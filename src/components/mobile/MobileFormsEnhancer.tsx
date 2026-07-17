"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const FORM_ROUTES = [
  /^\/patrimony\/assets\/new\/?$/,
  /^\/patrimony\/assets\/[^/]+\/edit\/?$/,
  /^\/administration\/minutes\/new\/?$/,
  /^\/administration\/minutes\/[^/]+\/edit\/?$/,
  /^\/administration\/correspondence\/new\/?$/,
  /^\/extensions\/activities\/new\/?$/,
  /^\/finance\/expenses\/new\/?$/,
  /^\/finance\/offerings\/new\/?$/,
  /^\/administration\/tasks\/new\/?$/,
  /^\/administration\/tasks\/[^/]+\/edit\/?$/,
  /^\/patrimony\/maintenance\/new\/?$/,
  /^\/patrimony\/movements\/new\/?$/,
  /^\/administration\/transmissions\/new\/?$/,
  /^\/administration\/transmissions\/[^/]+\/edit\/?$/,
  /^\/finance\/budgets\/new\/?$/,
  /^\/finance\/budgets\/[^/]+\/edit\/?$/,
  /^\/extensions\/new\/?$/,
  /^\/extensions\/[^/]+\/edit\/?$/,
  /^\/settings\/users\/new\/?$/,
  /^\/super-admin\/users\/new\/?$/,
  /^\/login\/?$/,
];

function matchesFormRoute(pathname: string) {
  return FORM_ROUTES.some((pattern) => pattern.test(pathname));
}


export default function MobileFormsEnhancer() {
  const pathname = usePathname() || "/";

  useEffect(() => {
    const body = document.body;

    body.dataset.mobileRoute = pathname;

    if (matchesFormRoute(pathname)) {
      body.dataset.mobileFormRoute = "true";
    } else {
      delete body.dataset.mobileFormRoute;
    }

    return () => {
      if (body.dataset.mobileRoute === pathname) {
        delete body.dataset.mobileRoute;
      }

      delete body.dataset.mobileFormRoute;
    };
  }, [pathname]);

  return null;
}
