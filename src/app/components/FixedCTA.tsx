import { SITE, CTA_LABEL } from "@/lib/site";

export default function FixedCTA() {
  return (
    <div className="fixed-cta">
      <a href="#order" className="btn-primary">
        {CTA_LABEL}
      </a>
      <span className="sr-only">{SITE.phoneDisplay}</span>
    </div>
  );
}
