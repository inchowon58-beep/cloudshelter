import Link from "next/link";
import type { NearbyLink } from "@/lib/nearby-regions";

interface Props {
  cityLabel: string | null;
  stations: NearbyLink[];
}

export default function NearbyStationsSection({ cityLabel, stations }: Props) {
  if (stations.length === 0) return null;

  const title = cityLabel ? `${cityLabel} 인근 지하철역` : "인근 지하철역";

  return (
    <section className="soft-card mt-6 p-6 lg:p-8">
      <h2 className="text-xl font-bold text-[var(--navy)]">{title}</h2>
      <p className="mt-1 text-xs text-[var(--muted)]">
        {cityLabel || "해당"} 지역에서 보호소를 찾을 때 통학·상담 거리를 고려해 함께 검색하는 인근 지하철역입니다.
      </p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {stations.map((item) => (
          <li key={item.label}>
            {item.href ? (
              <Link
                href={item.href}
                className="inline-block rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-medium text-[var(--navy)] transition hover:border-[var(--coral)] hover:text-[var(--coral)]"
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
