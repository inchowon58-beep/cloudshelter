# 강아지보호소 구름이네 (cloudshelter)

Next.js 15 기반 강아지 파양입소 · 무료분양 보호소 사이트입니다.

## ⛔ 배포 규칙 (필수)

**이 폴더는 제주감귤(`jejumilgam`)로 push/deploy 하면 안 됩니다.**  
**오직 `cloudshelter` (구름이네)로만 배포하세요.**

| 항목 | 허용 | 금지 |
|------|------|------|
| GitHub | `inchowon58-beep/cloudshelter` | `jejumilgam` |
| Vercel | project `cloudshelter` | project `jejumilgam` |
| 도메인 | `cloudshelter.vercel.app` | `jenju.agapet.co.kr` 등 감귤 |

배포 전 검사:

```bash
npm run check:deploy-target
```

안전한 프로덕션 배포:

```bash
npm run deploy:prod
```

(`deploy:prod`는 cloudshelter가 아니면 바로 중단됩니다.)

## 시작

```bash
npm install
npm run dev
```

## 주요 설정

- `src/lib/site.ts` — 업체명, 전화(0505-300-7779), CDN, 도메인
- 이미지 CDN: `https://image.cattery.co.kr/dogboho/`
- 히어로 영상: `public/videos/hero.mp4`
- SEO: `/guide/[slug]` + `tools/webdoc`
- 하단 CTA: 파양입소 / 무료분양문의 + infocs 렌탈 문의

## GitHub

```
https://github.com/inchowon58-beep/cloudshelter.git
```

## 텔레그램 문의 알림

설정: [`docs/telegram-setup.md`](docs/telegram-setup.md)

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID` (숫자, 예: 8433555162)
- `TELEGRAM_BOT_USERNAME` (예: cloudshelter_79_bot)
