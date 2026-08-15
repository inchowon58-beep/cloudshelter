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
# 개발 실행 (콘솔 없음)
제주도감귤농장_웹문서_실행.bat

# 실행파일 빌드 (--windowed, 검은 콘솔 없음)
build_exe.bat
```

빌드 결과: `tools/webdoc/dist/제주도감귤농장웹문서생성기/제주도감귤농장웹문서생성기.exe`

키워드 입력 시 강아지교배와 동일한 SeoPage 형식(title/meta/OG/Twitter/FAQ/히어로)으로
제주감귤 판매용 `/guide` 상세페이지를 생성합니다. 이미지는 3장(히어로+본문2).

## 빌드

```bash
npm run build
npm start
```

## GitHub

https://github.com/inchowon58-beep/jejumilgam.git
