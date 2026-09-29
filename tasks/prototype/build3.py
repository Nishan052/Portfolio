#!/usr/bin/env python3
import json, html, random

REPO = "/Users/nishan/Documents/Portfolio/Portfolio"
BASE = "/private/tmp/claude-501/-Users-nishan-Documents-Portfolio-Portfolio/4d60d802-e96f-4be0-b389-057fca426388/scratchpad/proto/"
en = json.load(open(f"{REPO}/src/i18n/en.json"))
projects = json.load(open(f"{REPO}/src/data/projects.json"))
experience = json.load(open(f"{REPO}/src/data/experience.json"))
skills = json.load(open(f"{REPO}/src/data/skills.json"))
esc = html.escape
EMAIL = "nishanchandrashekarpoojary@gmail.com"

def chip(t): return f'<span class="chip" data-hover>{esc(t)}</span>'

# ── about ────────────────────────────────────────────────────────────────────
sources = "".join(
    f'<div class="src" data-hover><p class="mono">{esc(c["title"])}</p><p>{esc(c["desc"])}</p></div>' for c in en["about"]["cards"])
about_chips = "".join(chip(s) for s in ["Python", "PyTorch", "TensorFlow", "RAG / LLMs", "SQL", "Docker"])

# ── experience: by domain, oldest to newest (matches the icons on the route) ──
DOMAIN = {"Softusvista": "Consulting", "Infosys": "Healthcare", "Novigo Solutions": "Banking", "Georg Schröder Maritime Unternehmensberatung": "Maritime"}
chron = [experience[3], experience[2], experience[1], experience[0]]
hi = {id(experience[i]): en["experience"]["items"][i]["highlights"] for i in range(4)}
tabs = ""; roles = ""
for k, e in enumerate(chron):
    dom = DOMAIN.get(e["company"], e["company"])
    yr = e["period"].split()[-1]
    tabs += (f'<button class="tab" role="tab" type="button" aria-selected="{"true" if k == 3 else "false"}" aria-controls="role{k}" id="tab{k}">'
             f'<span class="mono">{esc(yr)}</span><b>{esc(dom)}</b></button>')
    role = e["role"].replace("  →   ", " → ").split(" → ")[-1]
    lis = "".join(f"<li>{esc(h)}</li>" for h in hi[id(e)][:2])
    chips = "".join(chip(s) for s in e["skills"][:5])
    roles += f"""<article class="role veil" role="tabpanel" id="role{k}" aria-labelledby="tab{k}">
  <p class="mono mute">{esc(e["period"])} — {esc(e["end"])} · {esc(e["duration"])}</p>
  <h3>{esc(role)}</h3><p class="co">{esc(e["company"])}</p><p class="mono mute">{esc(e["location"])}</p>
  <ul>{lis}</ul><div class="chips">{chips}</div></article>"""

# ── project demos (viewBox 424x150) ──────────────────────────────────────────
def svg(inner): return f'<svg viewBox="0 0 424 150" preserveAspectRatio="xMidYMid meet" fill="none" aria-hidden="true">{inner}</svg>'

def d_rag():
    """a question, three retrieved chunks lighting in turn, and a grounded answer being written"""
    chunks = "".join(f'<rect class="d-rg d-rg{k}" x="20" y="{58 + k*30}" width="{156 - k*16}" height="22" rx="7"/>' for k in range(3))
    return svg('<rect x="20" y="14" width="176" height="30" rx="15" stroke="currentColor" stroke-opacity=".55"/>'
               '<rect x="36" y="26" width="72" height="6" rx="3" fill="currentColor" fill-opacity=".55"/>'
               f'{chunks}'
               '<path class="d-flow a-str" d="M182,70 C216,70 208,86 240,86" stroke-width="1.5"/>'
               '<path class="d-flow a-str" d="M166,100 C210,100 208,94 240,94" stroke-width="1.5"/>'
               '<rect x="240" y="34" width="164" height="94" rx="16" class="a-str" stroke-width="1.6"/>'
               '<rect class="d-type a-fill" x="256" y="54" width="130" height="8" rx="4"/>'
               '<rect class="d-type d-type2 a-fill" x="256" y="74" width="108" height="8" rx="4"/>'
               '<rect class="d-type d-type3 a-fill" x="256" y="94" width="84" height="8" rx="4"/>'
               '<text x="256" y="120" class="m-fill" font-family="Geist Mono, monospace" font-size="10">grounded answer</text>')

def d_candles():
    """candlesticks with an amber forecast that keeps appearing"""
    rnd = random.Random(11); out = ""; y = 96.0; xs = 26
    for k in range(17):
        o = y; c = y + rnd.uniform(-16, 12) - (2.2 if k > 0 else 0); hi = min(o, c) - rnd.uniform(3, 10); lo = max(o, c) + rnd.uniform(3, 10)
        fc = k >= 12
        cls = f'c-fc c-fc{k-11}' if fc else 'c-up'
        x = xs + k * 22
        out += (f'<line x1="{x+5}" y1="{hi:.1f}" x2="{x+5}" y2="{lo:.1f}" stroke="{"var(--amber)" if fc else "currentColor"}" stroke-width="1.5" class="{"c-fc c-fc"+str(k-11) if fc else ""}"/>'
                f'<rect class="{cls}" x="{x}" y="{min(o,c):.1f}" width="10" height="{max(3,abs(o-c)):.1f}" rx="1.5"/>')
        y = c
    return svg('<path d="M14,134 H410" stroke="currentColor" stroke-opacity=".2"/>' + out +
               '<text x="26" y="20" class="m-fill" font-family="Geist Mono, monospace" font-size="11">history</text>'
               '<text x="330" y="20" class="a-fill" font-family="Geist Mono, monospace" font-size="11">forecast</text>')

def d_person():
    """what the project actually does: a camera frame detects a person and runs inference
    on-device. A plain silhouette in a bounding box, no facial features drawn — matches
    the real pipeline (OpenCV + a small CNN, INT8-quantized, on TFLite Micro / Arduino)."""
    cx, cy = 96, 78
    icon = (f'<circle cx="{cx}" cy="{cy-14}" r="16" fill="currentColor"/>'
            f'<path d="M{cx-27},{cy+40} C{cx-27},{cy+12} {cx-15},{cy+3} {cx},{cy+3} '
            f'C{cx+15},{cy+3} {cx+27},{cy+12} {cx+27},{cy+40} Z" fill="currentColor"/>')
    b, a = 48, 12
    box = (f'<path class="f-box a-str" stroke-width="2" d="M{cx-b},{cy-b+a} V{cy-b} H{cx-b+a} M{cx+b-a},{cy-b} H{cx+b} V{cy-b+a} '
           f'M{cx+b},{cy+b-a} V{cy+b} H{cx+b-a} M{cx-b+a},{cy+b} H{cx-b} V{cy+b-a}"/>')
    scan = f'<rect class="f-scan a-fill" x="{cx-b}" y="{cy-b-4}" width="{2*b}" height="3" rx="1.5"/>'
    ping = f'<circle class="f-lm a-fill" cx="{cx+b+6}" cy="{cy-b-2}" r="4"/>'
    return svg(icon + box + scan + ping +
               f'<text class="f-wait m-fill" x="210" y="52" font-family="Geist Mono, monospace" font-size="13">scanning frame…</text>'
               f'<text class="f-ok a-fill" x="210" y="52" font-family="Geist Mono, monospace" font-size="15" font-weight="500">person · 0.97</text>'
               f'<text x="210" y="82" class="m-fill" font-family="Geist Mono, monospace" font-size="11">INT8 · TFLite Micro</text>'
               f'<text x="210" y="102" class="m-fill" font-family="Geist Mono, monospace" font-size="11">Arduino · on-device</text>')

def d_sig():
    return svg('<path d="M61,75 H198 M226,71 L363,39 M226,79 L363,111" stroke="currentColor" stroke-opacity=".3"/>'
               '<circle cx="52" cy="75" r="9" stroke="currentColor" stroke-width="1.5"/><circle class="a-fill" cx="212" cy="75" r="14"/>'
               '<circle cx="372" cy="36" r="9" stroke="currentColor" stroke-width="1.5"/><circle cx="372" cy="114" r="9" stroke="currentColor" stroke-width="1.5"/>'
               '<circle class="d-pk d-pk1 a-fill" cx="61" cy="75" r="4"/><circle class="d-pk d-pk2 a-fill" cx="226" cy="71" r="4"/><circle class="d-pk d-pk3 a-fill" cx="226" cy="79" r="4"/>'
               '<text x="26" y="22" class="m-fill" font-family="Geist Mono, monospace" font-size="12">topic/room1</text>')

def d_bar():
    rnd = random.Random(3); x, bars = 60, ""
    while x < 360:
        w = rnd.choice([3, 3, 5, 7, 4]); bars += f'<rect x="{x}" y="28" width="{w}" height="94" fill="currentColor"/>'; x += w + rnd.choice([3, 4, 6])
    return svg(bars + '<rect class="d-glow a-fill" x="34" y="18" width="18" height="114" fill-opacity=".2"/><rect class="d-scan a-fill" x="52" y="18" width="3" height="114"/>')

def d_data():
    hh = [34, 58, 84, 104, 92, 70, 48, 30, 18]
    b = "".join(f'<rect class="d-hb" style="animation-delay:{k*.15:.2f}s" x="{62 + k*34}" y="{132 - h}" width="24" height="{h}" rx="3" fill="currentColor" fill-opacity=".85"/>' for k, h in enumerate(hh))
    d = "".join(f'<circle class="d-sd a-fill" style="animation-delay:{k*.3:.1f}s" cx="{70 + k*41}" cy="{26 + (k*37)%30}" r="3.5"/>' for k in range(8))
    return svg(f'<path d="M40,132 H392" stroke="currentColor" stroke-opacity=".25"/>{b}{d}')

demos = [d_rag(), d_candles(), d_person(), d_sig(), d_bar(), d_data()]
cards = ""
for k, (p, it, dm) in enumerate(zip(projects, en["projects"]["items"], demos)):
    tech = "".join(chip(t) for t in p["tech"][:4])
    cards += f"""<a class="card" href="https://github.com/Nishan052" target="_blank" rel="noopener" aria-label="{esc(p["title"])} on GitHub">
  <div class="viz">{dm}</div>
  <div class="meta"><p class="mono mute">{k+1:02d} · {esc(it["category"])}</p><h3 data-scramble>{esc(p["title"])}</h3><p class="hl">{esc(it["highlights"][0])}</p><div class="chips">{tech}</div></div>
</a>"""

# ── toolkit ──────────────────────────────────────────────────────────────────
IS = 'viewBox="0 0 96 96" aria-hidden="true"'
icons = [
    ("RAG", "Retrieval and grounding", f'<svg {IS}><rect x="20" y="12" width="44" height="64" rx="5"/><path class="i-ln" d="M30,30H54M30,42H54M30,54H46"/><g class="i-mag"><circle cx="62" cy="60" r="14"/><path d="M72,70L84,82"/></g></svg>'),
    ("LLMs", "Language models", f'<svg {IS}><path d="M14,20H82V64H46L30,78V64H14Z"/><circle class="i-dt" cx="36" cy="42" r="3.5"/><circle class="i-dt" style="animation-delay:.15s" cx="48" cy="42" r="3.5"/><circle class="i-dt" style="animation-delay:.3s" cx="60" cy="42" r="3.5"/></svg>'),
    ("Edge ML", "On-device inference", f'<svg {IS}><rect x="28" y="28" width="40" height="40" rx="6"/><rect class="i-core" x="40" y="40" width="16" height="16" rx="2"/><path class="i-pin" d="M38,28V16M48,28V16M58,28V16M38,68V80M48,68V80M58,68V80M28,38H16M28,48H16M28,58H16M68,38H80M68,48H80M68,58H80"/></svg>'),
    ("Forecasting", "Time-series models", f'<svg {IS}><path d="M16,14V80H84" stroke-opacity=".4"/><path class="i-line" pathLength="1" d="M22,64L38,50L50,58L66,34L80,22"/><circle class="i-tip" cx="80" cy="22" r="5"/></svg>'),
    ("MLOps", "Ship and monitor", f'<svg {IS}><g class="i-rot"><path d="M74,36A28,28 0 0 0 26,32"/><path d="M26,60A28,28 0 0 0 70,66"/><path d="M26,20V33H39M70,76V63H57"/></g></svg>'),
    ("Vector search", "Embeddings and retrieval", f'<svg {IS}><path class="i-net" d="M48,22L22,66H74Z M48,22V48 M22,66L48,48 M74,66L48,48" stroke-dasharray="4 6"/><circle class="i-nd" cx="48" cy="22" r="6"/><circle class="i-nd" style="animation-delay:.3s" cx="22" cy="66" r="6"/><circle class="i-nd" style="animation-delay:.6s" cx="74" cy="66" r="6"/></svg>'),
]
icon_html = "".join(f'<div class="tile" data-hover>{s}<b>{esc(n)}</b><span>{esc(sub)}</span></div>' for n, sub, s in icons)
groups = "".join(
    f'<div><h3>{esc(nm)}</h3><div class="chips">{"".join(chip(s["name"]) for s in cat["skills"])}</div></div>'
    for nm, cat in zip(en["skills"]["categoryNames"], skills["categories"]))

# certifications grouped by who issued them: easy to scan, nothing scrolls away
by = {}
for c in skills["certifications"]:
    by.setdefault(c["org"], []).append(c["title"])
certs_html = ""
for org, titles in by.items():
    items = "".join(f'<li class="cred" data-hover><span class="mono mute">{i+1:02d}</span><p>{esc(t)}</p></li>' for i, t in enumerate(titles))
    n = len(titles)
    certs_html += (f'<div class="issuer"><header><span class="badge" aria-hidden="true">{esc(org[0])}</span>'
                   f'<div><b>{esc(org)}</b><span class="mono mute">{n} certificate{"s" if n != 1 else ""}</span></div></header><ol>{items}</ol></div>')

# ── assemble ─────────────────────────────────────────────────────────────────
t = open(BASE + "template3.html").read()
rep = {
    "@@HERO_ROLE@@": esc(en["hero"]["role"]),
    "@@HERO_DESC@@": esc(en["hero"]["description"]),
    "@@BIO@@": esc(en["about"]["bio1"]),
    "@@SOURCES@@": sources, "@@ABOUT_CHIPS@@": about_chips, "@@TABS@@": tabs, "@@ROLES@@": roles, "@@CARDS@@": cards,
    "@@ICONS@@": icon_html, "@@GROUPS@@": groups, "@@CERTS_HTML@@": certs_html,
    "@@CONTACT_DESC@@": esc(en["contact"]["description"].split(". ")[0]) + ".", "@@EMAIL@@": EMAIL,
    "@@LANDMASK@@": open(BASE + "landmask.txt").read().strip(),
}
for k, v in rep.items():
    assert k in t, k
    t = t.replace(k, v)
assert "@@" not in t
open(BASE + "index.html", "w").write(t)
print("ok", len(t))
