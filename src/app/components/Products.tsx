import Image from "next/image";
import { Gift, Truck } from "lucide-react";
import { PRODUCTS } from "@/lib/site";
import { imageUrl, galleryAlt } from "@/lib/images";

export default function Products() {
  return (
    <section id="products" className="section">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold tracking-wide text-[var(--orange)]">PRODUCTS</p>
          <h2 className="mt-2 text-2xl font-extrabold text-[var(--navy)] md:text-4xl">
            실속형 · 선물용 감귤 박스
          </h2>
          <p className="mt-4 text-[var(--muted)]">
            필요한 만큼만, 농장에서 선별해 바로 보내드립니다.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--green)] px-3 py-1.5 text-xs font-bold text-white">
            <Truck size={14} /> 무료 배송 · 산지 직송
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--orange)] px-3 py-1.5 text-xs font-bold text-white">
            <Gift size={14} /> 선물 포장 가능
          </span>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PRODUCTS.map((product) => (
            <a
              key={product.id}
              href={`#order`}
              className="group overflow-hidden rounded-2xl border border-[var(--line)] bg-white transition hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)]"
            >
              <div className="relative aspect-square">
                <Image
                  src={imageUrl(product.image)}
                  alt={`${product.name} — ${galleryAlt(product.image)}`}
                  fill
                  unoptimized
                  className="object-cover transition duration-500 group-hover:scale-105"
                  sizes="(max-width:640px) 100vw, 25vw"
                />
                <span className="absolute left-3 top-3 rounded-lg bg-[var(--navy)] px-2.5 py-1 text-xs font-bold text-white">
                  {product.badge}
                </span>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-extrabold text-[var(--navy)]">{product.name}</h3>
                <p className="mt-1 text-sm font-semibold text-[var(--orange)]">{product.weight}</p>
                <p className="mt-2 text-sm text-[var(--muted)]">{product.desc}</p>
                <span className="mt-4 inline-flex text-sm font-bold text-[var(--green)]">
                  이 옵션으로 주문 →
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
