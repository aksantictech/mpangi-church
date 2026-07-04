import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function getString(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function getDateValue(value: unknown) {
  const text = getString(value);

  if (!text) {
    return null;
  }

  return text.slice(0, 10);
}

function getStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => String(item).trim()).filter(Boolean);
}

function getBase64Payload(value: unknown) {
  const text = getString(value);

  if (!text || !text.includes(",")) {
    return null;
  }

  const [metadata, base64] = text.split(",");

  if (!metadata || !base64) {
    return null;
  }

  return {
    metadata,
    base64,
  };
}

function getSafeFileExtension(fileType: string, fileName: string) {
  if (fileType === "image/png") return "png";
  if (fileType === "image/webp") return "webp";
  if (fileType === "image/jpeg") return "jpg";

  const extension = fileName.split(".").pop()?.toLowerCase();

  if (extension && ["jpg", "jpeg", "png", "webp"].includes(extension)) {
    return extension === "jpeg" ? "jpg" : extension;
  }

  return "jpg";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const churchSlug = getString(body.churchSlug);
    const token = getString(body.token);

    if (!churchSlug || !token) {
      return NextResponse.json(
        { error: "Lien d’inscription invalide." },
        { status: 400 }
      );
    }

    const firstName = getString(body.firstName);
    const middleName = getString(body.middleName);
    const lastName = getString(body.lastName);
    const gender = getString(body.gender);
    const birthDate = getDateValue(body.birthDate);
    const maritalStatus = getString(body.maritalStatus);

    const phone = getString(body.phone);
    const email = getString(body.email);
    const address = getString(body.address);

    const integrationYear = getString(body.integrationYear);
    const baptismDate = getDateValue(body.baptismDate);
    const occupation = getString(body.occupation);
    const emergencyContact = getString(body.emergencyContact);
    const notes = getString(body.notes);

    const departmentIds = getStringArray(body.departmentIds);
    const trainingProgramIds = getStringArray(body.trainingProgramIds);

    const photoBase64 = getString(body.photoBase64);
    const photoName = getString(body.photoName);
    const photoType = getString(body.photoType);

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "Le prénom et le nom sont obligatoires." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: church, error: churchError } = await admin
      .from("churches")
      .select(
        `
        id,
        slug,
        status,
        public_enabled,
        member_form_enabled,
        member_form_token
      `
      )
      .eq("slug", churchSlug)
      .maybeSingle();

    if (churchError || !church) {
      return NextResponse.json(
        { error: "Église introuvable." },
        { status: 404 }
      );
    }

    if (
      church.status !== "active" ||
      !church.public_enabled ||
      !church.member_form_enabled ||
      church.member_form_token !== token
    ) {
      return NextResponse.json(
        { error: "Ce lien d’inscription n’est pas actif." },
        { status: 403 }
      );
    }

    const duplicateChecks: string[] = [];

if (phone) {
  duplicateChecks.push(`phone.eq.${phone}`);
}

if (email) {
  duplicateChecks.push(`email.eq.${email}`);
}

if (firstName && lastName && birthDate) {
  const { data: existingByIdentity } = await admin
    .from("members")
    .select("id, first_name, last_name, phone, email, birth_date")
    .eq("church_id", church.id)
    .ilike("first_name", firstName)
    .ilike("last_name", lastName)
    .eq("birth_date", birthDate)
    .maybeSingle();

  if (existingByIdentity) {
    return NextResponse.json(
      {
        error:
          "Un membre avec le même prénom, nom et date de naissance existe déjà dans cette église.",
      },
      { status: 409 }
    );
  }
}

if (duplicateChecks.length > 0) {
  const { data: existingMembers } = await admin
    .from("members")
    .select("id, first_name, last_name, phone, email")
    .eq("church_id", church.id)
    .or(duplicateChecks.join(","))
    .limit(1);

  const existingMember = existingMembers?.[0];

  if (existingMember) {
    if (phone && existingMember.phone === phone) {
      return NextResponse.json(
        {
          error:
            "Un membre avec ce numéro de téléphone existe déjà dans cette église.",
        },
        { status: 409 }
      );
    }

    if (email && existingMember.email === email) {
      return NextResponse.json(
        {
          error:
            "Un membre avec cette adresse email existe déjà dans cette église.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error:
          "Ce membre semble déjà exister dans cette église.",
      },
      { status: 409 }
    );
  }
}

    let photoUrl: string | null = null;

    if (photoBase64 && photoType) {
      const payload = getBase64Payload(photoBase64);

      if (payload) {
        const extension = getSafeFileExtension(photoType, photoName);
        const filePath = `${church.id}/public-${Date.now()}-${crypto.randomUUID()}.${extension}`;
        const fileBuffer = Buffer.from(payload.base64, "base64");

        const { error: uploadError } = await admin.storage
          .from("member-photos")
          .upload(filePath, fileBuffer, {
            contentType: photoType,
            upsert: false,
          });

        if (!uploadError) {
          const { data: publicUrlData } = admin.storage
            .from("member-photos")
            .getPublicUrl(filePath);

          photoUrl = publicUrlData.publicUrl;
        }
      }
    }

    const finalNotes = [
      notes || null,
      integrationYear ? `Année d’intégration : ${integrationYear}` : null,
      baptismDate ? `Date de baptême : ${baptismDate}` : null,
      occupation ? `Profession : ${occupation}` : null,
      emergencyContact ? `Contact d’urgence : ${emergencyContact}` : null,
      "Inscription envoyée via formulaire public membre.",
    ]
      .filter(Boolean)
      .join("\n");

    const { data: member, error: memberError } = await admin
      .from("members")
      .insert({
        church_id: church.id,
        first_name: firstName,
        middle_name: middleName || null,
        last_name: lastName,
        gender: gender || null,
        birth_date: birthDate,
        marital_status: maritalStatus || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        photo_url: photoUrl,
        status: "actif",
        notes: finalNotes,
      })
      .select("id")
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        {
          error:
            memberError?.message ||
            "Impossible d’enregistrer le membre pour le moment.",
        },
        { status: 400 }
      );
    }

    if (departmentIds.length > 0) {
      const { data: validDepartments } = await admin
        .from("departments")
        .select("id")
        .eq("church_id", church.id)
        .in("id", departmentIds);

      const assignments = (validDepartments ?? []).map((department) => ({
        church_id: church.id,
        member_id: member.id,
        department_id: department.id,
        role: "member",
        status: "active",
        assigned_at: new Date().toISOString().slice(0, 10),
      }));

      if (assignments.length > 0) {
        await admin.from("member_departments").insert(assignments);
      }
    }

    if (trainingProgramIds.length > 0) {
      const { data: validPrograms } = await admin
        .from("training_programs")
        .select("id")
        .eq("church_id", church.id)
        .in("id", trainingProgramIds);

      const trainingRows = (validPrograms ?? []).map((program) => ({
        church_id: church.id,
        member_id: member.id,
        training_program_id: program.id,
        status: "completed",
      }));

      if (trainingRows.length > 0) {
        await admin.from("member_trainings").insert(trainingRows);
      }
    }

    return NextResponse.json({
      success: true,
      memberId: member.id,
      message: "Votre fiche membre a été envoyée avec succès.",
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur inattendue pendant l’inscription." },
      { status: 500 }
    );
  }
}