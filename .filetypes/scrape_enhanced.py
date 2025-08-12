#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Enhanced scraper to extract ALL content from FileInfo HTML pages including:
- More Information section with detailed descriptions
- Common Filenames
- How to Open (detailed)
- How to Convert (detailed with formats)
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
OUT_DIR = ROOT / "out_enhanced"
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

def extract_section_html(soup, section_id):
    """Extract the raw HTML content of a section"""
    section = soup.find("section", id=section_id)
    if section:
        info_box = section.find("div", class_="infoBox")
        if info_box:
            # Get paragraphs and preserve formatting
            return [text(p) for p in info_box.find_all("p")]
    return []

def extract_more_info(soup, ext):
    """Extract the More Information section with detailed descriptions"""
    more_info = {}
    
    # Try to find the More Information section
    section_id = f"microsoft_word_document__legacy__moreinfo"  # This varies by file type
    # Try generic pattern
    for section in soup.find_all("section"):
        if section.get("id") and "moreinfo" in section.get("id", ""):
            info_box = section.find("div", class_="infoBox")
            if info_box:
                paragraphs = []
                for p in info_box.find_all("p"):
                    p_text = text(p)
                    if p_text:
                        paragraphs.append(p_text)
                
                # Extract screenshot info if present
                figure = info_box.find("figure")
                if figure:
                    img = figure.find("img")
                    if img:
                        more_info["screenshot"] = {
                            "url": img.get("src", ""),
                            "alt": img.get("alt", ""),
                            "caption": text(figure.find("figcaption")) if figure.find("figcaption") else ""
                        }
                
                more_info["description"] = paragraphs
                break
    
    return more_info

def extract_common_filenames(soup):
    """Extract common filenames section"""
    filenames = []
    
    for section in soup.find_all("section"):
        if section.get("id") and "filenames" in section.get("id", ""):
            info_box = section.find("div", class_="infoBox")
            if info_box:
                for p in info_box.find_all("p"):
                    # Look for filename spans
                    filename_spans = p.find_all("span", class_="filename")
                    if filename_spans:
                        for span in filename_spans:
                            filename = text(span)
                            # Get the description (rest of the paragraph)
                            desc_text = text(p)
                            if filename and desc_text:
                                filenames.append({
                                    "filename": filename,
                                    "description": desc_text
                                })
                    else:
                        # Sometimes filenames are just in the text
                        p_text = text(p)
                        if p_text and (".doc" in p_text.lower() or "." in p_text):
                            filenames.append({"text": p_text})
            break
    
    return filenames

def extract_how_to_open(soup):
    """Extract detailed How to Open section"""
    how_to_open = {}
    
    for section in soup.find_all("section"):
        if section.get("id") and "__open" in section.get("id", ""):
            info_box = section.find("div", class_="infoBox")
            if info_box:
                paragraphs = []
                for p in info_box.find_all("p"):
                    p_text = text(p)
                    if p_text:
                        paragraphs.append(p_text)
                
                how_to_open["detailed_instructions"] = paragraphs
            break
    
    return how_to_open

def extract_how_to_convert(soup):
    """Extract detailed How to Convert section with format list"""
    how_to_convert = {}
    
    for section in soup.find_all("section"):
        if section.get("id") and "__convert" in section.get("id", ""):
            info_box = section.find("div", class_="infoBox")
            if info_box:
                paragraphs = []
                formats = []
                
                for p in info_box.find_all("p"):
                    p_text = text(p)
                    if p_text:
                        paragraphs.append(p_text)
                
                # Look for list items (conversion formats)
                for li in info_box.find_all("li"):
                    li_text = text(li)
                    if li_text and "." in li_text:
                        # Parse format like ".DOCX - Microsoft Word Document"
                        parts = li_text.split(" - ", 1)
                        if len(parts) == 2:
                            formats.append({
                                "extension": parts[0].strip(),
                                "name": parts[1].strip()
                            })
                        else:
                            formats.append({"text": li_text})
                
                how_to_convert["instructions"] = paragraphs
                how_to_convert["formats"] = formats
            break
    
    return how_to_convert

def extract_programs_enhanced(soup):
    """Extract programs with more detail"""
    programs_by_platform = {}
    
    # Find all platform sections
    for section in soup.find_all("section", class_="apps"):
        platform_label = None
        h4 = section.find("h4")
        if h4:
            platform_label = text(h4)
            platform = detect_platform(platform_label)
            if platform:
                programs = []
                for li in section.find_all("li"):
                    a = li.find("a")
                    if a:
                        display_name = text(a)
                        href = a.get("href", "")
                        software_slug = to_slug(Path(href).stem) if href else to_slug(display_name)
                        
                        # Check for badges (paid, discontinued, etc.)
                        badges = []
                        for badge in li.find_all("span", class_="badge"):
                            badge_text = text(badge)
                            if badge_text:
                                badges.append(badge_text.lower())
                        
                        program_info = {
                            "software": software_slug,
                            "display_name": display_name,
                            "url": href
                        }
                        
                        if "discontinued" in badges:
                            program_info["status"] = "discontinued"
                        if "paid" in badges:
                            program_info["paid"] = True
                            
                        programs.append(program_info)
                
                if programs:
                    programs_by_platform[platform] = programs
    
    return programs_by_platform

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
    
    # Basic info
    title_h2 = soup.select_one(".entryHeader h2.title") or soup.select_one("h2.title") or soup.find("h1")
    name = text(title_h2) or ext.upper() + " File"
    
    # Developer
    developer = None
    for row in soup.select(".entryHeader table.headerInfo tr"):
        tds = row.find_all("td")
        if len(tds) >= 2 and "developer" in text(tds[0]).lower():
            developer = text(tds[1])
    
    # Popularity
    popularity = {}
    rating_el = soup.select_one(".rating .stars")
    if rating_el:
        rating_val = rating_el.get("data-rating")
        if rating_val:
            popularity["rating"] = parse_float(rating_val)
    
    votes_el = soup.select_one(".rating .votes")
    if votes_el:
        votes_text = text(votes_el)
        votes_num = parse_int(votes_text)
        if votes_num:
            popularity["votes"] = votes_num
    
    if popularity:
        popularity["source"] = "fileinfo"
    
    # Summary
    summary = ""
    summary_el = soup.select_one(".entryHeader .description") or soup.select_one(".description")
    if summary_el:
        summary = text(summary_el)
    
    # Extract enhanced content
    more_info = extract_more_info(soup, ext)
    common_filenames = extract_common_filenames(soup)
    how_to_open = extract_how_to_open(soup)
    how_to_convert = extract_how_to_convert(soup)
    programs = extract_programs_enhanced(soup)
    
    # Images
    images = []
    for fig in soup.find_all("figure"):
        img = fig.find("img")
        if img and img.get("src"):
            caption = text(fig.find("figcaption")) if fig.find("figcaption") else ""
            images.append({
                "url": img.get("src"),
                "alt": img.get("alt", ""),
                "caption": caption or img.get("alt", "")
            })
    
    # Build the result
    result = {
        "slug": ext,
        "extension": ext,
        "name": name,
        "category": to_slug(name),
        "summary": summary
    }
    
    if developer:
        result["developer_org"] = to_slug(developer)
        result["developer_name"] = developer
    
    if popularity:
        result["popularity"] = popularity
    
    if more_info:
        result["more_information"] = more_info
    
    if common_filenames:
        result["common_filenames"] = common_filenames
    
    if how_to_open:
        result["how_to_open"] = how_to_open
    
    if how_to_convert:
        result["how_to_convert"] = how_to_convert
    
    if programs:
        result["programs_by_platform"] = programs
    
    if images:
        result["images"] = images
    
    # Metadata
    result["updated_at"] = datetime.date.today().isoformat()
    result["sources"] = [{
        "url": html_path.name,
        "retrieved_at": datetime.date.today().isoformat()
    }]
    
    return result

def main():
    """Process all HTML files"""
    
    html_files = sorted(IN_DIR.glob("*.html"))
    print(f"Found {len(html_files)} HTML files to process")
    
    results = []
    errors = []
    
    for html_path in html_files:
        print(f"Processing {html_path.name}...")
        try:
            result = parse_file(html_path)
            if result:
                results.append(result)
                # Save individual JSON
                json_path = JSON_DIR / f"{result['slug']}.json"
                with open(json_path, "w", encoding="utf-8") as f:
                    f.write(dumps(result))
        except Exception as e:
            print(f"Error processing {html_path}: {e}")
            errors.append({"file": str(html_path), "error": str(e)})
    
    # Save index
    index_path = OUT_DIR / "index_enhanced.json"
    with open(index_path, "w", encoding="utf-8") as f:
        index_data = [{
            "slug": r["slug"],
            "name": r["name"],
            "category": r["category"],
            "popularity": r.get("popularity"),
            "developer_org": r.get("developer_org"),
            "has_more_info": bool(r.get("more_information")),
            "has_conversion": bool(r.get("how_to_convert"))
        } for r in results]
        f.write(dumps(index_data))
    
    print(f"\nProcessed {len(results)} files successfully")
    if errors:
        print(f"Errors: {len(errors)}")
        for err in errors[:5]:
            print(f"  - {err['file']}: {err['error']}")
    
    print(f"\nOutput saved to: {OUT_DIR}")

if __name__ == "__main__":
    main()