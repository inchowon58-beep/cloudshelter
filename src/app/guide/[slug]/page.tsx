import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE, CTA_LABEL } from "@/lib/site";
import { listPageSummaries, readPage } from "@/lib/seo-pages";
import { galleryAlt } from "@/lib/images";
import { faqJsonLd } from "@/lib/faq-data";
import GuideHeroThumb from "@/app/components/GuideHeroThumb";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export async function generateStaticParams() {
  const pages = await listPageSummaries();
  return pages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: raw } = await params;
  const slug = decodeURIComponent(raw);
  const page = await readPage(slug);
  if (!page) return { title: "페이지 없음" };
  const url = `${SITE.siteUrl.replace(/\/$/, "")}/guide/${encodeURIComponent(page.slug)}`;
  const ogImage = page.images[0] || SITE.logo;
  return {
    title: page.title,
    description: page.metaDescription,
    keywords: page.metaKeywords.split(",").map((s) => s.trim()),
    alternates: { canonical: url },
    openGraph: {
      title: page.title,
      description: page.metaDescription,
      url,
      type: "article",
      locale: "ko_KR",
      siteName: SITE.name,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 1200,
          alt: galleryAlt(page.keyword, 1),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.metaDescription,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
  };
}

export default async function GuidePage({ params }: Props) {
  const { slug: raw } = await params;
  const slug = decodeURIComponent(raw);
  const page = await readPage(slug);
  if (!page) notFound();

  const pageUrl = `${SITE.siteUrl.replace(/\/$/, "")}/guide/${encodeURIComponent(page.slug)}`;
  const images = (page.images || []).slice(0, 3);
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: SITE.siteUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: "제주도감귤농장 안내글",
        item: `${SITE.siteUrl.replace(/\/$/, "")}/guide`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: page.h1,
        item: pageUrl,
      },
    ],
  };
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: page.h1,
    description: page.metaDescription,
    keywords: page.metaKeywords,
    datePublished: page.createdAt,
    dateModified: page.updatedAt,
    author: { "@type": "Organization", name: SITE.name },
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      logo: { "@type": "ImageObject", url: SITE.logo },
    },
    image: images.length ? images : [SITE.logo],
    mainEntityOfPage: pageUrl,
    about: ["제주도감귤농장", "서귀포감귤", page.keyword],
  };

  return (
    <article className="pb-8 pt-8 md:pt-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(page.faqs)) }}
      />

      <div className="bg-[linear-gradient(180deg,#0f172a_0%,#1b4d3e_42%,#f8fafc_42%)] px-4 pb-10 pt-6">
        <div className="container">
          <GuideHeroThumb page={page} imageSrc={images[0] || SITE.logo} />
        </div>
      </div>

      <div className="container max-w-3xl py-12">
        <nav className="mb-8 text-sm text-[var(--muted)]">
          <Link href="/" className="hover:text-[var(--orange)]">
            홈
          </Link>
          <span className="mx-2">/</span>
          <Link href="/guide" className="hover:text-[var(--orange)]">
            제주도감귤농장 안내글
          </Link>
          <span className="mx-2">/</span>
          <span>{page.keyword}</span>
        </nav>

        <p className="mb-2 text-sm font-bold tracking-wide text-[var(--orange)]">
          {page.heroSubtitle}
        </p>
        <p className="mb-8 text-lg font-semibold leading-snug text-[var(--navy)] md:text-xl">
          {page.h1}
        </p>

        {page.sections.map((sec, si) => (
          <section key={sec.h2} className="mb-12">
            <h2 className="text-2xl font-extrabold text-[var(--navy)] md:text-3xl">{sec.h2}</h2>
            <div className="my-3 h-px w-12 bg-[var(--orange)]" />
            {sec.paragraphs.map((p, pi) => (
              <p key={pi} className="mb-4 leading-relaxed text-[var(--muted)]">
                {p}
              </p>
            ))}
            {/* 본문 이미지 2장만 — 섹션1·2 뒤에 배치 (가독성) */}
            {si < 2 && images[si + 1] && (
              <figure className="my-7 overflow-hidden rounded-2xl border border-[var(--line)]">
                <Image
                  src={images[si + 1]}
                  alt={galleryAlt(page.keyword, si + 2)}
                  width={1000}
                  height={640}
                  unoptimized
                  className="aspect-[16/10] w-full object-cover"
                  loading="lazy"
                />
              </figure>
            )}
          </section>
        ))}

        {page.faqs?.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-extrabold text-[var(--navy)] md:text-3xl">자주 묻는 질문</h2>
            <div className="my-3 h-px w-12 bg-[var(--orange)]" />
            <div className="space-y-3">
              {page.faqs.map((f) => (
                <details
                  key={f.q}
                  className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                >
                  <summary className="cursor-pointer font-medium text-[var(--navy)]">{f.q}</summary>
                  <p className="mt-2 text-sm text-[var(--muted)]">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        <aside className="rounded-2xl border border-[var(--orange)] bg-[var(--orange-soft)] p-6 text-center">
          <p className="text-xl font-extrabold text-[var(--navy)] md:text-2xl">{page.ctaText}</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <a href={SITE.phoneTel} className="btn-primary inline-flex">
              {CTA_LABEL} {SITE.phone}
            </a>
            <a
              href="/#order"
              className="inline-flex rounded-xl border border-[var(--green)] px-4 py-3 text-sm font-bold text-[var(--green)]"
            >
              간편 주문 신청
            </a>
          </div>
        </aside>
      </div>
    </article>
  );
}
