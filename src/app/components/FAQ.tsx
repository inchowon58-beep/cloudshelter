import { HOME_FAQS } from "@/lib/faq-data";

export default function FAQ() {
  return (
    <section id="faq" className="section">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold tracking-wide text-[var(--green)]">FAQ · AEO</p>
          <h2 className="mt-2 text-2xl font-extrabold text-[var(--navy)] md:text-4xl">
            제주도감귤농장, 자주 묻는 질문
          </h2>
          <p className="mt-4 text-[var(--muted)]">
            검색·음성 답변에도 맞춰 정리한 핵심 안내입니다.
          </p>
        </div>
        <div className="mx-auto mt-10 max-w-2xl space-y-3">
          {HOME_FAQS.map((f) => (
            <details
              key={f.q}
              className="rounded-2xl border border-[var(--line)] bg-white px-5 py-4"
            >
              <summary className="cursor-pointer font-bold text-[var(--navy)]">{f.q}</summary>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
