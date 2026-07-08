"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing, CheckCircle2, Loader2, WifiOff } from "lucide-react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

export default function NotificationPermissionCard({
  churchSlug,
}: {
  churchSlug?: string;
}) {
  const [supported, setSupported] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const isSupported =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;

    setSupported(isSupported);

    if (isSupported) {
      setPermission(Notification.permission);
    }
  }, []);

  async function activateNotifications() {
    try {
      setLoading(true);
      setMessage("");

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!vapidPublicKey) {
        setMessage("Clé VAPID publique manquante.");
        return;
      }

      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== "granted") {
        setMessage("Notifications refusées par le navigateur.");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");

      const existingSubscription =
        await registration.pushManager.getSubscription();

      const subscription =
        existingSubscription ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        }));

      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscription,
          churchSlug,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setMessage(payload.error || "Activation impossible.");
        return;
      }

      setMessage("Notifications activées sur cet appareil.");
    } finally {
      setLoading(false);
    }
  }

  if (!supported) {
    return (
      <div className="rounded-3xl border border-orange-100 bg-orange-50 p-5 text-orange-800">
        <div className="flex items-start gap-3">
          <WifiOff className="h-6 w-6 shrink-0" />
          <div>
            <h3 className="font-black">Notifications non supportées</h3>
            <p className="mt-1 text-sm">
              Ce navigateur ne supporte pas les notifications web push.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const active = permission === "granted";

  return (
    <div className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
            {active ? (
              <BellRing className="h-6 w-6" />
            ) : (
              <Bell className="h-6 w-6" />
            )}
          </div>

          <div>
            <h3 className="font-black text-[#03357A]">
              Notifications internet
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Activez les notifications pour recevoir les nouvelles publications,
              enseignements et communications importantes.
            </p>

            {message && (
              <p className="mt-2 text-sm font-bold text-[#03357A]">
                {message}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={activateNotifications}
          disabled={loading || active}
          className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-extrabold transition ${
            active
              ? "bg-green-50 text-green-700"
              : "bg-[#03357A] text-white hover:bg-[#022B63]"
          } disabled:cursor-not-allowed`}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : active ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
          {active ? "Activées" : "Activer"}
        </button>
      </div>
    </div>
  );
}
