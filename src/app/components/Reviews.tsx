import Image from "next/image";
import { Quote, Star } from "lucide-react";
import { imageUrl, galleryAlt } from "@/lib/images";

const REVIEWS = [
  {
    text: "마트에서 사 먹던 감귤이랑 당도가 아예 달라요.",
    name: "김○○님",
    tag: "5kg 재주문",
    image: 9,
  },
  {
    text: "박스갈이 뉴스 보고 불안했는데, 여긴 농장 직송이라 안심하고 주문했습니다.",
    name: "이○○님",
    tag: "10kg 가족용",
    image: 11,
  },
  {
    text: "껍질만 까도 향이 진하고, 시원하지 않아서 아이들이 잘 먹어요.",
    name: "박○○님",
    tag: "선물용 세트",
    image: 12,
  },
];

export default function Reviews() {
  return (
    <section id="reviews" className="section bg-[var(--green)] text-white">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold tracking-wide text-[#9fd4c2]">REVIEWS</p>
          <h2 className="mt-2 text-2xl font-extrabold md:text-4xl">고객이 먼저 느낀 당도 차이</h2>
          <p className="mt-4 text-white/75">산지 직송을 선택한 분들이 남긴 실제 후기입니다.</p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {REVIEWS.map((review) => (
            <article
              key={review.name + review.tag}
              className="overflow-hidden rounded-2xl bg-white/10 backdrop-blur-sm"
            >
              <div className="relative aspect-[16/10]">
                <Image
                  src={imageUrl(review.image)}
                  alt={galleryAlt(review.image)}
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="(max-width:768px) 100vw, 33vw"
                />
              </div>
              <div className="p-5">
                <div className="mb-3 flex gap-0.5 text-[#ffb347]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                </div>
                <Quote size={18} className="mb-2 text-white/40" />
                <p className="text-base font-medium leading-relaxed">&ldquo;{review.text}&rdquo;</p>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="font-semibold">{review.name}</span>
                  <span className="text-white/60">{review.tag}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
