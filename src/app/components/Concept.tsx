import Image from "next/image";
import { SITE } from "@/lib/site";
import { imageUrl, galleryAlt } from "@/lib/images";

/** 사이트 컨셉 — 상세 문구는 추후 업데이트 예정 */
export default function Concept() {
  return (
    <section id="concept" className="section">
      <div className="container">
        <div className="overflow-hidden rounded-3xl border border-[var(--line)] bg-white md:grid md:grid-cols-2">
          <div className="relative min-h-[260px]">
            <Image
              src={imageUrl(13)}
              alt={galleryAlt(13)}
              fill
              unoptimized
              className="object-cover"
              sizes="(max-width:768px) 100vw, 50vw"
            />
          </div>
          <div className="flex flex-col justify-center p-6 md:p-10">
            <p className="text-sm font-bold tracking-wide text-[var(--orange)]">FARM CONCEPT</p>
            <h2 className="mt-2 text-2xl font-extrabold text-[var(--navy)] md:text-3xl">
              {SITE.name} 이야기
            </h2>
            <p className="mt-4 text-[var(--muted)] leading-relaxed">
              제주도 서귀포에 농장이 있는 감귤농장입니다. 수확한 감귤을 농장주가 직접 선별·포장해
              보내드리며, 박스갈이 없는 산지 직송을 원칙으로 합니다.
            </p>
            <p className="mt-4 rounded-xl bg-[var(--orange-soft)] px-4 py-3 text-sm text-[var(--navy)]">
              사이트 컨셉·농장 소개 상세 내용은 곧 업데이트됩니다.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
