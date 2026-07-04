import type { ReactNode } from "react";
import AdminChurchHomeLink from "./AdminChurchHomeLink";
import MobileBottomNav from "./MobileBottomNav";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

type AppShellProps = {
  children: ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#F5F9FC] text-[#0F172A]">
      <Sidebar />

      <div className="min-h-screen lg:pl-72">
        <Topbar />

        <AdminChurchHomeLink />

        <main className="px-4 py-5 pb-28 md:px-6 md:pb-8 lg:px-8">
          {children}
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
}