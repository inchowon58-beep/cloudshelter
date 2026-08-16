import Image from "next/image";
import { SITE } from "@/lib/site";
import { ADOPTION_GALLERY } from "@/lib/adoption-gallery";

export default function Pets() {
  return (
    <section id="pets" className="section bg-white/50">
      <div className="container">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold tracking-wide text-[var(--sky)]">ADOPT</p>
            <h2 className="mt-2 text-3xl font-extrabold text-[var(--navy)] md:text-4xl">
              가족을 기다리는 아이들
            </h2>
            <p className="mt-3 max-w-xl text-[var(--muted)]">
              무료분양 가능한 아이들이 새 가족을 기다립니다. 마음에 드는 아이를 확인하신 뒤
              전화로 매칭 상담을 받아보세요.
            </p>
          </div>
          <a href={SITE.phoneTel} className="btn-sky shrink-0">
            무료분양 상담하기
          </a>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ADOPTION_GALLERY.map((pet) => (
            <article key={pet.name} className="soft-card group">
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image
                  src={pet.src}
                  alt={`${pet.name} — ${pet.breed} 무료분양`}
                  fill
                  unoptimized
                  className="object-cover transition duration-700 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-[var(--sky-deep)]">
                  {pet.status}
                </span>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-extrabold text-[var(--navy)]">{pet.name}</h3>
                <p className="mt-0.5 text-sm text-[var(--muted)]">
                  {pet.breed} · {pet.age} · {pet.sex}
                </p>
                <ul className="mt-3 space-y-1">
                  {pet.traits.slice(0, 2).map((t) => (
                    <li key={t} className="text-xs text-[var(--muted)]">
                      · {t}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
