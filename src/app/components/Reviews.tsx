import { SITE } from "@/lib/site";

const REVIEWS = [
  {
    quote:
      "이사 때문에 급히 상담했는데, 파양 절차를 차분히 설명해 주셔서 안심하고 맡길 수 있었습니다.",
    name: "김○○ 보호자",
    course: "파양 입소",
  },
  {
    quote:
      "무료분양으로 아이를 만났는데 성향까지 자세히 알려주셨어요. 적응도 빨랐고 책임감이 느껴졌습니다.",
    name: "이○○ 보호자",
    course: "책임 분양",
  },
  {
    quote:
      "전국 상담이라 걱정했는데, 방문이 어려운 상황에 맞춰 픽업까지 안내해 주셨습니다.",
    name: "박○○ 보호자",
    course: "방문 픽업",
  },
  {
    quote:
      "입소 후에도 생활 사진을 보내 주셔서 마음이 놓였어요. 끝까지 챙기시는 느낌이었습니다.",
    name: "최○○ 보호자",
    course: "보호 근황",
  },
  {
    quote:
      "버리거나 직거래할까 고민하다가 구름이네에 문의했습니다. 아이에게 더 좋은 선택이었다고 생각합니다.",
    name: "정○○ 보호자",
    course: "상담 후 입소",
  },
  {
    quote:
      "전화만으로도 친절히 안내받아 편했습니다. 급한 일정에도 맞춰 주셔서 감사했어요.",
    name: "한○○ 보호자",
    course: "긴급 상담",
  },
];

export default function Reviews() {
  return (
    <section id="reviews" className="section bg-white/50">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold tracking-wide text-[var(--sky)]">REVIEWS</p>
          <h2 className="mt-2 text-3xl font-extrabold text-[var(--navy)] md:text-4xl">
            보호자님이 남겨 주신 이야기
          </h2>
          <p className="mt-3 text-[var(--muted)]">
            {SITE.brand}를 통해 안전한 입소와 새 가족 만남을 경험하신 분들의 후기입니다.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {REVIEWS.map((r) => (
            <blockquote key={r.name + r.course} className="soft-card p-6">
              <p className="text-[var(--ink)] leading-relaxed">&ldquo;{r.quote}&rdquo;</p>
              <footer className="mt-4 border-t border-[var(--line)] pt-3">
                <p className="text-sm font-bold text-[var(--navy)]">{r.name}</p>
                <p className="text-xs text-[var(--sky)]">{r.course}</p>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
