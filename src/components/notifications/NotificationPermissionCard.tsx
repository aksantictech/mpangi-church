"use client";

import {
  BellRing,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Settings2,
  WifiOff,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

function urlBase64ToUint8Array(
  base64String: string
) {
  const padding = "=".repeat(
    (4 - (base64String.length % 4)) % 4
  );

  const base64 =
    `${base64String}${padding}`
      .replace(/-/g, "+")
      .replace(/_/g, "/");

  const rawData = window.atob(base64);

  return Uint8Array.from(
    rawData,
    (character) => character.charCodeAt(0)
  );
}

function getBrowserLabel() {
  if (typeof navigator === "undefined") {
    return "votre navigateur";
  }

  const userAgent = navigator.userAgent;

  if (/SamsungBrowser/i.test(userAgent)) {
    return "Samsung Internet";
  }

  if (/EdgA?|EdgiOS/i.test(userAgent)) {
    return "Microsoft Edge";
  }

  if (/Firefox|FxiOS/i.test(userAgent)) {
    return "Firefox";
  }

  if (/OPR|Opera/i.test(userAgent)) {
    return "Opera";
  }

  if (
    /CriOS|Chrome/i.test(userAgent) &&
    !/Edg|OPR|SamsungBrowser/i.test(userAgent)
  ) {
    return "Google Chrome";
  }

  if (
    /Safari/i.test(userAgent) &&
    !/Chrome|CriOS|Android/i.test(userAgent)
  ) {
    return "Safari";
  }

  return "votre navigateur";
}

async function readPayload(
  response: Response
) {
  const raw = await response.text();

  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    return {
      error:
        raw.slice(0, 400) ||
        `Erreur HTTP ${response.status}`,
    };
  }
}

export default function NotificationPermissionCard({
  churchSlug,
}: {
  churchSlug?: string;
}) {
  const [supported, setSupported] =
    useState(true);

  const [permission, setPermission] =
    useState<NotificationPermission>("default");

  const [subscribed, setSubscribed] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [browserLabel, setBrowserLabel] =
    useState("votre navigateur");

  const refreshPermissionState =
    useCallback(async () => {
      const isSupported =
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;

      setSupported(isSupported);
      setBrowserLabel(getBrowserLabel());

      if (!isSupported) {
        setSubscribed(false);
        return;
      }

      const nextPermission =
        Notification.permission;

      setPermission(nextPermission);

      try {
        const registration =
          await navigator.serviceWorker.getRegistration(
            "/"
          );

        const existing =
          await registration?.pushManager.getSubscription();

        setSubscribed(
          Boolean(
            existing &&
              nextPermission === "granted"
          )
        );
      } catch {
        setSubscribed(false);
      }
    }, []);

  useEffect(() => {
    refreshPermissionState();

    function handleVisibilityChange() {
      if (
        document.visibilityState === "visible"
      ) {
        refreshPermissionState();
      }
    }

    window.addEventListener(
      "focus",
      refreshPermissionState
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      window.removeEventListener(
        "focus",
        refreshPermissionState
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [refreshPermissionState]);

  async function activateNotifications() {
    setLoading(true);
    setMessage("");

    try {
      if (
        Notification.permission === "denied"
      ) {
        setPermission("denied");
        setMessage(
          `Les notifications sont bloquées dans ${browserLabel}.`
        );
        return;
      }

      const vapidPublicKey =
        process.env
          .NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!vapidPublicKey) {
        setMessage(
          "Clé VAPID publique manquante dans Vercel."
        );
        return;
      }

      const result =
        await Notification.requestPermission();

      setPermission(result);

      if (result !== "granted") {
        setMessage(
          `Autorisation non accordée dans ${browserLabel}.`
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

      await navigator.serviceWorker.ready;

      const existingSubscription =
        await registration.pushManager.getSubscription();

      const subscription =
        existingSubscription ||
        (
          await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey:
              urlBase64ToUint8Array(
                vapidPublicKey
              ),
          })
        );

      const response = await fetch(
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

      const payload =
        await readPayload(response);

      if (!response.ok) {
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
    } catch (error: any) {
      setMessage(
        error?.message ||
          "Activation impossible."
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
              Notifications non disponibles
            </h3>

            <p className="mt-1 text-sm">
              Ce navigateur ou ce mode de navigation
              ne supporte pas les notifications Web
              Push.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const denied =
    permission === "denied";

  return (
    <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
          <BellRing className="h-6 w-6" />
        </div>

        <div className="min-w-0">
          <h3 className="font-black text-[#03357A]">
            Notifications sur cet appareil
          </h3>

          <p className="mt-1 text-sm leading-6 text-slate-600">
            Recevez les publications et alertes de
            votre église.
          </p>
        </div>
      </div>

      {denied && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <div className="flex items-center gap-2 font-black">
            <Settings2 className="h-5 w-5" />
            Autorisation bloquée dans {browserLabel}
          </div>

          <p className="mt-2">
            Ouvrez les informations ou permissions
            du site depuis l’icône proche de l’adresse.
          </p>

          <p className="mt-2 font-black">
            Permissions du site → Notifications →
            Autoriser
          </p>

          <p className="mt-2 text-xs font-semibold">
            Les intitulés peuvent varier. Vous pouvez
            également passer par les paramètres du
            navigateur, puis Sites / Permissions /
            Notifications.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={
          denied
            ? refreshPermissionState
            : activateNotifications
        }
        disabled={
          loading ||
          subscribed
        }
        className={[
          "mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition sm:w-auto",
          subscribed
            ? "bg-green-50 text-green-700"
            : denied
              ? "bg-amber-100 text-amber-950"
              : "bg-[#03357A] text-white",
        ].join(" ")}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : subscribed ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : denied ? (
          <RotateCcw className="h-4 w-4" />
        ) : (
          <BellRing className="h-4 w-4" />
        )}

        {subscribed
          ? "Notifications activées"
          : denied
            ? "Revérifier l’autorisation"
            : "Activer les notifications"}
      </button>

      {message && (
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
          {message}
        </p>
      )}
    </section>
  );
}
