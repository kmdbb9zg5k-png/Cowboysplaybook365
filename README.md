# The Cowboys Playbook 365

A multi-page, mobile-first website package built around the supplied CP365 logo.

## Pages
- `/` — Home
- `/news.html` — auto-updating Cowboys news hub
- `/episodes.html` — auto-updating YouTube episode library
- `/about.html` — about the show / Tyler Young
- `/watch.html` — latest video + uploads
- `/social.html` — YouTube and TikTok
- `/contact.html` — fan/business contact page

## Live data
The Vercel serverless functions inside `/api` provide:
- `/api/news` — recent Dallas Cowboys headlines from Google News RSS, cached on Vercel
- `/api/youtube` — loads the latest YouTube uploads from the channel's videos page (the channel's RSS feed is not published, so the function reads the page's embedded data instead), no API key required
- `/api/cowboys` — next Cowboys game **and live game** (scores + clock) from ESPN's public site API. During a game the home card flips to a red LIVE score display and auto-refreshes every 60s.

The frontend has fallback content, so the design still renders if an external feed is temporarily unavailable.

## Features
- **Global search** — press `/` (or the ⌕ button in the nav) to search episodes, news and pages from any page.
- **Live game score** — the "Next Cowboys game" card becomes a live scoreboard during games.
- **Daily Take email signup** — home-page card that delivers new subscribers to the business email in `content/site.json`.
- **Site music** — theme song auto-plays (with a "turn on the show music" fallback for browsers that block autoplay); toggle in the nav, remembers the visitor's choice.
- **Sponsorship** — home-page "Presented By" card + footer credit, driven by the `sponsor` block in `content/site.json`.
- **PWA** — `manifest.json` lets fans "Add to Home Screen"; favicons + Open Graph/Twitter share tags on every page.
- **SEO** — `robots.txt` + `sitemap.xml` (update the domain in both when the site has its final URL).

## Local preview (no Vercel needed)
Run the site on your own machine to see it with live data:

```
python3 preview.py
```

It serves the site at `http://localhost:8365` and emulates the three API functions using the same public sources, so news, episodes, and the next-game card all populate. Uses only the Python standard library. Press Ctrl+C to stop.

## Easy edits later
Most common edits do not require touching the page HTML.

`content/site.json`
- show name
- host
- YouTube URL
- TikTok URL
- contact email
- disclaimer
- sponsor (name, URL, logo, tagline, blurb, CTA)

## Sponsorship
The home page has a "Presented By" sponsor card (below the latest episode) plus a
footer credit. It is fully driven by the `sponsor` block in `content/site.json` —
swap the sponsor by editing that one block and replacing the logo in `assets/`.
The entire card links out to the sponsor's site (currently Ball Knower,
ballknowerofficial.com).

`content/tylers-take.json`
- headline
- Tyler's quick opinion
- CTA text

This makes future ChatGPT/GitHub edits simple.

## Contact form
Add the actual business email to:
`content/site.json`

The form then opens a pre-filled email in the visitor's email client.

## Fan poll
The included fan poll remembers a visitor's vote in their browser. For shared live percentages across every visitor, connect the poll to Supabase later.

## Deploy to GitHub + Vercel
1. Upload all files in this folder to a GitHub repository.
2. Import the repository into Vercel.
3. Framework preset: **Other**
4. No build command is required.
5. Deploy.

Vercel recognizes `/api/*.js` as serverless functions.

## Pokee AI
If Pokee accepts an uploaded project/ZIP, upload the entire ZIP.
If Pokee asks for a prompt, use `POKEE_INSTRUCTIONS.txt`.

## Important
The provided logo includes third-party team/league marks. Keep the independent-fan-media disclaimer visible and review trademark/licensing considerations before commercial use or sponsorship sales.
