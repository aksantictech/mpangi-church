"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  LogOut,
  ShieldCheck,
  UserCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: string;
  church_id: string | null;
};

function getInitials(name?: string | null) {
  if (!name) return "U";

  const parts = name.trim().split(/\s+/).filter(Boolean);

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getShortName(name?: string | null) {
  if (!name) return "Utilisateur";

  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length <= 2) return name;

  return `${parts[0]} ${parts[1]}...`;
}

function getRoleLabel(role?: string) {
  if (role === "super_admin") return "Super Admin";
  if (role === "church_admin") return "Admin église";
  if (role === "pastor") return "Pasteur";
  if (role === "department_leader") return "Responsable";
  if (role === "worker") return "Ouvrier";
  if (role === "member") return "Membre";

  return "Utilisateur";
}

function getLoginPath(churchSlug?: string | null) {
  if (typeof window === "undefined") {
    return "/login";
  }

  const hostname = window.location.hostname;

  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";

  const isChurchSubdomain =
    !isLocalhost &&
    hostname.endsWith(".mpangi-church.app") &&
    hostname !== "mpangi-church.app" &&
    hostname !== "www.mpangi-church.app";

  if (isChurchSubdomain) {
    return "/login";
  }

  if (churchSlug) {
    return `/login?church=${encodeURIComponent(churchSlug)}`;
  }

  return "/login";
}

export default function AccountMenu() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [churchSlug, setChurchSlug] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url, role, church_id")
        .eq("user_id", user.id)
        .maybeSingle();

      const loadedProfile =
        data ??
        ({
          id: user.id,
          full_name: user.user_metadata?.full_name ?? user.email ?? null,
          email: user.email ?? null,
          avatar_url: null,
          role: "user",
          church_id: null,
        } as Profile);

      setProfile(loadedProfile as Profile);

      if (loadedProfile?.church_id) {
        const { data: church } = await supabase
          .from("churches")
          .select("slug")
          .eq("id", loadedProfile.church_id)
          .maybeSingle();

        setChurchSlug(church?.slug || null);
      }
    }

    loadProfile();
  }, [supabase]);

  async function handleLogout() {
    setIsOpen(false);

    let finalChurchSlug = churchSlug;

    if (!finalChurchSlug) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: latestProfile } = await supabase
          .from("profiles")
          .select("church_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (latestProfile?.church_id) {
          const { data: church } = await supabase
            .from("churches")
            .select("slug")
            .eq("id", latestProfile.church_id)
            .maybeSingle();

          finalChurchSlug = church?.slug || null;
        }
      }
    }

    const loginPath = getLoginPath(finalChurchSlug);

    await supabase.auth.signOut();

    router.replace(loginPath);
    router.refresh();
  }

  const displayName = profile?.full_name || profile?.email || "Utilisateur";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="flex max-w-[230px] items-center gap-3 rounded-2xl bg-white px-2.5 py-2 shadow-sm ring-1 ring-[#DCEAF5] transition hover:bg-[#F8FBFD]"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#EAF3FA] text-sm font-extrabold text-[#03357A]">
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            getInitials(displayName)
          )}
        </div>

        <div className="hidden min-w-0 text-left md:block">
          <p className="truncate text-[11px] font-semibold text-slate-400">
            Bienvenue
          </p>

          <p className="max-w-[145px] truncate text-sm font-extrabold text-[#03357A]">
            {getShortName(displayName)}
          </p>
        </div>

        <ChevronDown
          className={`hidden h-4 w-4 shrink-0 text-slate-400 transition md:block ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-3 w-72 overflow-hidden rounded-3xl border border-[#DCEAF5] bg-white shadow-xl">
          <div className="border-b border-[#DCEAF5] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#EAF3FA] text-sm font-extrabold text-[#03357A]">
                {profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt={displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  getInitials(displayName)
                )}
              </div>

              <div className="min-w-0">
                <p className="truncate font-extrabold text-[#03357A]">
                  {displayName}
                </p>

                <p className="truncate text-xs text-slate-500">
                  {profile?.email || "Email non renseigné"}
                </p>
              </div>
            </div>

            <p className="mt-3 w-fit rounded-full bg-[#EAF3FA] px-3 py-1 text-xs font-bold text-[#03357A]">
              {getRoleLabel(profile?.role)}
            </p>
          </div>

          <div className="p-2">
            <Link
              href="/account/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-[#EAF3FA]"
            >
              <UserCircle className="h-5 w-5 text-[#03357A]" />
              Modifier mon profil
            </Link>

            <Link
              href="/account/security"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-[#EAF3FA]"
            >
              <ShieldCheck className="h-5 w-5 text-[#03357A]" />
              Modifier mon mot de passe
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-5 w-5" />
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </div>
  );
}