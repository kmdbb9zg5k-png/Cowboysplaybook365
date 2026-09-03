#!/usr/bin/env python3
"""
Local preview for The Cowboys Playbook 365 — no Vercel, no build, no dependencies.

Run it from anywhere:
    python3 preview.py

It serves the site on http://localhost:8365 and emulates the three Vercel
serverless functions (/api/news, /api/youtube, /api/cowboys) by calling the
same public upstream sources, so the live news, episodes, and next-game
sections render real data exactly as they will on Vercel.

Uses only the Python standard library. Press Ctrl+C to stop.
"""
import http.server
import socketserver
import os
import re
import json
import time
import webbrowser
import urllib.parse
import urllib.request

# Serve from the folder this script lives in (the site root).
ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = 8365
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"

_cache = {}
CACHE_TTL = 300  # 5 minutes


def http_get(url, headers=None, timeout=20):
    h = {"User-Agent": UA}
    if headers:
        h.update(headers)
    req = urllib.request.Request(url, headers=h)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf-8", "replace")


def decode(s=""):
    s = re.sub(r"<!\[CDATA\[|\]\]>", "", s)
    for a, b in [("&amp;", "&"), ("&quot;", '"'), ("&#39;", "'"),
                 ("&apos;", "'"), ("&lt;", "<"), ("&gt;", ">")]:
        s = s.replace(a, b)
    return re.sub(r"<[^>]*>", "", s).strip()


def get_tag(block, tag):
    m = re.search(r"<%s[^>]*>([\s\S]*?)</%s>" % (tag, tag), block, re.I)
    return decode(m.group(1)) if m else ""


def categorize(title=""):
    x = title.lower()
    if re.search(r"injur|questionable|practice|hamstring|ankle|knee|concussion", x):
        return "injury"
    if re.search(r"sign|release|waiv|trade|roster|contract|cut|activate", x):
        return "roster"
    if re.search(r"draft|prospect|pick|combine", x):
        return "draft"
    if re.search(r"game|week |matchup|score|preview|recap", x):
        return "game"
    return "news"


def api_news():
    query = urllib.parse.quote("Dallas Cowboys when:7d")
    url = f"https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en"
    xml = http_get(url)
    items = []
    for m in re.finditer(r"<item>([\s\S]*?)</item>", xml, re.I):
        b = m.group(1)
        title = get_tag(b, "title")
        sm = re.search(r"<source[^>]*>([\s\S]*?)</source>", b, re.I)
        items.append({
            "title": title,
            "url": get_tag(b, "link"),
            "published": get_tag(b, "pubDate"),
            "source": decode(sm.group(1)) if sm else "Google News",
            "description": "Open the original source for the full story.",
            "category": categorize(title),
        })
    return {"items": items[:24], "refreshedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}


def api_youtube():
    # The channel's public RSS feed is not available, so read the /videos tab
    # and parse the embedded ytInitialData JSON. No API key needed.
    html = http_get("https://www.youtube.com/@thecowboysplaybook365/videos",
                    headers={"Accept-Language": "en-US,en;q=0.9"})
    m = re.search(r"var ytInitialData = (\{.*?\});</script>", html, re.S)
    if not m:
        raise RuntimeError("Could not find channel video data.")
    data = json.loads(m.group(1))
    lockups = []

    def walk(o):
        if isinstance(o, list):
            for x in o:
                walk(x)
        elif isinstance(o, dict):
            if "lockupViewModel" in o:
                lockups.append(o["lockupViewModel"])
            for v in o.values():
                walk(v)

    walk(data)
    items = []
    for lv in lockups[:12]:
        video_id = lv.get("contentId", "")
        meta = (lv.get("metadata") or {}).get("lockupMetadataViewModel") or {}
        title = (meta.get("title") or {}).get("content", "")
        rows = ((meta.get("metadata") or {}).get("contentMetadataViewModel") or {}).get("metadataRows") or []
        parts = [(p.get("text") or {}).get("content", "") for p in (rows[0].get("metadataParts") or [])]
        views = next((p for p in parts if re.search(r"view", p, re.I)), "")
        published = next((p for p in parts if not re.search(r"view", p, re.I)), "")
        sources = (((lv.get("contentImage") or {}).get("thumbnailViewModel") or {}).get("image") or {}).get("sources") or []
        thumb = sources[-1].get("url") if sources else (f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg" if video_id else "")
        items.append({
            "videoId": video_id,
            "title": title,
            "url": f"https://www.youtube.com/watch?v={video_id}",
            "thumbnail": thumb,
            "published": published,
            "views": views,
            "description": "Watch the latest Cowboys conversation from The Cowboys Playbook 365.",
        })
    return {"items": items, "refreshedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}


def api_cowboys():
    now_date = time.gmtime()
    # NFL seasons span calendar years (Sep–Feb): the season parameter is the
    # year the season *starts*, so Jan–Aug belongs to the previous year.
    season_year = now_date.tm_year if now_date.tm_mon >= 8 else now_date.tm_year - 1
    url = f"https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/dal/schedule?season={season_year}"
    data = json.loads(http_get(url, headers={"User-Agent": "curl/8.0"}))
    now = time.time() * 1000
    mapped = []
    for ev in data.get("events", []):
        c = (ev.get("competitions") or [{}])[0]
        comps = c.get("competitors") or []
        cowboys = next((x for x in comps if (x.get("team") or {}).get("abbreviation") == "DAL"), None)
        opp = next((x for x in comps if (x.get("team") or {}).get("abbreviation") != "DAL"), None)
        dstr = ev["date"][:19].replace("Z", "")
        if len(dstr) == 16:
            dstr += ":00"
        ts = time.mktime(time.strptime(dstr, "%Y-%m-%dT%H:%M:%S")) * 1000
        mapped.append({
            "ts": ts,
            "dateLabel": time.strftime("%b %d", time.gmtime(ts / 1000)),
            "timeLabel": time.strftime("%I:%M %p", time.gmtime(ts / 1000)).lstrip("0"),
            "opponent": (opp.get("team") or {}).get("displayName", "Opponent") if opp else "Opponent",
            "homeAway": cowboys.get("homeAway", "") if cowboys else "",
            "venue": (c.get("venue") or {}).get("fullName", ""),
            "status": ((ev.get("status") or {}).get("type") or {}).get("description", "Scheduled"),
        })
    future = sorted([x for x in mapped if x["ts"] >= now], key=lambda x: x["ts"])
    past = sorted(mapped, key=lambda x: x["ts"], reverse=True)
    next_game = (future or past or [None])[0]
    return {"nextGame": next_game, "refreshedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}


API = {"/api/news": api_news, "/api/youtube": api_youtube, "/api/cowboys": api_cowboys}


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        print("  " + (fmt % args))

    def do_GET(self):
        path = urllib.parse.urlparse(self.path).path
        if path in API:
            try:
                hit = _cache.get(path)
                if hit and time.time() - hit[0] < CACHE_TTL:
                    payload = hit[1]
                else:
                    payload = API[path]()
                    _cache[path] = (time.time(), payload)
                body = json.dumps(payload).encode()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
            except Exception as e:
                body = json.dumps({"error": str(e), "items": [], "nextGame": None}).encode()
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
            return
        return super().do_GET()


if __name__ == "__main__":
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        url = f"http://localhost:{PORT}"
        print(f"\n  The Cowboys Playbook 365 — local preview")
        print(f"  ->  {url}")
        print(f"  Live news, episodes, and next-game data load automatically.\n")
        print("  Press Ctrl+C to stop.\n")
        try:
            webbrowser.open(url)
        except Exception:
            pass
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped.")