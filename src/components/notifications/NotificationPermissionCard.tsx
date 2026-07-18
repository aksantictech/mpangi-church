"use client";

import {
  BellOff,
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

type NotificationPermissionCardProps = {
  churchSlug?: string;
};

type ApiPayload = {
  ok?: boolean;
  error?: string;
  message?: string;
};

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function urlBase64ToUint8Array(
  base64String: string
) {
  const normalized =
    base64String.trim();

  const padding = "=".repeat(
    (4 - (normalized.length % 4)) % 4
  );

  const base64 =
    `${normalized}${padding}`
      .replace(/-/g, "+")
      .replace(/_/g, "/");

  const rawData =
    window.atob(base64);

  return Uint8Array.from(
    rawData,
    (character) =>
      character.charCodeAt(0)
  );
}

function getBrowserLabel() {
  if (
    typeof navigator === "undefined"
  ) {
    return "votre navigateur";
  }

  const userAgent =
    navigator.userAgent;

  if (
    /SamsungBrowser/i.test(
      userAgent
    )
  ) {
    return "Samsung Internet";
  }

  if (
    /EdgA?|EdgiOS/i.test(
      userAgent
    )
  ) {
    return "Microsoft Edge";
  }

  if (
    /Firefox|FxiOS/i.test(
      userAgent
    )
  ) {
    return "Firefox";
  }

  if (
    /OPR|Opera/i.test(
      userAgent
    )
  ) {
    return "Opera";
  }

  if (
    /CriOS|Chrome/i.test(
      userAgent
    ) &&
    !/Edg|OPR|SamsungBrowser/i.test(
      userAgent
    )
  ) {
    return "Google Chrome";
  }

  if (
    /Safari/i.test(userAgent) &&
    !/Chrome|CriOS|Android/i.test(
      userAgent
    )
  ) {
    return "Safari";
  }

  return "votre navigateur";
}

async function readPayload(
  response: Response
): Promise<ApiPayload> {
  const raw =
    await response.text();

  if (!raw) return {};

  try {
    const parsed: unknown =
      JSON.parse(raw);

    if (!isRecord(parsed)) {
      return {};
    }

    return {
      ok:
        typeof parsed.ok === "boolean"
          ? parsed.ok
          : undefined,
      error:
        typeof parsed.error === "string"
          ? parsed.error
          : undefined,
      message:
        typeof parsed.message === "string"
          ? parsed.message
          : undefined,
    };
  } catch {
    return {
      error:
        raw.slice(0, 400) ||
        `Erreur HTTP ${response.status}`,
    };
  }
}

function getErrorMessage(
  error: unknown,
  fallback: string
) {
  return error instanceof Error
    ? error.message
    : fallback;
}

export default function NotificationPermissionCard({
  churchSlug,
}: NotificationPermissionCardProps) {
  const [supported, setSupported] =
    useState<boolean | null>(null);

  const [permission, setPermission] =
    useState<NotificationPermission>(
      "default"
    );

  const [subscribed, setSubscribed] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [
    browserLabel,
    setBrowserLabel,
  ] = useState(
    "votre navigateur"
  );

  const refreshPermissionState =
    useCallback(async () => {
      const isSupported =
        typeof window !== "undefined" &&
        window.isSecureContext &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;

      setSupported(isSupported);
      setBrowserLabel(
        getBrowserLabel()
      );

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

        const existingSubscription =
          await registration?.pushManager.getSubscription();

        setSubscribed(
          Boolean(
            existingSubscription &&
              nextPermission ===
                "granted"
          )
        );
      } catch {
        setSubscribed(false);
      }
    }, []);

  useEffect(() => {
  const initialCheckId =
    window.setTimeout(() => {
      void refreshPermissionState();
    }, 0);

  function handleFocus() {
    void refreshPermissionState();
  }

  function handleVisibilityChange() {
    if (
      document.visibilityState ===
      "visible"
    ) {
      void refreshPermissionState();
    }
  }

  window.addEventListener(
    "focus",
    handleFocus
  );

  document.addEventListener(
    "visibilitychange",
    handleVisibilityChange
  );

  return () => {
    window.clearTimeout(
      initialCheckId
    );

    window.removeEventListener(
      "focus",
      handleFocus
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
        supported !== true ||
        !("Notification" in window) ||
        !(
          "serviceWorker" in
          navigator
        )
      ) {
        setMessage(
          "Les notifications ne sont pas disponibles sur cet appareil."
        );

        return;
      }

      if (
        Notification.permission ===
        "denied"
      ) {
        setPermission("denied");

        setMessage(
          `Les notifications sont bloquées dans ${browserLabel}.`
        );

        return;
      }

      const vapidPublicKey =
        process.env
          .NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();

      if (!vapidPublicKey) {
        setMessage(
          "Clé VAPID publique manquante dans l’environnement."
        );

        return;
      }

      const permissionResult =
        await Notification.requestPermission();

      setPermission(
        permissionResult
      );

      if (
        permissionResult !==
        "granted"
      ) {
        setMessage(
          `Autorisation non accordée dans ${browserLabel}.`
        );

        return;
      }

      const currentRegistration =
        await navigator.serviceWorker.getRegistration(
          "/"
        );

      if (!currentRegistration) {
        await navigator.serviceWorker.register(
          "/sw.js",
          {
            scope: "/",
            updateViaCache: "none",
          }
        );
      }

      /*
       * navigator.serviceWorker.ready retourne
       * l’enregistrement réellement actif.
       */
      const readyRegistration =
        await navigator.serviceWorker.ready;

      const existingSubscription =
        await readyRegistration.pushManager.getSubscription();

      const subscription =
        existingSubscription ||
        (await readyRegistration.pushManager.subscribe(
          {
            userVisibleOnly: true,
            applicationServerKey:
              urlBase64ToUint8Array(
                vapidPublicKey
              ),
          }
        ));

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
            churchSlug:
              churchSlug || undefined,
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
        payload.message ||
          "Notifications activées sur cet appareil."
      );
    } catch (error: unknown) {
      setMessage(
        getErrorMessage(
          error,
          "Activation impossible."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  async function deactivateNotifications() {
    setLoading(true);
    setMessage("");

    try {
      if (
        !(
          "serviceWorker" in
          navigator
        )
      ) {
        setSubscribed(false);
        return;
      }

      const registration =
        await navigator.serviceWorker.getRegistration(
          "/"
        );

      const subscription =
        await registration?.pushManager.getSubscription();

      if (!subscription) {
        setSubscribed(false);

        setMessage(
          "Les notifications sont déjà désactivées sur cet appareil."
        );

        return;
      }

      const endpoint =
        subscription.endpoint;

      /*
       * Le navigateur est désabonné en premier.
       * Si le nettoyage du serveur échoue, le
       * prochain envoi recevra une erreur 404/410
       * et désactivera automatiquement la ligne.
       */
      const unsubscribed =
        await subscription.unsubscribe();

      if (!unsubscribed) {
        setMessage(
          "Le navigateur n’a pas pu supprimer l’abonnement."
        );

        return;
      }

      setSubscribed(false);

      const response = await fetch(
        "/api/notifications/subscribe",
        {
          method: "DELETE",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            endpoint,
          }),
        }
      );

      const payload =
        await readPayload(response);

      if (!response.ok) {
        setMessage(
          "Notifications désactivées sur cet appareil, mais le nettoyage du serveur sera effectué automatiquement."
        );

        return;
      }

      setMessage(
        payload.message ||
          "Notifications désactivées sur cet appareil."
      );
    } catch (error: unknown) {
      setMessage(
        getErrorMessage(
          error,
          "Désactivation impossible."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  if (supported === null) {
    return (
      <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Vérification des notifications…
        </div>
      </section>
    );
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

            <p className="mt-1 text-sm leading-6">
              Ce navigateur, ce mode de
              navigation ou cette connexion
              ne permet pas les notifications
              Web Push.
            </p>

            <p className="mt-2 text-xs font-semibold">
              En production, la page doit être
              ouverte en HTTPS. Sur iPhone,
              l’application doit généralement
              être ajoutée à l’écran d’accueil.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const denied =
    permission === "denied";

  function handleMainAction() {
    if (subscribed) {
      void deactivateNotifications();
      return;
    }

    if (denied) {
      void refreshPermissionState();
      return;
    }

    void activateNotifications();
  }

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
            Recevez les publications,
            événements et alertes de votre
            église.
          </p>
        </div>
      </div>

      {denied && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <div className="flex items-center gap-2 font-black">
            <Settings2 className="h-5 w-5" />
            Autorisation bloquée dans{" "}
            {browserLabel}
          </div>

          <p className="mt-2">
            Ouvrez les informations ou
            permissions du site depuis l’icône
            proche de l’adresse.
          </p>

          <p className="mt-2 font-black">
            Permissions du site →
            Notifications → Autoriser
          </p>

          <p className="mt-2 text-xs font-semibold">
            Les intitulés peuvent varier selon
            le navigateur. Vous pouvez aussi
            ouvrir les paramètres du
            navigateur, puis Sites,
            Permissions et Notifications.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={handleMainAction}
        disabled={loading}
        className={[
          "mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto",
          subscribed
            ? "bg-red-50 text-red-700 hover:bg-red-100"
            : denied
              ? "bg-amber-100 text-amber-950"
              : "bg-[#03357A] text-white hover:bg-[#022B63]",
        ].join(" ")}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : subscribed ? (
          <BellOff className="h-4 w-4" />
        ) : denied ? (
          <RotateCcw className="h-4 w-4" />
        ) : (
          <BellRing className="h-4 w-4" />
        )}

        {loading
          ? "Traitement…"
          : subscribed
            ? "Désactiver les notifications"
            : denied
              ? "Revérifier l’autorisation"
              : "Activer les notifications"}
      </button>

      {subscribed && !message && (
        <p className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          Cet appareil est actuellement
          abonné.
        </p>
      )}

      {message && (
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
          {message}
        </p>
      )}
    </section>
  );
}