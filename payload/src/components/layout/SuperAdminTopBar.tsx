"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  ChevronDown,
  KeyRound,
  LogOut,
  Menu,
  Settings,
  UserRound,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

type Profile = {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role?: string;
  status?: string;
};

function initials(name: string, email: string) {
  const label = name || email || "SA";
  const parts = label.trim().split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return label.slice(0, 2).toUpperCase();
}

export default function SuperAdminTopBar({
  onOpenMobileMenu,
}: {
  onOpenMobileMenu?: () => void;
}) {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [open, setOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    fetch("/api/account/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        if (mounted) setProfile(payload.profile ?? null);
      })
      .catch(() => {
        if (mounted) setProfile(null);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    function closeOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOutside);

    return () =>
      document.removeEventListener("mousedown", closeOutside);
  }, []);

  const displayName = useMemo(
    () => profile?.full_name || profile?.email || "Super admin",
    [profile]
  );
  const displayEmail = profile?.email || "";
  const displayInitials = initials(displayName, displayEmail);

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
    <header
      data-mpangi-superadmin-topbar
      className="sticky top-0 z-[60] border-b border-[#DCEAF5] bg-white/95 px-3 py-3 backdrop-blur sm:px-5"
    >
      <div className="flex min-h-12 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A] lg:hidden"
            aria-label="Ouvrir les options"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 sm:text-xs">
              Super admin
            </p>
            <h1 className="truncate text-base font-black text-[#03357A] sm:text-lg">
              Administration globale
            </h1>
          </div>
        </div>

        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="flex min-h-12 items-center gap-2 rounded-2xl border border-[#DCEAF5] bg-white p-1.5 pr-2 shadow-sm"
          >
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={displayName}
                className="h-10 w-10 rounded-2xl object-cover"
              />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#03357A] text-sm font-black text-white">
                {displayInitials}
              </span>
            )}

            <span className="hidden min-w-0 text-left md:block">
              <span className="block text-xs font-bold text-slate-400">
                Bienvenue
              </span>
              <span className="block max-w-[180px] truncate text-sm font-black text-[#03357A]">
                {displayName}
              </span>
            </span>

            <ChevronDown
              className={`h-4 w-4 text-slate-400 transition ${
                open ? "rotate-180" : ""
              }`}
            />
          </button>

          {open && (
            <div
              data-mpangi-account-dropdown
              className="fixed left-3 right-3 top-[76px] z-[110] overflow-hidden rounded-3xl border border-[#DCEAF5] bg-white shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-3 sm:w-[350px]"
            >
              <div className="bg-[#F8FBFD] p-4 sm:p-5">
                <div className="flex min-w-0 items-center gap-3">
                  {profile?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatar_url}
                      alt={displayName}
                      className="h-14 w-14 shrink-0 rounded-2xl object-cover"
                    />
                  ) : (
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#03357A] font-black text-white">
                      {displayInitials}
                    </span>
                  )}

                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-black text-[#03357A]">
                      {displayName}
                    </h2>
                    <p className="truncate text-sm font-semibold text-slate-500">
                      {displayEmail}
                    </p>
                    <span className="mt-2 inline-flex rounded-full bg-[#EAF3FA] px-3 py-1 text-xs font-black text-[#03357A]">
                      {profile?.role || "super_admin"}
                    </span>
                  </div>
                </div>
              </div>

              <nav className="space-y-1 p-3">
                <Link
                  href="/super-admin/profile"
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-extrabold text-slate-600 hover:bg-[#EAF3FA] hover:text-[#03357A]"
                >
                  <UserRound className="h-4 w-4" />
                  Modifier mon profil
                </Link>
                <Link
                  href="/super-admin/profile?photo=1"
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-extrabold text-slate-600 hover:bg-[#EAF3FA] hover:text-[#03357A]"
                >
                  <Camera className="h-4 w-4" />
                  Modifier ma photo
                </Link>
                <Link
                  href="/super-admin/profile/password"
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-extrabold text-slate-600 hover:bg-[#EAF3FA] hover:text-[#03357A]"
                >
                  <KeyRound className="h-4 w-4" />
                  Modifier le mot de passe
                </Link>
                <Link
                  href="/super-admin/settings"
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-extrabold text-slate-600 hover:bg-[#EAF3FA] hover:text-[#03357A]"
                >
                  <Settings className="h-4 w-4" />
                  Paramètres super admin
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={logoutLoading}
                  className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-extrabold text-red-700 hover:bg-red-50 disabled:opacity-60"
                >
                  {logoutLoading ? (
                    <X className="h-4 w-4 animate-pulse" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}
                  {logoutLoading ? "Déconnexion..." : "Déconnexion"}
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
