import { NextResponse } from "next/server";
import { getAuditRows } from "@/lib/audit/auditQuery";
import { logAuditEvent } from "@/lib/audit/logAuditEvent";
import { createSimplePdf } from "@/lib/audit/simplePdf";
import { requireSuperAdmin } from "@/lib/security/access";

export async function GET(request: Request) {
  const session = await requireSuperAdmin();
  const filters = Object.fromEntries(new URL(request.url).searchParams);
  const rows = await getAuditRows(filters, 3000);
  const lines = rows.map((row: any) => {
    const church = (Array.isArray(row.churches) ? row.churches[0] : row.churches)?.name || "Plateforme";
    return `${new Date(row.created_at).toLocaleString("fr-BE")} | ${church} | ${row.actor_email || "Public"} | ${row.action} | ${row.status}`;
  });
  const pdf = createSimplePdf("Mpangi-church - Journal d'audit", [
    `Rapport genere le ${new Date().toLocaleString("fr-BE")} - ${rows.length} evenement(s)`,
    `Filtres: ${JSON.stringify(filters)}`,
    "",
    ...lines,
  ]);
  await logAuditEvent({
    actorUserId: session.profile.user_id,
    actorEmail: session.profile.email,
    actorRole: session.role,
    action: "audit.export.pdf",
    category: "export",
    resourceType: "security_audit_logs",
    metadata: { filters, rows: rows.length },
  });
  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="journal-audit-${new Date().toISOString().slice(0, 10)}.pdf"`,
    },
  });
}

