"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

type NavigationItem = {
  code: string;
  href: string;
};

type NavigationPayload = {
  data?: {
    items?: NavigationItem[];
  };
};

const PROTECTED_PREFIXES = [
  "/dashboard/role",
  "/my-work",
  "/members",
  "/attendance",
  "/souls",
  "/departments",
  "/events",
  "/public-requests",
  "/teachings",
  "/notifications",
  "/finance",
  "/patrimony",
  "/administration",
  "/inbox",
  "/extensions",
  "/settings/users",
  "/settings/roles",
  "/modules",
];

const ALWAYS_VISIBLE_PREFIXES = [
  "/dashboard",
  "/profile",
  "/account",
  "/install",
  "/church/",
  "/login",
  "/logout",
  "/unauthorized",
];

function normalizePath(value: string) {
  const path = value.split("?")[0].split("#")[0];

  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1);
  }

  return path || "/";
}

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) =>
      pathname === prefix ||
      pathname.startsWith(`${prefix}/`)
  );
}

function isAlwaysVisible(pathname: string) {
  return ALWAYS_VISIBLE_PREFIXES.some(
    (prefix) =>
      pathname === prefix ||
      pathname.startsWith(prefix)
  );
}

function isAuthorizedPath(
  pathname: string,
  allowedHrefs: string[]
) {
  if (isAlwaysVisible(pathname)) return true;
  if (!isProtectedPath(pathname)) return true;

  if (
    pathname === "/modules" &&
    allowedHrefs.length > 0
  ) {
    return true;
  }

  return allowedHrefs.some((allowedHref) => {
    const allowed = normalizePath(allowedHref);

    if (pathname === allowed) return true;

    if (pathname.startsWith(`${allowed}/`)) {
      return true;
    }

    if (
      ["/finance", "/patrimony", "/administration"].includes(
        pathname
      ) &&
      allowed.startsWith(`${pathname}/`)
    ) {
      return true;
    }

    return false;
  });
}

function setLinkVisibility(
  link: HTMLAnchorElement,
  visible: boolean
) {
  const container =
    link.closest("li") ||
    link.closest("[data-menu-item]") ||
    link;

  if (!(container instanceof HTMLElement)) return;

  if (visible) {
    if (
      container.dataset.permissionHidden === "true"
    ) {
      container.hidden = false;
      container.removeAttribute("aria-hidden");
      delete container.dataset.permissionHidden;
    }

    return;
  }

  container.hidden = true;
  container.setAttribute("aria-hidden", "true");
  container.dataset.permissionHidden = "true";
}

function filterNavigation(allowedHrefs: string[]) {
  const links = document.querySelectorAll<HTMLAnchorElement>(
    "nav a[href], aside a[href], [role='navigation'] a[href]"
  );

  links.forEach((link) => {
    try {
      const url = new URL(link.href, window.location.origin);

      if (url.origin !== window.location.origin) {
        return;
      }

      const pathname = normalizePath(url.pathname);

      setLinkVisibility(
        link,
        isAuthorizedPath(pathname, allowedHrefs)
      );
    } catch {
      // Un lien non standard ne doit pas casser la navigation.
    }
  });
}

export default function PermissionNavigationDomFilter() {
  const pathname = usePathname();

  useEffect(() => {
    let disposed = false;
    let observer: MutationObserver | null = null;

    async function loadPermissions() {
      try {
        const response = await fetch(
          "/api/security/navigation",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        if (!response.ok || disposed) return;

        const payload =
          (await response.json()) as NavigationPayload;

        const allowedHrefs = (
          payload.data?.items || []
        )
          .map((item) => normalizePath(item.href))
          .filter(Boolean);

        filterNavigation(allowedHrefs);

        observer = new MutationObserver(() => {
          filterNavigation(allowedHrefs);
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true,
        });
      } catch {
        // Les routes restent sécurisées côté serveur même si
        // le filtrage visuel ne peut pas être chargé.
      }
    }

    loadPermissions();

    return () => {
      disposed = true;
      observer?.disconnect();
    };
  }, [pathname]);

  return null;
}
