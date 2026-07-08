import type { ReactNode } from "react";

export function DesktopTableShell({
  children,
  minWidth = "900px",
}: {
  children: ReactNode;
  minWidth?: string;
}) {
  return (
    <div className="hidden overflow-x-auto rounded-2xl border border-[#DCEAF5] md:block">
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export function MobileListShell({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="grid gap-3 md:hidden">{children}</div>;
}
