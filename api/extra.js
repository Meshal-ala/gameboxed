const SGDB_KEY = process.env.STEAMGRIDDB_KEY;
const RAPID_KEY = process.env.RAPIDAPI_KEY;
const STORES={"1":"Steam","2":"GamersGate","3":"GreenManGaming","7":"GOG","8":"Origin","11":"Humble","13":"Uplay","15":"Fanatical","21":"WinGameStore","23":"GameBillet","24":"Voidu","25":"Epic Games","27":"Gamesplanet","28":"Gamesload","29":"2Game","30":"IndieGala","31":"Blizzard","33":"DLGamer","34":"Noctre","35":"GameStop"};

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

    // ═══ CHEAPSHARK DEALS ═══

    // Search deals for a game
    if (action === "deals" && name) {
      const r = await fetch(`https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(name)}&limit=1`);
      const games = await r.json();
      if (!games?.length) return res.json({ deals: [] });

      const gameId = games[0].gameID;
      const dr = await fetch(`https://www.cheapshark.com/api/1.0/games?id=${gameId}`);
      const detail = await dr.json();

      return res.json({
        cheapest: detail.cheapestPriceEver ? { price: detail.cheapestPriceEver.price, date: detail.cheapestPriceEver.date } : null,
        deals: (detail.deals || []).slice(0, 6).map(d => ({
          store: d.storeID,
          price: d.price,
          retail: d.retailPrice,
          savings: Math.round(parseFloat(d.savings)),
          url: `https://www.cheapshark.com/redirect?dealID=${d.dealID}`
        }))
      });
    }

    // Top current deals
    if (action === "top-deals") {
      const r = await fetch(`https://www.cheapshark.com/api/1.0/deals?sortBy=Deal%20Rating&pageSize=12&onSale=1`);
      const deals = await r.json();
      return res.json({
        deals: (deals || []).map(d => ({
          title: d.title,
          price: d.salePrice,
          retail: d.normalPrice,
          savings: Math.round(parseFloat(d.savings)),
          thumb: d.thumb,
          metacritic: d.metacriticScore ? parseInt(d.metacriticScore) : null,
          rating: d.steamRatingPercent ? parseInt(d.steamRatingPercent) : null,
          store: d.storeID,
          url: `https://www.cheapshark.com/redirect?dealID=${d.dealID}`
        }))
      });
    }

    // ═══ GAMING NEWS ═══

    if (action === "news") {
      try {
        const feeds = [
          "https://feeds.feedburner.com/ign/games-all",
          "https://www.gamespot.com/feeds/news/",
        ];
        
        const articles = [];
        // Words that indicate non-game news (hardware, accessories, etc.)
        const skipWords = ["headset", "headphone", "controller", "monitor", "keyboard", "mouse", "chair", "desk", "tv ", "laptop", "gpu", "cpu", "graphics card", "ssd", "ram", "motherboard", "router", "earbuds", "speaker", "microphone", "webcam", "capture card", "streaming deck", "phone case", "cable", "charger", "power bank", "subscription price", "price increase"];
        
        for (const feedUrl of feeds) {
          try {
            const r = await fetch(feedUrl, { headers: { "User-Agent": "GameBoxd/1.0" } });
            const xml = await r.text();
            
            const items = xml.split("<item>").slice(1, 8);
            for (const item of items) {
              const getTag = (tag) => {
                const match = item.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([^\\]]*?)\\]\\]></${tag}>|<${tag}[^>]*>([^<]*)</${tag}>`));
                return match ? (match[1] || match[2] || "").trim() : "";
              };
              
              const title = getTag("title");
              const link = getTag("link");
              const pubDate = getTag("pubDate");
              const desc = getTag("description").replace(/<[^>]+>/g, "").slice(0, 120);
              
              // Skip non-game news
              const titleLower = (title + " " + desc).toLowerCase();
              if (skipWords.some(w => titleLower.includes(w))) continue;
              
              const mediaMatch = item.match(/url="(https?:\/\/[^"]+\.(jpg|jpeg|png|webp)[^"]*)"/i);
              const imgMatch = item.match(/<img[^>]+src="(https?:\/\/[^"]+)"/i);
              const img = mediaMatch ? mediaMatch[1] : imgMatch ? imgMatch[1] : "";
              
              const source = feedUrl.includes("ign") ? "IGN" : "GameSpot";
              
              if (title) {
                articles.push({ title, desc, url: link, img, source, date: pubDate || new Date().toISOString() });
              }
            }
          } catch {}
        }
        
        articles.sort((a, b) => new Date(b.date) - new Date(a.date));
        return res.json({ articles: articles.slice(0, 10) });
      } catch {}
      return res.json({ articles: [] });
    }

    return res.status(400).json({ error: "Invalid action" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
