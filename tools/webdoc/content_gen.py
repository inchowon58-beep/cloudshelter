# -*- coding: utf-8 -*-
"""문서 본문 생성 (템플릿) — 강아지보호소 구름이네.
키워드 전달 시 SeoPage 스키마(title/meta/OG/FAQ/hero)로
파양입소·무료분양 상세 페이지를 생성합니다. 이미지는 3장.
"""

from __future__ import annotations

import hashlib
import json
import os
import random
import string
from datetime import datetime
from typing import Any, Dict, List
from urllib.parse import quote

BRAND = "구름이네"
FARM = "강아지보호소"
SITE_NAME = "강아지보호소 구름이네"
PHONE = "0505-300-7779"
PHONE_TEL = "05053007779"
LOCATION = "대한민국 전국"
IMAGE_BASE = "https://image.cattery.co.kr/dogboho"
IMAGE_COUNT = 79
IMAGE_USE = 3  # 히어로 1 + 본문 2


def _rng(keyword: str, idx: int) -> random.Random:
    seed = int(hashlib.md5(f"{keyword}|{idx}|cloud".encode()).hexdigest()[:8], 16)
    return random.Random(seed)


def image_urls(count: int, seed: int) -> List[str]:
    rng = random.Random(seed)
    pool = [f"{IMAGE_BASE}/{i:02d}.webp" for i in range(1, IMAGE_COUNT + 1)]
    rng.shuffle(pool)
    return pool[:count]


def slugify(keyword: str, idx: int) -> str:
    base = "".join(
        c if c.isalnum() or c in "-_" else "-" for c in keyword.lower().replace(" ", "-")
    )
    base = base.strip("-")[:36] or "cloudshelter"
    tail = f"{idx:02d}{''.join(random.choices(string.ascii_lowercase + string.digits, k=4))}"
    return f"{base}-{tail}"


def _page_to_summary(page: Dict[str, Any]) -> Dict[str, str]:
    return {
        "slug": page["slug"],
        "keyword": page.get("keyword") or "",
        "title": page.get("title") or page.get("h1") or page["slug"],
        "metaDescription": page.get("metaDescription") or "",
        "h1": page.get("h1") or page.get("title") or page["slug"],
        "createdAt": page.get("createdAt") or "",
        "updatedAt": page.get("updatedAt") or page.get("createdAt") or "",
    }


def build_content(keyword: str, idx: int) -> Dict[str, Any]:
    rng = _rng(keyword, idx)
    kw = keyword.strip() or "강아지보호소"
    heroes = [
        "Nationwide Dog Shelter · No Euthanasia",
        "Responsible Surrender & Free Adoption",
        "From Hard Goodbyes to New Families",
        "Cloud Shelter · Care Until Forever Home",
    ]
    line2_opts = [
        "파양입소 · 무료분양",
        "안락사 없는 보호",
        "책임 있는 새 가족 매칭",
        "전국 상담 가능",
    ]
    bar_opts = [
        "버리거나 직거래하지 마세요",
        "전화 한 통으로 차분히 안내합니다",
        "아이와 보호자 모두를 생각합니다",
        "입소 후에도 근황을 나눠 드립니다",
    ]
    intro_h2 = [
        f"{kw}, 왜 보호소 상담이 필요할까요",
        f"{kw} 알아보기 전 꼭 확인할 점",
        f"책임 있는 선택을 위한 {kw} 안내",
        f"{kw}와 구름이네 보호 원칙",
    ]

    title = f"{kw} | {FARM} {BRAND} 파양입소·무료분양"
    if len(title) > 60:
        title = f"{kw} | {FARM} {BRAND}"
    meta_desc = (
        f"{kw} 안내 — {FARM} {BRAND}는 강아지 파양입소와 무료분양을 책임 있게 상담합니다. "
        f"안락사 없는 보호, 새 가족 매칭. 문의 {PHONE}."
    )
    if len(meta_desc) > 160:
        meta_desc = meta_desc[:157] + "..."

    variants = ["차분히", "꼼꼼히", "따뜻하게"]
    tone = variants[idx % len(variants)]
    h2_0 = intro_h2[idx % len(intro_h2)]

    sections = [
        {
            "h2": h2_0,
            "paragraphs": [
                f"{kw}를 검색하셨다면, 가장 먼저 확인할 것은 아이의 안전과 이후 삶의 질입니다. "
                f"{FARM} {BRAND}는 {tone} 파양 상담부터 무료분양 매칭까지 한곳에서 안내합니다.",
                f"직거래·유기 대신 보호소 입소를 선택하시면, 아이가 안정된 환경에서 새 가족을 기다릴 수 있습니다. "
                f"{BRAND}는 안락사 없는 보호를 원칙으로 합니다.",
                f"상담은 전화({PHONE})로 가능합니다. 상황·일정·지역을 말씀해 주시면 "
                f"입소·분양 절차를 차분히 안내드립니다.",
            ],
        },
        {
            "h2": f"{BRAND}가 {kw}에서 지키는 약속",
            "paragraphs": [
                f"투명한 상담, 책임 있는 매칭, 입소 후 근황 안내가 {BRAND}의 기준입니다. "
                f"충동 분양보다 아이와 가정의 궁합을 우선합니다.",
                f"상담 범위는 {LOCATION}입니다. 방문이 어려운 경우 픽업·이동 일정도 함께 조율합니다.",
                f"{kw}로 찾아오신 분이라면, 비용·절차·준비물을 먼저 확인하신 뒤 "
                f"전화 상담을 권합니다. 문의 {PHONE}.",
            ],
        },
        {
            "h2": f"{kw} FAQ와 다음 단계",
            "paragraphs": [
                f"{kw} 상담은 홈페이지 문의 또는 {PHONE} 전화로 가능합니다. "
                f"파양입소·무료분양 모두 같은 번호로 연결됩니다.",
                f"{BRAND}는 좋은 이별과 좋은 만남을 모두 돕습니다. 지금 바로 상담해 주세요.",
            ],
        },
    ]
    faqs = [
        {
            "q": f"{kw} 상담은 어떻게 하나요?",
            "a": f"사이트 하단 문의 또는 {PHONE} 전화로 접수합니다. "
            f"상황·희망 일정을 알려주시면 {BRAND}가 확인 후 안내합니다.",
        },
        {
            "q": f"파양입소와 무료분양 모두 가능한가요?",
            "a": f"네. {BRAND}는 파양입소와 무료분양 매칭을 함께 안내합니다. "
            f"아이 상태와 가정 환경에 맞춰 절차를 안내드립니다.",
        },
        {
            "q": f"{kw} 전국에서 이용할 수 있나요?",
            "a": "전국 상담이 가능합니다. 방문·픽업이 필요한 경우 일정 조율 후 진행합니다. "
            f"문의 {PHONE}.",
        },
        {
            "q": "구름이네 문의 전화번호는?",
            "a": f"{PHONE}입니다. {FARM} {BRAND}로 연락 주시면 됩니다.",
        },
    ]
    now = datetime.utcnow().isoformat() + "Z"
    line2 = line2_opts[idx % len(line2_opts)]
    return {
        "slug": slugify(kw, idx),
        "keyword": kw,
        "title": title,
        "metaDescription": meta_desc,
        "metaKeywords": (
            f"{kw}, 강아지보호소, 구름이네, 강아지파양, 파양입소, "
            f"무료분양, 유기견보호소, 강아지입양, 강아지분양"
        ),
        "h1": f"{kw} — {BRAND} 파양입소·무료분양",
        "heroSubtitle": heroes[idx % len(heroes)],
        "heroBadge": "안락사 없는 보호",
        "heroTitleLine1": kw,
        "heroTitleLine2": line2,
        "heroBar": bar_opts[idx % len(bar_opts)],
        "sections": sections,
        "faqs": faqs,
        "images": image_urls(IMAGE_USE, rng.randint(1, 99999)),
        "ctaText": f"파양입소·무료분양 문의 {PHONE} — {BRAND}",
        "createdAt": now,
        "updatedAt": now,
    }


def write_html(page: Dict[str, Any], site_url: str) -> str:
    imgs = page.get("images") or []
    hero = imgs[0] if imgs else ""
    sections = ""
    for i, sec in enumerate(page["sections"]):
        ps = "".join(f"<p>{p}</p>" for p in sec["paragraphs"])
        sections += f"<section><h2>{sec['h2']}</h2>{ps}</section>"
        if i < 2 and i + 1 < len(imgs):
            sections += (
                f'<figure><img src="{imgs[i+1]}" alt="{page["keyword"]} 보호소 {i+2}" '
                f'loading="lazy"/></figure>'
            )
    faqs = "".join(
        f"<details><summary>{f['q']}</summary><p>{f['a']}</p></details>" for f in page["faqs"]
    )
    url = f"{site_url.rstrip('/')}/guide/{page['slug']}"
    og = hero or ""
    return f"""<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8"/>
<title>{page['title']}</title>
<meta name="description" content="{page['metaDescription']}"/>
<meta name="keywords" content="{page['metaKeywords']}"/>
<link rel="canonical" href="{url}"/>
<meta property="og:type" content="article"/>
<meta property="og:title" content="{page['title']}"/>
<meta property="og:description" content="{page['metaDescription']}"/>
<meta property="og:url" content="{url}"/>
<meta property="og:image" content="{og}"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="{page['title']}"/>
<meta name="twitter:description" content="{page['metaDescription']}"/>
<meta name="twitter:image" content="{og}"/>
</head>
<body>
<header><a href="{site_url}">{SITE_NAME}</a></header>
<article>
<h1>{page['h1']}</h1>
<p>{page['heroSubtitle']}</p>
{sections}
<section><h2>자주 묻는 질문</h2>{faqs}</section>
<p><a href="tel:{PHONE_TEL}">{page['ctaText']}</a></p>
</article>
</body>
</html>"""


def generate_batch(
    keywords: List[str],
    out_dir: str,
    site_url: str,
    sync_public: str = "",
    stop_requested=None,
) -> List[str]:
    os.makedirs(out_dir, exist_ok=True)
    pages_dir = os.path.join(out_dir, "pages")
    os.makedirs(pages_dir, exist_ok=True)
    slugs: List[str] = []
    entries: List[Dict[str, str]] = []
    urls: List[str] = []
    for i, kw in enumerate(keywords, 1):
        if stop_requested and stop_requested():
            break
        page = build_content(kw, i)
        slugs.append(page["slug"])
        entries.append(_page_to_summary(page))
        with open(os.path.join(pages_dir, f"{page['slug']}.json"), "w", encoding="utf-8") as f:
            json.dump(page, f, ensure_ascii=False, indent=2)
        html = write_html(page, site_url)
        with open(os.path.join(out_dir, f"{page['slug']}.html"), "w", encoding="utf-8") as f:
            f.write(html)
        urls.append(f"{site_url.rstrip('/')}/guide/{quote(page['slug'])}")
    if not urls:
        return []
    index = {
        "slugs": slugs,
        "entries": entries,
        "updatedAt": datetime.utcnow().isoformat() + "Z",
    }
    with open(os.path.join(out_dir, "index.json"), "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)
    with open(os.path.join(out_dir, "urls.txt"), "w", encoding="utf-8") as f:
        f.write("\n".join(urls))
    if sync_public:
        pub_pages = os.path.join(sync_public, "pages")
        os.makedirs(pub_pages, exist_ok=True)
        existing: Dict[str, Any] = {"slugs": [], "entries": [], "updatedAt": ""}
        idx_path = os.path.join(sync_public, "index.json")
        if os.path.isfile(idx_path):
            with open(idx_path, encoding="utf-8") as f:
                existing = json.load(f)
        by_slug = {e["slug"]: e for e in (existing.get("entries") or []) if e.get("slug")}
        for slug, entry in zip(slugs, entries):
            if stop_requested and stop_requested():
                break
            src = os.path.join(pages_dir, f"{slug}.json")
            dst = os.path.join(pub_pages, f"{slug}.json")
            with open(src, encoding="utf-8") as f:
                data = f.read()
            with open(dst, "w", encoding="utf-8") as f:
                f.write(data)
            by_slug[slug] = entry
            if slug in existing.get("slugs", []):
                existing["slugs"].remove(slug)
            existing.setdefault("slugs", []).insert(0, slug)
        existing["entries"] = [by_slug[s] for s in existing["slugs"] if s in by_slug]
        existing["updatedAt"] = datetime.utcnow().isoformat() + "Z"
        with open(idx_path, "w", encoding="utf-8") as f:
            json.dump(existing, f, ensure_ascii=False, indent=2)
    return urls
