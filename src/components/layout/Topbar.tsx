import { Menu, Search } from "lucide-react";
import HeaderActions from "@/components/layout/HeaderActions";
import { createClient } from "@/lib/supabase/server";

function firstItem<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function getShortName(name?: string | null) {
  if (!name) return "Utilisateur";

  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length <= 2) return name;

  return `${parts[0]} ${parts[1]}...`;
}

function getRoleLabel(role?: string | null) {
  if (role === "church_admin") return "Administrateur";
  if (role === "pastor") return "Pasteur";
  if (role === "department_leader") return "Responsable";
  if (role === "worker") return "Ouvrier";
  if (role === "member") return "Membre";

  return "Utilisateur";
}

export default async function Topbar() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName = "Utilisateur";
  let roleLabel = "Utilisateur";
  let churchName = "Mpangi-church";

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email, role, churches(name)")
      .eq("user_id", user.id)
      .maybeSingle();

    const church = firstItem<{ name: string | null }>(profile?.churches);

    displayName = getShortName(
      profile?.full_name || user.user_metadata?.full_name || user.email
    );

    roleLabel = getRoleLabel(profile?.role);
    churchName = church?.name || "Mpangi-church";
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[#DCEAF5] bg-white/90 backdrop-blur-xl">
      <div className="flex h-20 items-center justify-between gap-4 px-4 md:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <button className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A] lg:hidden">
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <h1 className="truncate text-xl font-extrabold text-[#03357A]">
              Bienvenue,{" "}
              <span className="text-[#8B5CF6]">{displayName}</span>
            </h1>

            <p className="mt-1 hidden text-sm text-slate-500 sm:block">
              {roleLabel} — {churchName}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-4">
          <div className="relative hidden w-full max-w-sm md:block">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

            <input
              type="search"
              placeholder="Rechercher..."
              className="h-12 w-80 rounded-2xl border border-[#DCEAF5] bg-white pl-12 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10 xl:w-96"
            />
          </div>

          <HeaderActions />
        </div>
      </div>
    </header>
  );
}