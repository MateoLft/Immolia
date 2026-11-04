import Link from "next/link";

export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden>
      <rect width="36" height="36" rx="8" fill="#4654F0" />
      <path d="M10 18.5L18 11l8 7.5V26a1 1 0 0 1-1 1h-4.5v-5h-5v5H11a1 1 0 0 1-1-1z" fill="#FFFFFF" />
    </svg>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 text-ink">
      <LogoMark />
      <span className="text-[19px] font-bold tracking-tight">Immolia</span>
    </Link>
  );
}
