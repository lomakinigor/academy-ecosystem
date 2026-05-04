import Image from "next/image";

import logoSrc from "@/public/logo.png";

type BrandMarkProps = {
  size?: number;
  isPriority?: boolean;
  className?: string;
};

export function BrandMark({ size = 64, isPriority = false, className }: BrandMarkProps) {
  return (
    <Image
      src={logoSrc}
      alt="Академия Развития Человека им. В.Ю. Светлова"
      width={size}
      height={size}
      priority={isPriority}
      className={className}
    />
  );
}
