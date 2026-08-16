import type { Order } from "./orders";
import { SITE } from "./site";

function telegramConfig() {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim() || "";
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim() || "";
  return { token, chatId, enabled: Boolean(token && chatId) };
}

function escapeHtml(text: string): string {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatInquiryMessage(order: Order): string {
  const when = new Date(order.createdAt).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
  });
  const lines = [
    `<b>🔔 ${escapeHtml(SITE.name)} 새 문의</b>`,
    "",
    `<b>이름</b>: ${escapeHtml(order.name)}`,
    `<b>전화</b>: ${escapeHtml(order.phone)}`,
    `<b>유형</b>: ${escapeHtml(order.productLabel || order.product)}`,
  ];
  if (order.address && order.address !== "미입력") {
    lines.push(`<b>지역</b>: ${escapeHtml(order.address)}`);
  }
  if (order.memo) {
    lines.push(`<b>내용</b>: ${escapeHtml(order.memo)}`);
  }
  lines.push(`<b>시각</b>: ${escapeHtml(when)}`);
  lines.push(`<b>ID</b>: <code>${escapeHtml(order.id)}</code>`);
  return lines.join("\n");
}

/** 문의 접수 시 텔레그램으로 즉시 알림 (설정 없으면 조용히 스킵) */
export async function notifyInquiryTelegram(order: Order): Promise<{
  ok: boolean;
  skipped?: boolean;
  message: string;
}> {
  const { token, chatId, enabled } = telegramConfig();
  if (!enabled) {
    return {
      ok: false,
      skipped: true,
      message: "TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID 미설정",
    };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: formatInquiryMessage(order),
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      description?: string;
    };
    if (!res.ok || !data.ok) {
      const msg = data.description || `HTTP ${res.status}`;
      console.error("[telegram] send failed:", msg);
      return { ok: false, message: msg };
    }
    return { ok: true, message: "텔레그램 알림 전송 완료" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[telegram] error:", msg);
    return { ok: false, message: msg };
  }
}
