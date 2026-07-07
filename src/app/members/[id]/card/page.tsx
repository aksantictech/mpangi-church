import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, IdCard } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import MemberCardPrint from "@/components/members/MemberCardPrint";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type MemberCardPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function getPublicChurchName(church: any) {
  return church.public_name || church.pwa_name || church.name || "Église";
}

function getMemberCode(member: any) {
  if (member.member_code) {
    return member.member_code;
  }

  return `M-${String(member.id).replaceAll("-", "").slice(0, 8).toUpperCase()}`;
}

function buildQrValue({
  origin,
  churchSlug,
  member,
}: {
  origin: string;
  churchSlug: string;
  member: any;
}) {
  if (member.qr_token) {
    return `${origin}/church/${churchSlug}/member-card/${member.qr_token}`;
  }

  return JSON.stringify({
    type: "mpangi_church_member",
    member_id: member.id,
    church_slug: churchSlug,
  });
}

export default async function MemberCardPage({ params }: MemberCardPageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, church_id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile || !profile.church_id) {
    redirect("/login");
  }

  if (profile.status && profile.status !== "active") {
    redirect("/login");
  }

  const admin = createAdminClient();

  const { data: church } = await admin
    .from("churches")
    .select("id, name, public_name, pwa_name, slug, logo_url, custom_domain")
    .eq("id", profile.church_id)
    .maybeSingle();

  if (!church) {
    redirect("/members");
  }

  const { data: member } = await admin
    .from("members")
    .select(
      `
      id,
      church_id,
      first_name,
      middle_name,
      last_name,
      phone,
      status,
      photo_url,
      qr_token,
      member_code
      `
    )
    .eq("id", id)
    .eq("church_id", profile.church_id)
    .maybeSingle();

  if (!member) {
    redirect("/members");
  }

  const { data: memberDepartments } = await admin
    .from("member_departments")
    .select("department_id, status")
    .eq("church_id", profile.church_id)
    .eq("member_id", member.id)
    .limit(3);

  const departmentIds = (memberDepartments ?? [])
    .map((item: any) => item.department_id)
    .filter(Boolean);

  const { data: departments } =
    departmentIds.length > 0
      ? await admin
          .from("departments")
          .select("id, name")
          .eq("church_id", profile.church_id)
          .in("id", departmentIds)
      : { data: [] as any[] };

  const departmentName =
    (departments ?? []).map((department: any) => department.name).join(", ") ||
    "Non renseigné";

  const appOrigin = process.env.NEXT_PUBLIC_APP_URL || "https://mpangi-church.app";

  const qrValue = buildQrValue({
    origin: appOrigin,
    churchSlug: church.slug,
    member,
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="no-print flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Link
            href={`/members/${member.id}`}
            className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à la fiche membre
          </Link>

          <div className="inline-flex items-center gap-2 rounded-2xl bg-[#EAF3FA] px-4 py-2 text-sm font-extrabold text-[#03357A]">
            <IdCard className="h-4 w-4" />
            Carte membre
          </div>
        </div>

        <section className="no-print rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
            Impression carte
          </p>

          <h1 className="mt-2 text-3xl font-extrabold">Carte de membre</h1>

          <p className="mt-2 text-sm leading-7 text-blue-50">
            Carte générée depuis la fiche membre : photo, nom, département, ID
            personnel et QR Code.
          </p>
        </section>

        <MemberCardPrint
          church={{
            name: church.name,
            publicName: getPublicChurchName(church),
            logoUrl: church.logo_url,
            slug: church.slug,
          }}
          member={{
            id: member.id,
            firstName: member.first_name,
            middleName: member.middle_name,
            lastName: member.last_name,
            photoUrl: member.photo_url,
            phone: member.phone,
            status: member.status,
            memberCode: getMemberCode(member),
            qrToken: member.qr_token,
          }}
          departmentName={departmentName}
          qrValue={qrValue}
        />
      </div>
    </AppShell>
  );
}
