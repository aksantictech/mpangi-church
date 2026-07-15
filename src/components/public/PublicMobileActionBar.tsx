import Link from "next/link";
import {
  Gift,
  HeartHandshake,
  Home,
  UserPlus,
} from "lucide-react";
import NotificationSubscribeButton from "@/components/public/NotificationSubscribeButton";
import { buildChurchPublicUrl } from "@/lib/tenant/domain";

type PublicMobileActionBarProps = {
  churchId: string;
  slug: string;
};

export default function PublicMobileActionBar({
  churchId,
  slug,
}: PublicMobileActionBarProps) {
  return (
    <nav
      data-mpangi-public-bottom-nav
      className="fixed inset-x-0 bottom-0 z-[80] border-t border-white/20 bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.12)] backdrop-blur lg:hidden"
    >
      <div className="mx-auto grid max-w-xl grid-cols-5 gap-1">
        <Link
          href={buildChurchPublicUrl({ slug })}
          className="flex min-h-14 min-w-0 flex-col items-center justify-center rounded-2xl px-1 py-2 text-[10px] font-extrabold text-[#03357A]"
        >
          <Home className="mb-1 h-5 w-5" />
          Accueil
        </Link>

        <Link
          href={buildChurchPublicUrl({ slug }, "/prayer")}
          className="flex min-h-14 min-w-0 flex-col items-center justify-center rounded-2xl px-1 py-2 text-[10px] font-extrabold text-slate-500"
        >
          <HeartHandshake className="mb-1 h-5 w-5" />
          Prière
        </Link>

        <Link
          href={buildChurchPublicUrl({ slug }, "/join")}
          className="flex min-h-14 min-w-0 flex-col items-center justify-center rounded-2xl px-1 py-2 text-[10px] font-extrabold text-slate-500"
        >
          <UserPlus className="mb-1 h-5 w-5" />
          Rejoindre
        </Link>

        <a
          href="#don"
          className="flex min-h-14 min-w-0 flex-col items-center justify-center rounded-2xl px-1 py-2 text-[10px] font-extrabold text-slate-500"
        >
          <Gift className="mb-1 h-5 w-5" />
          Don
        </a>

        <NotificationSubscribeButton
          churchId={churchId}
          label="Notif"
          className="flex min-h-14 min-w-0 flex-col items-center justify-center rounded-2xl px-1 py-2 text-[10px] font-extrabold text-slate-500"
        />
      </div>
    </nav>
  );
}
