import Image from "next/image";
import { ArrowDown } from "lucide-react";
import { SITE, CTA_LABEL } from "@/lib/site";
import { imageUrl, galleryAlt } from "@/lib/images";

export default function Hero() {
  return (
    <section id="top" className="relative min-h-[100svh] overflow-hidden text-white">
      <div className="absolute inset-0 hero-media">
        <Image
          src={imageUrl(1)}
          alt={galleryAlt(1)}
          fill
          priority
          unoptimized
          className="object-cover"
          sizes="100vw"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg, rgba(15,23,42,0.78) 0%, rgba(27,77,62,0.55) 42%, rgba(15,23,42,0.25) 68%, rgba(15,23,42,0.15) 100%)",
          }}
        />
      </div>

      <div className="container relative flex min-h-[100svh] flex-col justify-end pb-28 pt-32 md:justify-center md:pb-24 md:pt-28">
        <p className="animate-rise text-sm font-semibold tracking-[0.08em] text-[#ffd4b0]">
          {SITE.farm} · {SITE.location}
        </p>
        <h1 className="animate-rise-delay mt-3 max-w-3xl text-4xl font-extrabold drop-shadow-[0_2px_18px_rgba(0,0,0,0.35)] sm:text-5xl md:text-6xl">
          {SITE.brand}
          <span className="mt-3 block text-[0.55em] font-bold leading-snug text-white/95">
            진짜 서귀포 감귤, 농장에서 집 앞까지 직배송
          </span>
        </h1>
        <p className="animate-rise-delay-2 mt-5 max-w-xl text-base text-white/88 md:text-lg">
          시중의 저가 박스갈이 감귤에 속지 마세요.
          <br className="hidden sm:block" />
          뽕순이네 농장이 100% 서귀포 산지 직송을 보장합니다.
        </p>
        <div className="animate-rise-delay-2 mt-8 flex flex-wrap gap-3">
          <a href="#order" className="btn-primary">
            {CTA_LABEL}
            <ArrowDown size={18} />
          </a>
          <a href={SITE.phoneTel} className="btn-secondary">
            전화 상담 {SITE.phoneDisplay}
          </a>
        </div>
      </div>
    </section>
  );
}
