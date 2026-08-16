import Image from "next/image";
import { SITE } from "@/lib/site";
import { imageUrl, galleryAlt } from "@/lib/images";

const INDICES = [2, 4, 6, 9, 11, 14, 18, 22];

export default function Gallery() {
  return (
    <section id="gallery" className="section">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold tracking-wide text-[var(--sky)]">SHELTER LIFE</p>
          <h2 className="mt-2 text-3xl font-extrabold text-[var(--navy)] md:text-4xl">
            보호소의 하루
          </h2>
          <p className="mt-3 text-[var(--muted)]">
            {SITE.brand}가 지키는 보호 공간의 분위기입니다.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {INDICES.map((i) => (
            <div key={i} className="rounded-media relative aspect-square overflow-hidden shadow-sm">
              <Image
                src={imageUrl(i)}
                alt={galleryAlt(i)}
                fill
                unoptimized
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
