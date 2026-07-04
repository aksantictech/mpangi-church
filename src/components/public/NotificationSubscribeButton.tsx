"use client";

import { useEffect, useState } from "react";
import { BellRing, CheckCircle2, Loader2 } from "lucide-react";

type NotificationSubscribeButtonProps = {
  churchId: string;
  label?: string;
  className?: string;
};

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

export default function NotificationSubscribeButton({
  churchId,
  label = "Activer les notifications",
  className,
}: NotificationSubscribeButtonProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      "Notification" in window &&
      "serviceWorker" in navigator &&
      "PushManager" in window;

    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  async function handleSubscribe() {
    setMessage("");

    if (!isSupported) {
      setMessage("Notifications non supportées sur ce navigateur.");
      return;
    }

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    if (!publicKey) {
      setMessage("Notifications non configurées.");
      return;
    }

    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      const nextPermission = await Notification.requestPermission();
      setPermission(nextPermission);

      if (nextPermission !== "granted") {
        setMessage("Autorisation refusée.");
        setIsLoading(false);
        return;
      }

      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          churchId,
          subscription,
        }),
      });

      const payload = await response.json();

      setIsLoading(false);

      if (!response.ok) {
        setMessage(payload.error || "Impossible d’activer les notifications.");
        return;
      }

      setMessage("Notifications activées.");
    } catch {
      setIsLoading(false);
      setMessage("Impossible d’activer les notifications.");
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleSubscribe}
        disabled={isLoading || permission === "granted"}
        className={
          className ||
          "inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-[#03357A] shadow-sm hover:bg-[#EAF3FA] disabled:opacity-70"
        }
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : permission === "granted" ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <BellRing className="h-4 w-4" />
        )}

        {permission === "granted" ? "Notifications activées" : label}
      </button>

      {message && (
        <p className="mt-2 text-xs font-semibold text-white/80 md:text-slate-500">
          {message}
        </p>
      )}
    </div>
  );
}