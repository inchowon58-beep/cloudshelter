import type { Metadata, Viewport } from "next";
import { SITE } from "@/lib/site";
import { faqJsonLd, orgJsonLd } from "@/lib/faq-data";
import Header from "./components/Header";
import Footer from "./components/Footer";
import FixedCTA from "./components/FixedCTA";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.siteUrl),
  title: {
    default: `${SITE.name} | 제주도감귤농장 서귀포 산지직송`,
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
    title: `${SITE.name} | 제주도감귤농장 서귀포 산지직송`,
    description: SITE.description,
    images: [
      {
        url: SITE.logo,
        width: 1200,
        height: 630,
        alt: `${SITE.name} 제주도감귤농장`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} | 제주도감귤농장 서귀포 산지직송`,
    description: SITE.description,
    images: [SITE.logo],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  other: {
    "msapplication-TileColor": "#FF6B00",
  },
};

export const viewport: Viewport = {
  themeColor: "#FF6B00",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const org = orgJsonLd();
  const faq = faqJsonLd();
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link rel="preconnect" href="https://image.cattery.co.kr" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
        <link
          rel="alternate"
          type="application/rss+xml"
          title={`${SITE.name} RSS`}
          href="/rss.xml"
        />
        <link
          rel="alternate"
          type="application/rss+xml"
          title={`${SITE.name} Feed`}
          href="/feed"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(org) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }}
        />
      </head>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
        <FixedCTA />
      </body>
    </html>
  );
}
