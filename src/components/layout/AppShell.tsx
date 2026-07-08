import type { ReactNode } from "react";
import Sidebar from "@/components/layout/Sidebar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import MobileTopBar from "@/components/layout/MobileTopBar";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#F5F9FC] text-[#0F172A] lg:flex lg:items-start">
      <Sidebar />

      <section className="flex min-h-dvh min-w-0 flex-1 flex-col">
        <MobileTopBar />

        <main className="min-h-0 flex-1 px-3 pb-28 pt-4 sm:px-5 lg:px-6 lg:pb-8 lg:pt-5 xl:px-8">
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </main>

        <MobileBottomNav />
      </section>
    </div>
  );
}
