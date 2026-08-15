import Image from "next/image";
import { Leaf, PackageCheck, Sparkles } from "lucide-react";
import { imageUrl, galleryAlt } from "@/lib/images";

const ITEMS = [
  {
    icon: Leaf,
    title: "100% 서귀포 자체 농장 직영",
    desc: "중간 유통 업자를 거치지 않고 서귀포 농장에서 바로 수확합니다.",
    image: 4,
  },
  {
    icon: PackageCheck,
    title: "박스갈이 절대 불가 · 농가 직배송",
    desc: "당일 수확한 감귤을 농가에서 직접 포장하여 보냅니다.",
    image: 6,
  },
  {
    icon: Sparkles,
    title: "맛과 당도 보장",
    desc: "서귀포의 일조량과 풍토에서 자란 진짜 고당도 감귤만 선별합니다.",
    image: 7,
  },
];

export default function Philosophy() {
  return (
    <section id="philosophy" className="section bg-white/60">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold tracking-wide text-[var(--green)]">SOLUTION</p>
          <h2 className="mt-2 text-2xl font-extrabold text-[var(--navy)] md:text-4xl">
            뽕순이네의 3가지 철학
          </h2>
          <p className="mt-4 text-[var(--muted)]">
            유통 마진이 아니라, 수확한 그날의 맛으로 승부합니다.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {ITEMS.map((item, i) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
                <div className="relative aspect-[4/3]">
                  <Image
                    src={imageUrl(item.image)}
                    alt={galleryAlt(item.image)}
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="(max-width:768px) 100vw, 33vw"
                  />
                </div>
                <div className="p-5">
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--green-soft)] text-[var(--green)]">
                    <Icon size={20} />
                  </div>
                  <p className="text-xs font-bold text-[var(--orange)]">0{i + 1}</p>
                  <h3 className="mt-1 text-lg font-extrabold text-[var(--navy)]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{item.desc}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
