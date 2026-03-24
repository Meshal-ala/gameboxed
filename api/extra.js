const SGDB_KEY = process.env.STEAMGRIDDB_KEY;
const RAPID_KEY = process.env.RAPIDAPI_KEY;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { action, name, gameid } = req.query;

  try {
    // ═══ OPENCRITIC ═══

    // Search for a game on OpenCritic
    if (action === "oc-search" && name) {
      const r = await fetch(`https://opencritic-api.p.rapidapi.com/game/search?criteria=${encodeURIComponent(name)}`, {
        headers: { "X-RapidAPI-Key": RAPID_KEY, "X-RapidAPI-Host": "opencritic-api.p.rapidapi.com" }
      });
      const data = await r.json();
      if (!Array.isArray(data) || !data.length) return res.json({ score: null });

      // Find best match
      const searchLower = name.toLowerCase().trim();
      const match = data.find(g => g.name?.toLowerCase() === searchLower)
        || data.find(g => g.name?.toLowerCase().startsWith(searchLower))
        || data[0];

      if (!match?.id) return res.json({ score: null });

      // Get full game details
      const dr = await fetch(`https://opencritic-api.p.rapidapi.com/game/${match.id}`, {
        headers: { "X-RapidAPI-Key": RAPID_KEY, "X-RapidAPI-Host": "opencritic-api.p.rapidapi.com" }
      });
      const detail = await dr.json();

      return res.json({
        id: detail.id,
        name: detail.name,
        score: detail.topCriticScore > 0 ? Math.round(detail.topCriticScore) : null,
        recommended: detail.percentRecommended > 0 ? Math.round(detail.percentRecommended) : null,
        tier: detail.tier || null,
        reviewCount: detail.numReviews || 0,
        url: `https://opencritic.com/game/${detail.id}/${(detail.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      });
    }

    // ═══ STEAMGRIDDB ═══

    // Search for a game on SteamGridDB
    if (action === "sgdb-search" && name) {
      const r = await fetch(`https://www.steamgriddb.com/api/v2/search/autocomplete/${encodeURIComponent(name)}`, {
        headers: { Authorization: `Bearer ${SGDB_KEY}` }
      });
      const data = await r.json();
      if (!data.success || !data.data?.length) return res.json({ id: null });

      const searchLower = name.toLowerCase().trim();
      const match = data.data.find(g => g.name?.toLowerCase() === searchLower) || data.data[0];
      return res.json({ id: match.id, name: match.name });
    }

    // Get grids (portrait covers) for a game
    if (action === "sgdb-grids" && gameid) {
      const r = await fetch(`https://www.steamgriddb.com/api/v2/grids/game/${gameid}?dimensions=600x900&types=static&limit=6`, {
        headers: { Authorization: `Bearer ${SGDB_KEY}` }
      });
      const data = await r.json();
      if (!data.success) return res.json({ grids: [] });
      return res.json({
        grids: (data.data || []).map(g => ({
          id: g.id, url: g.url, thumb: g.thumb, style: g.style, score: g.score,
          author: g.author?.name || "Unknown"
        }))
      });
    }

    // Get heroes (wide banners) for a game
    if (action === "sgdb-heroes" && gameid) {
      const r = await fetch(`https://www.steamgriddb.com/api/v2/heroes/game/${gameid}?types=static&limit=6`, {
        headers: { Authorization: `Bearer ${SGDB_KEY}` }
      });
      const data = await r.json();
      if (!data.success) return res.json({ heroes: [] });
      return res.json({
        heroes: (data.data || []).map(h => ({
          id: h.id, url: h.url, thumb: h.thumb, style: h.style,
          author: h.author?.name || "Unknown"
        }))
      });
    }

    // Get icons for a game
    if (action === "sgdb-icons" && gameid) {
      const r = await fetch(`https://www.steamgriddb.com/api/v2/icons/game/${gameid}?types=static&limit=6`, {
        headers: { Authorization: `Bearer ${SGDB_KEY}` }
      });
      const data = await r.json();
      if (!data.success) return res.json({ icons: [] });
      return res.json({
        icons: (data.data || []).map(i => ({
          id: i.id, url: i.url, thumb: i.thumb,
          author: i.author?.name || "Unknown"
        }))
      });
    }

    return res.status(400).json({ error: "Invalid action. Use: oc-search, sgdb-search, sgdb-grids, sgdb-heroes, sgdb-icons" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
