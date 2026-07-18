"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

type Experience =
  | "dashboard"
  | "public"
  | "scanner"
  | "notifications"
  | "install"
  | null;


function resolveExperience(pathname: string): Experience {
  if (
    pathname === "/dashboard" ||
    pathname === "/super-admin/dashboard" ||
    pathname === "/finance" ||
    pathname === "/patrimony" ||
    pathname === "/extensions"
  ) {
    return "dashboard";
  }

  if (/^\/church\/[^/]+\/?$/.test(pathname)) {
    return "public";
  }

  if (
    pathname.startsWith("/attendance/scanner") ||
    pathname === "/scanner"
  ) {
    return "scanner";
  }

  if (pathname === "/notifications") {
    return "notifications";
  }

  if (
    pathname === "/install" ||
    /^\/church\/[^/]+\/install\/?$/.test(pathname)
  ) {
    return "install";
  }

  return null;
}



export default function MobileRouteExperienceEnhancer() {
  const pathname = usePathname() || "/";

  useEffect(() => {
    const body = document.body;
    const experience = resolveExperience(pathname);

    if (!experience) {
      delete body.dataset.mobileExperience;
      return;
    }

    body.dataset.mobileExperience = experience;

    return () => {
      if (body.dataset.mobileExperience === experience) {
        delete body.dataset.mobileExperience;
      }
    };
  }, [pathname]);

  return null;
}