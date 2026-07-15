import Link from "next/link";
import { BellRing, Gift, HeartHandshake, Home, UserPlus } from "lucide-react";
import NotificationSubscribeButton from "@/components/public/NotificationSubscribeButton";

type PublicMobileActionBarProps = {
  churchId: string;
  slug: string;
};

export default function PublicMobileActionBar({
  churchId,
  slug,
}: PublicMobileActionBarProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/20 bg-white/95 px-2 pb-3 pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.12)] backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        <Link
          href={`/church/${slug}`}
          className="flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[11px] font-extrabold text-[#03357A]"
        >
          <Home className="mb-1 h-5 w-5" />
          Accueil
        </Link>

        <Link
          href={`/church/${slug}/prayer`}
          className="flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[11px] font-extrabold text-slate-500"
        >
          <HeartHandshake className="mb-1 h-5 w-5" />
          Prière
        </Link>

        <Link
          href={`/church/${slug}/join`}
          className="flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[11px] font-extrabold text-slate-500"
        >
          <UserPlus className="mb-1 h-5 w-5" />
          Rejoindre
        </Link>

        <a
          href="#don"
          className="flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[11px] font-extrabold text-slate-500"
        >
          <Gift className="mb-1 h-5 w-5" />
          Don
        </a>

        <NotificationSubscribeButton
          churchId={churchId}
          label="Notif"
          className="flex h-full flex-col items-center justify-center rounded-2xl px-2 py-2 text-[11px] font-extrabold text-slate-500"
        />
      </div>
    </nav>
  );
}