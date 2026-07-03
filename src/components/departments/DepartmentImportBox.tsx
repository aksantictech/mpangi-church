"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/client";

type DepartmentImportBoxProps = {
  churchId: string;
};

type ImportResult = {
  inserted: number;
  skipped: number;
  failed: number;
  messages: string[];
};

type DepartmentRow = Record<string, unknown>;

type DepartmentInsert = {
  church_id: string;
  name: string;
  description: string | null;
  status: string;
};

function getString(row: DepartmentRow, key: string) {
  const value = row[key];

  if (value === null || value === undefined) return "";

  return String(value).trim();
}

function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export default function DepartmentImportBox({
  churchId,
}: DepartmentImportBoxProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    setIsLoading(true);
    setResult(null);

    try {
      const buffer = await file.arrayBuffer();

      const workbook = XLSX.read(buffer, {
        type: "array",
      });

      const worksheetName =
        workbook.SheetNames.find((name) => name === "Departements") ||
        workbook.SheetNames.find((name) => name === "Départements") ||
        workbook.SheetNames[0];

      if (!worksheetName) {
        throw new Error("Le fichier Excel ne contient aucune feuille.");
      }

      const worksheet = workbook.Sheets[worksheetName];

      if (!worksheet) {
        throw new Error("Feuille Excel introuvable.");
      }

      const rows = XLSX.utils.sheet_to_json<DepartmentRow>(worksheet, {
        defval: "",
      });

      if (rows.length === 0) {
        throw new Error("Le fichier Excel ne contient aucune ligne à importer.");
      }

      const { data: existingDepartments, error: existingError } = await supabase
        .from("departments")
        .select("id, name")
        .eq("church_id", churchId);

      if (existingError) {
        throw existingError;
      }

      const existingNames = new Set(
        (existingDepartments ?? []).map((department) =>
          normalizeName(String(department.name || ""))
        )
      );

      const messages: string[] = [];
      let skipped = 0;
      let failed = 0;

      const payload: DepartmentInsert[] = [];

      for (const [index, row] of rows.entries()) {
        const name = getString(row, "name");
        const description = getString(row, "description");
        const status = getString(row, "status") || "active";

        if (!name) {
          failed += 1;
          messages.push(`Ligne ${index + 2} ignorée : nom manquant.`);
          continue;
        }

        const normalizedName = normalizeName(name);

        if (existingNames.has(normalizedName)) {
          skipped += 1;
          messages.push(`Déjà existant : ${name}`);
          continue;
        }

        existingNames.add(normalizedName);

        payload.push({
          church_id: churchId,
          name,
          description: description || null,
          status,
        });
      }

      let inserted = 0;

      if (payload.length > 0) {
        const { error } = await supabase.from("departments").insert(payload);

        if (error) {
          throw error;
        }

        inserted = payload.length;
      }

      setResult({
        inserted,
        skipped,
        failed,
        messages,
      });

      router.refresh();
    } catch (error) {
      setResult({
        inserted: 0,
        skipped: 0,
        failed: 1,
        messages: [
          error instanceof Error
            ? error.message
            : "Erreur inconnue pendant l’import.",
        ],
      });
    } finally {
      setIsLoading(false);
      event.target.value = "";
    }
  }

  return (
    <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
            <FileSpreadsheet className="h-6 w-6" />
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-[#03357A]">
              Import Excel des départements
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Colonnes attendues : name, description, status.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href="/templates/mpangi_modele_departements.xlsx"
            download
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#DCEAF5] bg-white px-5 py-3 text-sm font-bold text-[#03357A] hover:bg-[#EAF3FA]"
          >
            <Download className="h-4 w-4" />
            Télécharger modèle
          </a>

          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#03357A] to-[#2563EB] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/20">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}

            {isLoading ? "Import..." : "Importer Excel"}

            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={isLoading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {result && (
        <div className="mt-5 rounded-2xl bg-[#F8FBFD] p-4 text-sm">
          <p className="font-extrabold text-[#03357A]">
            Résultat : {result.inserted} importé(s), {result.skipped} ignoré(s),{" "}
            {result.failed} erreur(s).
          </p>

          {result.messages.length > 0 && (
            <ul className="mt-3 space-y-1 text-slate-600">
              {result.messages.slice(0, 8).map((message, index) => (
                <li key={index}>• {message}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}