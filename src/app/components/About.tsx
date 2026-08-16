import Image from "next/image";
import { SITE } from "@/lib/site";
import { imageUrl } from "@/lib/images";

const PROMISES = [
  {
    n: "01",
    title: "안락사는 없습니다",
    desc: "아프거나 나이가 많아도, 저희가 먼저 생을 끝내지 않습니다. 자연의 시간까지 곁을 지킵니다.",
  },
  {
    n: "02",
    title: "끝까지 책임집니다",
    desc: "파양 후 재입양이 어려워도 구름이네가 보호를 이어갑니다. 버리거나 방치하지 않습니다.",
  },
  {
    n: "03",
    title: "투명하게 상담합니다",
    desc: "절차·비용·아이 상태를 숨기지 않습니다. 전화 한 통으로 솔직한 안내를 드립니다.",
  },
];

export default function About() {
  return (
    <section id="about" className="section">
      <div className="container grid items-center gap-10 md:grid-cols-2">
        <div className="rounded-media relative aspect-[4/5] overflow-hidden shadow-[0_20px_50px_rgba(28,36,52,0.12)] md:aspect-[5/6]">
          <Image
            src={imageUrl(8)}
            alt={`${SITE.name} 보호 공간`}
            fill
            unoptimized
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
        <div>
          <p className="text-sm font-bold tracking-wide text-[var(--sky)]">OUR PROMISE</p>
          <h2 className="mt-2 text-3xl font-extrabold text-[var(--navy)] md:text-4xl">
            판단하지 않고,
            <br />
            끝까지 함께 있겠습니다
          </h2>
          <p className="mt-4 text-[var(--muted)]">
            {SITE.brand}는 강아지 파양입소와 무료분양을 함께 안내합니다. 불가피한 이별도,
            새로운 만남도 — 양쪽 모두가 덜 아픈 길을 찾는 것이 저희의 일입니다.
          </p>
          <div className="mt-8 space-y-5">
            {PROMISES.map((p) => (
              <div key={p.n} className="soft-card p-5">
                <p className="text-xs font-bold text-[var(--coral)]">— 약속 {p.n}</p>
                <h3 className="mt-1 text-lg font-bold text-[var(--navy)]">{p.title}</h3>
                <p className="mt-1 text-sm text-[var(--muted)]">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
