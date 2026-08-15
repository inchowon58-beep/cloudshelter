import Image from "next/image";
import { AlertTriangle, Newspaper } from "lucide-react";
import { imageUrl, galleryAlt } from "@/lib/images";

const NEWS = [
  {
    title: "타 지역 감귤을 서귀포 산으로 포장재만 바꿔 치기하는 '박스갈이' 기승",
    source: "산지·유통 관련 보도",
  },
  {
    title: "서귀포 산지 표기 위반 단속 적발 사례 급증",
    source: "원산지 표시 단속 동향",
  },
];

export default function Problem() {
  return (
    <section id="problem" className="section">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold tracking-wide text-[var(--orange)]">TRUST WARNING</p>
          <h2 className="mt-2 text-2xl font-extrabold text-[var(--navy)] md:text-4xl">
            혹시 내가 먹은 감귤도
            <br />
            &apos;박스갈이&apos; 가짜 서귀포 감귤?
          </h2>
          <p className="mt-4 text-[var(--muted)]">
            맛없는 저품질 감귤을 서귀포산으로 속여 파는 유통 구조, 소비자가 피해를 보고
            있습니다.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {NEWS.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] md:p-6"
            >
              <div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-[#fff1f0] px-2.5 py-1 text-xs font-bold text-[#c0392b]">
                <Newspaper size={14} />
                뉴스 기반 이슈
              </div>
              <h3 className="text-lg font-bold leading-snug text-[var(--navy)]">{item.title}</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">{item.source}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl bg-[var(--navy)] text-white md:grid md:grid-cols-2">
          <div className="relative min-h-[220px] md:min-h-full">
            <Image
              src={imageUrl(2)}
              alt={galleryAlt(2)}
              fill
              unoptimized
              className="object-cover opacity-90"
              sizes="(max-width:768px) 100vw, 50vw"
            />
          </div>
          <div className="flex flex-col justify-center p-6 md:p-10">
            <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-lg bg-[var(--orange)] px-3 py-1.5 text-sm font-bold">
              <AlertTriangle size={16} />
              소비자 주의
            </div>
            <p className="text-lg font-semibold leading-relaxed md:text-xl">
              &quot;가짜 서귀포 감귤(박스갈이)에 속지 마세요. 진짜 서귀포 농장에서 농장주가
              직배송합니다.&quot;
            </p>
            <p className="mt-4 text-sm text-white/70">
              저가 감귤을 서귀포 박스로만 바꿔 파는 유통은 당도·신선도에서 큰 차이를 만듭니다.
              산지와 농장을 확인할 수 있는 직송이 가장 확실한 대안입니다.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
