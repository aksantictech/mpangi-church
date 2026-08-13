"use client";

import Link from "next/link";
import { Bell, CheckCircle2, ClipboardList } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Alert = { id: string; title: string; href: string; type: string };

export default function InternalNotificationBell({ mobile = false }: { mobile?: boolean }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [count, setCount] = useState(0);

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
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
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
      {open && (
        <div className="absolute right-0 top-14 z-[120] w-[min(88vw,360px)] overflow-hidden rounded-3xl border border-[#DCEAF5] bg-white shadow-2xl">
          <div className="border-b border-[#DCEAF5] p-4"><p className="font-black text-[#03357A]">Rappels et validations</p><p className="text-xs text-slate-500">{count} élément(s) nécessitent votre attention</p></div>
          <div className="p-2">
            {alerts.length === 0 ? <p className="p-5 text-center text-sm text-slate-500">Aucune action en attente.</p> : alerts.map((alert) => (
              <Link key={alert.id} href={alert.href} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-2xl p-3 hover:bg-[#F8FBFD]">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">{alert.type === "task" ? <ClipboardList className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}</span>
                <span className="text-sm font-bold text-slate-700">{alert.title}</span>
              </Link>
            ))}
          </div>
          <Link href="/notifications" onClick={() => setOpen(false)} className="block border-t border-[#DCEAF5] p-3 text-center text-sm font-black text-[#2563EB]">Centre de notifications</Link>
        </div>
      )}
    </div>
  );
}
