import type { Metadata, Viewport } from "next";
import { SITE } from "@/lib/site";
import { imageUrl } from "@/lib/images";
import "./globals.css";

const ogImage = imageUrl(1);

export const metadata: Metadata = {
  metadataBase: new URL(SITE.siteUrl),
  title: {
    default: `${SITE.name} | 진짜 서귀포 감귤 산지직송`,
    template: `%s | ${SITE.brand}`,
  },
  description: SITE.description,
  keywords: [...SITE.keywords],
  authors: [{ name: SITE.name }],
  creator: SITE.name,
  publisher: SITE.name,
  alternates: { canonical: SITE.siteUrl },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: SITE.siteUrl,
    siteName: SITE.name,
    title: `${SITE.name} | 진짜 서귀포 감귤 산지직송`,
    description: SITE.description,
    images: [{ url: ogImage, width: 1200, height: 630, alt: SITE.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} | 진짜 서귀포 감귤 산지직송`,
    description: SITE.description,
    images: [ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  themeColor: "#FF6B00",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: SITE.name,
  description: SITE.description,
  telephone: SITE.phone,
  url: SITE.siteUrl,
  image: ogImage,
  address: {
    "@type": "PostalAddress",
    addressLocality: "서귀포시",
    addressRegion: "제주특별자치도",
    addressCountry: "KR",
  },
  areaServed: "KR",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link rel="preconnect" href="https://image.cattery.co.kr" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
