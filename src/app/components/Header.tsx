"use client";

import { useState } from "react";
import { Menu, Phone, X } from "lucide-react";
import { SITE, CTA_LABEL } from "@/lib/site";

const NAV = [
  { href: "#problem", label: "박스갈이 주의" },
  { href: "#philosophy", label: "농장 철학" },
  { href: "#products", label: "상품" },
  { href: "/guide", label: "안내글" },
  { href: "#order", label: "주문" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[rgba(248,250,252,0.92)] backdrop-blur-md">
      <div className="trust-pulse flex items-center justify-center gap-2 bg-[var(--green)] px-3 py-2 text-center text-[0.78rem] font-semibold text-white md:text-sm">
        <span>100% 서귀포 산지직송 보증 · 문제 시 100% 환불</span>
      </div>

      <div className="container flex h-14 items-center justify-between md:h-16">
        <a href="#top" className="flex flex-col leading-tight">
          <span className="text-[0.7rem] font-semibold tracking-wide text-[var(--orange)]">
            {SITE.farm}
          </span>
          <span className="text-lg font-extrabold tracking-tight text-[var(--navy)] md:text-xl">
            {SITE.brand}
          </span>
        </a>

        <nav className="hidden items-center gap-6 text-sm font-medium text-[var(--muted)] lg:flex">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className="hover:text-[var(--orange)]">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={SITE.phoneTel}
            className="hidden items-center gap-1.5 rounded-xl bg-[var(--green)] px-3 py-2 text-sm font-semibold text-white sm:inline-flex"
          >
            <Phone size={16} />
            {SITE.phoneDisplay}
          </a>
          <a
            href="#order"
            className="hidden rounded-xl bg-[var(--orange)] px-3.5 py-2 text-sm font-bold text-white md:inline-flex"
          >
            {CTA_LABEL}
          </a>
          <button
            type="button"
            className="inline-flex rounded-lg p-2 text-[var(--navy)] lg:hidden"
            aria-label="메뉴"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-[var(--line)] bg-white px-4 py-3 lg:hidden">
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--navy)] hover:bg-[var(--orange-soft)]"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <a
              href={SITE.phoneTel}
              className="mt-1 inline-flex items-center gap-2 rounded-lg bg-[var(--green)] px-3 py-2.5 text-sm font-semibold text-white"
              onClick={() => setOpen(false)}
            >
              <Phone size={16} />
              {SITE.phoneDisplay}
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
