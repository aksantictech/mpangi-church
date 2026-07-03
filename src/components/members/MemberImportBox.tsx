"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/client";

type MemberImportBoxProps = {
  churchId: string;
  profileId: string;
};

type ImportResult = {
  inserted: number;
  skipped: number;
  failed: number;
  assigned: number;
  messages: string[];
};

type MemberRow = Record<string, unknown>;

type MemberDepartmentInsert = {
  church_id: string;
  member_id: string;
  department_id: string;
  role: string;
  status: string;
  assigned_at: string;
  created_by: string;
};

function getString(row: MemberRow, key: string) {
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

function getDateString(value: unknown) {
  if (!value) return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "number") {
    const date = new Date(Date.UTC(1899, 11, 30));
    date.setUTCDate(date.getUTCDate() + value);

    return date.toISOString().slice(0, 10);
  }

  const text = String(value).trim();

  if (!text) return null;

  return text.slice(0, 10);
}

export default function MemberImportBox({
  churchId,
  profileId,
}: MemberImportBoxProps) {
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
        cellDates: true,
      });

      const worksheetName =
        workbook.SheetNames.find((name) => name === "Membres") ||
        workbook.SheetNames.find((name) => name === "Members") ||
        workbook.SheetNames[0];

      if (!worksheetName) {
        throw new Error("Le fichier Excel ne contient aucune feuille.");
      }

      const worksheet = workbook.Sheets[worksheetName];

      if (!worksheet) {
        throw new Error("Feuille Excel introuvable.");
      }

      const rows = XLSX.utils.sheet_to_json<MemberRow>(worksheet, {
        defval: "",
      });

      if (rows.length === 0) {
        throw new Error("Le fichier Excel ne contient aucune ligne à importer.");
      }

      const { data: departmentsData, error: departmentsError } = await supabase
        .from("departments")
        .select("id, name")
        .eq("church_id", churchId);

      if (departmentsError) {
        throw departmentsError;
      }

      const departmentByName = new Map<string, string>();

      for (const department of departmentsData ?? []) {
        departmentByName.set(
          normalizeName(String(department.name || "")),
          String(department.id)
        );
      }

      const phones = rows
        .map((row) => getString(row, "phone"))
        .filter((phone) => phone.length > 0);

      let existingMembers: { id: string; phone: string | null }[] = [];

      if (phones.length > 0) {
        const { data, error } = await supabase
          .from("members")
          .select("id, phone")
          .eq("church_id", churchId)
          .in("phone", phones);

        if (error) {
          throw error;
        }

        existingMembers = (data ?? []) as { id: string; phone: string | null }[];
      }

      const existingPhones = new Set(
        existingMembers.map((member) => String(member.phone || ""))
      );

      const messages: string[] = [];
      let inserted = 0;
      let skipped = 0;
      let failed = 0;
      let assigned = 0;

      for (const [index, row] of rows.entries()) {
        const firstName = getString(row, "first_name");
        const middleName = getString(row, "middle_name");
        const lastName = getString(row, "last_name");
        const phone = getString(row, "phone");

        if (!firstName || !lastName) {
          failed += 1;
          messages.push(
            `Ligne ${index + 2} ignorée : first_name et last_name sont obligatoires.`
          );
          continue;
        }

        if (phone && existingPhones.has(phone)) {
          skipped += 1;
          messages.push(`Déjà existant avec téléphone : ${phone}`);
          continue;
        }

        const { data: member, error: memberError } = await supabase
          .from("members")
          .insert({
            church_id: churchId,
            first_name: firstName,
            middle_name: middleName || null,
            last_name: lastName,
            gender: getString(row, "gender") || null,
            phone: phone || null,
            email: getString(row, "email") || null,
            birth_date: getDateString(row["birth_date"]),
            address: getString(row, "address") || null,
            member_type: getString(row, "member_type") || "member",
            status: getString(row, "status") || "actif",
            notes: getString(row, "notes") || null,
            created_by: profileId,
          })
          .select("id")
          .single();

        if (memberError || !member) {
          failed += 1;
          messages.push(
            `Ligne ${index + 2} erreur membre : ${
              memberError?.message || "erreur inconnue"
            }`
          );
          continue;
        }

        inserted += 1;

        if (phone) {
          existingPhones.add(phone);
        }

        const departmentNames = getString(row, "departments")
          .split(/[;,]/)
          .map((name) => name.trim())
          .filter((name) => name.length > 0);

        const uniqueDepartmentNames = Array.from(new Set(departmentNames));

        const assignments: MemberDepartmentInsert[] = [];

        for (const departmentName of uniqueDepartmentNames) {
          const departmentId = departmentByName.get(normalizeName(departmentName));

          if (!departmentId) {
            messages.push(
              `Département introuvable pour ${firstName} ${lastName} : ${departmentName}`
            );
            continue;
          }

          assignments.push({
            church_id: churchId,
            member_id: String(member.id),
            department_id: departmentId,
            role: "member",
            status: "active",
            assigned_at: new Date().toISOString().slice(0, 10),
            created_by: profileId,
          });
        }

        if (assignments.length > 0) {
          const { error: assignmentError } = await supabase
            .from("member_departments")
            .insert(assignments);

          if (assignmentError) {
            messages.push(
              `Affectation département échouée pour ${firstName} ${lastName} : ${assignmentError.message}`
            );
          } else {
            assigned += assignments.length;
          }
        }
      }

      setResult({
        inserted,
        skipped,
        failed,
        assigned,
        messages,
      });

      router.refresh();
    } catch (error) {
      setResult({
        inserted: 0,
        skipped: 0,
        failed: 1,
        assigned: 0,
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
              Import Excel des membres
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Importez les membres et leurs affectations de départements.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href="/templates/mpangi_modele_membres.xlsx"
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

      <div className="mt-4 rounded-2xl bg-[#F8FBFD] p-4 text-sm leading-6 text-slate-600">
        Importez d’abord les départements. La colonne{" "}
        <span className="font-bold text-[#03357A]">departments</span> accepte
        plusieurs valeurs séparées par point-virgule :{" "}
        <span className="font-bold text-[#03357A]">
          Intercession; Accueil
        </span>
      </div>

      {result && (
        <div className="mt-5 rounded-2xl bg-[#F8FBFD] p-4 text-sm">
          <p className="font-extrabold text-[#03357A]">
            Résultat : {result.inserted} membre(s) importé(s),{" "}
            {result.assigned} affectation(s), {result.skipped} ignoré(s),{" "}
            {result.failed} erreur(s).
          </p>

          {result.messages.length > 0 && (
            <ul className="mt-3 space-y-1 text-slate-600">
              {result.messages.slice(0, 12).map((message, index) => (
                <li key={index}>• {message}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}