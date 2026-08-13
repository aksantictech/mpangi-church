"use client";

import Link from "next/link";
import { Bell, CheckCircle2, ClipboardList } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Alert = { id: string; title: string; href: string; type: string };

export default function InternalNotificationBell({ mobile = false }: { mobile?: boolean }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [count, setCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    let active = true;
    const load = () => fetch("/api/account/alerts", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => { if (active) { setAlerts(payload.alerts || []); setCount(payload.count || 0); } })
      .catch(() => undefined);
    void load();
    const timer = window.setInterval(load, 60_000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !panelRef.current?.contains(target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button type="button" onClick={() => setOpen((value) => !value)} className={`relative flex items-center justify-center rounded-2xl border border-[#DCEAF5] bg-white text-[var(--church-primary,#03357A)] shadow-sm ${mobile ? "h-11 w-11" : "h-12 w-12"}`} aria-label={`${count} notification(s)`}>
        <Bell className="h-5 w-5" />
        {count > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-black text-white ring-2 ring-white">{count > 99 ? "99+" : count}</span>}
      </button>
      {open && mounted && createPortal(
        <div
          ref={panelRef}
          className={mobile
            ? "fixed left-3 right-3 top-[76px] z-[140] max-h-[calc(100dvh-160px)] overflow-hidden rounded-3xl border border-[#DCEAF5] bg-white shadow-2xl"
            : "fixed right-5 top-[76px] z-[140] w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-3xl border border-[#DCEAF5] bg-white shadow-2xl"
          }
          role="dialog"
          aria-label="Rappels et validations"
        >
          <div className="border-b border-[#DCEAF5] p-4"><p className="whitespace-normal font-black text-[#03357A]">Rappels et validations</p><p className="mt-1 whitespace-normal text-xs leading-5 text-slate-500">{count} élément(s) nécessitent votre attention</p></div>
          <div className="max-h-[calc(100dvh-280px)] overflow-y-auto p-2">
            {alerts.length === 0 ? <p className="p-5 text-center text-sm text-slate-500">Aucune action en attente.</p> : alerts.map((alert) => (
              <Link key={alert.id} href={alert.href} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-2xl p-3 hover:bg-[#F8FBFD]">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">{alert.type === "task" ? <ClipboardList className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}</span>
                <span className="min-w-0 whitespace-normal break-words text-sm font-bold leading-5 text-slate-700">{alert.title}</span>
              </Link>
            ))}
          </div>
          <Link href="/notifications" onClick={() => setOpen(false)} className="block border-t border-[#DCEAF5] p-3 text-center text-sm font-black text-[#2563EB]">Centre de notifications</Link>
        </div>,
        document.body
      )}
    </div>
  );
}
