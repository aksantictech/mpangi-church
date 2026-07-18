"use client";

import {
  BellOff,
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
  churchId?: string;
  churchSlug?: string;
  label?: string;
  className?: string;
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

export default function NotificationSubscribeButton({
  churchId,
  churchSlug,
  label = "Activer les notifications",
  className,
}: NotificationSubscribeButtonProps) {
  const [
    isSupported,
    setIsSupported,
  ] = useState<boolean | null>(null);

  const [permission, setPermission] =
    useState<NotificationPermission>(
      "default"
    );

  const [
    isSubscribed,
    setIsSubscribed,
  ] = useState(false);

  const [isLoading, setIsLoading] =
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
      const supported =
        typeof window !== "undefined" &&
        window.isSecureContext &&
        "Notification" in window &&
        "serviceWorker" in navigator &&
        "PushManager" in window;

      setIsSupported(supported);
      setBrowserLabel(
        getBrowserLabel()
      );

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
              nextPermission ===
                "granted"
          )
        );
      } catch {
        setIsSubscribed(false);
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

  async function handleSubscribe() {
    setMessage("");

    if (!churchId && !churchSlug) {
      setMessage(
        "L’église de cet abonnement est introuvable."
      );

      return;
    }

    if (isSupported !== true) {
      setMessage(
        "Ce navigateur ou cette connexion ne supporte pas les notifications Push."
      );

      return;
    }

    if (
      Notification.permission ===
      "denied"
    ) {
      setPermission("denied");

      setMessage(
        `L’autorisation est bloquée dans ${browserLabel}. Modifiez les permissions du site, puis revenez sur cette page.`
      );

      return;
    }

    const publicKey =
      process.env
        .NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();

    if (!publicKey) {
      setMessage(
        "La clé publique VAPID n’est pas configurée dans l’environnement."
      );

      return;
    }

    setIsLoading(true);

    try {
      /*
       * La demande de permission reste proche
       * du clic de l’utilisateur.
       */
      const nextPermission =
        await Notification.requestPermission();

      setPermission(nextPermission);

      if (
        nextPermission !== "granted"
      ) {
        setMessage(
          `Autorisation non accordée dans ${browserLabel}. Utilisez les permissions du site pour sélectionner Autoriser.`
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

      const readyRegistration =
        await navigator.serviceWorker.ready;

      let subscription =
        await readyRegistration.pushManager.getSubscription();

      if (!subscription) {
        subscription =
          await readyRegistration.pushManager.subscribe(
            {
              userVisibleOnly: true,
              applicationServerKey:
                urlBase64ToUint8Array(
                  publicKey
                ),
            }
          );
      }

      const response = await fetch(
        "/api/notifications/subscribe",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            churchId:
              churchId || undefined,
            churchSlug:
              churchSlug || undefined,
            subscription:
              subscription.toJSON(),
          }),
        }
      );

      const payload =
        await readPayload(response);

      if (!response.ok) {
        setMessage(
          payload.error ||
            "Impossible d’activer les notifications."
        );

        return;
      }

      setIsSubscribed(true);

      setMessage(
        payload.message ||
          "Notifications activées sur cet appareil."
      );
    } catch (error: unknown) {
      setMessage(
        getErrorMessage(
          error,
          "Impossible d’activer les notifications."
        )
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUnsubscribe() {
    setIsLoading(true);
    setMessage("");

    try {
      if (
        !(
          "serviceWorker" in
          navigator
        )
      ) {
        setIsSubscribed(false);
        return;
      }

      const registration =
        await navigator.serviceWorker.getRegistration(
          "/"
        );

      const subscription =
        await registration?.pushManager.getSubscription();

      if (!subscription) {
        setIsSubscribed(false);

        setMessage(
          "Les notifications sont déjà désactivées sur cet appareil."
        );

        return;
      }

      const endpoint =
        subscription.endpoint;

      const unsubscribed =
        await subscription.unsubscribe();

      if (!unsubscribed) {
        setMessage(
          "Le navigateur n’a pas pu supprimer l’abonnement."
        );

        return;
      }

      setIsSubscribed(false);

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
          "Notifications désactivées sur cet appareil. Le nettoyage du serveur sera effectué automatiquement."
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
          "Impossible de désactiver les notifications."
        )
      );
    } finally {
      setIsLoading(false);
    }
  }

  const denied =
    permission === "denied";

  function handleMainAction() {
    if (isSubscribed) {
      void handleUnsubscribe();
      return;
    }

    if (denied) {
      void refreshPermissionState();
      return;
    }

    void handleSubscribe();
  }

  const defaultButtonClass = [
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60",
    isSubscribed
      ? "bg-red-50 text-red-700 hover:bg-red-100"
      : denied
        ? "bg-amber-50 text-amber-900 ring-1 ring-amber-200"
        : "bg-[#03357A] text-white hover:bg-[#022B63]",
  ].join(" ");

  return (
    <div>
      <button
        type="button"
        onClick={handleMainAction}
        disabled={
          isLoading ||
          isSupported === null
        }
        className={
          className ||
          defaultButtonClass
        }
      >
        {isLoading ||
        isSupported === null ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isSubscribed ? (
          <BellOff className="h-4 w-4" />
        ) : denied ? (
          <RotateCcw className="h-4 w-4" />
        ) : (
          <BellRing className="h-4 w-4" />
        )}

        {isLoading
          ? "Traitement…"
          : isSupported === null
            ? "Vérification…"
            : isSubscribed
              ? "Désactiver les notifications"
              : denied
                ? "Revérifier l’autorisation"
                : label}
      </button>

      {isSubscribed && !message && (
        <p className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          Cet appareil est abonné.
        </p>
      )}

      {isSupported === false && (
        <p className="mt-2 max-w-md text-xs font-semibold leading-5 text-amber-700">
          Les notifications Push ne sont pas
          disponibles dans ce navigateur, ce
          mode de navigation ou cette
          connexion. En production, utilisez
          HTTPS.
        </p>
      )}

      {denied && (
        <div className="mt-3 max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <div className="flex items-center gap-2 font-black">
            <Settings2 className="h-5 w-5" />
            Autorisation à réactiver dans{" "}
            {browserLabel}
          </div>

          <p className="mt-2">
            Ouvrez les informations ou
            permissions du site depuis l’icône
            située près de l’adresse, puis
            choisissez :
          </p>

          <p className="mt-2 font-black">
            Permissions du site →
            Notifications → Autoriser
          </p>

          <p className="mt-2 text-xs font-semibold">
            Vous pouvez également ouvrir les
            paramètres du navigateur, puis
            Sites, Permissions et
            Notifications.
          </p>

          <p className="mt-3 text-xs font-semibold text-amber-800">
            Une application Web ne peut pas
            remplacer automatiquement une
            décision déjà refusée par le
            navigateur.
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