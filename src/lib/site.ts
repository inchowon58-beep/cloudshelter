/** 제주도감귤농장 뽕순이네 — 사이트 공통 설정 */

export const SITE = {
  name: "제주도감귤농장 뽕순이네",
  brand: "뽕순이네",
  farm: "제주도감귤농장",
  tagline: "제주도 서귀포 농장에서 농장주가 직접 보내는 진짜 감귤",
  description:
    "가짜 서귀포 감귤(박스갈이)에 속지 마세요. 제주도감귤농장 뽕순이네는 서귀포 자체 농장에서 수확한 감귤을 농장주가 직배송합니다. 100% 서귀포 산지직송 보증.",
  keywords: [
    "서귀포감귤",
    "제주감귤",
    "감귤직송",
    "서귀포산지직송",
    "박스갈이",
    "뽕순이네",
    "제주도감귤농장",
    "감귤농장",
    "밀감",
  ],
  phone: "010-2374-0401",
  phoneTel: "tel:01023740401",
  phoneDisplay: "010-2374-0401",
  imageBase: "https://image.cattery.co.kr/jejumilgam",
  imageCount: 13,
  location: "제주특별자치도 서귀포시",
  domain: "jejumilgam",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://jejumilgam.com",
} as const;

export const CTA_LABEL = "진짜 서귀포 감귤 주문하기";

export const PRODUCTS = [
  {
    id: "3kg",
    name: "실속형 3kg",
    weight: "3kg",
    desc: "혼자 또는 소가족이 즐기기 좋은 분량",
    badge: "인기",
    image: 3,
  },
  {
    id: "5kg",
    name: "추천 5kg",
    weight: "5kg",
    desc: "가정용으로 가장 많이 찾는 사이즈",
    badge: "BEST",
    image: 5,
  },
  {
    id: "10kg",
    name: "대용량 10kg",
    weight: "10kg",
    desc: "온 가족·지인 나눔용 실속 박스",
    badge: "실속",
    image: 8,
  },
  {
    id: "gift",
    name: "선물용 세트",
    weight: "선물포장",
    desc: "명절·감사 선물용 프리미엄 포장",
    badge: "선물",
    image: 10,
  },
] as const;
