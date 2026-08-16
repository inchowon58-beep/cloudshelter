import { SITE } from "./site";

/** dogboho 01.webp ~ N.webp */
export function imageUrl(index: number): string {
  const n = Math.max(1, Math.min(SITE.imageCount, index));
  return `${SITE.imageBase}/${String(n).padStart(2, "0")}.webp`;
}

function clampImageIndex(num: number): number {
  if (!Number.isFinite(num) || num < 1) return 1;
  return Math.min(SITE.imageCount, Math.max(1, Math.floor(num)));
}

/** 구 CDN·잘못된 URL → dogboho 01~N 로 맞춤 */
export function migrateImageUrl(url: string): string {
  return url
    .replace(
      /https?:\/\/image\.cattery\.co\.kr\/(?:jejumilgam|dogboho)\/(?:new)?(\d{1,3})\.webp/gi,
      (_m, num: string) =>
        `${SITE.imageBase}/${String(clampImageIndex(Number(num))).padStart(2, "0")}.webp`
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
    "보호 중인 강아지",
    "무료분양 대기 아이",
    "파양입소 보호 공간",
    "새 가족을 기다리는 아이들",
    "구름이네 보호소 일상",
  ];
  if (typeof keywordOrIndex === "number") {
    const i = keywordOrIndex;
    return `${SITE.name} ${suffixes[(i - 1) % suffixes.length]} ${i}`;
  }
  const suffix = suffixes[(index - 1) % suffixes.length];
  return `${keywordOrIndex} ${suffix} ${index}`;
}
