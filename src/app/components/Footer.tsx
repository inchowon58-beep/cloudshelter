import { Phone, MapPin } from "lucide-react";
import { SITE } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--navy)] py-12 text-white">
      <div className="container grid gap-8 md:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="text-sm font-semibold text-[#ffb347]">{SITE.farm}</p>
          <h2 className="mt-1 text-2xl font-extrabold">{SITE.brand}</h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/70">{SITE.tagline}</p>
        </div>

        <div className="space-y-3 text-sm text-white/80">
          <a href={SITE.phoneTel} className="flex items-center gap-2 hover:text-white">
            <Phone size={16} className="text-[var(--orange)]" />
            {SITE.phoneDisplay}
          </a>
          <p className="flex items-start gap-2">
            <MapPin size={16} className="mt-0.5 shrink-0 text-[var(--orange)]" />
            {SITE.location} (농장 직송)
          </p>
          <p className="pt-2 text-xs text-white/45">
            Domain: {SITE.domain} · © {new Date().getFullYear()} {SITE.name}
          </p>
        </div>
      </div>
    </footer>
  );
}
