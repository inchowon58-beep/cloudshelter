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
  new: "신규",
  contacted: "연락완료",
  done: "처리완료",
  cancelled: "취소",
};

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
            주문 <strong className="text-[var(--ink)]">{orderTotal}</strong>건 · SEO 글{" "}
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
          주문 신청
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
          <h2 className="text-2xl font-extrabold text-[var(--navy)]">간편 주문 신청 목록</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">사이트에서 접수된 주문을 확인·처리합니다.</p>
          <ul className="mt-4 divide-y divide-[var(--line)] overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
            {orders.length === 0 && (
              <li className="px-4 py-6 text-sm text-[var(--muted)]">아직 접수된 주문이 없습니다.</li>
            )}
            {orders.map((o) => (
              <li key={o.id} className="px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-[var(--orange-soft)] px-2 py-0.5 text-xs font-bold text-[var(--orange)]">
                        {STATUS_LABEL[o.status] || o.status}
                      </span>
                      <strong className="text-[var(--navy)]">{o.name}</strong>
                      <a href={`tel:${o.phone.replace(/-/g, "")}`} className="text-sm font-semibold text-[var(--green)]">
                        {o.phone}
                      </a>
                    </div>
                    <p className="mt-1 text-sm text-[var(--ink)]">
                      {o.productLabel} × {o.quantity}박스
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{o.address}</p>
                    {o.memo && <p className="mt-1 text-sm text-[var(--muted)]">메모: {o.memo}</p>}
                    <p className="mt-1 text-xs text-[var(--muted)]">{o.createdAt}</p>
                  </div>
                  <select
                    className="rounded-lg border border-[var(--line)] px-2 py-1.5 text-sm"
                    value={o.status}
                    onChange={(e) => changeOrderStatus(o.id, e.target.value)}
                  >
                    <option value="new">신규</option>
                    <option value="contacted">연락완료</option>
                    <option value="done">처리완료</option>
                    <option value="cancelled">취소</option>
                  </select>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {Array.from({ length: Math.max(1, orderTotalPages) }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => loadOrders(n)}
                className={`min-w-9 rounded-full px-2 py-1 text-sm ${
                  n === orderPage
                    ? "bg-[var(--green)] text-white"
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
