import { SITE } from "./site";

export type FaqItem = { q: string; a: string };

/** 메인·AEO용 자주 묻는 질문 */
export const HOME_FAQS: FaqItem[] = [
  {
    q: "제주도감귤농장 뽕순이네 감귤은 정말 서귀포에서 보내나요?",
    a: "네. 제주도감귤농장 뽕순이네는 서귀포 자체 농장에서 수확한 감귤만 출하합니다. 타 지역 감귤을 서귀포 박스로 바꿔 담는 박스갈이를 하지 않으며, 농장주가 직접 포장·발송합니다.",
  },
  {
    q: "박스갈이 감귤과 뭐가 다른가요?",
    a: "박스갈이는 원산지와 다른 감귤을 서귀포 포장재로만 바꿔 파는 행위입니다. 뽕순이네는 중간 유통 없이 농가 직배송만 진행해 원산지·당도·신선도를 그대로 전달합니다.",
  },
  {
    q: "어떤 용량으로 주문할 수 있나요?",
    a: "실속형 3kg, 가정용 5kg, 대용량 10kg, 선물용 세트를 준비했습니다. 사이트 주문 신청 또는 전화 010-2374-0401로 수량을 남겨주시면 됩니다.",
  },
  {
    q: "문제가 있으면 환불이 되나요?",
    a: "100% 서귀포 산지직송을 보증하며, 문제 발생 시 100% 환불 정책으로 대응합니다. 수령 후 이상이 있으면 바로 연락 주세요.",
  },
  {
    q: "배송은 얼마나 걸리나요?",
    a: "수확·선별 일정에 맞춰 출고하며, 신선도를 위해 당일·익일 출고를 원칙으로 합니다. 정확한 일정은 주문 접수 후 전화로 안내드립니다.",
  },
  {
    q: "제주도감귤농장 문의 전화번호는?",
    a: "010-2374-0401입니다. 이름·주소·희망 용량을 알려주시면 빠르게 확인 후 안내드립니다.",
  },
];

export function faqJsonLd(faqs: FaqItem[] = HOME_FAQS) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function orgJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Farm",
    name: SITE.name,
    alternateName: [SITE.farm, SITE.brand, "제주도감귤농장"],
    description: SITE.description,
    url: SITE.siteUrl,
    telephone: SITE.phone,
    image: SITE.logo,
    address: {
      "@type": "PostalAddress",
      addressLocality: "서귀포시",
      addressRegion: "제주특별자치도",
      addressCountry: "KR",
      streetAddress: SITE.address,
    },
    areaServed: "KR",
    priceRange: "$$",
    keywords: SITE.keywords.join(", "),
  };
}
