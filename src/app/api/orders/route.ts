import { NextResponse } from "next/server";
import { createOrder } from "@/lib/orders";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();
    const address = String(body.address || "").trim() || "미입력";
    const product = String(body.product || "파양입소").trim();
    const quantity = String(body.quantity || "1").trim();
    const memo = String(body.memo || "").trim();

    if (!name || !phone) {
      return NextResponse.json(
        { error: "이름, 연락처는 필수입니다." },
        { status: 400 }
      );
    }

    const order = await createOrder({
      name,
      phone,
      address,
      product,
      productLabel: product,
      quantity,
      memo,
    });

    return NextResponse.json({ ok: true, id: order.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "문의 접수 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
