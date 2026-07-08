import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function txt(value: unknown) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function csvEscape(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function csvLine(values: unknown[]) {
  return values.map(csvEscape).join(";");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const dateFrom = txt(url.searchParams.get("dateFrom"));
  const dateTo = txt(url.searchParams.get("dateTo"));
  const category = txt(url.searchParams.get("category"));
  const department = txt(url.searchParams.get("department"));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Utilisateur non connecté." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, church_id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile || (profile.status && profile.status !== "active") || !profile.church_id) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const admin = createAdminClient();

  let query = admin
    .from("finance_transactions")
    .select(
      `
      transaction_date,
      transaction_type,
      title,
      amount,
      currency,
      amount_cdf,
      payment_method,
      reference,
      status,
      category:finance_categories(name),
      department:departments(name)
      `
    )
    .eq("church_id", profile.church_id)
    .neq("status", "archived")
    .order("transaction_date", { ascending: false });

  if (dateFrom) query = query.gte("transaction_date", dateFrom);
  if (dateTo) query = query.lte("transaction_date", dateTo);
  if (category) query = query.eq("category_id", category);
  if (department) query = query.eq("department_id", department);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Export impossible." }, { status: 500 });
  }

  const rows = data ?? [];

  const header = [
    "Date",
    "Type",
    "Titre",
    "Catégorie",
    "Département",
    "Montant",
    "Devise",
    "Montant CDF",
    "Mode paiement",
    "Référence",
    "Statut",
  ];

  const lines = [
    csvLine(header),
    ...rows.map((row: any) =>
      csvLine([
        row.transaction_date,
        row.transaction_type === "income" ? "Entrée" : "Dépense",
        row.title,
        row.category?.name || "",
        row.department?.name || "",
        row.amount,
        row.currency,
        row.amount_cdf || "",
        row.payment_method,
        row.reference || "",
        row.status,
      ])
    ),
  ];

  const csv = "\ufeff" + lines.join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rapport-financier-${dateFrom || "debut"}-${dateTo || "fin"}.csv"`,
    },
  });
}
