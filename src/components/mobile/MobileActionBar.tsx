import type { ReactNode } from "react";

export default function MobileActionBar({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-x-0 bottom-16 z-40 border-t border-[#DCEAF5] bg-white/95 px-3 py-3 shadow-2xl shadow-slate-900/15 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-md gap-2">
        {children}
      </div>
    </div>
  );
}
