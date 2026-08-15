# -*- coding: utf-8 -*-
"""문서 본문 생성 (템플릿) — 제주도감귤농장 뽕순이네.
키워드 전달 시 강아지교배와 동일한 SeoPage 스키마(title/meta/OG/FAQ/hero)로
제주감귤 판매용 상세 페이지를 생성합니다. 이미지는 3장.
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

BRAND = "뽕순이네"
FARM = "제주도감귤농장"
SITE_NAME = "제주도감귤농장 뽕순이네"
PHONE = "010-2374-0401"
LOCATION = "제주특별자치도 서귀포시"
IMAGE_BASE = "https://image.cattery.co.kr/jejumilgam"
IMAGE_COUNT = 13
IMAGE_USE = 3  # 히어로 1 + 본문 2


def _rng(keyword: str, idx: int) -> random.Random:
    seed = int(hashlib.md5(f"{keyword}|{idx}|jm".encode()).hexdigest()[:8], 16)
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
    base = base.strip("-")[:36] or "jejumilgam"
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
    kw = keyword.strip() or "제주도감귤농장"
    heroes = [
        "Farm-Direct Seogwipo Tangerines",
        "100% Seogwipo Orchard · No Box Switch",
        "Harvested Today · Delivered Fresh",
        "Real Origin · Real Sugar Content",
    ]
    line2_opts = [
        "농장에서 직배송",
        "서귀포 산지직송",
        "박스갈이 없는 감귤",
        "당일 선별 발송",
    ]
    bar_opts = [
        "가짜 서귀포 감귤에 속지 마세요",
        "농장주가 직접 포장해 보냅니다",
        "3kg·5kg·10kg 실속 주문 가능",
        "문제 시 100% 환불 보증",
    ]
    intro_h2 = [
        f"{kw}, 왜 농장 직송이어야 할까요",
        f"{kw} 주문 전 꼭 알아둘 점",
        f"진짜 서귀포 맛을 위한 {kw} 안내",
        f"{kw}와 산지직송의 기준",
    ]

    # SEO title / meta — 강아지교배와 동일 패턴
    title = f"{kw} | {FARM} {BRAND} 산지직송"
    if len(title) > 60:
        title = f"{kw} | {FARM} 산지직송"
    meta_desc = (
        f"{kw} 안내 — {FARM} {BRAND}는 서귀포 자체 농장에서 수확한 감귤을 농장주가 직배송합니다. "
        f"박스갈이 없는 100% 서귀포 산지직송. 3kg·5kg·10kg 주문. 문의 {PHONE}."
    )
    if len(meta_desc) > 160:
        meta_desc = meta_desc[:157] + "..."

    variants = ["직접", "꼼꼼히", "정직하게"]
    tone = variants[idx % len(variants)]
    h2_0 = intro_h2[idx % len(intro_h2)]

    sections = [
        {
            "h2": h2_0,
            "paragraphs": [
                f"{kw}를 검색하셨다면, 가장 먼저 확인할 것은 원산지와 유통 경로입니다. "
                f"{FARM} {BRAND}는 제주 서귀포 농장에서 {tone} 수확·선별·포장하여 "
                f"중간 유통 없이 집 앞으로 보냅니다.",
                f"시중에는 타 지역 감귤을 서귀포 박스로만 바꿔 파는 '박스갈이' 피해가 이어지고 있습니다. "
                f"{BRAND}는 농가 직배송만 진행하므로 포장재만 바꾼 가짜 서귀포 감귤과 분명히 다릅니다.",
                f"당도와 신선도는 수확 직후가 가장 좋습니다. 전화({PHONE})로 수량·배송지를 남겨주시면 "
                f"수확 일정에 맞춰 안내드리며, 가정용·선물용 모두 대응합니다.",
            ],
        },
        {
            "h2": f"{BRAND}가 {kw}에서 지키는 판매 원칙",
            "paragraphs": [
                f"100% 서귀포 자체 농장 직영, 박스갈이 절대 불가, 맛·당도 선별이 {BRAND}의 기준입니다. "
                f"{FARM}에서 자란 감귤만 출하합니다.",
                f"농장 위치는 {LOCATION}입니다. 산지 직송 주문이 기본이며, "
                f"문제 발생 시 100% 환불 보증 정책을 운영합니다.",
                f"실속형 3kg, 가정용 5kg, 대용량 10kg, 선물용 세트를 준비했습니다. "
                f"{kw}로 찾아오신 분이라면 유통 마진이 아닌 수확 당일의 맛으로 비교해 보세요.",
            ],
        },
        {
            "h2": f"{kw} 주문 방법과 다음 단계",
            "paragraphs": [
                f"{kw} 주문은 홈페이지 간편 신청 또는 {PHONE} 전화로 가능합니다. "
                f"이름·연락처·주소·수량을 남겨주시면 농장에서 확인 후 연락드립니다.",
                f"{BRAND}는 정직한 산지 표기와 농장주 직배송으로 신뢰를 쌓습니다. "
                f"진짜 서귀포 감귤이 필요하시다면 지금 바로 주문해 주세요.",
            ],
        },
    ]
    faqs = [
        {
            "q": f"{kw} 주문은 어떻게 하나요?",
            "a": f"사이트 하단 간편 주문 신청 또는 {PHONE} 전화로 접수합니다. "
            f"상품(3kg·5kg·10kg·선물용)·수량·배송지를 알려주시면 {BRAND}가 확인 후 안내합니다.",
        },
        {
            "q": f"박스갈이 없는 {kw}인지 어떻게 확인하나요?",
            "a": f"{BRAND}는 서귀포 자체 농장에서 직접 포장·발송합니다. "
            f"중간 유통을 거치지 않으며 산지직송 보증·문제 시 환불 정책을 적용합니다.",
        },
        {
            "q": f"{kw} 배송은 얼마나 걸리나요?",
            "a": "수확·선별 일정에 따라 달라지며, 주문 접수 후 전화로 출고 예정일을 안내드립니다. "
            "신선도를 위해 당일·익일 출고를 원칙으로 합니다.",
        },
        {
            "q": "제주도감귤농장 문의 전화번호는?",
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
            f"{kw}, 제주도감귤농장, 서귀포감귤, 감귤직송, 감귤판매, 뽕순이네, "
            f"박스갈이, 산지직송, 제주감귤, 밀감"
        ),
        "h1": f"{kw} — {BRAND} 서귀포 산지직송 감귤",
        "heroSubtitle": heroes[idx % len(heroes)],
        "heroBadge": "100% 서귀포 산지직송",
        "heroTitleLine1": kw,
        "heroTitleLine2": line2,
        "heroBar": bar_opts[idx % len(bar_opts)],
        "sections": sections,
        "faqs": faqs,
        "images": image_urls(IMAGE_USE, rng.randint(1, 99999)),
        "ctaText": f"감귤 주문 문의 {PHONE} — {BRAND}",
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
                f'<figure><img src="{imgs[i+1]}" alt="{page["keyword"]} 감귤 {i+2}" '
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
<p><a href="tel:01023740401">{page['ctaText']}</a></p>
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
        existing["entries"] = [
            by_slug[s] for s in existing["slugs"] if s in by_slug
        ] + [e for s, e in by_slug.items() if s not in existing["slugs"]]
        # entries 순서를 slugs 기준으로
        existing["entries"] = [by_slug[s] for s in existing["slugs"] if s in by_slug]
        existing["updatedAt"] = datetime.utcnow().isoformat() + "Z"
        with open(idx_path, "w", encoding="utf-8") as f:
            json.dump(existing, f, ensure_ascii=False, indent=2)
    return urls
