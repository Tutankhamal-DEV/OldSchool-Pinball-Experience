"""
Content Audit: oldschoolpinball.com vs local project
Scrapes production site images & texts, then compares with src/ files.
"""

import re
import json
import os
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

PROJECT_SRC = Path(r"c:\work_files\development\react\oldschoolpinball\src")
PROJECT_PUBLIC = Path(r"c:\work_files\development\react\oldschoolpinball\public")

PAGES = {
    "Home": "https://oldschoolpinball.com",
    "American Bar": "https://oldschoolpinball.com/american-bar",
    "Máquinas": "https://oldschoolpinball.com/maquinas",
    "Mídia": "https://oldschoolpinball.com/na-midia",
    "Ingressos": "https://oldschoolpinball.com/ingressos",
}


# ── 1. HTML Parser to extract images & text ──────────────────────────────
class ContentExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.images = []        # (src, alt)
        self.texts = []         # visible text snippets
        self._skip = False
        self._skip_tags = {"script", "style", "noscript", "svg", "path"}

    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        if tag in self._skip_tags:
            self._skip = True
        if tag == "img":
            src = d.get("src", d.get("data-src", ""))
            alt = d.get("alt", "")
            if src:
                self.images.append((src, alt))
        if tag == "video":
            poster = d.get("poster", "")
            src = d.get("src", "")
            if poster:
                self.images.append((poster, "video-poster"))
            if src:
                self.images.append((src, "video-src"))
        if tag == "source":
            src = d.get("src", d.get("srcset", ""))
            if src:
                self.images.append((src, "source"))

    def handle_endtag(self, tag):
        if tag in self._skip_tags:
            self._skip = False

    def handle_data(self, data):
        if self._skip:
            return
        text = data.strip()
        if text and len(text) > 2:
            self.texts.append(text)


def fetch_html(url):
    """Download raw HTML from a URL."""
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    })
    with urllib.request.urlopen(req, timeout=15) as resp:
        return resp.read().decode("utf-8", errors="replace")


# ── 2. Scan local project for used content ───────────────────────────────
def scan_local_project():
    """Search all .tsx/.ts/.css files for image refs and text strings."""
    local_images = set()
    local_texts = []

    exts = {".tsx", ".ts", ".css", ".html"}
    for f in PROJECT_SRC.rglob("*"):
        if f.suffix not in exts:
            continue
        try:
            content = f.read_text(encoding="utf-8", errors="replace")
        except Exception:
            continue
        # Find image references
        for m in re.finditer(r'(?:src|href|url)\s*[=\(]\s*["\']([^"\']+\.(jpg|jpeg|png|gif|svg|webp|avif))', content, re.I):
            local_images.add(m.group(1))
        # Find quoted strings (potential text content)
        for m in re.finditer(r"['\"]([^'\"]{10,})['\"]", content):
            local_texts.append(m.group(1))

    # Also check public/images
    local_public_images = set()
    img_dir = PROJECT_PUBLIC / "images"
    if img_dir.exists():
        for f in img_dir.iterdir():
            if f.is_file():
                local_public_images.add(f.name)

    return local_images, local_texts, local_public_images


# ── 3. Main audit ────────────────────────────────────────────────────────
def main():
    print("=" * 70)
    print("  CONTENT AUDIT: oldschoolpinball.com vs Local Project")
    print("=" * 70)

    all_prod_images = {}   # url -> {pages, alt}
    all_prod_texts = {}    # text -> pages
    prod_machines = []

    for page_name, url in PAGES.items():
        print(f"\n🔍 Scraping: {page_name} ({url})")
        try:
            html = fetch_html(url)
        except Exception as e:
            print(f"   ❌ Failed to fetch: {e}")
            continue

        parser = ContentExtractor()
        parser.feed(html)

        print(f"   📷 Found {len(parser.images)} images")
        print(f"   📝 Found {len(parser.texts)} text snippets")

        for src, alt in parser.images:
            if src not in all_prod_images:
                all_prod_images[src] = {"pages": [], "alt": alt}
            all_prod_images[src]["pages"].append(page_name)

        for txt in parser.texts:
            if txt not in all_prod_texts:
                all_prod_texts[txt] = []
            all_prod_texts[txt].append(page_name)

        # Extract machines from the machines page
        if page_name == "Máquinas":
            for line in parser.texts:
                line = line.strip()
                # Lines with dots between name and year
                m = re.match(r'^(.+?)\.{2,}\s*(\d{4})\s*$', line)
                if m:
                    prod_machines.append({"name": m.group(1).strip(), "year": m.group(2)})

    # ── Scan local project ──
    print("\n" + "=" * 70)
    print("  SCANNING LOCAL PROJECT")
    print("=" * 70)
    local_img_refs, local_texts, local_public_imgs = scan_local_project()

    # ── REPORT: Images ──
    print("\n" + "=" * 70)
    print("  📷 IMAGE AUDIT")
    print("=" * 70)

    # Filter to meaningful images (skip tiny icons, tracking pixels, etc.)
    meaningful_images = {}
    skip_patterns = ["facebook", "twitter", "google", "analytics", "pixel",
                     "1x1", "blank", "spacer", "wix", "parastorage"]
    for src, info in all_prod_images.items():
        if any(p in src.lower() for p in skip_patterns):
            continue
        meaningful_images[src] = info

    print(f"\n  Production site has {len(meaningful_images)} meaningful images:")
    for src, info in sorted(meaningful_images.items(), key=lambda x: x[0]):
        # Try to extract filename
        fname = src.split("/")[-1].split("?")[0].split("#")[0]
        pages = ", ".join(info["pages"])
        alt = info.get("alt", "")[:40]
        # Check if this image or similar exists locally
        fname_lower = fname.lower()
        found_local = any(fname_lower in ref.lower() for ref in local_img_refs) or \
                      any(fname_lower == img.lower() for img in local_public_imgs)
        status = "✅ FOUND" if found_local else "❌ MISSING"
        print(f"  {status} | {fname[:40]:<40} | pages: {pages}")
        if alt:
            print(f"         | alt: {alt}")

    # ── REPORT: Local images not from prod ──
    print(f"\n  Local public/images ({len(local_public_imgs)} files):")
    for img in sorted(local_public_imgs):
        print(f"    📁 {img}")

    print(f"\n  Image refs in src/ code ({len(local_img_refs)} refs):")
    for ref in sorted(local_img_refs):
        print(f"    🔗 {ref}")

    # ── REPORT: Key texts comparison ──
    print("\n" + "=" * 70)
    print("  📝 KEY TEXT CONTENT AUDIT")
    print("=" * 70)

    key_texts = {
        "Passaporte": ["PASSAPORTE", "passaporte"],
        "Preço R$90": ["R$ 90", "R$90"],
        "Preço R$100": ["R$ 100", "R$100"],
        "Desconto 10%": ["10%", "desconto"],
        "Jogue à vontade": ["JOGUE À VONTADE", "jogue à vontade", "Jogue à vontade"],
        "Sem ficha": ["sem ficha", "Sem ficha", "SEM FICHA"],
        "Crianças R$63": ["R$ 63", "R$63", "crianças"],
        "Endereço": ["Teodureto Souto", "292a", "Cambuci"],
        "WhatsApp": ["11 91562-0127", "5511915620127", "915620127"],
        "Email": ["oldschoolpinballsite@gmail.com"],
        "CNPJ": ["05.775.189/0001-08"],
        "Razão Social": ["Ricardo Massato Kobe Kuroki"],
        "Horário": ["quintas", "sábados", "18h", "18:00", "meia-noite", "00h"],
        "Eventos/Reservas": ["aniversário", "corporativos", "eventos", "podcast"],
        "American Bar": ["American Bar", "AMERICAN BAR"],
        "Melhor Espaço Pinball": ["melhor espaço", "Melhor Espaço", "América Latina"],
        "Compre Online": ["Compre Online", "compre agora", "COMPRE"],
        "Pix/Cartão": ["pix", "cartão de crédito", "débito"],
    }

    local_all_text = " ".join(local_texts)

    for label, patterns in key_texts.items():
        found = any(p.lower() in local_all_text.lower() for p in patterns)
        status = "✅" if found else "❌"
        print(f"  {status} {label}")

    # ── REPORT: Machines ──
    print("\n" + "=" * 70)
    print("  🎮 MACHINES AUDIT")
    print("=" * 70)

    # Get machine names from local project
    machines_file = PROJECT_SRC / "features" / "Machines.tsx"
    local_machine_names = set()
    if machines_file.exists():
        content = machines_file.read_text(encoding="utf-8", errors="replace")
        for m in re.finditer(r"name:\s*['\"]([^'\"]+)['\"]", content):
            local_machine_names.add(m.group(1).lower().strip())

    print(f"\n  Production machines: {len(prod_machines)}")
    print(f"  Local machines: {len(local_machine_names)}")

    # Check which prod machines are missing locally
    missing_machines = []
    found_machines = []
    for machine in prod_machines:
        name = machine["name"]
        name_lower = name.lower().strip()
        # Fuzzy match
        found = any(name_lower in lm or lm in name_lower for lm in local_machine_names)
        if not found:
            # Try partial match (first word)
            first_word = name_lower.split()[0] if name_lower.split() else ""
            found = any(first_word in lm for lm in local_machine_names) if first_word and len(first_word) > 3 else False
        if found:
            found_machines.append(name)
        else:
            missing_machines.append(f"{name} ({machine['year']})")

    if missing_machines:
        print(f"\n  ❌ Machines on production but MISSING locally:")
        for m in missing_machines:
            print(f"     - {m}")

    if found_machines:
        print(f"\n  ✅ Machines found in both ({len(found_machines)}):")
        for m in found_machines:
            print(f"     - {m}")

    # Check local machines not on production
    prod_names_lower = {m["name"].lower().strip() for m in prod_machines}
    extra_local = []
    for lm in local_machine_names:
        found = any(lm in pm or pm in lm for pm in prod_names_lower)
        if not found:
            first = lm.split()[0] if lm.split() else ""
            found = any(first in pm for pm in prod_names_lower) if first and len(first) > 3 else False
        if not found:
            extra_local.append(lm)

    if extra_local:
        print(f"\n  ⚠️  Machines in local project but NOT on production:")
        for m in sorted(extra_local):
            print(f"     - {m}")

    # ── REPORT: Sections ──
    print("\n" + "=" * 70)
    print("  📋 SECTIONS AUDIT")
    print("=" * 70)

    prod_sections = [
        "Hero / Home (logo + passaporte CTA)",
        "Passaporte / Pricing (R$100 → R$90, crianças R$63)",
        "Passaporte inclui... (features list)",
        "Eventos / Reservas (aniversário, corporativos)",
        "American Bar / Cardápio",
        "Máquinas (lista de pinballs + arcades)",
        "Mídia (aparições na mídia + gravados aqui)",
        "Ingressos (datas, horários)",
        "Contato / Footer (endereço, WhatsApp, email, CNPJ)",
    ]

    local_sections_files = [
        ("Hero.tsx", "Hero / Home"),
        ("Atmosphere.tsx", "Atmosfera / Sobre Nós"),
        ("AmericanBar.tsx", "American Bar"),
        ("Machines.tsx", "Máquinas"),
        ("Events.tsx", "Mídia / Eventos"),
        ("Tickets.tsx", "Ingressos / Passaporte"),
        ("Contact.tsx", "Contato"),
    ]

    print("\n  Production sections:")
    for s in prod_sections:
        print(f"    📌 {s}")

    print("\n  Local component sections:")
    for fname, desc in local_sections_files:
        fpath = PROJECT_SRC / "features" / fname
        exists = fpath.exists()
        status = "✅" if exists else "❌"
        print(f"    {status} {fname:<25} → {desc}")

    # ── Summary ──
    print("\n" + "=" * 70)
    print("  📊 SUMMARY")
    print("=" * 70)
    print(f"  Production images (meaningful): {len(meaningful_images)}")
    print(f"  Local public images: {len(local_public_imgs)}")
    print(f"  Production machines: {len(prod_machines)}")
    print(f"  Local machines: {len(local_machine_names)}")
    print(f"  Missing machines: {len(missing_machines)}")
    print(f"  Extra local machines: {len(extra_local)}")
    print()


if __name__ == "__main__":
    main()
