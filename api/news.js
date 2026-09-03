export default async function handler(req, res) {
  try {
    const query = encodeURIComponent('Dallas Cowboys when:7d');
    const url = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;
    const r = await fetch(url, { headers: { "User-Agent": "CP365/1.0" } });
    if (!r.ok) throw new Error(`News request failed: ${r.status}`);
    const xml = await r.text();

    const decode = (s = "") => s
      .replace(/<!\[CDATA\[|\]\]>/g, "")
      .replace(/&amp;/g, "&").replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/<[^>]*>/g, "").trim();

    const get = (item, tag) => {
      const m = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
      return m ? decode(m[1]) : "";
    };
    const category = (title = "") => {
      const x = title.toLowerCase();
      if (/injur|questionable|practice|hamstring|ankle|knee|concussion/.test(x)) return "injury";
      if (/sign|release|waiv|trade|roster|contract|cut|activate/.test(x)) return "roster";
      if (/draft|prospect|pick|combine/.test(x)) return "draft";
      if (/game|week |matchup|score|preview|recap/.test(x)) return "game";
      return "news";
    };

    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
      .slice(0, 24)
      .map(m => {
        const block = m[1];
        const title = get(block, "title");
        const sourceMatch = block.match(/<source[^>]*>([\s\S]*?)<\/source>/i);
        return {
          title,
          url: get(block, "link"),
          published: get(block, "pubDate"),
          source: sourceMatch ? decode(sourceMatch[1]) : "Google News",
          description: "Open the original source for the full story.",
          category: category(title)
        };
      });

    res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=3600");
    res.status(200).json({ items, refreshedAt: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: error.message, items: [] });
  }
}