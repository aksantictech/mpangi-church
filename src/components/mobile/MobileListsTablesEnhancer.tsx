"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";


const LIST_ROUTES = [
  /^\/members\/?$/,
  /^\/settings\/users\/?$/,
  /^\/super-admin\/churches\/?$/,
  /^\/super-admin\/users\/?$/,
  /^\/departments\/?$/,
  /^\/events\/?$/,
  /^\/souls\/?$/,
  /^\/appointments\/?$/,
  /^\/notifications\/?$/,
  /^\/attendance\/reports\/[^/]+\/?$/,
  /^\/administration\/correspondence\/?$/,
  /^\/administration\/inbox\/?$/,
  /^\/administration\/tasks\/?$/,
  /^\/administration\/minutes\/?$/,
  /^\/administration\/transmissions\/?$/,
  /^\/inbox\/?$/,
  /^\/finance\/offerings\/?$/,
  /^\/finance\/expenses\/?$/,
  /^\/finance\/budgets\/?$/,
  /^\/finance\/reports\/?$/,
  /^\/finance\/donations\/?$/,
  /^\/patrimony\/assets\/?$/,
  /^\/patrimony\/maintenance\/?$/,
  /^\/patrimony\/movements\/?$/,
  /^\/extensions\/?$/,
  /^\/extensions\/activities\/?$/,
  /^\/extensions\/reports\/?$/,
  /^\/teachings\/?$/,
];

function matchesListRoute(pathname: string) {
  return LIST_ROUTES.some((pattern) => pattern.test(pathname));
}



export default function MobileListsTablesEnhancer() {
  const pathname = usePathname() || "/";

  useEffect(() => {
    const body = document.body;
    const active = matchesListRoute(pathname);

    if (!active) {
      delete body.dataset.mobileListRoute;
      return;
    }

    body.dataset.mobileListRoute = "true";

    return () => {
      delete body.dataset.mobileListRoute;
    };
  }, [pathname]);

  return null;
}