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
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
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
      setMessage("Ce navigateur ne supporte pas les notifications push.");
      return;
    }

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    if (!publicKey) {
      setMessage("Clé publique VAPID manquante.");
      return;
    }

    setIsLoading(true);

    try {
      const registration =
        (await navigator.serviceWorker.getRegistration("/")) ||
        (await navigator.serviceWorker.register("/sw.js", { scope: "/" }));

      await navigator.serviceWorker.ready;

      const nextPermission = await Notification.requestPermission();
      setPermission(nextPermission);

      if (nextPermission !== "granted") {
        setIsLoading(false);
        setMessage("Autorisation refusée.");
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
          subscription: subscription.toJSON(),
        }),
      });

      const payload = await response.json();

      setIsLoading(false);

      if (!response.ok) {
        setMessage(payload.error || "Impossible d’activer les notifications.");
        return;
      }

      setMessage("Notifications activées.");
    } catch (error) {
      setIsLoading(false);

      setMessage(
        error instanceof Error
          ? error.message
          : "Impossible d’activer les notifications."
      );
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
          "inline-flex items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-[#022B63] disabled:opacity-70"
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
        <p className="mt-2 max-w-md text-xs font-semibold text-slate-500">
          {message}
        </p>
      )}
    </div>
  );
}