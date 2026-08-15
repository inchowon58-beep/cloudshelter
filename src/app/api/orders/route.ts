import { NextResponse } from "next/server";
import { createOrder } from "@/lib/orders";
import { PRODUCTS } from "@/lib/site";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();
    const address = String(body.address || "").trim();
    const product = String(body.product || "5kg").trim();
    const quantity = String(body.quantity || "1").trim();
    const memo = String(body.memo || "").trim();

    if (!name || !phone || !address) {
      return NextResponse.json(
        { error: "이름, 연락처, 주소는 필수입니다." },
        { status: 400 }
      );
    }

    const productLabel =
      PRODUCTS.find((p) => p.id === product)?.name ?? product;

    const order = await createOrder({
      name,
      phone,
      address,
      product,
      productLabel,
      quantity,
      memo,
    });

    return NextResponse.json({ ok: true, id: order.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "주문 접수 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
