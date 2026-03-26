const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

let tokenCache = { token: null, expires: 0 };

async function getToken() {
  if (tokenCache.token && Date.now() < tokenCache.expires) return tokenCache.token;
  const r = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials`,
  });
  const d = await r.json();
  tokenCache = { token: d.access_token, expires: Date.now() + (d.expires_in - 60) * 1000 };
  return d.access_token;
}

async function igdbPost(endpoint, body) {
  const token = await getToken();
  const r = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
    method: "POST",
    headers: {
      "Client-ID": CLIENT_ID,
      Authorization: `Bearer ${token}`,
      "Content-Type": "text/plain",
    },
    body,
  });
  return r.json();
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { action, name, names, year } = req.query;

  // Helper: find best name match from results, with year disambiguation
  function bestMatch(results, searchName, searchYear) {
    if (!results?.length) return null;
    const s = searchName.toLowerCase().trim();
    
    // 1. Exact name match
    const exacts = results.filter(g => g.name?.toLowerCase().trim() === s);
    if (exacts.length === 1) return exacts[0];
    // If multiple exact matches (e.g. RE4 original + remake), prefer by year
    if (exacts.length > 1 && searchYear) {
      const yr = parseInt(searchYear);
      const yearMatch = exacts.find(g => {
        if (!g.first_release_date) return false;
        const gy = new Date(g.first_release_date * 1000).getFullYear();
        return Math.abs(gy - yr) <= 1; // within 1 year tolerance
      });
      if (yearMatch) return yearMatch;
    }
    if (exacts.length > 0) return exacts[0];
    
    // 2. Name with subtitle match (e.g. "The Forest" should NOT match "The Forest Cathedral")
    // Only match if search is a complete word boundary
    const wordBound = results.find(g => {
      const gn = g.name?.toLowerCase().trim();
      return gn === s || gn === s + " " || gn.startsWith(s + ":") || gn.startsWith(s + " -");
    });
    if (wordBound) return wordBound;
    
    // 3. Starts with (but NOT substring of longer name)
    const starts = results.find(g => g.name?.toLowerCase().startsWith(s));
    if (starts) return starts;
    
    // 4. Default to first result
    return results[0];
  }

  try {
    // Single game cover
    if (action === "cover" && name) {
      const games = await igdbPost("games",
        `search "${name.replace(/"/g, '\\"')}"; fields name,cover.url,platforms.abbreviation,first_release_date; limit 10;`
      );
      const match = bestMatch(games, name, year);
      if (match?.cover?.url) {
        const url = match.cover.url
          .replace("//", "https://")
          .replace("t_thumb", "t_cover_big_2x");
        const platforms = (match.platforms || []).map(p => p.abbreviation).filter(Boolean);
        return res.json({ cover: url, name: match.name, platforms });
      }
      return res.json({ cover: null });
    }

    // Batch covers (up to 15 games)
    if (action === "covers" && names) {
      const gameNames = names.split("|").slice(0, 15);
      const covers = {};

      for (const gn of gameNames) {
        try {
          const games = await igdbPost("games",
            `search "${gn.replace(/"/g, '\\"')}"; fields name,cover.url; limit 10;`
          );
          const match = bestMatch(games, gn);
          if (match?.cover?.url) {
            covers[gn.toLowerCase()] = match.cover.url
              .replace("//", "https://")
              .replace("t_thumb", "t_cover_big_2x");
          }
        } catch {}
      }
      return res.json({ covers });
    }

    // Search games with covers
    if (action === "search" && name) {
      const games = await igdbPost("games",
        `search "${name.replace(/"/g, '\\"')}"; fields name,cover.url,first_release_date,platforms.abbreviation,rating,summary; limit 5;`
      );
      const results = (games || []).map(g => ({
        id: g.id,
        name: g.name,
        cover: g.cover?.url?.replace("//", "https://").replace("t_thumb", "t_cover_big_2x") || null,
        platforms: (g.platforms || []).map(p => p.abbreviation).filter(Boolean),
        rating: g.rating ? Math.round(g.rating / 20 * 10) / 10 : null,
        year: g.first_release_date ? new Date(g.first_release_date * 1000).getFullYear() : null,
        summary: g.summary?.slice(0, 200) || null,
      }));
      return res.json({ results });
    }

    return res.status(400).json({ error: "Invalid action. Use: cover, covers, or search" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
