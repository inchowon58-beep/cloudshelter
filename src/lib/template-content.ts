import { SITE } from "./site";
import { pickImages } from "./images";
import type { SeoPage } from "./seo-pages";
import { slugifyKeyword } from "./seo-pages";

const HERO = [
  "Nationwide Dog Shelter · No Euthanasia",
  "Responsible Surrender & Free Adoption",
  "From Hard Goodbyes to New Families",
  "Cloud Shelter · Care Until Forever Home",
];

const INTRO_H2 = [
  "{kw}, 왜 보호소 상담이 필요할까요",
  "{kw} 알아보기 전 꼭 확인할 점",
  "책임 있는 선택을 위한 {kw} 안내",
  "{kw}와 구름이네 보호 원칙",
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

export function generateTemplateContent(keyword: string, pageIndex = 1): SeoPage {
  const seed = hash(`${keyword}|${pageIndex}|${SITE.brand}`);
  const kw = keyword.trim() || "강아지보호소";
  const phone = SITE.phone;
  const brand = SITE.brand;
  const farm = SITE.farm;

  const title = `${kw} | ${farm} ${brand} 파양입소·무료분양`;
  const metaDescription = `${kw} 안내 — ${farm} ${brand}는 강아지 파양입소와 무료분양을 책임 있게 상담합니다. 안락사 없는 보호, 새 가족 매칭. 문의 ${phone}.`;
  const h1 = `${kw} — ${brand} 파양입소·무료분양`;

  const sections = [
    {
      h2: pick(INTRO_H2, seed).replace(/\{kw\}/g, kw),
      paragraphs: [
        `${kw}를 찾을 때 가장 중요한 것은 아이의 안전과 이후 삶의 질입니다. ${farm} ${brand}는 피치 못한 파양 상담부터 무료분양 매칭까지 한곳에서 안내합니다.`,
        `직거래·유기 대신 보호소 입소를 선택하시면, 아이가 안정된 환경에서 새 가족을 기다릴 수 있습니다. ${brand}는 안락사 없는 보호를 원칙으로 합니다.`,
        `상담은 전화(${phone})로 가능합니다. 상황·일정·지역을 말씀해 주시면 입소·분양 절차를 차분히 안내드립니다.`,
      ],
    },
    {
      h2: `${brand}가 ${kw}에서 지키는 약속`,
      paragraphs: [
        `투명한 상담, 책임 있는 매칭, 입소 후 근황 안내가 ${brand}의 기준입니다. 충동 분양보다 아이와 가정의 궁합을 우선합니다.`,
        `${SITE.areaServed} 범위에서 상담이 가능하며, 방문이 어려운 경우 픽업·이동 일정도 함께 조율합니다.`,
        `${kw}로 검색하신 분이라면, 비용·절차·준비물을 먼저 확인하신 뒤 전화 상담을 권합니다. 문의 ${phone}.`,
      ],
    },
    {
      h2: `${kw} FAQ와 다음 단계`,
      paragraphs: [
        `${kw} 상담은 홈페이지 문의 또는 ${phone} 전화로 가능합니다. 파양입소·무료분양 모두 같은 번호로 연결됩니다.`,
        `${brand}는 좋은 이별과 좋은 만남을 모두 돕습니다. 지금 바로 상담해 주세요.`,
      ],
    },
  ];

  const faqs = [
    {
      q: `${kw} 상담은 어떻게 하나요?`,
      a: `사이트 하단 문의 또는 ${phone} 전화로 접수합니다. 상황·희망 일정을 알려주시면 ${brand}가 확인 후 안내합니다.`,
    },
    {
      q: `파양입소와 무료분양 모두 가능한가요?`,
      a: `네. ${brand}는 파양입소와 무료분양 매칭을 함께 안내합니다. 아이 상태와 가정 환경에 맞춰 절차를 안내드립니다.`,
    },
    {
      q: `전국에서 이용할 수 있나요?`,
      a: `전국 상담이 가능합니다. 방문·픽업이 필요한 경우 일정 조율 후 진행합니다. 문의 ${phone}.`,
    },
  ];

  const tweak = seed % 3;
  if (tweak === 1) {
    sections[0].paragraphs[0] = sections[0].paragraphs[0].replace("안내합니다", "함께합니다");
  } else if (tweak === 2) {
    sections[1].paragraphs[0] = sections[1].paragraphs[0].replace("기준입니다", "약속입니다");
  }

  const now = new Date().toISOString();
  return {
    slug: slugifyKeyword(kw, `t${pageIndex}${seed.toString(36).slice(0, 4)}`),
    keyword: kw,
    title,
    metaDescription,
    metaKeywords: `${kw}, 강아지보호소, 구름이네, 강아지파양, 파양입소, 무료분양, 유기견보호소, 강아지입양`,
    h1,
    heroSubtitle: pick(HERO, seed),
    heroBadge: "안락사 없는 보호",
    heroTitleLine1: kw,
    heroTitleLine2: "파양입소 · 무료분양",
    heroBar: "책임 있는 보호와 새 가족 매칭",
    sections,
    faqs,
    images: pickImages(3, seed),
    ctaText: `파양입소·무료분양 문의 ${phone} — ${brand}`,
    createdAt: now,
    updatedAt: now,
  };
}
