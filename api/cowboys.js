export default async function handler(req, res) {
  try {
    const now = Date.now();
    // NFL seasons span calendar years (Sep–Feb), so ESPN's season parameter is
    // the year the season *starts*. Jan–Aug belongs to the previous year's season.
    const nowDate = new Date();
    const seasonYear = nowDate.getMonth() >= 8 ? nowDate.getFullYear() : nowDate.getFullYear() - 1;
    const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/dal/schedule?season=${seasonYear}`;
    const r = await fetch(url, { headers: { "User-Agent": "curl/8.0" } });
    if (!r.ok) throw new Error(`Schedule request failed: ${r.status}`);
    const data = await r.json();

    const mapped = (data.events || []).map(event => {
      const c = event.competitions?.[0] || {};
      const cowboys = (c.competitors || []).find(x => x.team?.abbreviation === "DAL");
      const opponent = (c.competitors || []).find(x => x.team?.abbreviation !== "DAL");
      const date = new Date(event.date);
      const st = event.status?.type || {};
      const dalScore = cowboys?.score?.displayValue ?? cowboys?.score?.value ?? "";
      const oppScore = opponent?.score?.displayValue ?? opponent?.score?.value ?? "";
      return {
        ts: date.getTime(),
        dateLabel: date.toLocaleDateString("en-US",{month:"short",day:"numeric"}),
        timeLabel: date.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"}),
        opponent: opponent?.team?.displayName || "Opponent",
        oppAbbr: opponent?.team?.abbreviation || "",
        homeAway: cowboys?.homeAway || "",
        venue: c.venue?.fullName || "",
        status: st.description || "Scheduled",
        state: st.state || "",
        shortDetail: st.shortDetail || "",
        dalScore,
        oppScore
      };
    });

    // A game is "live" when ESPN marks it in-progress (state "in").
    const liveGame = mapped.find(x => x.state === "in") || null;
    const nextGame = mapped.filter(x => x.ts >= now).sort((a,b)=>a.ts-b.ts)[0] || mapped.sort((a,b)=>b.ts-a.ts)[0] || null;

    res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=3600");
    res.status(200).json({ nextGame, liveGame, refreshedAt: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: error.message, nextGame: null });
  }
}