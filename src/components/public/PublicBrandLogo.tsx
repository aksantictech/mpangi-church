"use client";

import { useState } from "react";

const PRIMARY_LOGO = "/images/mpangi-logo.png?v=20260713";
const FALLBACK_LOGO = "/icons/icon-192.png?v=20260713";

export default function PublicBrandLogo({
  className = "h-12 w-12 rounded-2xl object-contain",
}: {
  className?: string;
}) {
  const [src, setSrc] = useState(PRIMARY_LOGO);

  return (
    <img
      src={src}
      alt="Logo Mpangi-church"
      className={className}
      loading="eager"
      decoding="async"
      onError={() => {
        if (src !== FALLBACK_LOGO) {
          setSrc(FALLBACK_LOGO);
        }
      }}
    />
  );
}
