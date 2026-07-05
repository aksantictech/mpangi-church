import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

type AppShellProps = {
  children: ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#F5F9FC] text-[#0F172A]">
      <Sidebar />

      <div className="min-h-screen lg:pl-72">
        <Topbar />

        <main className="px-4 pb-28 pt-5 md:px-6 lg:px-8 lg:pb-8">
          {children}
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
}