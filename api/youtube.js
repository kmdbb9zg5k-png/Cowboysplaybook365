export default async function handler(req, res) {
  try {
    // The channel's public RSS feed is not available, so we read the channel's
    // /videos tab and pull the embedded ytInitialData JSON instead. No API key needed.
    const handleUrl = "https://www.youtube.com/@thecowboysplaybook365/videos";
    const page = await fetch(handleUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (!page.ok) throw new Error(`YouTube page request failed: ${page.status}`);
    const html = await page.text();

    const dataMatch = html.match(/var ytInitialData = (\{[\s\S]*?\});<\/script>/);
    if (!dataMatch) throw new Error("Could not find channel video data.");
    const data = JSON.parse(dataMatch[1]);

    const lockups = [];
    const walk = (o) => {
      if (Array.isArray(o)) return o.forEach(walk);
      if (o && typeof o === "object") {
        if (o.lockupViewModel) lockups.push(o.lockupViewModel);
        for (const v of Object.values(o)) walk(v);
      }
    };
    walk(data);

    const items = lockups.slice(0, 12).map((lv) => {
      const videoId = lv.contentId || "";
      const meta = lv.metadata?.lockupMetadataViewModel || {};
      const title = meta.title?.content || "";
      const rows = meta.metadata?.contentMetadataViewModel?.metadataRows || [];
      const parts = (rows[0]?.metadataParts || []).map((p) => p.text?.content || "");
      const views = parts.find((p) => /view/i.test(p)) || "";
      const published = parts.find((p) => !/view/i.test(p)) || "";
      const sources = lv.contentImage?.thumbnailViewModel?.image?.sources || [];
      const thumbnail =
        sources[sources.length - 1]?.url ||
        (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : "");
      return {
        videoId,
        title,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnail,
        published,
        views,
        description: "Watch the latest Cowboys conversation from The Cowboys Playbook 365.",
      };
    });

    res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=3600");
    res.status(200).json({ items, refreshedAt: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: error.message, items: [] });
  }
}