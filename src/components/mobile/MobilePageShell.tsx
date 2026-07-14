import type { ReactNode } from "react";

type MobilePageShellProps = {
  children: ReactNode;
  className?: string;
  withBottomSpacing?: boolean;
};

export default function MobilePageShell({
  children,
  className = "",
  withBottomSpacing = true,
}: MobilePageShellProps) {
  return (
    <main
      className={[
        "mobile-page-shell min-h-screen bg-[#F5F9FC]",
        withBottomSpacing ? "pb-24 lg:pb-8" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </main>
  );
}
