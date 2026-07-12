export default function ExtensionStatusBadge({
  status,
}: {
  status?: string | null;
}) {
  const normalized = status || "active";

  const styles: Record<string, string> = {
    active: "bg-green-50 text-green-700",
    inactive: "bg-orange-50 text-orange-700",
    archived: "bg-slate-100 text-slate-600",
    draft: "bg-slate-100 text-slate-600",
    submitted: "bg-blue-50 text-blue-700",
    validated: "bg-green-50 text-green-700",
  };

  const labels: Record<string, string> = {
    active: "Active",
    inactive: "Inactive",
    archived: "Archivée",
    draft: "Brouillon",
    submitted: "Soumis",
    validated: "Validé",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
        styles[normalized] || styles.active
      }`}
    >
      {labels[normalized] || normalized}
    </span>
  );
}
