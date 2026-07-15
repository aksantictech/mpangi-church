"use client";

import {
  BellRing,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import {
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

export default function NotificationSubscribeButton({
  churchId,
  label = "Activer les notifications",
  className,
}: NotificationSubscribeButtonProps) {
  const [
    isSupported,
    setIsSupported,
  ] = useState(false);

  const [
    isSubscribed,
    setIsSubscribed,
  ] = useState(false);

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  useEffect(() => {
    let active = true;

    async function detectStatus() {
      const supported =
        typeof window !==
          "undefined" &&
        "Notification" in
          window &&
        "serviceWorker" in
          navigator &&
        "PushManager" in
          window;

      if (!active) return;

      setIsSupported(
        supported
      );

      if (!supported) return;

      try {
        const registration =
          await navigator.serviceWorker.getRegistration(
            "/"
          );

        const subscription =
          await registration?.pushManager.getSubscription();

        if (active) {
          setIsSubscribed(
            Boolean(
              subscription &&
                Notification.permission ===
                  "granted"
            )
          );
        }
      } catch {
        if (active) {
          setIsSubscribed(
            false
          );
        }
      }
    }

    detectStatus();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubscribe() {
    setMessage("");

    if (!isSupported) {
      setMessage(
        "Ce navigateur ne supporte pas les notifications Push."
      );
      return;
    }

    const publicKey =
      process.env
        .NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    if (!publicKey) {
      setMessage(
        "La clé publique VAPID n’est pas configurée."
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

      const permission =
        await Notification.requestPermission();

      if (
        permission !==
        "granted"
      ) {
        setMessage(
          "Autorisation refusée. Réactivez les notifications dans les paramètres du site."
        );
        return;
      }

      let subscription =
        await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription =
          await registration.pushManager.subscribe(
            {
              userVisibleOnly:
                true,
              applicationServerKey:
                urlBase64ToUint8Array(
                  publicKey
                ),
            }
          );
      }

      const response =
        await fetch(
          "/api/push/subscribe",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              churchId,
              subscription:
                subscription.toJSON(),
            }),
          }
        );

      const payload =
        await response.json();

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
    } catch (
      subscribeError: any
    ) {
      setMessage(
        subscribeError?.message ||
          "Impossible d’activer les notifications."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={
          handleSubscribe
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
              : "bg-[#03357A] text-white hover:bg-[#022B63]",
          ].join(" ")
        }
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isSubscribed ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <BellRing className="h-4 w-4" />
        )}

        {isSubscribed
          ? "Notifications activées"
          : label}
      </button>

      {!isSupported && (
        <p className="mt-2 max-w-md text-xs font-semibold leading-5 text-amber-700">
          Ce navigateur ne
          supporte pas les
          notifications Push.
        </p>
      )}

      {message && (
        <p className="mt-2 max-w-md text-xs font-semibold leading-5 text-slate-600">
          {message}
        </p>
      )}
    </div>
  );
}
