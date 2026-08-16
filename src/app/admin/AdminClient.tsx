"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";

const PAGE_SIZE = 25;

type PageItem = {
  slug: string;
  keyword: string;
  title: string;
  path: string;
  createdAt: string;
};

type OrderItem = {
  id: string;
  name: string;
  phone: string;
  address: string;
  product: string;
  productLabel: string;
  quantity: string;
  memo: string;
  status: string;
  createdAt: string;
};

const STATUS_LABEL: Record<string, string> = {
  new: "답변대기",
  contacted: "연락완료",
  done: "답변완료",
  cancelled: "취소",
};

const STATUS_STYLE: Record<string, string> = {
  new: "bg-[#fff0eb] text-[#e85d3d] ring-1 ring-[#ffd4c8]",
  contacted: "bg-[#e8f1ff] text-[#3d6fd4] ring-1 ring-[#c9dbff]",
  done: "bg-[#eaf7f1] text-[#1f7a4d] ring-1 ring-[#c6ead7]",
  cancelled: "bg-[#f3f4f6] text-[#6b7280] ring-1 ring-[#e5e7eb]",
};

function formatInquiryTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function AdminClient() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<"orders" | "publish">("orders");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [keyword, setKeyword] = useState("강아지보호소");
  const [mode, setMode] = useState<"gemini" | "template">("template");
  const [apiKey, setApiKey] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState("");
  const [items, setItems] = useState<PageItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [copiedSlug, setCopiedSlug] = useState("");
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [orderTotal, setOrderTotal] = useState(0);
  const [orderPage, setOrderPage] = useState(1);
  const [orderTotalPages, setOrderTotalPages] = useState(1);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [deletingOrders, setDeletingOrders] = useState(false);

  function absolutePageUrl(path: string) {
    const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://cloudshelter.vercel.app").replace(
      /\/$/,
      ""
    );
    if (!path) return `${base}/guide`;
    if (path.startsWith("http")) return path;
    return `${base}${path.startsWith("/") ? path : `/${path}`}`;
  }

  async function copyPageUrl(path: string, slug: string) {
    const url = absolutePageUrl(path);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(""), 1800);
    } catch {
      window.prompt("주소를 복사하세요", url);
    }
  }

  const loadPages = useCallback(async (p = 1) => {
    const res = await fetch(`/api/admin/pages?page=${p}`);
    if (res.status === 401) {
      setAuthed(false);
      return;
    }
    const data = await res.json();
    setItems(data.items || []);
    setTotal(data.total || 0);
    setPage(data.page || 1);
    setTotalPages(data.totalPages || 1);
    setAuthed(true);
  }, []);

  const loadOrders = useCallback(async (p = 1) => {
    const res = await fetch(`/api/admin/orders?page=${p}`);
    if (res.status === 401) {
      setAuthed(false);
      return;
    }
    const data = await res.json();
    setOrders(data.items || []);
    setOrderTotal(data.total || 0);
    setOrderPage(data.page || 1);
    setOrderTotalPages(data.totalPages || 1);
    setSelectedOrderIds([]);
    setAuthed(true);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/orders?page=1");
        if (res.ok) {
          const data = await res.json();
          setOrders(data.items || []);
          setOrderTotal(data.total || 0);
          setOrderPage(data.page || 1);
          setOrderTotalPages(data.totalPages || 1);
          setAuthed(true);
          await loadPages(1);
        }
      } finally {
        setChecking(false);
      }
    })();
  }, [loadPages]);

  async function onLogin(e: FormEvent) {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setLoginError(data.error || "로그인 실패");
      return;
    }
    setAuthed(true);
    await Promise.all([loadOrders(1), loadPages(1)]);
  }

  async function onLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuthed(false);
  }

  async function onPublish(e: FormEvent) {
    e.preventDefault();
    setPublishing(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword,
          mode,
          apiKey: apiKey || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "발행 실패");
      setMessage(
        `발행 완료: ${data.path}` +
          (data.indexNow ? `\nIndexNow: ${data.indexNow.message}` : "")
      );
      await loadPages(1);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "발행 실패");
    } finally {
      setPublishing(false);
    }
  }

  async function changeOrderStatus(id: string, status: string) {
    const res = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) await loadOrders(orderPage);
  }

  function toggleOrderSelect(id: string) {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleSelectAllOrders() {
    if (selectedOrderIds.length === orders.length) {
      setSelectedOrderIds([]);
      return;
    }
    setSelectedOrderIds(orders.map((o) => o.id));
  }

  async function deleteSelectedOrders() {
    if (!selectedOrderIds.length) return;
    if (!confirm(`선택한 문의 ${selectedOrderIds.length}건을 삭제할까요?`)) return;
    setDeletingOrders(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedOrderIds }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "삭제에 실패했습니다.");
        return;
      }
      await loadOrders(orderPage);
    } finally {
      setDeletingOrders(false);
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-24">
        <p className="text-[var(--muted)]">확인 중…</p>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 pt-24">
        <form
          onSubmit={onLogin}
          className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-white p-8 shadow-[0_16px_40px_rgba(15,23,42,0.06)]"
        >
          <p className="text-sm font-bold text-[var(--orange)]">Admin</p>
          <h1 className="mt-2 text-3xl font-extrabold text-[var(--navy)]">관리자 로그인</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            강아지보호소 구름이네 · 문의·SEO 발행 관리
          </p>
          <label className="mt-6 block text-sm font-semibold">
            아이디
            <input
              className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </label>
          <label className="mt-4 block text-sm font-semibold">
            비밀번호
            <input
              type="password"
              className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          {loginError && <p className="mt-3 text-sm text-red-700">{loginError}</p>}
          <button type="submit" className="btn-primary mt-6 w-full">
            로그인
          </button>
          <Link href="/" className="mt-4 block text-center text-sm text-[var(--muted)]">
            ← 사이트로 돌아가기
          </Link>
        </form>
      </div>
    );
  }

  return (
    <div className="container min-h-screen py-28">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-[var(--orange)]">Dashboard</p>
          <h1 className="text-4xl font-extrabold text-[var(--navy)]">관리자</h1>
          <p className="mt-2 text-[var(--muted)]">
            문의 <strong className="text-[var(--ink)]">{orderTotal}</strong>건 · SEO 글{" "}
            <strong className="text-[var(--ink)]">{total}</strong>건
          </p>
        </div>
        <button type="button" onClick={onLogout} className="btn-secondary !text-[var(--navy)] !border-[var(--line)]">
          로그아웃
        </button>
      </div>

      <div className="mt-8 flex gap-2">
        <button
          type="button"
          onClick={() => setTab("orders")}
          className={`rounded-xl px-4 py-2 text-sm font-bold ${
            tab === "orders" ? "bg-[var(--orange)] text-white" : "bg-white border border-[var(--line)]"
          }`}
        >
          신청문의
        </button>
        <button
          type="button"
          onClick={() => setTab("publish")}
          className={`rounded-xl px-4 py-2 text-sm font-bold ${
            tab === "publish" ? "bg-[var(--orange)] text-white" : "bg-white border border-[var(--line)]"
          }`}
        >
          SEO 발행
        </button>
      </div>

      {tab === "orders" && (
        <div className="mt-8">
          <div className="overflow-hidden rounded-[1.75rem] border border-[var(--line)] bg-gradient-to-br from-white via-white to-[#eef4ff] shadow-[0_18px_40px_rgba(28,36,52,0.06)]">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--line)] bg-white/80 px-5 py-5 md:px-7">
              <div>
                <p className="text-xs font-bold tracking-wide text-[var(--sky)]">INQUIRY BOARD</p>
                <h2 className="mt-1 text-2xl font-extrabold text-[var(--navy)] md:text-3xl">
                  구름이네 문의목록
                </h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  온라인 상담 신청을 확인하고 상태를 바꿔 관리하세요.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#fff0eb] px-3 py-1 text-xs font-bold text-[#e85d3d]">
                    답변대기 {orders.filter((o) => o.status === "new").length}
                  </span>
                  <span className="rounded-full bg-[#eaf7f1] px-3 py-1 text-xs font-bold text-[#1f7a4d]">
                    답변완료 {orders.filter((o) => o.status === "done").length}
                  </span>
                  <span className="rounded-full bg-[#e8f1ff] px-3 py-1 text-xs font-bold text-[#3d6fd4]">
                    전체 {orderTotal}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={toggleSelectAllOrders}
                  disabled={orders.length === 0}
                  className="rounded-full border border-[var(--line)] bg-white px-3.5 py-2 text-xs font-semibold text-[var(--navy)] shadow-sm transition hover:border-[var(--sky)] disabled:opacity-40"
                >
                  {selectedOrderIds.length === orders.length && orders.length > 0
                    ? "선택 해제"
                    : "전체 선택"}
                </button>
                <button
                  type="button"
                  onClick={deleteSelectedOrders}
                  disabled={!selectedOrderIds.length || deletingOrders}
                  className="rounded-full bg-[#dc2626] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:brightness-95 disabled:opacity-40"
                >
                  {deletingOrders ? "삭제 중…" : `선택 삭제 (${selectedOrderIds.length})`}
                </button>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--sky-soft)] text-2xl">
                  ✉️
                </div>
                <p className="mt-4 text-lg font-bold text-[var(--navy)]">아직 접수된 문의가 없습니다</p>
                <p className="mt-2 max-w-sm text-sm text-[var(--muted)]">
                  메인 페이지에서 상담 신청이 들어오면 여기에 카드로 표시됩니다.
                </p>
              </div>
            ) : (
              <ul className="grid gap-3 p-4 md:grid-cols-2 md:gap-4 md:p-6">
                {orders.map((o) => {
                  const selected = selectedOrderIds.includes(o.id);
                  return (
                    <li
                      key={o.id}
                      className={`rounded-2xl border bg-white p-4 shadow-[0_8px_24px_rgba(28,36,52,0.04)] transition ${
                        selected
                          ? "border-[var(--coral)] ring-2 ring-[rgba(255,122,89,0.18)]"
                          : "border-[var(--line)] hover:border-[var(--sky)]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 shrink-0 accent-[var(--coral)]"
                          checked={selected}
                          onChange={() => toggleOrderSelect(o.id)}
                          aria-label={`${o.name} 문의 선택`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[0.7rem] font-bold ${
                                STATUS_STYLE[o.status] || STATUS_STYLE.new
                              }`}
                            >
                              {STATUS_LABEL[o.status] || o.status}
                            </span>
                            <strong className="truncate text-base text-[var(--navy)]">{o.name}</strong>
                          </div>

                          <a
                            href={`tel:${o.phone.replace(/-/g, "")}`}
                            className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[var(--sky-soft)] px-3 py-1.5 text-sm font-bold text-[var(--sky-deep)]"
                          >
                            📞 {o.phone}
                          </a>

                          <div className="mt-3 space-y-1.5 text-sm">
                            <p className="font-semibold text-[var(--ink)]">
                              {o.productLabel}
                              {o.quantity && o.quantity !== "1" ? ` · ${o.quantity}` : ""}
                            </p>
                            {o.address && o.address !== "미입력" && (
                              <p className="text-[var(--muted)]">📍 {o.address}</p>
                            )}
                            {o.memo && (
                              <p className="rounded-xl bg-[#f8fafc] px-3 py-2 text-[var(--muted)]">
                                {o.memo}
                              </p>
                            )}
                            <p className="text-xs text-[var(--muted)]">{formatInquiryTime(o.createdAt)}</p>
                          </div>

                          <div className="mt-3 flex items-center gap-2">
                            <label className="text-xs font-semibold text-[var(--muted)]">상태</label>
                            <select
                              className="flex-1 rounded-xl border border-[var(--line)] bg-[#fbfcfe] px-2.5 py-2 text-sm"
                              value={o.status}
                              onChange={(e) => changeOrderStatus(o.id, e.target.value)}
                            >
                              <option value="new">답변대기</option>
                              <option value="contacted">연락완료</option>
                              <option value="done">답변완료</option>
                              <option value="cancelled">취소</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {Array.from({ length: Math.max(1, orderTotalPages) }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => loadOrders(n)}
                className={`min-w-9 rounded-full px-2 py-1 text-sm ${
                  n === orderPage
                    ? "bg-[var(--sky)] text-white"
                    : "rounded-xl border border-[var(--line)] bg-white"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === "publish" && (
        <>
          <form
            onSubmit={onPublish}
            className="mt-8 rounded-2xl border border-[var(--line)] bg-white p-6"
          >
            <h2 className="text-2xl font-extrabold text-[var(--navy)]">SEO 1건 발행</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              대량 발행은 tools/webdoc 웹문서 발행기를 사용하세요.
            </p>
            <label className="mt-4 block text-sm font-semibold">
              키워드
              <input
                className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="예: 강아지보호소"
                required
              />
            </label>
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={mode === "template"}
                  onChange={() => setMode("template")}
                />
                기본 양식 (API 없음)
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={mode === "gemini"}
                  onChange={() => setMode("gemini")}
                />
                Gemini
              </label>
            </div>
            {mode === "gemini" && (
              <label className="mt-4 block text-sm font-semibold">
                Gemini API Key (선택 · 서버 .env 우선)
                <input
                  className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="비우면 GEMINI_API_KEY 사용"
                />
              </label>
            )}
            <button type="submit" className="btn-primary mt-5" disabled={publishing}>
              {publishing ? "발행 중…" : "발행하기"}
            </button>
            {message && (
              <p className="mt-3 whitespace-pre-wrap text-sm text-[var(--muted)]">{message}</p>
            )}
          </form>

          <div className="mt-10">
            <h2 className="text-2xl font-extrabold text-[var(--navy)]">발행된 페이지</h2>
            <ul className="mt-4 divide-y divide-[var(--line)] overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
              {items.length === 0 && (
                <li className="px-4 py-6 text-sm text-[var(--muted)]">아직 발행된 글이 없습니다.</li>
              )}
              {items.map((item, i) => {
                const no = (page - 1) * PAGE_SIZE + i + 1;
                return (
                  <li
                    key={item.slug}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="flex min-w-0 flex-1 gap-3">
                      <span className="w-8 shrink-0 text-lg font-bold text-[var(--orange)]">
                        {String(no).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs text-[var(--orange)]">{item.keyword}</div>
                        <a
                          href={item.path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-[var(--navy)] hover:underline"
                        >
                          {no}. {item.title}
                        </a>
                        <div className="truncate text-xs text-[var(--muted)]">
                          {absolutePageUrl(item.path)}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyPageUrl(item.path, item.slug)}
                      className="shrink-0 rounded-full border border-[var(--orange)] px-3 py-1.5 text-xs font-semibold text-[var(--orange)]"
                    >
                      {copiedSlug === item.slug ? "복사됨" : "주소복사하기"}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => loadPages(n)}
                  className={`min-w-9 rounded-full px-2 py-1 text-sm ${
                    n === page
                      ? "bg-[var(--green)] text-white"
                      : "rounded-xl border border-[var(--line)] bg-white"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
