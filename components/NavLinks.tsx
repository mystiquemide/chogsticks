"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function NavLinks({
  links,
  variant,
}: {
  links: { href: string; label: string }[];
  variant: "bar" | "menu";
}) {
  const path = usePathname();

  // The mobile menu is a <details>: close it on outside taps and Escape.
  useEffect(() => {
    if (variant !== "menu") return;
    const close = (e: Event) => {
      document.querySelectorAll("details[data-menu][open]").forEach((d) => {
        if (
          e.type === "keydown"
            ? (e as KeyboardEvent).key === "Escape"
            : !d.contains(e.target as Node)
        )
          d.removeAttribute("open");
      });
    };
    document.addEventListener("click", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", close);
    };
  }, [variant]);

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
          onClick={(e) =>
            e.currentTarget.closest("details")?.removeAttribute("open")
          }
        >
          {l.label}
        </Link>
      </li>
    );
  });
}
