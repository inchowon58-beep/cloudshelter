/** 아가펫스토리 입양게시판 — 무료분양 가능 아이들 (대표 사진) */
function sanity(id: string, w = 800) {
  return `https://cdn.sanity.io/images/58cgd16k/production/${id}?w=${w}&auto=format`;
}

export type AdoptionPet = {
  name: string;
  breed: string;
  age: string;
  sex: string;
  status: "입양 대기";
  traits: string[];
  src: string;
};

export const ADOPTION_GALLERY: AdoptionPet[] = [
  {
    name: "보리",
    breed: "코카푸",
    age: "3살",
    sex: "남아",
    status: "입양 대기",
    traits: ["밝고 쾌활함", "친구들을 좋아해요", "똥꼬발랄 귀염둥이"],
    src: sanity("9e3014bc68d9b59de4bd480f47e0208076177f94-3024x4032.jpg"),
  },
  {
    name: "길산",
    breed: "시바견",
    age: "6살",
    sex: "남아",
    status: "입양 대기",
    traits: ["산책러버", "순둥순둥 조용한 성격", "짖음없음"],
    src: sanity("1f045f7e4e2a4d0a8f9b6da943f988149a9c1755-3024x4032.jpg"),
  },
  {
    name: "나롱이",
    breed: "시츄",
    age: "5살",
    sex: "여아",
    status: "입양 대기",
    traits: ["시츄답게 착하고 얌전", "애교만땅", "엄마 같은 아이"],
    src: sanity("d6f70ec52dc2ecf320928a81d4b9366a240260c9-3024x4032.jpg"),
  },
  {
    name: "초코",
    breed: "토이푸들",
    age: "6살",
    sex: "여아",
    status: "입양 대기",
    traits: ["작고 소중한 아이", "착해도 너무나 착해요", "수술 이력 있음"],
    src: sanity("6c3d6caf3a2d18ef34bcfb673181ee2a93bcf1f6-3024x4032.jpg"),
  },
  {
    name: "사남매",
    breed: "믹스견",
    age: "생후 2개월",
    sex: "남매",
    status: "입양 대기",
    traits: ["곰돌이 인형 같은 외모", "형제 다른 모색", "각기 다른 매력"],
    src: sanity("6e9c01f9a7a41b394caec98f0b47524829fa33ca-4032x3024.jpg"),
  },
  {
    name: "미르",
    breed: "웰시코기 카디건",
    age: "8살",
    sex: "남아",
    status: "입양 대기",
    traits: ["단미 안 되어 있음", "든든함 물씬", "귀한 카디건"],
    src: sanity("95626aa75257a753d3cf2a6428b1dceadf990235-3024x4032.jpg"),
  },
  {
    name: "장군이",
    breed: "골든리트리버",
    age: "3개월",
    sex: "남아",
    status: "입양 대기",
    traits: ["장꾸 리트리버", "순둥이 끝판왕", "장난이 제일 좋아요"],
    src: sanity("1c68d95cd703b179c24de9d3f02d9f9e28977734-2518x3357.jpg"),
  },
  {
    name: "땡초",
    breed: "웰시코기",
    age: "5살",
    sex: "남아",
    status: "입양 대기",
    traits: ["단미된 웰시코기", "애교가 많음", "활발한 성격"],
    src: sanity("29396ec6bb635ca32b6419d643947d9a751421ac-3024x4032.jpg"),
  },
];
