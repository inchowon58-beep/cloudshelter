import Image from "next/image";
import { ShieldCheck, Truck, Sun } from "lucide-react";
import { SITE } from "@/lib/site";
import { imageUrl, galleryAlt } from "@/lib/images";

export default function Concept() {
  return (
    <section id="concept" className="section">
      <div className="container">
        <div className="overflow-hidden rounded-3xl border border-[var(--line)] bg-white md:grid md:grid-cols-2">
          <div className="relative min-h-[280px]">
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
              {SITE.name}이 지키는 약속
            </h2>
            <p className="mt-4 text-[var(--muted)] leading-relaxed">
              제주도 서귀포에 뿌리를 둔 {SITE.farm}입니다. 수확한 감귤을 농장주가 직접 선별·포장해
              보내드리며, 박스갈이 없는 산지 직송만을 원칙으로 합니다. 유통 마진이 아니라 수확
              당일의 맛으로 신뢰를 쌓습니다.
            </p>

            <ul className="mt-6 space-y-3">
              <li className="flex gap-3 text-sm text-[var(--navy)]">
                <ShieldCheck className="mt-0.5 shrink-0 text-[var(--green)]" size={18} />
                <span>
                  <strong>원산지 정직 표기</strong> — 서귀포 자체 농장 감귤만 출하, 타 지역 감귤
                  혼입·박스갈이 금지
                </span>
              </li>
              <li className="flex gap-3 text-sm text-[var(--navy)]">
                <Truck className="mt-0.5 shrink-0 text-[var(--green)]" size={18} />
                <span>
                  <strong>농장주 직배송</strong> — 중간 유통 없이 포장 후 곧바로 집 앞까지 발송
                </span>
              </li>
              <li className="flex gap-3 text-sm text-[var(--navy)]">
                <Sun className="mt-0.5 shrink-0 text-[var(--green)]" size={18} />
                <span>
                  <strong>당일 선별</strong> — 서귀포 일조량에서 자란 고당도 감귤만 골라 담습니다
                </span>
              </li>
            </ul>

            <p className="mt-6 rounded-xl bg-[var(--green-soft)] px-4 py-3 text-sm font-medium text-[var(--green)]">
              문제 발생 시 100% 환불 · 산지직송 보증제로 안심하고 주문하세요.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
