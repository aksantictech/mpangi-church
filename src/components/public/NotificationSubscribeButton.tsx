"use client";

import {
  BellRing,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Settings2,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

type NotificationSubscribeButtonProps = {
  churchId: string;
  label?: string;
  className?: string;
};

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

export default function NotificationSubscribeButton({
  churchId,
  label = "Activer les notifications",
  className,
}: NotificationSubscribeButtonProps) {
  const [isSupported, setIsSupported] =
    useState(false);

  const [permission, setPermission] =
    useState<NotificationPermission>("default");

  const [isSubscribed, setIsSubscribed] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [browserLabel, setBrowserLabel] =
    useState("votre navigateur");

  const refreshPermissionState =
    useCallback(async () => {
      const supported =
        typeof window !== "undefined" &&
        "Notification" in window &&
        "serviceWorker" in navigator &&
        "PushManager" in window;

      setIsSupported(supported);
      setBrowserLabel(getBrowserLabel());

      if (!supported) {
        setIsSubscribed(false);
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

        const subscription =
          await registration?.pushManager.getSubscription();

        setIsSubscribed(
          Boolean(
            subscription &&
              nextPermission === "granted"
          )
        );
      } catch {
        setIsSubscribed(false);
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

  async function handleSubscribe() {
    setMessage("");

    if (!isSupported) {
      setMessage(
        "Ce navigateur ne supporte pas les notifications Push."
      );
      return;
    }

    if (Notification.permission === "denied") {
      setPermission("denied");
      setMessage(
        `L’autorisation est bloquée dans ${browserLabel}. Modifiez les permissions du site, puis revenez sur cette page.`
      );
      return;
    }

    const publicKey =
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    if (!publicKey) {
      setMessage(
        "La clé publique VAPID n’est pas configurée dans Vercel."
      );
      return;
    }

    setIsLoading(true);

    try {
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

      const nextPermission =
        await Notification.requestPermission();

      setPermission(nextPermission);

      if (nextPermission !== "granted") {
        setMessage(
          `Autorisation non accordée dans ${browserLabel}. Utilisez les permissions du site pour sélectionner Autoriser.`
        );
        return;
      }

      let subscription =
        await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription =
          await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey:
              urlBase64ToUint8Array(publicKey),
          });
      }

      const response = await fetch(
        "/api/push/subscribe",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            churchId,
            subscription:
              subscription.toJSON(),
          }),
        }
      );

      const payload =
        await readPayload(response);

      if (!response.ok) {
        throw new Error(
          payload.error ||
            "Impossible d’activer les notifications."
        );
      }

      setIsSubscribed(true);
      setMessage(
        "Notifications activées sur cet appareil."
      );
    } catch (subscribeError: any) {
      setMessage(
        subscribeError?.message ||
          "Impossible d’activer les notifications."
      );
    } finally {
      setIsLoading(false);
    }
  }

  const denied =
    permission === "denied";

  return (
    <div>
      <button
        type="button"
        onClick={
          denied
            ? refreshPermissionState
            : handleSubscribe
        }
        disabled={
          isLoading ||
          isSubscribed
        }
        className={
          className ||
          [
            "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black shadow-sm transition",
            isSubscribed
              ? "bg-green-50 text-green-700"
              : denied
                ? "bg-amber-50 text-amber-900 ring-1 ring-amber-200"
                : "bg-[#03357A] text-white hover:bg-[#022B63]",
          ].join(" ")
        }
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isSubscribed ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : denied ? (
          <RotateCcw className="h-4 w-4" />
        ) : (
          <BellRing className="h-4 w-4" />
        )}

        {isSubscribed
          ? "Notifications activées"
          : denied
            ? "Revérifier l’autorisation"
            : label}
      </button>

      {!isSupported && (
        <p className="mt-2 max-w-md text-xs font-semibold leading-5 text-amber-700">
          Les notifications Push ne sont pas
          disponibles dans ce navigateur ou ce mode
          de navigation.
        </p>
      )}

      {denied && (
        <div className="mt-3 max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <div className="flex items-center gap-2 font-black">
            <Settings2 className="h-5 w-5" />
            Autorisation à réactiver dans {browserLabel}
          </div>

          <p className="mt-2">
            Ouvrez les informations ou les permissions
            du site depuis l’icône située près de
            l’adresse, puis choisissez :
          </p>

          <p className="mt-2 font-black">
            Permissions du site → Notifications →
            Autoriser
          </p>

          <p className="mt-2 text-xs font-semibold">
            Les noms des menus peuvent varier selon
            le navigateur. Vous pouvez aussi ouvrir
            ses Paramètres → Sites / Permissions →
            Notifications, puis rechercher ce
            sous-domaine.
          </p>

          <p className="mt-3 text-xs font-semibold text-amber-800">
            Une application web ne peut pas remplacer
            automatiquement une décision déjà refusée
            par le navigateur.
          </p>
        </div>
      )}

      {message && (
        <p className="mt-2 max-w-md text-xs font-semibold leading-5 text-slate-600">
          {message}
        </p>
      )}
    </div>
  );
}
