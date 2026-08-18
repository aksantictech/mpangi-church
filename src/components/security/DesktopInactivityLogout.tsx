"use client";

import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const INACTIVITY_LIMIT_MS = 10 * 60 * 1000;
const WARNING_BEFORE_MS = 60 * 1000;
const ACTIVITY_STORAGE_KEY = "mpangi:last-desktop-activity";

export default function DesktopInactivityLogout() {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (!window.matchMedia("(min-width: 1024px)").matches) return;

    let logoutTimer: ReturnType<typeof setTimeout> | undefined;
    let warningTimer: ReturnType<typeof setTimeout> | undefined;
    let lastRecordedAt = 0;
    let signingOut = false;

    const readLastActivity = () => {
      const stored = Number(window.localStorage.getItem(ACTIVITY_STORAGE_KEY));
      return Number.isFinite(stored) && stored > 0 ? stored : Date.now();
    };

    const logout = async () => {
      if (signingOut) return;
      signingOut = true;

      try {
        await createClient().auth.signOut({ scope: "local" });
      } finally {
        window.location.assign("/login?reason=inactivity");
      }
    };

    const schedule = () => {
      if (logoutTimer) clearTimeout(logoutTimer);
      if (warningTimer) clearTimeout(warningTimer);

      const remaining =
        INACTIVITY_LIMIT_MS - (Date.now() - readLastActivity());

      if (remaining <= 0) {
        void logout();
        return;
      }

      if (remaining <= WARNING_BEFORE_MS) {
        setShowWarning(true);
      } else {
        setShowWarning(false);
        warningTimer = setTimeout(
          () => setShowWarning(true),
          remaining - WARNING_BEFORE_MS
        );
      }

      logoutTimer = setTimeout(() => void logout(), remaining);
    };

    const recordActivity = () => {
      const now = Date.now();

      if (now - lastRecordedAt < 1000) return;

      lastRecordedAt = now;
      window.localStorage.setItem(ACTIVITY_STORAGE_KEY, String(now));
      setShowWarning(false);
      schedule();
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === ACTIVITY_STORAGE_KEY) schedule();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") schedule();
    };

    // Une nouvelle session protégée ne doit jamais hériter du délai
    // d'inactivité mémorisé par une ancienne session.
    window.localStorage.setItem(ACTIVITY_STORAGE_KEY, String(Date.now()));

    const events: Array<keyof WindowEventMap> = [
      "pointerdown",
      "mousemove",
      "keydown",
      "scroll",
      "wheel",
    ];

    events.forEach((eventName) =>
      window.addEventListener(eventName, recordActivity, { passive: true })
    );

    window.addEventListener("storage", handleStorage);
    document.addEventListener("visibilitychange", handleVisibility);
    schedule();

    return () => {
      if (logoutTimer) clearTimeout(logoutTimer);
      if (warningTimer) clearTimeout(warningTimer);

      events.forEach((eventName) =>
        window.removeEventListener(eventName, recordActivity)
      );

      window.removeEventListener("storage", handleStorage);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  if (!showWarning) return null;

  return (
    <aside className="fixed bottom-6 right-6 z-[120] hidden w-[min(24rem,calc(100vw-3rem))] rounded-3xl border border-amber-200 bg-white p-5 shadow-2xl lg:block">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
          <Clock3 className="h-5 w-5" />
        </span>

        <div>
          <p className="font-black text-[#03357A]">
            Session bientôt fermée
          </p>

          <p className="mt-1 text-sm leading-6 text-slate-600">
            Sans activité, vous serez déconnecté automatiquement après 10 minutes.
          </p>

          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("pointerdown"))}
            className="mt-3 rounded-xl bg-[#03357A] px-4 py-2 text-sm font-black text-white"
          >
            Rester connecté
          </button>
        </div>
      </div>
    </aside>
  );
}
