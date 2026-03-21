const STEAM_KEY = process.env.STEAM_API_KEY;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { action, steamid, vanity } = req.query;

  try {
    // Resolve vanity URL to Steam ID
    if (action === "resolve") {
      const r = await fetch(`https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${STEAM_KEY}&vanityurl=${vanity}`);
      const d = await r.json();
      return res.json(d.response);
    }

    // Get player summary (profile info)
    if (action === "profile") {
      const r = await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_KEY}&steamids=${steamid}`);
      const d = await r.json();
      return res.json(d.response?.players?.[0] || null);
    }

    // Get owned games with playtime
    if (action === "games") {
      const r = await fetch(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${STEAM_KEY}&steamid=${steamid}&format=json&include_appinfo=1&include_played_free_games=1`);
      const d = await r.json();
      const games = (d.response?.games || []).map(g => ({
        appid: g.appid,
        name: g.name,
        playtime: g.playtime_forever || 0, // minutes
        playtime_2weeks: g.playtime_2weeks || 0,
        img: g.img_icon_url ? `https://media.steampowered.com/steamcommunity/public/images/apps/${g.appid}/${g.img_icon_url}.jpg` : null,
        header: `https://cdn.akamai.steamstatic.com/steam/apps/${g.appid}/header.jpg`,
      }));
      // Sort by playtime descending
      games.sort((a, b) => b.playtime - a.playtime);
      return res.json({ count: games.length, games });
    }

    // Get achievements for a specific game
    if (action === "achievements") {
      const { appid } = req.query;
      const r = await fetch(`https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?key=${STEAM_KEY}&steamid=${steamid}&appid=${appid}`);
      const d = await r.json();
      if (!d.playerstats?.achievements) return res.json({ total: 0, achieved: 0, pct: 0 });
      const all = d.playerstats.achievements;
      const done = all.filter(a => a.achieved === 1).length;
      return res.json({ total: all.length, achieved: done, pct: all.length ? Math.round((done / all.length) * 100) : 0 });
    }

    // Get recently played
    if (action === "recent") {
      const r = await fetch(`https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${STEAM_KEY}&steamid=${steamid}&format=json&count=10`);
      const d = await r.json();
      const games = (d.response?.games || []).map(g => ({
        appid: g.appid,
        name: g.name,
        playtime_2weeks: g.playtime_2weeks || 0,
        playtime: g.playtime_forever || 0,
        header: `https://cdn.akamai.steamstatic.com/steam/apps/${g.appid}/header.jpg`,
      }));
      return res.json({ games });
    }

    return res.status(400).json({ error: "Invalid action" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
