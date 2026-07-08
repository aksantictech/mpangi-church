"use client";

import Link from "next/link";
import {
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Profile = {
  full_name?: string | null;
  email?: string | null;
  role?: string | null;
};

type ProfilePayload = {
  profile?: Profile | null;
};

function initials(name?: string | null, email?: string | null) {
  const source = (name || email || "Utilisateur").trim();
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

function shortName(name?: string | null, email?: string | null) {
  const value = (name || email || "Utilisateur").trim();

  if (value.length <= 22) return value;

  return `${value.slice(0, 22)}...`;
}

export default function ChurchDesktopTopBar() {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [open, setOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    fetch("/api/security/my-access", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: ProfilePayload) => {
        if (!mounted) return;
        setProfile(payload.profile ?? null);
      })
      .catch(() => {
        if (!mounted) return;
        setProfile(null);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!dropdownRef.current) return;

      if (!dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const displayName = useMemo(
    () => shortName(profile?.full_name, profile?.email),
    [profile?.full_name, profile?.email]
  );

  async function handleLogout() {
    try {
      setLogoutLoading(true);

      await fetch("/logout", {
        method: "POST",
        cache: "no-store",
      });

      router.replace("/login?logout=1");
      router.refresh();
    } finally {
      setLogoutLoading(false);
    }
  }

  return (
    <header className="hidden border-b border-[#DCEAF5] bg-[#F5F9FC]/95 px-6 py-4 backdrop-blur lg:block xl:px-8">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-end gap-3">
        <Link
          href="/notifications"
          className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-[#DCEAF5] bg-white text-[#03357A] shadow-sm transition hover:bg-[#EAF3FA]"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </Link>

        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="flex min-w-[260px] items-center justify-between gap-3 rounded-2xl border border-[#DCEAF5] bg-white px-3 py-2 shadow-sm transition hover:bg-[#F8FBFD]"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#03357A] text-sm font-black text-white">
                {initials(profile?.full_name, profile?.email)}
              </span>

              <span className="min-w-0 text-left">
                <span className="block text-xs font-bold text-slate-400">
                  Bienvenue
                </span>
                <span className="block truncate text-sm font-black text-[#03357A]">
                  {displayName}
                </span>
              </span>
            </span>

            <ChevronDown
              className={`h-4 w-4 shrink-0 text-slate-400 transition ${
                open ? "rotate-180" : ""
              }`}
            />
          </button>

          {open && (
            <div className="absolute right-0 z-50 mt-3 w-[280px] overflow-hidden rounded-3xl border border-[#DCEAF5] bg-white p-2 shadow-2xl shadow-slate-900/15">
              <div className="rounded-2xl bg-[#F8FBFD] p-4">
                <p className="text-sm font-black text-[#03357A]">
                  {profile?.full_name || "Utilisateur"}
                </p>
                <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                  {profile?.email || "Compte connecté"}
                </p>
                <p className="mt-2 inline-flex rounded-full bg-[#EAF3FA] px-3 py-1 text-xs font-black text-[#03357A]">
                  {profile?.role || "role"}
                </p>
              </div>

              <div className="mt-2 space-y-1">
                <Link
                  href="/settings"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-extrabold text-slate-600 transition hover:bg-[#EAF3FA] hover:text-[#03357A]"
                >
                  <Settings className="h-4 w-4" />
                  Paramètres
                </Link>

                <Link
                  href="/settings/users"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-extrabold text-slate-600 transition hover:bg-[#EAF3FA] hover:text-[#03357A]"
                >
                  <UsersRound className="h-4 w-4" />
                  Utilisateurs & rôles
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={logoutLoading}
                  className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-extrabold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <LogOut className="h-4 w-4" />
                  {logoutLoading ? "Déconnexion..." : "Déconnexion"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
