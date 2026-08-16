/** 강아지보호소 구름이네 — 사이트 공통 설정 */

export const SITE = {
  name: "강아지보호소 구름이네",
  brand: "구름이네",
  farm: "강아지보호소",
  tagline: "안락사 없는 보호, 파양입소부터 무료분양까지",
  taglineEn: "Dog Shelter · Surrender & Free Adoption",
  description:
    "강아지보호소 구름이네는 강아지 파양입소와 무료분양을 안내하는 보호소입니다. 피치 못한 파양 상담부터 새 가족 매칭까지 책임집니다. 문의 0505-300-7779.",
  keywords: [
    "강아지보호소",
    "구름이네",
    "강아지파양",
    "강아지파양입소",
    "무료분양",
    "강아지무료분양",
    "유기견보호소",
    "강아지입양",
    "반려견파양",
    "강아지입소",
    "강아지분양",
    "유기견입양",
  ],
  phone: "0505-300-7779",
  phoneTel: "tel:05053007779",
  phoneDisplay: "0505-300-7779",
  logo: "https://image.cattery.co.kr/dogboho/01.webp",
  imageBase: "https://image.cattery.co.kr/dogboho",
  imageCount: 79,
  location: "대한민국 전국",
  address: "전국 상담 · 방문 예약제",
  areaServed: "대한민국 전국",
  domain: "cloudshelter",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://cloudshelter.vercel.app",
  infocsUrl: "https://www.infocs.co.kr/",
} as const;

export const CTA_LABEL = "파양입소·무료분양 문의";
export const CTA_SURRENDER = "파양입소";
export const CTA_ADOPT = "무료분양문의";
export const CTA_BUILD = "자동화사이트구축/렌탈문의";
