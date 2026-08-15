import { SITE } from "./site";
import { pickImages } from "./images";
import type { SeoPage } from "./seo-pages";
import { slugifyKeyword } from "./seo-pages";

const HERO = [
  "Farm-Direct Seogwipo Tangerines",
  "100% Seogwipo Orchard · No Box Switch",
  "Harvested Today · Delivered Fresh",
  "Real Sugar Content · Real Origin",
];

const INTRO_H2 = [
  "{kw}, 왜 농장 직송이어야 할까요",
  "{kw} 주문 전 꼭 알아둘 점",
  "진짜 서귀포 맛을 위한 {kw} 안내",
  "{kw}와 산지직송의 기준",
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
  const kw = keyword.trim() || "제주도감귤농장";
  const phone = SITE.phone;
  const brand = SITE.brand;
  const farm = SITE.farm;

  const title = `${kw} | ${farm} ${brand} 산지직송`;
  const metaDescription = `${kw} 안내 — ${farm} ${brand}는 서귀포 자체 농장에서 수확한 감귤을 농장주가 직배송합니다. 박스갈이 없는 100% 서귀포 산지직송. 문의 ${phone}.`;
  const h1 = `${kw} — ${brand} 서귀포 산지직송 감귤`;

  const sections = [
    {
      h2: pick(INTRO_H2, seed).replace(/\{kw\}/g, kw),
      paragraphs: [
        `${kw}를 찾을 때 가장 중요한 것은 원산지와 유통 경로입니다. ${farm} ${brand}는 제주 서귀포 농장에서 직접 수확·선별·포장하여, 중간 유통 없이 집 앞으로 보냅니다.`,
        `시중에는 타 지역 감귤을 서귀포 박스로만 바꿔 파는 '박스갈이' 피해가 이어지고 있습니다. ${brand}는 농가 직배송만 진행하므로 포장재만 바꾼 가짜 서귀포 감귤과 분명히 다릅니다.`,
        `당도와 신선도는 수확 직후가 가장 좋습니다. 전화(${phone})로 수량·배송지를 남겨주시면 수확 일정에 맞춰 안내드립니다.`,
      ],
    },
    {
      h2: `${brand}가 ${kw}에서 지키는 원칙`,
      paragraphs: [
        `100% 서귀포 자체 농장 직영, 박스갈이 절대 불가, 맛·당도 선별이 ${brand}의 기준입니다. ${farm}에서 자란 감귤만 출하합니다.`,
        `농장 위치는 ${SITE.location}입니다. 방문 상담보다 산지 직송 주문이 기본이며, 문제 발생 시 100% 환불 보증 정책을 운영합니다.`,
        `3kg·5kg·10kg 실속형과 선물용 세트를 준비했습니다. ${kw} 키워드로 검색하신 분이라면, 유통 마진이 아닌 수확 당일의 맛으로 비교해 보세요.`,
      ],
    },
    {
      h2: `${kw} FAQ와 다음 단계`,
      paragraphs: [
        `${kw} 주문은 홈페이지 간편 신청 또는 ${phone} 전화로 가능합니다. 이름·연락처·주소·수량을 남겨주시면 농장에서 확인 후 연락드립니다.`,
        `${brand}는 정직한 산지 표기와 농장주 직배송으로 신뢰를 쌓습니다. 진짜 서귀포 감귤이 필요하시다면 지금 바로 주문해 주세요.`,
      ],
    },
  ];

  const faqs = [
    {
      q: `${kw} 주문은 어떻게 하나요?`,
      a: `사이트 하단 간편 주문 신청 또는 ${phone} 전화로 접수합니다. 상품·수량·배송지를 알려주시면 ${brand}가 확인 후 안내합니다.`,
    },
    {
      q: `박스갈이 없는 ${kw}인지 어떻게 확인하나요?`,
      a: `${brand}는 서귀포 자체 농장에서 직접 포장·발송합니다. 중간 유통 업자를 거치지 않으며, 산지직송 보증·문제 시 환불 정책을 적용합니다.`,
    },
    {
      q: `배송은 얼마나 걸리나요?`,
      a: `수확·선별 일정에 따라 달라지며, 주문 접수 후 전화로 출고 예정일을 안내드립니다. 신선도를 위해 당일·익일 출고를 원칙으로 합니다.`,
    },
  ];

  const tweak = seed % 3;
  if (tweak === 1) {
    sections[0].paragraphs[0] = sections[0].paragraphs[0].replace("직접", "꼼꼼히");
  } else if (tweak === 2) {
    sections[1].paragraphs[0] = sections[1].paragraphs[0].replace("기준입니다", "약속입니다");
  }

  const now = new Date().toISOString();
  return {
    slug: slugifyKeyword(kw, `t${pageIndex}${seed.toString(36).slice(0, 4)}`),
    keyword: kw,
    title,
    metaDescription,
    metaKeywords: `${kw}, 제주도감귤농장, 서귀포감귤, 감귤직송, 뽕순이네, 박스갈이, 산지직송, 제주감귤`,
    h1,
    heroSubtitle: pick(HERO, seed),
    heroBadge: "100% 서귀포 산지직송",
    heroTitleLine1: kw,
    heroTitleLine2: "농장에서 직배송",
    heroBar: "박스갈이 없는 진짜 서귀포 감귤",
    sections,
    faqs,
    images: pickImages(3, seed),
    ctaText: `감귤 주문 문의 ${phone} — ${brand}`,
    createdAt: now,
    updatedAt: now,
  };
}
