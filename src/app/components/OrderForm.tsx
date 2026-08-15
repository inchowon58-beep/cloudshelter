"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Phone, Send } from "lucide-react";
import { PRODUCTS, SITE } from "@/lib/site";

type FormState = {
  name: string;
  phone: string;
  address: string;
  product: string;
  quantity: string;
  memo: string;
};

const initial: FormState = {
  name: "",
  phone: "",
  address: "",
  product: "5kg",
  quantity: "1",
  memo: "",
};

export default function OrderForm() {
  const [form, setForm] = useState<FormState>(initial);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "주문 접수에 실패했습니다.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "주문 접수에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <section id="order" className="section bg-white/70">
        <div className="container">
          <div className="mx-auto max-w-lg rounded-3xl border border-[var(--line)] bg-white p-8 text-center shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <CheckCircle2 className="mx-auto text-[var(--green)]" size={48} />
            <h2 className="mt-4 text-2xl font-extrabold text-[var(--navy)]">주문이 접수되었습니다</h2>
            <p className="mt-3 text-[var(--muted)]">
              관리자 페이지에 주문이 저장되었습니다.
              <br />
              농장에서 확인 후 빠르게 연락드리겠습니다.
            </p>
            <a href={SITE.phoneTel} className="btn-primary mt-6 inline-flex">
              <Phone size={18} />
              {SITE.phoneDisplay} 전화하기
            </a>
            <button
              type="button"
              className="mt-4 block w-full text-sm font-semibold text-[var(--muted)] underline"
              onClick={() => {
                setDone(false);
                setForm(initial);
              }}
            >
              다시 작성하기
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="order" className="section bg-white/70">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold tracking-wide text-[var(--orange)]">ORDER</p>
          <h2 className="mt-2 text-2xl font-extrabold text-[var(--navy)] md:text-4xl">
            간편 주문 신청
          </h2>
          <p className="mt-4 text-[var(--muted)]">
            이름·연락처·주소만 남겨주시면 농장에서 확인 후 연락드립니다.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="mx-auto mt-10 max-w-xl rounded-3xl border border-[var(--line)] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] md:p-8"
        >
          <div className="field">
            <label htmlFor="name">이름</label>
            <input
              id="name"
              required
              placeholder="홍길동"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="field">
            <label htmlFor="phone">연락처</label>
            <input
              id="phone"
              required
              type="tel"
              inputMode="tel"
              placeholder="010-0000-0000"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          <div className="field">
            <label htmlFor="address">배송 주소</label>
            <textarea
              id="address"
              required
              rows={3}
              placeholder="받으실 주소를 입력해 주세요"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="field">
              <label htmlFor="product">상품 선택</label>
              <select
                id="product"
                value={form.product}
                onChange={(e) => setForm({ ...form, product: e.target.value })}
              >
                {PRODUCTS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.weight})
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="quantity">수량</label>
              <select
                id="quantity"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              >
                {["1", "2", "3", "4", "5"].map((n) => (
                  <option key={n} value={n}>
                    {n}박스
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="memo">요청사항 (선택)</label>
            <input
              id="memo"
              placeholder="선물 포장, 배송 희망일 등"
              value={form.memo}
              onChange={(e) => setForm({ ...form, memo: e.target.value })}
            />
          </div>

          {error && <p className="mb-3 text-sm text-red-700">{error}</p>}

          <button type="submit" className="btn-primary mt-2 w-full" disabled={submitting}>
            <Send size={18} />
            {submitting ? "접수 중…" : "주문 신청하기"}
          </button>

          <p className="mt-4 text-center text-xs text-[var(--muted)]">
            신청 후 {SITE.phoneDisplay} 로 전화 주시면 더 빠르게 확인됩니다.
          </p>
        </form>
      </div>
    </section>
  );
}
