"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Department = {
  id: string;
  name: string;
  status: string | null;
};

type Assignment = {
  id: string;
  church_id: string;
  member_id: string;
  department_id: string;
  role: string | null;
  status: string | null;
  assigned_at: string | null;
  departments:
    | {
        id: string;
        name: string;
      }
    | {
        id: string;
        name: string;
      }[]
    | null;
};

type MemberDepartmentsManagerProps = {
  memberId: string;
  churchId: string;
  profileId: string;
  departments: Department[];
  assignments: Assignment[];
};

function firstItem<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function MemberDepartmentsManager({
  memberId,
  churchId,
  profileId,
  departments,
  assignments,
}: MemberDepartmentsManagerProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [departmentId, setDepartmentId] = useState("");
  const [role, setRole] = useState("member");
  const [isLoading, setIsLoading] = useState(false);

  const assignedDepartmentIds = new Set(
    assignments.map((assignment) => assignment.department_id)
  );

  const availableDepartments = departments.filter(
    (department) => !assignedDepartmentIds.has(department.id)
  );

  async function handleAssign(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!departmentId) {
      alert("Veuillez choisir un département.");
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.from("member_departments").insert({
      church_id: churchId,
      member_id: memberId,
      department_id: departmentId,
      role,
      status: "active",
      assigned_at: new Date().toISOString().slice(0, 10),
      created_by: profileId,
    });

    setIsLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    setDepartmentId("");
    setRole("member");
    router.refresh();
  }

  async function handleRemove(assignmentId: string) {
    const confirmed = window.confirm(
      "Voulez-vous retirer ce membre de ce département ?"
    );

    if (!confirmed) return;

    setIsLoading(true);

    const { error } = await supabase
      .from("member_departments")
      .delete()
      .eq("id", assignmentId)
      .eq("member_id", memberId)
      .eq("church_id", churchId);

    setIsLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleAssign}
        className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
            <Building2 className="h-6 w-6" />
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-[#03357A]">
              Affecter à un département
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Sélectionnez un département de votre église.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-[1fr_0.7fr_auto]">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-[#03357A]">
              Département
            </span>

            <select
              value={departmentId}
              onChange={(event) => setDepartmentId(event.target.value)}
              className="h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white px-4 text-sm outline-none focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10"
            >
              <option value="">Choisir un département</option>

              {availableDepartments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-[#03357A]">
              Rôle dans le département
            </span>

            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className="h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white px-4 text-sm outline-none focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10"
            >
              <option value="member">Membre</option>
              <option value="worker">Ouvrier</option>
              <option value="leader">Responsable</option>
              <option value="assistant">Assistant</option>
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isLoading || !departmentId}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#03357A] to-[#2563EB] px-5 text-sm font-bold text-white shadow-lg shadow-blue-900/20 disabled:opacity-60"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}

              Ajouter
            </button>
          </div>
        </div>

        {availableDepartments.length === 0 && (
          <p className="mt-4 rounded-2xl bg-[#F8FBFD] p-4 text-sm font-semibold text-slate-500">
            Tous les départements actifs sont déjà associés à ce membre.
          </p>
        )}
      </form>

      <section className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
        <h2 className="text-xl font-extrabold text-[#03357A]">
          Départements associés
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Liste des départements auxquels ce membre participe.
        </p>

        <div className="mt-6 space-y-3">
          {assignments.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#C9DBEA] bg-[#F8FBFD] p-8 text-center">
              <Building2 className="mx-auto h-10 w-10 text-[#3F79B3]" />

              <p className="mt-4 text-sm font-semibold text-slate-500">
                Ce membre n’est encore affecté à aucun département.
              </p>
            </div>
          )}

          {assignments.map((assignment) => {
            const department = firstItem(assignment.departments);

            return (
              <article
                key={assignment.id}
                className="flex flex-col justify-between gap-4 rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] p-5 md:flex-row md:items-center"
              >
                <div>
                  <h3 className="font-extrabold text-[#03357A]">
                    {department?.name || "Département"}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Rôle :{" "}
                    <span className="font-bold text-slate-700">
                      {assignment.role || "member"}
                    </span>{" "}
                    • Depuis le {formatDate(assignment.assigned_at)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemove(assignment.id)}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100 disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                  Retirer
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}