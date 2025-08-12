#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Scrape FileInfo-like HTML pages into the exact JSON shape requested
(e.g., the EML example). Robust to minor DOM differences.
"""

import re, json, sys, os, traceback, datetime, glob
from pathlib import Path

try:
    import orjson as jsonlib
    def dumps(obj): return jsonlib.dumps(obj, option=jsonlib.OPT_INDENT_2).decode()
    def dumpnl(obj): return jsonlib.dumps(obj).decode()
except Exception:
    import json as jsonlib
    def dumps(obj): return jsonlib.dumps(obj, indent=2, ensure_ascii=False)
    def dumpnl(obj): return jsonlib.dumps(obj, ensure_ascii=False)

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent
IN_DIR = ROOT / "extension"
OUT_DIR = ROOT / "out"
JSON_DIR = OUT_DIR / "json"
OUT_DIR.mkdir(parents=True, exist_ok=True)
JSON_DIR.mkdir(parents=True, exist_ok=True)

def get_soup(html: str):
    # prefer lxml if installed; fall back silently
    try:
        return BeautifulSoup(html, "lxml")
    except Exception:
        return BeautifulSoup(html, "html.parser")

def text(el):
    return re.sub(r'\s+', ' ', el.get_text(" ", strip=True)) if el else ""

def to_slug(s):
    s = (s or "").strip().lower()
    s = re.sub(r'[^a-z0-9._+-]+','-', s)
    return s.strip('-')

def parse_float(s):
    try: return float(re.findall(r'[\d.]+', s)[0])
    except: return None

def parse_int(s):
    try: return int(re.findall(r'\d+', s)[0])
    except: return None

PLAT_KEYS = ["windows","macos","linux","android","ios","ipad","web","chromeos"]

def detect_platform(label):
    if not label: return None
    l = label.lower()
    if "windows" in l: return "windows"
    if "mac" in l or "macos" in l or "os x" in l: return "macos"
    if "linux" in l: return "linux"
    if "android" in l: return "android"
    if "ios" in l or "iphone" in l: return "ios"
    if "ipad" in l or "ipados" in l: return "ios"
    if "chrome" in l: return "chromeos"
    if "web" in l or "browser" in l: return "web"
    return None

def extract_schema_jsonld(soup):
    # FileInfo pages often include an Article JSON-LD with dates, image, etc.
    for tag in soup.select('script[type="application/ld+json"]'):
        try:
            data = json.loads(tag.string or "{}")
        except Exception:
            continue
        # sometimes it’s an array
        if isinstance(data, list):
            for item in data:
                if isinstance(item, dict) and item.get("@type") in ("Article","TechArticle","WebPage"):
                    return item
        elif isinstance(data, dict) and data.get("@type") in ("Article","TechArticle","WebPage"):
            return data
    return {}

def extract_core(soup, html_path):
    # extension from filename
    ext = Path(html_path).stem.lower()

    # canonical URL
    canonical = soup.find("link", rel="canonical")
    canonical_url = canonical["href"] if canonical and canonical.has_attr("href") else None

    # first “title” in header
    title_h2 = soup.select_one(".entryHeader h2.title") or soup.select_one("h2.title") or soup.find("h1")
    name = text(title_h2) or ext.upper() + " File"

    # Developer
    developer = None
    for row in soup.select(".entryHeader table.headerInfo tr"):
        tds = row.find_all("td")
        if len(tds) >= 2 and "developer" in text(tds[0]).lower():
            developer = text(tds[1])
            break

    # Popularity rating/votes
    voteavg = soup.select_one(".entryHeader .popularity .voteavg")
    votetotal = soup.select_one(".entryHeader .popularity .votetotal")
    popularity = None
    if voteavg or votetotal:
        popularity = {
            "rating": parse_float(text(voteavg) or "") or 0.0,
            "votes": parse_int(text(votetotal) or "") or 0,
            "source": "fileinfo"
        }

    # Summary: first infoBox paragraph in the top overview section
    # Try the first visible infoBox paragraph anywhere as fallback
    summary = None
    info_p = soup.select_one(".infoBox p")
    if info_p:
        summary = text(info_p)

    # MIME types: look for “MIME” words or meta
    # FileInfo often doesn’t list explicit MIME on every page. We’ll look for "MIME" labels.
    mime_types = set()
    for row in soup.select("table.headerInfo tr"):
        tds = row.find_all("td")
        if len(tds) >= 2 and "mime" in text(tds[0]).lower():
            # split by comma/space/semicolon
            for part in re.split(r'[,\s;]+', text(tds[1])):
                if '/' in part:
                    mime_types.add(part.lower())
    # Also scan page text for common MIME patterns (conservative)
    for m in re.findall(r'\b[a-z0-9.+-]+/[a-z0-9.+-]+\b', soup.get_text(" ", strip=True), flags=re.I):
        # keep a small set (don’t flood with false positives)
        if len(mime_types) < 5:
            mime_types.add(m.lower())

    # Related extensions: look for internal links like /extension/xxx
    related_types = set()
    for a in soup.find_all("a", href=True):
        href = a["href"]
        m = re.match(r'^/extension/([a-z0-9._+-]+)$', href, re.I)
        if m:
            rel_ext = m.group(1).lower()
            if rel_ext != ext:
                related_types.add(rel_ext)

    # Programs that open… (group by platform)
    programs_by_platform = {}
    # The sections are typically under a “Programs that open X files” heading
    # Then lists grouped under toggles/menus. We’ll collect any lists we find.
    # Heuristics:
    # - find any heading containing “Programs that open”
    # - then find sibling lists/cards until next main heading
    headings = [h for h in soup.find_all(re.compile('^h[2-4]$'))
                if "programs that open" in text(h).lower()]
    blocks = []
    if headings:
        start = headings[0]
        # gather up to the next h2
        for sib in start.find_all_next():
            if sib.name in ("h2",) and sib is not start:
                break
            blocks.append(sib)

    # alternate: pages sometimes repeat sections; also capture any obvious program list containers
    blocks += soup.select(".programsheading, .programs, .programslist, .programslistitem")

    # Find program entries inside blocks
    # Program entries often include program name and platform badges/labels
    def push_prog(platform, name, pricing=None, store=None, status=None):
        if not platform or not name:
            return
        arr = programs_by_platform.setdefault(platform, [])
        rec = {"software": to_slug(name), "display_name": name}
        if pricing: rec["pricing"] = pricing
        if store: rec["store"] = store
        if status: rec["status"] = status
        # avoid dupes by display_name
        if not any(p.get("display_name")==name for p in arr):
            arr.append(rec)

    for blk in blocks:
        # detect a platform context from nearby labels
        plat_ctx = None
        # look for nearby text like "Windows" / "Mac" / "Linux"
        label = text(blk)
        for token in ("Windows","Mac","macOS","Linux","Android","iOS","ChromeOS","Web"):
            if token.lower() in label.lower():
                plat_ctx = detect_platform(token)
                break

        # individual items
        for item in blk.select(".programslistitem, .program, li"):
            name_el = (item.select_one(".program") or
                       item.select_one(".name") or
                       item.find("a") or
                       item.find("span"))
            pname = text(name_el)
            if not pname:
                continue

            # platform badges inside item
            plats = set()
            for badge in item.find_all(True):
                plat = detect_platform(badge.get("data-platform") or badge.get("title") or badge.get("aria-label") or text(badge))
                if plat:
                    plats.add(plat)
            if not plats and plat_ctx:
                plats.add(plat_ctx)
            if not plats:
                # default bucket if nothing found
                plats.add("windows")

            # crude pricing/status detection
            pricing = None
            s = text(item).lower()
            if "free+" in s or "free + in-app" in s:
                pricing = "free+"
            elif "free" in s:
                pricing = "free"
            elif "paid" in s or "commercial" in s:
                pricing = "paid"

            status = "discontinued" if "discontinued" in s else None
            store = None

            for plat in plats:
                push_prog(plat, pname, pricing=pricing, store=store, status=status)

    # Images/screenshots
    images = []
    # JSON-LD often has an image array
    schema = extract_schema_jsonld(soup)
    if schema:
        img = schema.get("image")
        if isinstance(img, dict) and "url" in img:
            images.append({
                "caption": img.get("caption") or "",
                "alt": img.get("caption") or "",
                "source_url": img["url"]
            })
        elif isinstance(img, list):
            for obj in img:
                if isinstance(obj, dict) and "url" in obj:
                    images.append({
                        "caption": obj.get("caption") or "",
                        "alt": obj.get("caption") or "",
                        "source_url": obj["url"]
                    })

    # updated_at
    updated_at = None
    for key in ("dateModified","dateUpdated"):
        if schema.get(key):
            updated_at = schema[key]
            break

    # category — FileInfo has multiple variants per extension; we’ll classify lightly
    # If the left nav (PAGE CONTENTS) first item text is present, we’ll derive a category-ish token.
    category = None
    nav_first = soup.select_one("nav.filetype_nav ol li .ftype")
    if nav_first:
        category = to_slug(text(nav_first))

    # developer_org slug
    developer_org = to_slug(developer) if developer else None

    # build record
    rec = {
        "slug": ext,
        "extension": ext,
        "name": name,
        "category": category,
        "developer_org": developer_org,
        "popularity": popularity or {"rating": 0.0, "votes": 0, "source": "fileinfo"},
        "summary": summary,
        "standards": [],  # rarely present on these pages; you can enrich later
        "mime_types": sorted(mime_types),
        "related_types": sorted(related_types),
        "how_to": {
            "save_as": [],
            "open": [],
            "convert": []
        },
        "programs_by_platform": programs_by_platform,
        "images": images,
        "verification": {
            "verified_by": "fileinfo",
            "verification_note": "Parsed from downloaded FileInfo page."
        },
        "updated_at": updated_at,
        "sources": ([{"url": canonical_url, "retrieved_at": datetime.date.today().isoformat()}]
                    if canonical_url else [])
    }

    # Minimal “open” note (we can’t perfectly step-extract across all pages)
    if summary:
        rec["how_to"]["open"].append({
            "mode": "native",
            "note": "Open with an associated app listed below.",
            "apps": []
        })

    return rec

def main():
    html_files = sorted(glob.glob(str(IN_DIR / "*.html")))
    if not html_files:
        print(f"No HTML files found in {IN_DIR}")
        sys.exit(1)

    index = []
    ndjson_lines = []

    for path in html_files:
        try:
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                html = f.read()
            soup = get_soup(html)
            rec = extract_core(soup, path)
            # write per-file
            out_path = JSON_DIR / f"{rec['extension']}.json"
            with open(out_path, "w", encoding="utf-8") as f:
                f.write(dumps(rec))
            # index-light
            index.append({
                "slug": rec["slug"],
                "name": rec["name"],
                "category": rec["category"],
                "popularity": rec["popularity"],
                "updated_at": rec["updated_at"]
            })
            ndjson_lines.append(dumpnl(rec))
            print(f"OK  {Path(path).name} -> {out_path.name}")
        except Exception as e:
            print(f"ERR {Path(path).name}: {e}")
            traceback.print_exc(limit=1)

    with open(OUT_DIR / "index.json", "w", encoding="utf-8") as f:
        f.write(dumps(sorted(index, key=lambda r: r["slug"])))

    with open(OUT_DIR / "filetypes.ndjson", "w", encoding="utf-8") as f:
        f.write("\n".join(ndjson_lines))

    print(f"\nWrote {len(index)} records to {OUT_DIR}/")

if __name__ == "__main__":
    main()