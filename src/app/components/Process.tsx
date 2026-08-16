import { SITE } from "@/lib/site";

const STEPS = [
  {
    n: "1",
    title: "전화 상담",
    desc: "파양입소·무료분양 상황을 들려주세요. 절차와 준비물을 안내합니다.",
  },
  {
    n: "2",
    title: "일정 조율",
    desc: "방문·픽업·만남 일정을 맞춥니다. 전국 상담이 가능합니다.",
  },
  {
    n: "3",
    title: "교감·확인",
    desc: "아이와 가정 환경의 궁합을 확인합니다. 충동 결정은 권하지 않습니다.",
  },
  {
    n: "4",
    title: "입소·입양",
    desc: "안전한 인계와 이후 케어 안내로 마칩니다. 이후에도 문의 가능합니다.",
  },
];

export default function Process() {
  return (
    <section id="process" className="section">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold tracking-wide text-[var(--sky)]">PROCESS</p>
          <h2 className="mt-2 text-3xl font-extrabold text-[var(--navy)] md:text-4xl">
            처음이라 어려우신가요?
          </h2>
          <p className="mt-3 text-[var(--muted)]">
            입양과 파양, 둘 다 쉬운 결정은 아닙니다. {SITE.brand}가 단계별로 함께합니다.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="soft-card p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--sky-soft)] text-lg font-extrabold text-[var(--sky-deep)]">
                {s.n}
              </div>
              <h3 className="mt-4 text-lg font-bold text-[var(--navy)]">{s.title}</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
