import Image from "next/image";
import { BRAND } from "@/lib/constants/theme";

type AppLogoProps = {
  compact?: boolean;
  light?: boolean;
  imageSize?: number;
};

export default function AppLogo({
  compact = false,
  light = false,
  imageSize = 56,
}: AppLogoProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative overflow-hidden rounded-2xl bg-white/10">
        <Image
          src="/images/mpangi-logo.png"
          alt="Logo Mpangi-church"
          width={imageSize}
          height={imageSize}
          className="h-auto w-auto object-contain"
          priority
        />
      </div>

      {!compact && (
        <div>
          <p
            className={`text-xl font-extrabold leading-none ${
              light ? "text-white" : "text-[#03357A]"
            }`}
          >
            {BRAND.name}
          </p>

          <p
            className={`mt-1 text-xs font-medium ${
              light ? "text-blue-100" : "text-[#8B5CF6]"
            }`}
          >
            {BRAND.tagline}
          </p>
        </div>
      )}
    </div>
  );
}