import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import MobileBottomNav from "./MobileBottomNav";

type AppShellProps = {
  children: ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#F5F9FC] text-[#0F172A]">
      <Sidebar />

      <div className="min-h-screen lg:pl-72">
        <Topbar />

        <main className="px-4 py-5 pb-28 md:px-6 md:pb-8 lg:px-8">
          {children}
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
}