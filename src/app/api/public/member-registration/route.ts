import { createHash, randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_REQUEST_BYTES = 7 * 1024 * 1024;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MAX_ARRAY_ITEMS = 25;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  return [...new Set(value.map((item) => String(item).trim()))]
    .filter((item) => UUID_PATTERN.test(item))
    .slice(0, MAX_ARRAY_ITEMS);
}

function isExpired(value: unknown) {
  const expiresAt = getString(value);
  return Boolean(expiresAt && Date.parse(expiresAt) <= Date.now());
}

function exceeds(value: string, maxLength: number) {
  return value.length > maxLength;
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
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > MAX_REQUEST_BYTES) {
      return NextResponse.json({ error: "La demande est trop volumineuse." }, { status: 413 });
    }

    const body = await request.json();

    if (getString(body.website)) {
      return NextResponse.json({ error: "Demande invalide." }, { status: 400 });
    }

    const startedAt = Number(body.startedAt);
    if (!Number.isFinite(startedAt) || Date.now() - startedAt < 2500) {
      return NextResponse.json({ error: "Veuillez vérifier le formulaire avant de l’envoyer." }, { status: 429 });
    }

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

    if (
      exceeds(firstName, 80) || exceeds(middleName, 80) || exceeds(lastName, 80) ||
      exceeds(phone, 40) || exceeds(email, 160) || exceeds(address, 300) ||
      exceeds(occupation, 120) || exceeds(emergencyContact, 120) || exceeds(notes, 1500)
    ) {
      return NextResponse.json({ error: "Un ou plusieurs champs sont trop longs." }, { status: 400 });
    }

    if (email && !EMAIL_PATTERN.test(email)) {
      return NextResponse.json({ error: "L’adresse email n’est pas valide." }, { status: 400 });
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
        member_form_token,
        member_form_token_expires_at
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
      church.member_form_token !== token ||
      isExpired(church.member_form_token_expires_at)
    ) {
      return NextResponse.json(
        { error: "Ce lien d’inscription n’est pas actif." },
        { status: 403 }
      );
    }

    const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const fingerprint = createHash("sha256")
      .update(`${church.id}:${forwardedFor}:${request.headers.get("user-agent") || "unknown"}`)
      .digest("hex");
    const { data: rateLimitAllowed, error: rateLimitError } = await admin.rpc(
      "check_public_member_registration_rate_limit",
      { p_church_id: church.id, p_fingerprint: fingerprint }
    );

    if (!rateLimitError && rateLimitAllowed === false) {
      return NextResponse.json(
        { error: "Trop de tentatives. Veuillez réessayer dans quelques minutes." },
        { status: 429 }
      );
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

    for (const [column, value, message] of [
      ["phone", phone, "Un membre avec ce numéro de téléphone existe déjà dans cette église."],
      ["email", email.toLowerCase(), "Un membre avec cette adresse email existe déjà dans cette église."],
    ] as const) {
      if (!value) continue;
      const { data: existingMember } = await admin
        .from("members").select("id").eq("church_id", church.id)
        .ilike(column, value).limit(1).maybeSingle();
      if (existingMember) return NextResponse.json({ error: message }, { status: 409 });
    }

    let photoUrl: string | null = null;

    if (photoBase64 && photoType) {
      const payload = getBase64Payload(photoBase64);

      if (payload) {
        if (!["image/jpeg", "image/png", "image/webp"].includes(photoType)) {
          return NextResponse.json({ error: "Format photo non accepté." }, { status: 400 });
        }
        const extension = getSafeFileExtension(photoType, photoName);
        const filePath = `${church.id}/public-${Date.now()}-${randomUUID()}.${extension}`;
        const fileBuffer = Buffer.from(payload.base64, "base64");

        if (fileBuffer.byteLength > MAX_PHOTO_BYTES) {
          return NextResponse.json({ error: "La photo ne doit pas dépasser 5 MB." }, { status: 413 });
        }

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

    const now = new Date().toISOString();
    const qrToken = randomUUID();

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
        status: "en_attente",
        registration_source: "public_form",
        notes: finalNotes,
        qr_token: qrToken,
        qr_enabled: false,
        qr_generated_at: now,
      })
      .select("id, first_name, last_name")
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
      message: "Formulaire envoyé avec succès.",
      pendingApproval: true,
      member: {
        id: member.id,
        firstName: member.first_name,
        lastName: member.last_name,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur inattendue pendant l’inscription." },
      { status: 500 }
    );
  }
}
