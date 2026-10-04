"use client";

import { useState } from "react";
import Image from "next/image";

import { LOGO_IMAGE } from "@/lib/constants";

/**
 * The trust emblem. Falls back to the generated placeholder if the real
 * `public/brand/tsss-emblem-original.jpg` has not been added yet.
 */
export function BrandEmblem({
  alt,
  size,
  priority,
  className = "size-full object-contain",
}: {
  alt: string;
  /** Rendered pixel size (the image is square). */
  size: number;
  priority?: boolean;
  className?: string;
}) {
  const [src, setSrc] = useState(LOGO_IMAGE);

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      {...(priority ? { preload: true } : {})}
      onError={() => setSrc("/brand/tsss-emblem-placeholder.jpg")}
      className={className}
    />
  );
}