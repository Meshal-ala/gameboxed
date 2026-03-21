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

  const { action, name, names } = req.query;

  try {
    // Single game cover
    if (action === "cover" && name) {
      const games = await igdbPost("games",
        `search "${name.replace(/"/g, '\\"')}"; fields name,cover.url,platforms.abbreviation; limit 1;`
      );
      if (games?.[0]?.cover?.url) {
        const url = games[0].cover.url
          .replace("//", "https://")
          .replace("t_thumb", "t_cover_big_2x");
        const platforms = (games[0].platforms || []).map(p => p.abbreviation).filter(Boolean);
        return res.json({ cover: url, name: games[0].name, platforms });
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
            `search "${gn.replace(/"/g, '\\"')}"; fields name,cover.url; limit 1;`
          );
          if (games?.[0]?.cover?.url) {
            covers[gn.toLowerCase()] = games[0].cover.url
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
