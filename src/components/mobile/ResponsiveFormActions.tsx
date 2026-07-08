import type { ReactNode } from "react";

export default function ResponsiveFormActions({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="sticky bottom-0 z-30 -mx-4 mt-6 border-t border-[#DCEAF5] bg-white/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
        {children}
      </div>
    </div>
  );
}
