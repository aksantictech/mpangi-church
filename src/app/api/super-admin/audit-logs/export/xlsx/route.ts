import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getAuditRows } from "@/lib/audit/auditQuery";
import { logAuditEvent } from "@/lib/audit/logAuditEvent";
import { requireSuperAdmin } from "@/lib/security/access";

export async function GET(request: Request) {
  const session = await requireSuperAdmin();
  const filters = Object.fromEntries(new URL(request.url).searchParams);
  const rows = await getAuditRows(filters, 10000);
  const data = rows.map((row: any) => ({
    Date: row.created_at,
    Église: (Array.isArray(row.churches) ? row.churches[0] : row.churches)?.name || "Plateforme",
    Utilisateur: row.actor_email || "Visiteur public",
    Rôle: row.actor_role || "",
    Catégorie: row.event_category || "",
    Action: row.action,
    Ressource: row.resource_type || "",
    "ID ressource": row.resource_id || "",
    Résultat: row.status,
    Gravité: row.severity,
    Route: row.route || "",
    IP: row.ip_address || "",
    Appareil: row.user_agent || "",
    Métadonnées: JSON.stringify(row.metadata || {}),
  }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(data), "Journal audit");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  await logAuditEvent({
    actorUserId: session.profile.user_id,
    actorEmail: session.profile.email,
    actorRole: session.role,
    action: "audit.export.xlsx",
    category: "export",
    resourceType: "security_audit_logs",
    metadata: { filters, rows: rows.length },
  });
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="journal-audit-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}

