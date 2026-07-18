import type { ReactNode } from "react";

import ChurchBrandingShell from "@/components/layout/ChurchBrandingShell";

export default function AppShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ChurchBrandingShell>
      {children}
    </ChurchBrandingShell>
  );
}