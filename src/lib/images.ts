import { SITE } from "./site";

/** jejumilgam 01.webp ~ 13.webp */
export function imageUrl(index: number): string {
  const n = Math.max(1, Math.min(SITE.imageCount, index));
  return `${SITE.imageBase}/${String(n).padStart(2, "0")}.webp`;
}

function clampImageIndex(num: number): number {
  if (!Number.isFinite(num) || num < 1) return 1;
  return Math.min(SITE.imageCount, Math.max(1, Math.floor(num)));
}

/** 범위 초과·잘못된 URL → 01~13 로 맞춤 */
export function migrateImageUrl(url: string): string {
  return url.replace(
    /(https?:\/\/image\.cattery\.co\.kr\/jejumilgam\/)(?:new)?(\d{1,3})\.webp/gi,
    (_m, base: string, num: string) =>
      `${base}${String(clampImageIndex(Number(num))).padStart(2, "0")}.webp`
  );
}

export function allImageUrls(): string[] {
  return Array.from({ length: SITE.imageCount }, (_, i) => imageUrl(i + 1));
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickImages(count: number, seed = 42): string[] {
  const pool = allImageUrls();
  const rng = mulberry32(seed);
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function galleryAlt(keywordOrIndex: string | number, index = 1): string {
  const suffixes = [
    "서귀포 감귤 농장 전경",
    "당일 수확 감귤",
    "농장주 직배송 포장",
    "고당도 감귤 선별",
    "제주 서귀포 과수원",
  ];
  if (typeof keywordOrIndex === "number") {
    const i = keywordOrIndex;
    return `${SITE.name} ${suffixes[(i - 1) % suffixes.length]} ${i}`;
  }
  const suffix = suffixes[(index - 1) % suffixes.length];
  return `${keywordOrIndex} ${suffix} ${index}`;
}
