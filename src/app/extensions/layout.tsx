import type { ReactNode } from "react";
import AppShell from "@/components/layout/AppShell";
import ExtensionsModuleNav from "@/components/extensions/ExtensionsModuleNav";

export default function ExtensionsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AppShell>
      <div className="space-y-5 pb-24 md:pb-0">
        <ExtensionsModuleNav />
        {children}
      </div>
    </AppShell>
  );
}
