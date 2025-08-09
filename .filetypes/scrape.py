import re
from collections import defaultdict
from bs4 import BeautifulSoup

PLATFORM_ALIASES = {
  "windows": ["Windows","Win","Win32","Win64"],
  "macos":   ["macOS","Mac OS X","Mac","OS X"],
  "linux":   ["Linux","GNU/Linux"],
  "android": ["Android"],
  "ios":     ["iOS","iPhone","iPad","iPadOS"],
  "web":     ["Web","Browser","Online"]
}

def norm_platform(label: str) -> str | None:
    if not label: return None
    s = label.strip()
    for key, vals in PLATFORM_ALIASES.items():
        if any(v.lower() in s.lower() for v in vals):
            return key
    return None

def parse_programs(soup: BeautifulSoup):
    """
    Returns:
      programs_by_platform: {platform: [{software, pricing?, status?}]}
      raw_html: str  # the HTML we harvested, for auditing
    """
    programs_by_platform = defaultdict(list)

    # 1) Find the container. Prefer an anchor section whose id ends with _apps
    #    (FileInfo uses <section id="..._apps"> Program List)
    apps_sections = soup.select('section[id$="_apps"], div[id$="_apps"]')
    if not apps_sections:
        # Fallback: find any h3 that says "Programs that open"
        h3s = [h for h in soup.find_all(["h2","h3"]) if "Programs that open" in h.get_text(" ", strip=True)]
        for h in h3s:
            # Grab the following siblings up to the next big heading
            chunk = []
            for sib in h.next_siblings:
                if getattr(sib, "name", None) in ("h2","h3"):
                    break
                chunk.append(str(sib))
            if chunk:
                holder = soup.new_tag("div")
                holder.append(BeautifulSoup("".join(chunk), "lxml"))
                apps_sections.append(holder)

    # Aggregate raw html for audit/debug
    raw_html_parts = [str(sec) for sec in apps_sections]
    raw_html = "\n".join(raw_html_parts)

    # 2) Try several list/table shapes

    def add_program(platform, name, pricing=None, status=None):
        if not name: return
        p = norm_platform(platform) if platform else None
        entry = {"software": re.sub(r"\s+", " ", name).strip()}
        if pricing: entry["pricing"] = pricing.strip().lower()
        if status:  entry["status"]  = status.strip().lower()
        if p:
            programs_by_platform[p].append(entry)
        else:
            # Unknown platform: put under 'web' only if name hints browser,
            # otherwise bucket under 'windows' as a conservative default.
            default = "web" if any(k in name.lower() for k in ["online","web","browser"]) else "windows"
            programs_by_platform[default].append(entry)

    for sec in apps_sections:
        sec_soup = BeautifulSoup(str(sec), "lxml")

        # a) Table layout with columns Program | Platform | Pricing | Status
        tables = sec_soup.select("table, .programs table")
        for tbl in tables:
            # header map
            headers = [th.get_text(" ", strip=True).lower() for th in tbl.select("thead th")] \
                      or [th.get_text(" ", strip=True).lower() for th in tbl.select("tr th")]
            for tr in tbl.select("tbody tr") or tbl.select("tr"):
                tds = tr.find_all(["td","th"])
                if not tds: continue
                if headers and len(headers) == len(tds):
                    d = {headers[i]: tds[i].get_text(" ", strip=True) for i in range(len(tds))}
                    add_program(
                        d.get("platform") or d.get("os") or "",
                        d.get("program name") or d.get("program") or d.get("application") or tds[0].get_text(" ", strip=True),
                        d.get("pricing"),
                        d.get("status"),
                    )
                else:
                    # heuristic: [Program, Platform, Pricing, Status] in order
                    name = tds[0].get_text(" ", strip=True)
                    plat = tds[1].get_text(" ", strip=True) if len(tds) > 1 else ""
                    price = tds[2].get_text(" ", strip=True) if len(tds) > 2 else ""
                    stat  = tds[3].get_text(" ", strip=True) if len(tds) > 3 else ""
                    if name:
                        add_program(plat, name, price, stat)

        # b) Grouped lists per platform, e.g. <h4>Windows</h4><ul><li>App…</li></ul>
        for h in sec_soup.select("h4, h5"):
            plat = norm_platform(h.get_text(" ", strip=True))
            if not plat: continue
            ul = h.find_next_sibling(["ul","ol"])
            if not ul: continue
            for li in ul.find_all("li", recursive=False):
                # app name often in <a>
                a = li.find("a")
                name = a.get_text(" ", strip=True) if a else li.get_text(" ", strip=True)
                # pricing/status hints in small/spans
                small = li.find("small")
                price = None
                stat  = None
                if small:
                    txt = small.get_text(" ", strip=True).lower()
                    if any(k in txt for k in ["free","trial","paid","commercial"]):
                        price = ("free" if "free" in txt else
                                 "free+" if "trial" in txt or "demo" in txt else
                                 "paid")
                    if "discontinued" in txt: stat = "discontinued"
                add_program(plat, name, price, stat)

        # c) Flat list with badges (common on mobile)
        for li in sec_soup.select("li.program, .programs li, ul.apps li"):
            name = li.get_text(" ", strip=True)
            plat = ""
            badge = li.find(class_=re.compile(r"platform|badge", re.I))
            if badge:
                plat = badge.get_text(" ", strip=True)
            price = None
            if re.search(r"\bfree\b", name, re.I): price = "free"
            add_program(plat, name, price)

        # d) Cards
        for card in sec_soup.select(".program-card, .app-card"):
            name = card.select_one(".name, .title, a")
            plat = card.select_one(".platform, .os")
            price = card.select_one(".pricing, .price, .license")
            stat  = card.select_one(".status")
            add_program(
                plat.get_text(" ", strip=True) if plat else "",
                name.get_text(" ", strip=True) if name else card.get_text(" ", strip=True),
                price.get_text(" ", strip=True) if price else None,
                stat.get_text(" ", strip=True) if stat else None
            )

    # Deduplicate while preserving order
    deduped = {}
    for plat, arr in programs_by_platform.items():
        seen = set()
        out = []
        for p in arr:
            key = (p["software"].lower(), p.get("pricing"), p.get("status"))
            if key in seen: continue
            seen.add(key)
            out.append(p)
        deduped[plat] = out

    return deduped, raw_html