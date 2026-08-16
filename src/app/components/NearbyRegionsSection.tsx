import Link from "next/link";
import type { NearbyLink } from "@/lib/nearby-regions";

interface Props {
  cityLabel: string | null;
  regions: NearbyLink[];
}

export default function NearbyRegionsSection({ cityLabel, regions }: Props) {
  if (regions.length === 0) return null;

  const title = cityLabel ? `${cityLabel} 인근에서 함께 찾는 지역` : "근방 지역";

  return (
    <section className="soft-card mt-10 p-6 lg:p-8">
      <h2 className="text-xl font-bold text-[var(--navy)]">{title}</h2>
      <p className="mt-1 text-xs text-[var(--muted)]">
        {cityLabel || "해당"} 지역에서 보호소·파양·무료분양을 알아볼 때 함께 검색하는 근방 구·동입니다.
      </p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {regions.map((item) => (
          <li key={item.label}>
            {item.href ? (
              <Link
                href={item.href}
                className="inline-block rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-medium text-[var(--navy)] transition hover:border-[var(--sky)] hover:text-[var(--sky)]"
              >
                {item.label} 유기견보호센터
              </Link>
            ) : (
              <span className="inline-block rounded-full border border-[var(--line)] bg-[var(--bg)] px-4 py-2 text-sm font-medium text-[var(--muted)]">
                {item.label} 유기견보호센터
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
