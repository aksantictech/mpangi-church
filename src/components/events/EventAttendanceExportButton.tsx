"use client";

import { Download } from "lucide-react";

type ExportRow = {
  fullName: string;
  phone: string;
  memberType: string;
  status: string;
  checkinMethod: string;
  checkedInAt: string;
};

type EventAttendanceExportButtonProps = {
  eventTitle: string;
  rows: ExportRow[];
};

function cleanCsvValue(value: string) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export default function EventAttendanceExportButton({
  eventTitle,
  rows,
}: EventAttendanceExportButtonProps) {
  function handleExport() {
    const headers = [
      "Nom complet",
      "Téléphone",
      "Type membre",
      "Statut présence",
      "Méthode pointage",
      "Heure pointage",
    ];

    const csvRows = [
      headers.map(cleanCsvValue).join(";"),
      ...rows.map((row) =>
        [
          row.fullName,
          row.phone,
          row.memberType,
          row.status,
          row.checkinMethod,
          row.checkedInAt,
        ]
          .map(cleanCsvValue)
          .join(";")
      ),
    ];

    const csvContent = `\uFEFF${csvRows.join("\n")}`;
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const safeTitle = eventTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "");

    link.href = url;
    link.download = `rapport-presence-${safeTitle || "evenement"}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#03357A] shadow-sm hover:bg-[#EAF3FA]"
    >
      <Download className="h-4 w-4" />
      Export Excel
    </button>
  );
}