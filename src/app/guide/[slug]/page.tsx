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
      images: [{ url: ogImage, alt: galleryAlt(page.keyword, 1) }],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.metaDescription,
      images: [ogImage],
    },
  };
}

export default async function GuidePage({ params }: Props) {
  const { slug: raw } = await params;
  const slug = decodeURIComponent(raw);
  const page = await readPage(slug);
  if (!page) notFound();

  const pageUrl = `${SITE.siteUrl.replace(/\/$/, "")}/guide/${encodeURIComponent(page.slug)}`;
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
    image: page.images,
    mainEntityOfPage: pageUrl,
    about: "제주도감귤농장",
  };

  return (
    <article className="pb-8 pt-8">
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

      <div className="bg-[linear-gradient(180deg,#0f172a_0%,#1b4d3e_40%,#f8fafc_40%)] px-4 pb-10 pt-8">
        <div className="container">
          <GuideHeroThumb page={page} imageSrc={page.images[0] || SITE.logo} />
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

        <p className="mb-8 text-lg text-[var(--navy)]">{page.h1}</p>

        {page.sections.map((sec, si) => (
          <section key={sec.h2} className="mb-12">
            <h2 className="text-2xl font-extrabold text-[var(--navy)] md:text-3xl">{sec.h2}</h2>
            <div className="my-3 h-px w-12 bg-[var(--orange)]" />
            {sec.paragraphs.map((p, pi) => (
              <p key={pi} className="mb-4 leading-relaxed text-[var(--muted)]">
                {p}
              </p>
            ))}
            {page.images[si + 1] && (
              <figure className="my-6 overflow-hidden rounded-2xl">
                <Image
                  src={page.images[si + 1]}
                  alt={galleryAlt(page.keyword, si + 2)}
                  width={1000}
                  height={700}
                  unoptimized
                  className="w-full object-cover"
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
          <a href={SITE.phoneTel} className="btn-primary mt-4 inline-flex">
            {CTA_LABEL} {SITE.phone}
          </a>
        </aside>
      </div>
    </article>
  );
}
