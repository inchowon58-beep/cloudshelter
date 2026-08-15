# 제주도감귤농장 뽕순이네 (jejumilgam)

서귀포 산지직송 감귤 랜딩 + SEO 발행 + 관리자 주문 확인.

## 개발

```bash
npm install
npm run dev
```

- 사이트: http://localhost:3000
- 관리자: http://localhost:3000/admin

## 환경변수

`.env.example` 참고 → `.env.local` 복사 후 설정

- `BLOB_READ_WRITE_TOKEN` — Vercel 배포 시 SEO/주문 저장용
- `NEXT_PUBLIC_SITE_URL` — 실제 도메인
- `GEMINI_API_KEY` — 관리자 Gemini 발행(선택)

## 웹문서 발행기

```bash
cd tools/webdoc
run.bat
```

키워드·지역 조합으로 `/guide` SEO 글을 대량 생성합니다.

## 빌드

```bash
npm run build
npm start
```

## GitHub

https://github.com/inchowon58-beep/jejumilgam.git
