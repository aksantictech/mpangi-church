"use client";

import { useEffect } from "react";

type NetworkInformationLike = {
  saveData?: boolean;
  effectiveType?: string;
  addEventListener?: (
    type: "change",
    listener: () => void
  ) => void;
  removeEventListener?: (
    type: "change",
    listener: () => void
  ) => void;
};

function updatePerformanceAttributes() {
  const root = document.documentElement;
  const connection = (
    navigator as Navigator & {
      connection?: NetworkInformationLike;
      mozConnection?: NetworkInformationLike;
      webkitConnection?: NetworkInformationLike;
      deviceMemory?: number;
    }
  ).connection ||
    (
      navigator as Navigator & {
        mozConnection?: NetworkInformationLike;
      }
    ).mozConnection ||
    (
      navigator as Navigator & {
        webkitConnection?: NetworkInformationLike;
      }
    ).webkitConnection;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const saveData = Boolean(connection?.saveData);
  const slowNetwork = ["slow-2g", "2g"].includes(
    String(connection?.effectiveType || "")
  );

  const deviceMemory = (
    navigator as Navigator & {
      deviceMemory?: number;
    }
  ).deviceMemory;

  const lowMemory =
    typeof deviceMemory === "number" && deviceMemory <= 2;

  root.dataset.reducedMotion = String(reducedMotion);
  root.dataset.saveData = String(saveData);
  root.dataset.lowPower = String(slowNetwork || lowMemory);
}

export default function MobilePerformanceCoordinator() {
  useEffect(() => {
    const media = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    const navigatorWithConnection =
      navigator as Navigator & {
        connection?: NetworkInformationLike;
        mozConnection?: NetworkInformationLike;
        webkitConnection?: NetworkInformationLike;
      };

    const connection =
      navigatorWithConnection.connection ||
      navigatorWithConnection.mozConnection ||
      navigatorWithConnection.webkitConnection;

    updatePerformanceAttributes();

    media.addEventListener("change", updatePerformanceAttributes);
    connection?.addEventListener?.(
      "change",
      updatePerformanceAttributes
    );

    return () => {
      media.removeEventListener(
        "change",
        updatePerformanceAttributes
      );
      connection?.removeEventListener?.(
        "change",
        updatePerformanceAttributes
      );
    };
  }, []);

  return null;
}
