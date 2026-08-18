import { NextRequest, NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";

const CATEGORY_LABELS: Record<string, string> = {
  building: "Bâtiment",
  land: "Terrain",
  vehicle: "Véhicule",
  sound: "Sonorisation",
  it: "Informatique",
  furniture: "Mobilier",
  instrument: "Instrument",
  office: "Bureau",
  security: "Sécurité",
  other: "Autre",
};

export async function GET(request: NextRequest) {
  const { admin, profile } = await requireChurchModuleAccess("assets");
  const params = request.nextUrl.searchParams;
  const format = params.get("format") === "pdf" ? "pdf" : "xlsx";
  const category = params.get("category") || "";
  const department = params.get("department") || "";
  const acquiredFrom = params.get("acquired_from") || "";
  const acquiredTo = params.get("acquired_to") || "";

  let query = admin
    .from("patrimony_assets")
    .select(`
      asset_code,name,category,acquisition_date,quantity,unit,
      acquisition_value,current_value,currency,condition,status,location,
      department_id,department:departments(name)
    `)
    .eq("church_id", profile.church_id)
    .neq("status", "archived")
    .order("acquisition_date", { ascending: false, nullsFirst: false })
    .limit(5000);

  if (category) query = query.eq("category", category);
  if (department) query = query.eq("department_id", department);
  if (acquiredFrom) query = query.gte("acquisition_date", acquiredFrom);
  if (acquiredTo) query = query.lte("acquisition_date", acquiredTo);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const rows = (data ?? []).map((row: any) => ({
    Code: row.asset_code || "",
    Bien: row.name || "",
    Type: CATEGORY_LABELS[row.category] || row.category || "",
    Département: row.department?.name || "Non affecté",
    "Date acquisition": row.acquisition_date || "",
    Quantité: Number(row.quantity || 0),
    Unité: row.unit || "",
    État: row.condition || "",
    Statut: row.status || "",
    Localisation: row.location || "",
    Valeur: Number(row.current_value ?? row.acquisition_value ?? 0),
    Devise: row.currency || "CDF",
  }));

  if (format === "xlsx") {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Patrimoine");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="rapport-patrimoine-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    });
  }

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  doc.setFontSize(16);
  doc.text("Rapport patrimoine", 14, 16);
  doc.setFontSize(9);
  doc.text(`Généré le ${new Intl.DateTimeFormat("fr-FR").format(new Date())}`, 14, 23);

  const headers = ["Code", "Bien", "Type", "Département", "Acquisition", "Qté", "État", "Statut", "Valeur"];
  const widths = [22, 42, 28, 38, 26, 14, 24, 24, 35];
  let y = 34;

  const drawHeader = () => {
    doc.setFont("helvetica", "bold");
    let x = 10;
    headers.forEach((header, index) => {
      doc.text(header, x, y);
      x += widths[index];
    });
    doc.setFont("helvetica", "normal");
    y += 7;
  };

  drawHeader();
  for (const row of rows) {
    if (y > 195) {
      doc.addPage();
      y = 18;
      drawHeader();
    }
    const values = [
      row.Code,
      row.Bien,
      row.Type,
      row.Département,
      row["Date acquisition"],
      String(row.Quantité),
      row.État,
      row.Statut,
      `${row.Valeur} ${row.Devise}`,
    ];
    let x = 10;
    values.forEach((value, index) => {
      doc.text(String(value || "-").slice(0, 28), x, y);
      x += widths[index];
    });
    y += 6;
  }

  const arrayBuffer = doc.output("arraybuffer");
  return new NextResponse(arrayBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="rapport-patrimoine-${new Date().toISOString().slice(0, 10)}.pdf"`,
    },
  });
}
