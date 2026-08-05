import Image from "next/image";

const LOGO_SRC = "/brand/united-distribution-logo.svg";

export function BrandLogo({
  className = "",
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={LOGO_SRC}
      alt="United Distribution STL"
      width={178}
      height={101}
      priority={priority}
      className={`h-auto w-auto object-contain ${className}`}
    />
  );
}