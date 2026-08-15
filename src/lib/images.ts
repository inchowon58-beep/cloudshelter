import { SITE } from "./site";

/** jejumilgam 01.webp ~ 13.webp */
export function imageUrl(index: number): string {
  const n = Math.max(1, Math.min(SITE.imageCount, index));
  return `${SITE.imageBase}/${String(n).padStart(2, "0")}.webp`;
}

export function allImageUrls(): string[] {
  return Array.from({ length: SITE.imageCount }, (_, i) => imageUrl(i + 1));
}

export function galleryAlt(index: number): string {
  const suffixes = [
    "서귀포 감귤 농장 전경",
    "당일 수확 감귤",
    "농장주 직배송 포장",
    "고당도 감귤 선별",
    "제주 서귀포 과수원",
  ];
  return `${SITE.name} ${suffixes[(index - 1) % suffixes.length]} ${index}`;
}
