import Image from "next/image";
import { allImageUrls, galleryAlt } from "@/lib/images";

export default function Gallery() {
  const images = allImageUrls();

  return (
    <section id="gallery" className="section pt-0">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold tracking-wide text-[var(--green)]">FARM GALLERY</p>
          <h2 className="mt-2 text-2xl font-extrabold text-[var(--navy)] md:text-3xl">
            농장 현장 · 수확 모습
          </h2>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
          {images.slice(0, 8).map((src, i) => (
            <figure
              key={src}
              className={`relative overflow-hidden rounded-xl ${
                i === 0 || i === 5 ? "col-span-2 aspect-[2/1] md:aspect-[2/1]" : "aspect-square"
              }`}
            >
              <Image
                src={src}
                alt={galleryAlt(i + 1)}
                fill
                unoptimized
                className="object-cover transition duration-500 hover:scale-105"
                sizes="(max-width:768px) 50vw, 25vw"
              />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
