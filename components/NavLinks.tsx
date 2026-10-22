"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks({
  links,
  variant,
}: {
  links: { href: string; label: string }[];
  variant: "bar" | "menu";
}) {
  const path = usePathname();
  return links.map((l) => {
    const active = path === l.href || path.startsWith(`${l.href}/`);
    const cls =
      variant === "bar"
        ? `font-display text-lg uppercase hover:text-chog-pink ${active ? "text-chog-pink underline decoration-[3px] underline-offset-[6px]" : ""}`
        : `block rounded-xl px-3 py-2 font-display text-lg uppercase hover:bg-paper ${active ? "bg-paper text-chog-pink" : ""}`;
    return (
      <li key={l.href}>
        <Link
          href={l.href}
          className={cls}
          aria-current={active ? "page" : undefined}
        >
          {l.label}
        </Link>
      </li>
    );
  });
}
