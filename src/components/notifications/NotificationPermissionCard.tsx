"use client";

import {
  Bell,
  BellRing,
  CheckCircle2,
  Loader2,
  WifiOff,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";

function urlBase64ToUint8Array(
  base64String: string
) {
  const padding = "=".repeat(
    (
      4 -
      (base64String.length %
        4)
    ) % 4
  );

  const base64 =
    `${base64String}${padding}`
      .replace(/-/g, "+")
      .replace(/_/g, "/");

  const rawData =
    window.atob(base64);

  const outputArray =
    new Uint8Array(
      rawData.length
    );

  for (
    let index = 0;
    index < rawData.length;
    index += 1
  ) {
    outputArray[index] =
      rawData.charCodeAt(
        index
      );
  }

  return outputArray;
}

export default function NotificationPermissionCard({
  churchSlug,
}: {
  churchSlug?: string;
}) {
  const [
    supported,
    setSupported,
  ] = useState(true);

  const [
    subscribed,
    setSubscribed,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  useEffect(() => {
    let active = true;

    async function detect() {
      const isSupported =
        typeof window !==
          "undefined" &&
        "serviceWorker" in
          navigator &&
        "PushManager" in
          window &&
        "Notification" in
          window;

      if (!active) return;

      setSupported(
        isSupported
      );

      if (!isSupported) {
        return;
      }

      const registration =
        await navigator.serviceWorker.getRegistration(
          "/"
        );

      const existing =
        await registration?.pushManager.getSubscription();

      if (active) {
        setSubscribed(
          Boolean(
            existing &&
              Notification.permission ===
                "granted"
          )
        );
      }
    }

    detect().catch(() => {
      if (active) {
        setSubscribed(
          false
        );
      }
    });

    return () => {
      active = false;
    };
  }, []);

  async function activateNotifications() {
    try {
      setLoading(true);
      setMessage("");

      const vapidPublicKey =
        process.env
          .NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!vapidPublicKey) {
        setMessage(
          "Clé VAPID publique manquante."
        );
        return;
      }

      const result =
        await Notification.requestPermission();

      if (
        result !==
        "granted"
      ) {
        setMessage(
          "Notifications refusées par le navigateur."
        );
        return;
      }

      const registration =
        (
          await navigator.serviceWorker.getRegistration(
            "/"
          )
        ) ||
        (
          await navigator.serviceWorker.register(
            "/sw.js",
            {
              scope: "/",
            }
          )
        );

      const existingSubscription =
        await registration.pushManager.getSubscription();

      const subscription =
        existingSubscription ||
        (
          await registration.pushManager.subscribe(
            {
              userVisibleOnly:
                true,
              applicationServerKey:
                urlBase64ToUint8Array(
                  vapidPublicKey
                ),
            }
          )
        );

      const response =
        await fetch(
          "/api/notifications/subscribe",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              subscription:
                subscription.toJSON(),
              churchSlug,
            }),
          }
        );

      if (!response.ok) {
        const payload =
          await response
            .json()
            .catch(() => ({}));

        setMessage(
          payload.error ||
            "Activation impossible."
        );

        return;
      }

      setSubscribed(true);
      setMessage(
        "Notifications activées sur cet appareil."
      );
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
            <h3 className="font-black">
              Notifications non
              supportées
            </h3>

            <p className="mt-1 text-sm">
              Ce navigateur ne
              supporte pas les
              notifications web
              Push.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
            {subscribed ? (
              <BellRing className="h-6 w-6" />
            ) : (
              <Bell className="h-6 w-6" />
            )}
          </div>

          <div>
            <h3 className="font-black text-[#03357A]">
              Notifications
              internet
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              Activez les
              notifications pour
              recevoir les nouvelles
              publications,
              enseignements et
              communications
              importantes.
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
          onClick={
            activateNotifications
          }
          disabled={
            loading ||
            subscribed
          }
          className={[
            "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition",
            subscribed
              ? "bg-green-50 text-green-700"
              : "bg-[#03357A] text-white hover:bg-[#022B63]",
          ].join(" ")}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : subscribed ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Bell className="h-4 w-4" />
          )}

          {subscribed
            ? "Activées"
            : "Activer"}
        </button>
      </div>
    </div>
  );
}
