"use client";

import type {
  CSSProperties,
  ReactNode,
} from "react";
import {
  useEffect,
  useState,
} from "react";

import ChurchDesktopTopBar from "@/components/layout/ChurchDesktopTopBar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import MobileTopBar from "@/components/layout/MobileTopBar";
import ModuleContextTabs from "@/components/layout/ModuleContextTabs";
import Sidebar from "@/components/layout/Sidebar";
import type { ChurchBranding } from "@/lib/tenant/churchBranding";

type BrandingStyles = CSSProperties & {
  "--church-primary": string;
  "--church-secondary": string;
  "--church-accent": string;
  "--church-background": string;
  "--church-surface": string;
  "--church-text": string;
};

type BrandingApiResponse = {
  branding?: ChurchBranding;
};

const FALLBACK_BRANDING: ChurchBranding = {
  churchId: null,
  name: "Mpangi-church",
  shortName: "MC",
  logoUrl: null,
  primaryColor: "#03357A",
  secondaryColor: "#2563EB",
  accentColor: "#8B5CF6",
  backgroundColor: "#F5F9FC",
  surfaceColor: "#FFFFFF",
  textColor: "#0F172A",
  welcomeMessage: null,
};

export default function ChurchBrandingShell({
  children,
}: {
  children: ReactNode;
}) {
  const [
    branding,
    setBranding,
  ] = useState<ChurchBranding>(
    FALLBACK_BRANDING
  );

  useEffect(() => {
    let mounted = true;

    fetch("/api/account/branding", {
      cache: "no-store",
      credentials: "include",
    })
      .then(async (response) => {
        const payload =
          (await response.json()) as
            BrandingApiResponse;

        if (!response.ok) {
          throw new Error(
            "Branding indisponible."
          );
        }

        if (
          mounted &&
          payload.branding
        ) {
          setBranding(
            payload.branding
          );
        }
      })
      .catch(() => {
        // Le branding par défaut
        // garde l’interface utilisable.
      });

    return () => {
      mounted = false;
    };
  }, []);

  const brandingStyles: BrandingStyles = {
    "--church-primary":
      branding.primaryColor,
    "--church-secondary":
      branding.secondaryColor,
    "--church-accent":
      branding.accentColor,
    "--church-background":
      branding.backgroundColor,
    "--church-surface":
      branding.surfaceColor,
    "--church-text":
      branding.textColor,
  };

  return (
    <div
      style={brandingStyles}
      className="min-h-dvh text-[var(--church-text)] lg:flex lg:items-start"
    >
      <Sidebar
        branding={branding}
      />

      <section
        className="flex min-h-dvh min-w-0 flex-1 flex-col"
        style={{
          backgroundColor:
            "var(--church-background)",
        }}
      >
        <MobileTopBar
          branding={branding}
        />

        <ChurchDesktopTopBar
          branding={branding}
        />

        <main className="min-h-0 flex-1 px-3 pb-28 pt-4 sm:px-5 lg:px-6 lg:pb-8 lg:pt-5 xl:px-8">
          <ModuleContextTabs />

          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </main>

        <MobileBottomNav />
      </section>
    </div>
  );
}