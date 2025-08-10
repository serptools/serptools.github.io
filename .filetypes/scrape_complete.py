#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Complete scraper that extracts ALL data from FileInfo HTML pages
"""

import re, json, sys, os, traceback, datetime, glob
from pathlib import Path
from bs4 import BeautifulSoup

try:
    import orjson as jsonlib
    def dumps(obj): return jsonlib.dumps(obj, option=jsonlib.OPT_INDENT_2).decode()
except Exception:
    import json as jsonlib
    def dumps(obj): return jsonlib.dumps(obj, indent=2, ensure_ascii=False)

ROOT = Path(__file__).resolve().parent
IN_DIR = ROOT / "extension"
OUT_DIR = ROOT / "out_complete"
JSON_DIR = OUT_DIR / "json"
OUT_DIR.mkdir(parents=True, exist_ok=True)
JSON_DIR.mkdir(parents=True, exist_ok=True)

def get_soup(html: str):
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

def extract_summary(soup):
    """Extract the 'What is a X file?' summary"""
    # Look for the specific summary section
    summary_sections = soup.find_all("h3", string=re.compile(r"What is a.*file\?", re.I))
    for h3 in summary_sections:
        # Get the next sibling div with infoBox class
        next_sibling = h3.find_next_sibling("div", class_="infoBox")
        if next_sibling:
            p = next_sibling.find("p")
            if p:
                return text(p)
    return ""

def extract_header_info(soup):
    """Extract all header information including format type, MIME type, etc."""
    header_info = {}
    
    # Find the header info table
    header_table = soup.select_one(".entryHeader table.headerInfo")
    if header_table:
        for row in header_table.find_all("tr"):
            tds = row.find_all("td")
            if len(tds) >= 2:
                label = text(tds[0]).lower()
                value = text(tds[1])
                
                if "developer" in label:
                    header_info["developer"] = value
                elif "category" in label:
                    header_info["category"] = value
                elif "format" in label:
                    header_info["format_type"] = value
                elif "mime" in label:
                    header_info["mime_type"] = value
                elif "magic" in label:
                    header_info["magic_number"] = value
                elif "popularity" in label:
                    # Extract rating and votes
                    rating_span = row.find("span", class_="rtg")
                    if rating_span:
                        # Get the class that indicates the rating (e.g., "four" = 4 stars)
                        classes = rating_span.get("class", [])
                        for cls in classes:
                            if cls in ["one", "two", "three", "four", "five"]:
                                rating_map = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5}
                                header_info["rating"] = rating_map.get(cls, 0)
                    
                    vote_avg = row.find("span", class_="voteavg")
                    if vote_avg:
                        header_info["rating_avg"] = parse_float(text(vote_avg))
                    
                    vote_total = row.find("span", class_="votetotal")
                    if vote_total:
                        header_info["votes"] = parse_int(text(vote_total))
    
    # Get category from footer if not in header
    if "category" not in header_info:
        footer = soup.find("footer", class_="ftfooter")
        if footer:
            cat_span = footer.find("span")
            if cat_span:
                cat_link = cat_span.find("a")
                if cat_link:
                    header_info["category"] = text(cat_link)
    
    # Get updated date
    updated_div = soup.find("div", class_="upDate")
    if updated_div:
        date_text = text(updated_div).replace("Updated:", "").strip()
        header_info["last_updated"] = date_text
    
    return header_info

def extract_programs_complete(soup):
    """Extract complete program information with all details"""
    programs_by_platform = {}
    
    # Find the programs section
    programs_section = soup.find("section", id=re.compile(r".*_apps"))
    if not programs_section:
        # Try the programsBox
        programs_box = soup.find("div", class_="programsBox")
        if programs_box:
            # Find all platform sections
            for platform_div in programs_box.find_all("div", class_="programs"):
                platform_attr = platform_div.get("data-plat", "")
                platform_name = None
                
                # Map platform codes to names
                plat_map = {
                    "win": "windows",
                    "mac": "macos", 
                    "lin": "linux",
                    "and": "android",
                    "ios": "ios",
                    "web": "web",
                    "cos": "chromeos"
                }
                
                platform_name = plat_map.get(platform_attr, platform_attr)
                
                if platform_name:
                    programs = []
                    
                    # Find all apps in this platform
                    for app_div in platform_div.find_all("div", class_="app"):
                        program_info = {}
                        
                        # Get program name and link
                        program_div = app_div.find("div", class_="program")
                        if program_div:
                            link = program_div.find("a")
                            if link:
                                program_info["name"] = text(link)
                                program_info["url"] = link.get("href", "")
                                
                                # Check for external link
                                if program_div.find("div", class_="external"):
                                    program_info["external"] = True
                                
                                # Check for discontinued
                                if "discontinued" in text(program_div).lower():
                                    program_info["status"] = "discontinued"
                        
                        # Get license info
                        license_span = app_div.find("span", class_="license")
                        if license_span:
                            license_text = text(license_span)
                            if "included" in license_text.lower() or "bundled" in license_text.lower():
                                program_info["license"] = "bundled"
                            elif "free" in license_text.lower():
                                if "+" in license_text or "iap" in license_span.get("class", []):
                                    program_info["license"] = "freemium"
                                else:
                                    program_info["license"] = "free"
                            elif "paid" in license_text.lower():
                                program_info["license"] = "paid"
                            else:
                                program_info["license"] = license_text
                        
                        # Get icon URL
                        icon_div = app_div.find("div", class_="appIcon")
                        if icon_div:
                            # Check data-bg attribute for icon URL
                            icon_url = icon_div.get("data-bg", "")
                            if icon_url:
                                program_info["icon"] = icon_url
                        
                        if program_info.get("name"):
                            programs.append(program_info)
                    
                    if programs:
                        programs_by_platform[platform_name] = programs
    
    return programs_by_platform

def extract_more_information(soup):
    """Extract the More Information section completely"""
    more_info = {}
    
    # Find More Information section by heading
    more_heading = soup.find("h3", string=re.compile(r"More Information", re.I))
    if more_heading:
        # Get the parent section
        parent_section = more_heading.find_parent("section")
        if parent_section:
            info_box = parent_section.find("div", class_="infoBox")
            if info_box:
                # Extract all paragraphs
                paragraphs = []
                for p in info_box.find_all("p"):
                    p_text = text(p)
                    if p_text:
                        paragraphs.append(p_text)
                
                if paragraphs:
                    more_info["content"] = paragraphs
                
                # Extract screenshot if present
                figure = info_box.find("figure")
                if figure:
                    img = figure.find("img")
                    if img:
                        more_info["screenshot"] = {
                            "url": img.get("src", ""),
                            "srcset": img.get("srcset", ""),
                            "alt": img.get("alt", ""),
                            "width": img.get("width", ""),
                            "height": img.get("height", ""),
                            "caption": text(figure.find("figcaption")) if figure.find("figcaption") else ""
                        }
    
    return more_info

def extract_how_to_open(soup):
    """Extract complete How to Open section"""
    how_to_open = {}
    
    # Find How to open section
    open_heading = soup.find("h3", string=re.compile(r"How to open", re.I))
    if open_heading:
        parent_section = open_heading.find_parent("section")
        if parent_section:
            info_box = parent_section.find("div", class_="infoBox")
            if info_box:
                # Get all content
                content = []
                for p in info_box.find_all("p"):
                    p_text = text(p)
                    if p_text:
                        content.append(p_text)
                
                # Get list of programs if present
                programs = []
                for ul in info_box.find_all("ul"):
                    for li in ul.find_all("li"):
                        link = li.find("a")
                        if link:
                            programs.append({
                                "name": text(link),
                                "url": link.get("href", "")
                            })
                        else:
                            li_text = text(li)
                            if li_text:
                                programs.append({"name": li_text})
                
                if content:
                    how_to_open["instructions"] = content
                if programs:
                    how_to_open["programs"] = programs
    
    return how_to_open

def parse_file(html_path: Path):
    """Parse a single HTML file and extract ALL information"""
    
    ext = html_path.stem.lower()
    
    try:
        with open(html_path, "r", encoding="utf-8") as f:
            html = f.read()
    except Exception as e:
        print(f"Error reading {html_path}: {e}")
        return None
    
    soup = get_soup(html)
    
    # Extract title
    title_h2 = soup.select_one(".entryHeader h2.title")
    name = text(title_h2) if title_h2 else f"{ext.upper()} File"
    
    # Extract all header information
    header_info = extract_header_info(soup)
    
    # Extract summary (What is a X file?)
    summary = extract_summary(soup)
    
    # Extract complete sections
    more_information = extract_more_information(soup)
    how_to_open = extract_how_to_open(soup)
    programs = extract_programs_complete(soup)
    
    # Build the result
    result = {
        "slug": ext,
        "extension": ext,
        "name": name,
        "summary": summary
    }
    
    # Add header info
    if header_info.get("developer"):
        result["developer"] = header_info["developer"]
        result["developer_slug"] = to_slug(header_info["developer"])
    
    if header_info.get("category"):
        result["category"] = header_info["category"]
        result["category_slug"] = to_slug(header_info["category"])
    
    if header_info.get("format_type"):
        result["format_type"] = header_info["format_type"]
    
    if header_info.get("mime_type"):
        result["mime_type"] = header_info["mime_type"]
    
    if header_info.get("magic_number"):
        result["magic_number"] = header_info["magic_number"]
    
    if header_info.get("rating_avg"):
        result["rating"] = header_info["rating_avg"]
    
    if header_info.get("votes"):
        result["votes"] = header_info["votes"]
    
    if header_info.get("last_updated"):
        result["last_updated"] = header_info["last_updated"]
    
    # Add content sections
    if more_information:
        result["more_information"] = more_information
    
    if how_to_open:
        result["how_to_open"] = how_to_open
    
    if programs:
        result["programs"] = programs
    
    # Add metadata
    result["scraped_at"] = datetime.datetime.now().isoformat()
    result["source"] = {
        "url": f"https://fileinfo.com/extension/{ext}",
        "file": html_path.name
    }
    
    return result

def main():
    """Process all HTML files"""
    
    # Common file types to process
    common_extensions = [
        'doc', 'docx', 'pdf', 'txt', 'rtf', 'odt', 'xls', 'xlsx', 'ods', 'csv',
        'ppt', 'pptx', 'odp', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp',
        'mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'mp3', 'wav', 'flac', 'aac',
        'ogg', 'wma', 'zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'exe', 'dmg',
        'pkg', 'deb', 'rpm', 'apk', 'html', 'htm', 'css', 'js', 'json', 'xml',
        'php', 'py', 'java', 'cpp', 'c', 'h', 'cs', 'swift', 'go', 'rs',
        'rb', 'pl', 'sh', 'bat', 'ps1', 'sql', 'db', 'sqlite', 'psd', 'ai',
        'eps', 'indd', 'sketch', 'fig', 'xd', 'iso', 'img', 'vmdk', 'vdi',
        'md', 'rst', 'tex', 'log', 'ini', 'cfg', 'conf', 'yaml', 'yml', 'toml'
    ]
    
    results = []
    errors = []
    processed = 0
    
    for ext_name in common_extensions:
        html_path = IN_DIR / f"{ext_name}.html"
        if html_path.exists():
            print(f"Processing {html_path.name}...")
            try:
                result = parse_file(html_path)
                if result:
                    results.append(result)
                    # Save individual JSON
                    json_path = JSON_DIR / f"{result['slug']}.json"
                    with open(json_path, "w", encoding="utf-8") as f:
                        f.write(dumps(result))
                    processed += 1
            except Exception as e:
                print(f"  ✗ Error: {e}")
                errors.append({"file": str(html_path), "error": str(e)})
        else:
            print(f"  - {ext_name}.html not found")
    
    print(f"\nProcessed {processed}/{len(common_extensions)} files successfully")
    if errors:
        print(f"Errors: {len(errors)}")
        for err in errors:
            print(f"  - {err['file']}: {err['error']}")
    
    print(f"\nOutput saved to: {OUT_DIR}")
    
    # Show sample output
    if results:
        print(f"\nSample output for {results[0]['slug']}:")
        sample = results[0]
        print(f"  Name: {sample.get('name')}")
        print(f"  Summary: {sample.get('summary', '')[:100]}...")
        print(f"  Developer: {sample.get('developer', 'N/A')}")
        print(f"  Category: {sample.get('category', 'N/A')}")
        print(f"  Rating: {sample.get('rating', 'N/A')} ({sample.get('votes', 0)} votes)")
        print(f"  Programs: {len(sample.get('programs', {}))} platforms")

if __name__ == "__main__":
    main()