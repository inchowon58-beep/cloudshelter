import { SITE } from "./site";

export type FaqItem = { q: string; a: string };

/** 메인·AEO용 자주 묻는 질문 */
export const HOME_FAQS: FaqItem[] = [
  {
    q: "강아지 파양입소는 어떻게 진행되나요?",
    a: `${SITE.name}는 전화 상담(${SITE.phone})으로 상황을 들은 뒤, 입소 가능 여부와 준비물을 안내합니다. 급하신 경우에도 일정 조율이 가능합니다.`,
  },
  {
    q: "무료분양은 정말 무료인가요?",
    a: "책임 있는 새 가족 매칭을 위한 무료분양을 진행합니다. 아이별 건강·성격·생활 조건을 상담 후 안내드리며, 충동 입양은 지양합니다.",
  },
  {
    q: "안락사 없는 보호소인가요?",
    a: "네. 구름이네는 안락사 없는 보호를 원칙으로 합니다. 아이가 새 가족을 만날 때까지, 그리고 그 이후에도 책임 있게 돕습니다.",
  },
  {
    q: "전국에서 상담·입소가 가능한가요?",
    a: `전국 상담이 가능합니다. 방문이 어려운 경우 픽업·이동 일정도 함께 안내합니다. 문의 ${SITE.phone}.`,
  },
  {
    q: "입양 전 아이를 미리 볼 수 있나요?",
    a: "전화 상담 후 방문·만남 일정을 잡습니다. 아이 성향과 가정 환경을 맞춰 본 뒤 입양을 결정하는 것을 권장합니다.",
  },
  {
    q: "상담 전화번호는 어떻게 되나요?",
    a: `${SITE.phoneDisplay}입니다. 파양입소·무료분양 모두 같은 번호로 안내받으실 수 있습니다.`,
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
    "@type": "LocalBusiness",
    name: SITE.name,
    alternateName: [SITE.brand, SITE.farm, "구름이네 보호소"],
    description: SITE.description,
    url: SITE.siteUrl,
    telephone: SITE.phone,
    image: SITE.logo,
    address: {
      "@type": "PostalAddress",
      addressCountry: "KR",
      streetAddress: SITE.address,
    },
    areaServed: SITE.areaServed,
    priceRange: "무료분양 · 상담",
    keywords: SITE.keywords.join(", "),
  };
}
