import "@/styles/mobile-performance-35d5.css";
import "@/styles/mobile-experience-35d4.css";
import "@/styles/mobile-tables-lists.css";
import "@/styles/mobile-forms-hardening.css";
import "@/styles/mobile-hardening.css";
import "@/styles/bible-reader.css";
import "@/styles/mobile-production-hardening.css";
import TenantPwaBootstrap from "@/components/pwa/TenantPwaBootstrap";
import DevServiceWorkerCleanup from "@/components/pwa/DevServiceWorkerCleanup";
import EmptyTablesEnhancer from "@/components/common/EmptyTablesEnhancer";
import "@/styles/empty-tables.css";
import ResponsiveTablesEnhancer from "@/components/mobile/ResponsiveTablesEnhancer";
import "@/styles/responsive-tables.css";
import { PwaInstallProvider } from "@/components/pwa/PwaInstallProvider";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import PwaRegister from "@/components/pwa/PwaRegister";
import "./globals.css";
import "@/styles/production-stabilization.css";

import MobileFormsEnhancer from "@/components/mobile/MobileFormsEnhancer";
import MobileListsTablesEnhancer from "@/components/mobile/MobileListsTablesEnhancer";
import MobileRouteExperienceEnhancer from "@/components/mobile/MobileRouteExperienceEnhancer";
import PwaInstallCoordinator from "@/components/pwa/PwaInstallCoordinator";
import MobilePerformanceCoordinator from "@/components/mobile/MobilePerformanceCoordinator";
import SiteAnalyticsTracker from "@/components/analytics/SiteAnalyticsTracker";
import { SITE_URL } from "@/lib/seo";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Mpangi-Church — logiciel de gestion d’église",
    template: "%s | Mpangi-church",
  },
  description:
    "Logiciel web et mobile de gestion d’église en français : membres, présences QR, dons, finances, départements, suivi pastoral et communication.",
  keywords: [
    "logiciel gestion église",
    "application gestion église",
    "gestion membres église",
    "présence QR église",
    "suivi pastoral",
    "église RDC",
    "PWA église",
  ],
  openGraph: {
    type: "website",
    locale: "fr_CD",
    url: "/",
    siteName: "Mpangi-Church",
    title: "Mpangi-Church — logiciel de gestion d’église",
    description:
      "Centralisez membres, présences, dons, finances, suivi pastoral et communication dans une application web et mobile.",
    images: [
      {
        url: "/images/mpangi-logo.png",
        width: 512,
        height: 512,
        alt: "Logo Mpangi-Church",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mpangi-Church — logiciel de gestion d’église",
    description:
      "Une plateforme web et mobile pour gérer votre église avec ordre, vision et excellence.",
    images: ["/images/mpangi-logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/images/mpangi-logo.png",
    apple: "/images/mpangi-logo.png",
  },
  appleWebApp: {
    capable: true,
    title: "Mpangi-church",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#03357A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <SiteAnalyticsTracker />
        <MobilePerformanceCoordinator />
        <MobileRouteExperienceEnhancer />
        <PwaInstallCoordinator />
        <MobileListsTablesEnhancer />
        <MobileFormsEnhancer />
        <TenantPwaBootstrap />
        <DevServiceWorkerCleanup />
        <EmptyTablesEnhancer />
        <ResponsiveTablesEnhancer />
        <PwaInstallProvider>{children}</PwaInstallProvider>
      </body>
    </html>
  );
}
