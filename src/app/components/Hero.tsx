import { ArrowDown } from "lucide-react";
import { SITE, CTA_LABEL } from "@/lib/site";
import { imageUrl } from "@/lib/images";

const HERO_VIDEO_SRC = "/videos/hero.mp4";

export default function Hero() {
  const poster = imageUrl(5);

  return (
    <section id="top" className="relative min-h-[100svh] overflow-hidden text-white">
      <div className="absolute inset-0 hero-media">
        <video
          className="h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={poster}
          aria-hidden
        >
          <source src={HERO_VIDEO_SRC} type="video/mp4" />
        </video>
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg, rgba(28,36,52,0.82) 0%, rgba(61,111,212,0.45) 48%, rgba(28,36,52,0.28) 100%)",
          }}
        />
      </div>

      <div className="container relative flex min-h-[100svh] flex-col justify-end pb-32 pt-32 md:justify-center md:pb-24 md:pt-28">
        <p className="animate-rise text-sm font-semibold tracking-[0.08em] text-[#c9dbff]">
          {SITE.farm} · {SITE.taglineEn}
        </p>
        <h1 className="animate-rise-delay mt-3 max-w-3xl text-4xl font-extrabold drop-shadow-[0_2px_18px_rgba(0,0,0,0.35)] sm:text-5xl md:text-6xl">
          {SITE.name}
          <span className="mt-3 block text-[0.55em] font-bold leading-snug text-white/95">
            사랑은 두 번째로 시작되기도 합니다
          </span>
        </h1>
        <p className="animate-rise-delay-2 mt-5 max-w-xl text-base text-white/88 md:text-lg">
          파양입소부터 무료분양까지, 아이와 보호자 모두가 덜 아픈 길을 함께 찾습니다.
        </p>
        <div className="animate-rise-delay-2 mt-8 flex flex-wrap gap-3">
          <a href="#pets" className="btn-primary">
            가족을 기다리는 아이들
            <ArrowDown size={18} />
          </a>
          <a href={SITE.phoneTel} className="btn-secondary">
            {CTA_LABEL} {SITE.phoneDisplay}
          </a>
        </div>
      </div>
    </section>
  );
}
