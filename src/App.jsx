import { useState, useEffect, useRef } from "react";

const API_KEY = "33d378268c5d452ab1f3a9cb04c89f38";
const API = "https://api.rawg.io/api";

const PARENT_PLATFORMS = {
  1: { name: "PC", icon: "🖥️", color: "#00d4ff" },
  2: { name: "PlayStation", icon: "🎮", color: "#006FCD" },
  3: { name: "Xbox", icon: "🟢", color: "#107C10" },
  7: { name: "Nintendo", icon: "🔴", color: "#E60012" },
};

const STATUS_CFG = {
  completed: { color: "#00ff88", label: "Completed", icon: "✓" },
  playing: { color: "#00d4ff", label: "Playing", icon: "▶" },
  wishlist: { color: "#FFD700", label: "Wishlist", icon: "☆" },
  dropped: { color: "#ff4444", label: "Dropped", icon: "✕" },
  backlog: { color: "#8b5cf6", label: "Backlog", icon: "◷" },
};

const loadUserData = () => { try { return JSON.parse(localStorage.getItem("gb_user") || "{}"); } catch { return {}; } };
const saveUserData = (d) => localStorage.setItem("gb_user", JSON.stringify(d));

const fetchGames = async (params = "") => {
  try { const r = await fetch(`${API}/games?key=${API_KEY}&page_size=20${params}`); const d = await r.json(); return d.results || []; } catch { return []; }
};
const fetchGameDetail = async (id) => {
  try { const r = await fetch(`${API}/games/${id}?key=${API_KEY}`); return await r.json(); } catch { return null; }
};
const searchGamesAPI = async (q) => {
  try { const r = await fetch(`${API}/games?key=${API_KEY}&search=${encodeURIComponent(q)}&page_size=20&search_precise=true`); const d = await r.json(); return d.results || []; } catch { return []; }
};

const norm = (g) => ({
  id: g.id, title: g.name, year: g.released?.slice(0, 4) || "TBA",
  img: g.background_image || "", rating: g.rating ? Math.round(g.rating * 10) / 10 : null,
  metacritic: g.metacritic, reviews: g.ratings_count || 0,
  genre: g.genres?.map(x => x.name).slice(0, 2).join(", ") || "Unknown",
  platforms: (g.parent_platforms || []).map(p => PARENT_PLATFORMS[p.platform.id]).filter(Boolean),
  screenshots: g.short_screenshots?.map(s => s.image) || [],
  slug: g.slug,
});

const useIsMobile = () => {
  const [m, setM] = useState(window.innerWidth < 768);
  useEffect(() => { const h = () => setM(window.innerWidth < 768); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, []);
  return m;
};

const Stars = ({ rating, size = 14, interactive, onRate }) => {
  const [h, setH] = useState(0);
  return <div style={{ display: "flex", gap: 1 }}>{[1,2,3,4,5].map(s =>
    <span key={s} onMouseEnter={() => interactive && setH(s)} onMouseLeave={() => interactive && setH(0)}
      onClick={() => interactive && onRate?.(s)} style={{ fontSize: size, cursor: interactive ? "pointer" : "default",
      color: s <= (h || rating) ? "#FFD700" : "#2a2a3a", transition: "all .15s",
      transform: interactive && s <= h ? "scale(1.2)" : "scale(1)",
      filter: s <= (h || rating) ? "drop-shadow(0 0 3px rgba(255,215,0,.4))" : "none" }}>★</span>
  )}</div>;
};

const Ring = ({ pct, size = 52, stroke = 3.5 }) => {
  const r = (size - stroke) / 2, c = r * 2 * Math.PI;
  const col = pct === 100 ? "#FFD700" : pct >= 70 ? "#00ff88" : "#00d4ff";
  return <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#161625" strokeWidth={stroke} />
    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={stroke}
      strokeDasharray={c} strokeDashoffset={c - (pct/100) * c} strokeLinecap="round"
      style={{ transition: "stroke-dashoffset .8s cubic-bezier(.4,0,.2,1)" }} />
    <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
      fill="#fff" fontSize={size * .22} fontWeight="800"
      style={{ transform: "rotate(90deg)", transformOrigin: "center" }}>{pct}%</text>
  </svg>;
};

const Loader = () => <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
  <div style={{ width: 32, height: 32, border: "3px solid #1a1a2e", borderTopColor: "#00d4ff", borderRadius: "50%", animation: "spin .8s linear infinite" }} /></div>;

const Section = ({ title, action, onAction, children, mobile }) => (
  <div style={{ marginBottom: 32 }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
      <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: mobile ? 17 : 19, fontWeight: 800 }}>{title}</h2>
      {action && <span onClick={onAction} style={{ fontSize: 12, color: "#00d4ff", cursor: "pointer", fontWeight: 700 }}>{action}</span>}
    </div>{children}</div>
);

const GameCard = ({ game, onClick, wide, delay = 0, mobile, userData }) => {
  const [hov, setHov] = useState(false);
  const [vis, setVis] = useState(false);
  const [err, setErr] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);
  const ud = userData?.[game.id];
  return <div onClick={() => onClick?.(game)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
    style={{ borderRadius: mobile ? 14 : 16, overflow: "hidden", cursor: "pointer", position: "relative",
      aspectRatio: wide ? "16/9" : mobile ? "16/9" : "16/10",
      opacity: vis ? 1 : 0, transform: vis ? (hov && !mobile ? "translateY(-6px) scale(1.015)" : "none") : "translateY(16px)",
      transition: "all .4s cubic-bezier(.22,1,.36,1)",
      boxShadow: hov && !mobile ? "0 24px 48px rgba(0,0,0,.6),0 0 0 1px rgba(0,212,255,.15)" : "0 4px 24px rgba(0,0,0,.3),0 0 0 1px rgba(255,255,255,.04)" }}>
    {!err && game.img ? <img src={game.img} alt={game.title} onError={() => setErr(true)} loading="lazy"
      style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .6s cubic-bezier(.22,1,.36,1)",
        transform: hov && !mobile ? "scale(1.08)" : "scale(1)" }} />
      : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#0f0c29,#302b63)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, color: "#ffffff30" }}>🎮</div>}
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,.92) 0%,rgba(0,0,0,.3) 50%,transparent 100%)" }} />
    {ud?.status && <div style={{ position: "absolute", top: 8, left: 8, padding: "3px 8px", borderRadius: 20,
      background: "rgba(0,0,0,.55)", backdropFilter: "blur(8px)", border: "1px solid " + (STATUS_CFG[ud.status]?.color||"#333") + "40",
      fontSize: 9, fontWeight: 800, color: STATUS_CFG[ud.status]?.color, display: "flex", alignItems: "center", gap: 3 }}>
      {STATUS_CFG[ud.status]?.icon} {STATUS_CFG[ud.status]?.label}</div>}
    {game.metacritic && <div style={{ position: "absolute", top: 8, right: 8, width: 32, height: 32, borderRadius: 8,
      background: "rgba(0,0,0,.6)", backdropFilter: "blur(8px)",
      border: "2px solid " + (game.metacritic >= 75 ? "#00ff88" : game.metacritic >= 50 ? "#FFD700" : "#ff4444"),
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900,
      color: game.metacritic >= 75 ? "#00ff88" : game.metacritic >= 50 ? "#FFD700" : "#ff4444" }}>{game.metacritic}</div>}
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: wide ? "16px 18px" : mobile ? "10px 12px" : "12px 14px" }}>
      <h3 style={{ fontSize: wide ? 20 : mobile ? 15 : 14, fontWeight: 800, margin: 0, textShadow: "0 2px 8px rgba(0,0,0,.8)" }}>{game.title}</h3>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, fontSize: 10, color: "rgba(255,255,255,.55)" }}>
        <span>{game.year}</span><span style={{ opacity: .3 }}>·</span><span>{game.genre}</span></div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
        {game.rating ? <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Stars rating={Math.round(game.rating)} size={10} /><span style={{ fontSize: 11, fontWeight: 800, color: "#FFD700" }}>{game.rating}</span>
        </div> : <span style={{ fontSize: 10, color: "#ffffff35", fontStyle: "italic" }}>Not rated</span>}
        <div style={{ display: "flex", gap: 3 }}>
          {game.platforms.slice(0, 3).map((p, i) => <span key={i} style={{ fontSize: 8, fontWeight: 800, padding: "2px 5px", borderRadius: 3, background: "rgba(255,255,255,.1)", color: p.color }}>{p.name}</span>)}</div>
      </div>
    </div>
  </div>;
};

const Modal = ({ game, onClose, mobile, userData, setUserData }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const ud = userData[game.id] || {};
  const [mr, setMr] = useState(ud.myRating || 0);
  const [st, setSt] = useState(ud.status || "");
  const [tab, setTab] = useState("overview");
  useEffect(() => { setLoading(true); fetchGameDetail(game.id).then(d => { setDetail(d); setLoading(false); }); }, [game.id]);
  const upd = (f, v) => { const n = { ...userData, [game.id]: { ...ud, [f]: v, title: game.title, img: game.img } }; setUserData(n); saveUserData(n); };

  return <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,.9)", backdropFilter: "blur(24px)",
    display: "flex", alignItems: mobile ? "flex-end" : "center", justifyContent: "center", animation: "fadeIn .2s", padding: mobile ? 0 : 16 }}>
    <div onClick={e => e.stopPropagation()} style={{ background: "#0c0c18", width: "100%", maxWidth: mobile ? "100%" : 700,
      maxHeight: mobile ? "92vh" : "88vh", borderRadius: mobile ? "24px 24px 0 0" : 24, overflow: "auto",
      border: mobile ? "none" : "1px solid rgba(255,255,255,.06)", boxShadow: "0 -8px 40px rgba(0,0,0,.5)",
      animation: mobile ? "slideFromBottom .3s cubic-bezier(.22,1,.36,1)" : "slideUp .35s cubic-bezier(.22,1,.36,1)" }}>
      {mobile && <div onClick={onClose} style={{ display: "flex", justifyContent: "center", padding: "10px 0 0" }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,.2)" }} /></div>}
      <div style={{ position: "relative", height: mobile ? 180 : 220, overflow: "hidden" }}>
        <img src={game.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,#0c0c18 0%,rgba(12,12,24,.5) 50%,rgba(12,12,24,.2) 100%)" }} />
        {!mobile && <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, width: 38, height: 38, borderRadius: 10,
          background: "rgba(0,0,0,.5)", border: "1px solid rgba(255,255,255,.1)", color: "#fff", fontSize: 16, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>}
        <div style={{ position: "absolute", bottom: 14, left: mobile ? 16 : 24, right: mobile ? 16 : 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div><h2 style={{ fontSize: mobile ? 22 : 28, fontWeight: 900, margin: 0, textShadow: "0 4px 16px rgba(0,0,0,.8)" }}>{game.title}</h2>
            <div style={{ color: "rgba(255,255,255,.45)", fontSize: 12, marginTop: 2 }}>{game.year} · {game.genre}{game.reviews > 0 && " · " + (game.reviews/1000).toFixed(1) + "k ratings"}</div></div>
          {game.rating && <div style={{ textAlign: "center", flexShrink: 0 }}><div style={{ fontSize: mobile ? 28 : 36, fontWeight: 900, color: "#FFD700", lineHeight: 1 }}>{game.rating}</div>
            <Stars rating={Math.round(game.rating)} size={10} /></div>}
        </div>
      </div>
      <div style={{ padding: mobile ? "14px 16px 28px" : "18px 24px 28px" }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          {game.platforms.map((p, i) => <span key={i} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700,
            background: p.color + "10", color: p.color, border: "1px solid " + p.color + "28" }}>{p.icon} {p.name}</span>)}
          {game.metacritic && <span style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700,
            background: (game.metacritic >= 75 ? "#00ff88" : "#FFD700") + "10",
            color: game.metacritic >= 75 ? "#00ff88" : "#FFD700",
            border: "1px solid " + (game.metacritic >= 75 ? "#00ff88" : "#FFD700") + "28" }}>Metacritic {game.metacritic}</span>}
        </div>
        {loading ? <Loader /> : detail?.description_raw && <p style={{ color: "#777", fontSize: 13, lineHeight: 1.7, marginBottom: 18, maxHeight: 100, overflow: "hidden",
          WebkitMaskImage: "linear-gradient(to bottom, black 60%, transparent)" }}>{detail.description_raw.slice(0, 400)}</p>}
        <div style={{ padding: mobile ? 14 : 18, borderRadius: 14, background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.05)", marginBottom: 18 }}>
          <div style={{ fontSize: 10, color: "#555", fontWeight: 700, letterSpacing: ".08em", marginBottom: 6 }}>YOUR RATING</div>
          <Stars rating={mr} size={mobile ? 24 : 26} interactive onRate={v => { setMr(v); upd("myRating", v); }} />
          <div style={{ fontSize: 10, color: "#555", fontWeight: 700, letterSpacing: ".08em", marginTop: 14, marginBottom: 6 }}>ADD TO LIBRARY</div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {Object.entries(STATUS_CFG).map(([k, c]) => <button key={k} onClick={() => { setSt(k); upd("status", k); }} style={{
              padding: "5px 12px", borderRadius: 18, fontSize: 11, fontWeight: 700, cursor: "pointer",
              border: "1px solid " + (st === k ? c.color : "#222"), background: st === k ? c.color + "15" : "transparent",
              color: st === k ? c.color : "#555" }}>{c.icon} {c.label}</button>)}
          </div>
        </div>
        {game.screenshots?.length > 1 && <>
          <div style={{ fontSize: 10, color: "#555", fontWeight: 700, letterSpacing: ".08em", marginBottom: 8 }}>SCREENSHOTS</div>
          <div className="hide-scroll" style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 18, paddingBottom: 4 }}>
            {game.screenshots.slice(1, 6).map((s, i) => <img key={i} src={s} alt="" loading="lazy"
              style={{ height: mobile ? 70 : 80, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />)}</div></>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <div style={{ padding: 12, borderRadius: 12, background: "rgba(255,255,255,.025)", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "#444", fontWeight: 700 }}>RATING</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#FFD700", marginTop: 4 }}>{game.rating || "—"}<span style={{ fontSize: 11, color: "#444" }}>/5</span></div></div>
          <div style={{ padding: 12, borderRadius: 12, background: "rgba(255,255,255,.025)", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "#444", fontWeight: 700 }}>METACRITIC</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: game.metacritic >= 75 ? "#00ff88" : "#FFD700", marginTop: 4 }}>{game.metacritic || "—"}</div></div>
          <div style={{ padding: 12, borderRadius: 12, background: "rgba(255,255,255,.025)", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "#444", fontWeight: 700 }}>MY RATING</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#00d4ff", marginTop: 4 }}>{mr || "—"}<span style={{ fontSize: 11, color: "#444" }}>/5</span></div></div>
        </div>
      </div>
    </div>
  </div>;
};

export default function App() {
  const mobile = useIsMobile();
  const [page, setPage] = useState("home");
  const [sel, setSel] = useState(null);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [userData, setUserData] = useState(loadUserData);
  const [popular, setPopular] = useState([]);
  const [bestOfAllTime, setBestOfAllTime] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [libFilter, setLibFilter] = useState("all");
  const searchTimer = useRef(null);

  useEffect(() => {
    setLoading(true);
    const today = new Date().toISOString().slice(0, 10);
    const lastYear = new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10);
    const nextYear = new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10);
    Promise.all([
      fetchGames(`&dates=${lastYear},${today}&ordering=-rating&metacritic=70,100`),
      fetchGames(`&ordering=-metacritic&metacritic=85,100`),
      fetchGames(`&dates=${lastYear},${today}&ordering=-released`),
      fetchGames(`&dates=${today},${nextYear}&ordering=-added`),
    ]).then(([p, b, n, u]) => {
      setPopular(p.map(norm));
      setBestOfAllTime(b.map(norm));
      setNewReleases(n.map(norm));
      setUpcoming(u.map(norm));
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!search.trim()) { setSearchResults([]); return; }
    setSearching(true);
    searchTimer.current = setTimeout(() => {
      searchGamesAPI(search).then(r => { setSearchResults(r.map(norm)); setSearching(false); });
    }, 400);
  }, [search]);

  const allGames = [...popular, ...bestOfAllTime, ...newReleases, ...upcoming, ...searchResults];
  const libraryGames = Object.entries(userData).filter(([_, v]) => v.status).map(([id, v]) => {
    const found = allGames.find(g => g.id === parseInt(id));
    return found || { id: parseInt(id), title: v.title || "Unknown", img: v.img || "", year: "", genre: "", rating: null, platforms: [], metacritic: null };
  });
  const filteredLib = libFilter === "all" ? libraryGames : libraryGames.filter(g => userData[g.id]?.status === libFilter);

  const NAV = [{ id: "home", icon: "🏠", l: "Home" }, { id: "library", icon: "📚", l: "Library" }, { id: "explore", icon: "🔍", l: "Explore" }, { id: "stats", icon: "📊", l: "Stats" }];

  return <div style={{ fontFamily: "'DM Sans','Outfit',system-ui,sans-serif", background: "#08080f", color: "#fff", minHeight: "100vh" }}>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,100..1000&family=Outfit:wght@100..900&display=swap');
      *{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#222;border-radius:3px}
      @keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
      @keyframes slideFromBottom{from{transform:translateY(100%)}to{transform:translateY(0)}}@keyframes spin{to{transform:rotate(360deg)}}
      body{background:#08080f;overflow-x:hidden}img{-webkit-user-drag:none}.hide-scroll::-webkit-scrollbar{display:none}.hide-scroll{-ms-overflow-style:none;scrollbar-width:none}
      @media(max-width:767px){*{-webkit-tap-highlight-color:transparent}}
    `}</style>

    {/* DESKTOP NAV */}
    {!mobile && <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(8,8,15,.82)", backdropFilter: "blur(24px) saturate(1.4)",
      borderBottom: "1px solid rgba(255,255,255,.04)", padding: "0 24px", height: 54, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <div onClick={() => { setPage("home"); setSearch(""); }} style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer" }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg,#00d4ff,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900 }}>G</div>
          <span style={{ fontFamily: "'Outfit'", fontSize: 17, fontWeight: 900, letterSpacing: ".04em", background: "linear-gradient(135deg,#00d4ff,#8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Gameboxed</span></div>
        <div style={{ display: "flex", gap: 2 }}>{NAV.map(n => <button key={n.id} onClick={() => { setPage(n.id); setSearch(""); }} style={{
          padding: "5px 10px", borderRadius: 7, border: "none", background: page === n.id ? "rgba(255,255,255,.06)" : "transparent",
          color: page === n.id ? "#00d4ff" : "#555", cursor: "pointer", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 12 }}>{n.icon}</span>{n.l}</button>)}</div></div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ position: "relative" }}><input placeholder="Search 500k+ games..." value={search} onChange={e => { setSearch(e.target.value); if (e.target.value) setPage("search"); }}
          style={{ padding: "6px 10px 6px 30px", borderRadius: 8, border: "1px solid rgba(255,255,255,.06)", background: "rgba(255,255,255,.04)", color: "#fff", fontSize: 12, width: 200, outline: "none", transition: "all .3s" }}
          onFocus={e => { e.target.style.width = "280px"; e.target.style.borderColor = "rgba(0,212,255,.3)"; }}
          onBlur={e => { e.target.style.width = "200px"; e.target.style.borderColor = "rgba(255,255,255,.06)"; }} />
          <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#444" }}>🔍</span></div>
        <div style={{ width: 30, height: 30, borderRadius: 7, background: "linear-gradient(135deg,#00d4ff,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>M</div></div>
    </nav>}

    {/* MOBILE TOP */}
    {mobile && <div style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(8,8,15,.9)", backdropFilter: "blur(20px)",
      padding: "0 16px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
      {searchOpen ? <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
        <input autoFocus placeholder="Search 500k+ games..." value={search} onChange={e => { setSearch(e.target.value); if (e.target.value) setPage("search"); }}
          style={{ flex: 1, padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(0,212,255,.3)", background: "rgba(255,255,255,.06)", color: "#fff", fontSize: 14, outline: "none" }} />
        <span onClick={() => { setSearchOpen(false); setSearch(""); setPage("home"); }} style={{ color: "#00d4ff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Cancel</span>
      </div> : <>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: "linear-gradient(135deg,#00d4ff,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900 }}>G</div>
          <span style={{ fontFamily: "'Outfit'", fontSize: 16, fontWeight: 900, letterSpacing: ".04em", background: "linear-gradient(135deg,#00d4ff,#8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Gameboxed</span></div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span onClick={() => { setSearchOpen(true); setPage("search"); }} style={{ fontSize: 18, cursor: "pointer" }}>🔍</span>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg,#00d4ff,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>M</div></div></>}
    </div>}

    <main style={{ maxWidth: 1200, margin: "0 auto", padding: mobile ? "12px 14px 100px" : "20px 18px 80px" }}>

      {page === "search" && <div style={{ animation: "fadeIn .4s" }}>
        <h2 style={{ fontFamily: "'Outfit'", fontSize: mobile ? 22 : 26, fontWeight: 900, marginBottom: 18 }}>{search ? `Results for "${search}"` : "Search for any game..."}</h2>
        {searching ? <Loader /> : searchResults.length > 0 ? <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(auto-fill,minmax(220px,1fr))", gap: mobile ? 10 : 14 }}>
          {searchResults.map((g, i) => <GameCard key={g.id} game={g} delay={i * 40} onClick={setSel} mobile={mobile} userData={userData} />)}
        </div> : search && <div style={{ textAlign: "center", padding: 60, color: "#444" }}><div style={{ fontSize: 48, marginBottom: 10 }}>🔍</div><div style={{ fontSize: 15, fontWeight: 700 }}>No games found</div></div>}
      </div>}

      {page === "home" && <div style={{ animation: "fadeIn .4s" }}>
        <div style={{ borderRadius: mobile ? 18 : 22, padding: mobile ? "28px 22px" : "44px 36px", marginBottom: mobile ? 24 : 36,
          background: "linear-gradient(135deg,#0a0a18 0%,#12122a 40%,#0d1a30 100%)", border: "1px solid rgba(255,255,255,.04)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -80, right: -40, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(0,212,255,.06),transparent 70%)" }} />
          <h1 style={{ fontFamily: "'Outfit'", fontSize: mobile ? 28 : 40, fontWeight: 900, letterSpacing: "-.03em", lineHeight: 1.1, marginBottom: 10, position: "relative",
            background: "linear-gradient(135deg,#fff 20%,#00d4ff 80%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Track Every Game.{mobile ? " " : <br />}Share Your Journey.</h1>
          <p style={{ color: "#666", fontSize: mobile ? 13 : 14, maxWidth: 460, lineHeight: 1.7, marginBottom: mobile ? 18 : 24, position: "relative" }}>Discover 500,000+ games. Rate, review, and build your ultimate collection.</p>
          <div style={{ display: "flex", gap: 10, position: "relative" }}>
            <button onClick={() => setPage("library")} style={{ padding: "10px 22px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#00d4ff,#0088bb)", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 20px rgba(0,212,255,.25)" }}>My Library →</button>
            <button onClick={() => setPage("explore")} style={{ padding: "10px 22px", borderRadius: 10, border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.03)", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Explore</button></div></div>
        {loading ? <Loader /> : <>
          <Section title="🔥 Popular Right Now" action="See All →" onAction={() => setPage("explore")} mobile={mobile}>
            <div className="hide-scroll" style={{ display: "flex", gap: mobile ? 10 : 14, overflowX: "auto", paddingBottom: 4 }}>
              {popular.slice(0, 10).map((g, i) => <div key={g.id} style={{ minWidth: mobile ? 200 : 230, flex: "0 0 auto" }}><GameCard game={g} delay={i * 60} onClick={setSel} mobile={mobile} userData={userData} /></div>)}</div></Section>
          <Section title="🏆 Best of All Time" mobile={mobile}>
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: mobile ? 10 : 14 }}>
              {bestOfAllTime.slice(0, 2).map((g, i) => <GameCard key={g.id} game={g} wide delay={i * 100} onClick={setSel} mobile={mobile} userData={userData} />)}</div></Section>
          <Section title="🆕 Recently Released" mobile={mobile}>
            <div className="hide-scroll" style={{ display: "flex", gap: mobile ? 10 : 14, overflowX: "auto", paddingBottom: 4 }}>
              {newReleases.slice(0, 10).map((g, i) => <div key={g.id} style={{ minWidth: mobile ? 200 : 230, flex: "0 0 auto" }}><GameCard game={g} delay={i * 60} onClick={setSel} mobile={mobile} userData={userData} /></div>)}</div></Section>
          {upcoming.length > 0 && <Section title="📅 Coming Soon" mobile={mobile}>
            <div className="hide-scroll" style={{ display: "flex", gap: mobile ? 10 : 14, overflowX: "auto", paddingBottom: 4 }}>
              {upcoming.slice(0, 10).map((g, i) => <div key={g.id} style={{ minWidth: mobile ? 200 : 230, flex: "0 0 auto" }}><GameCard game={g} delay={i * 60} onClick={setSel} mobile={mobile} userData={userData} /></div>)}</div></Section>}
        </>}</div>}

      {page === "library" && <div style={{ animation: "fadeIn .4s" }}>
        <h2 style={{ fontFamily: "'Outfit'", fontSize: mobile ? 22 : 26, fontWeight: 900, marginBottom: 16 }}>📚 My Library</h2>
        {libraryGames.length > 0 ? <>
          <div className="hide-scroll" style={{ display: "flex", gap: 5, marginBottom: 18, overflowX: "auto", paddingBottom: 8 }}>
            {[["all","All"],["playing","Playing"],["completed","Done"],["backlog","Backlog"],["wishlist","Wishlist"],["dropped","Dropped"]].map(([k,l]) =>
              <button key={k} onClick={() => setLibFilter(k)} style={{ padding: "5px 13px", borderRadius: 18, fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
                border: libFilter === k ? "1px solid #00d4ff" : "1px solid rgba(255,255,255,.06)", background: libFilter === k ? "#00d4ff14" : "transparent",
                color: libFilter === k ? "#00d4ff" : "#555" }}>{l} <span style={{ opacity: .5 }}>{k === "all" ? libraryGames.length : libraryGames.filter(g => userData[g.id]?.status === k).length}</span></button>)}</div>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(auto-fill,minmax(220px,1fr))", gap: mobile ? 10 : 14 }}>
            {filteredLib.map((g, i) => <GameCard key={g.id} game={g} delay={i * 50} onClick={setSel} mobile={mobile} userData={userData} />)}</div>
        </> : <div style={{ textAlign: "center", padding: 60, color: "#555" }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🎮</div><div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Your library is empty</div>
          <div style={{ fontSize: 13, color: "#444", marginBottom: 20 }}>Search for games and add them to your collection!</div>
          <button onClick={() => { setPage("search"); setSearchOpen(true); }} style={{ padding: "10px 24px", borderRadius: 10, border: "none",
            background: "linear-gradient(135deg,#00d4ff,#0088bb)", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Search Games</button></div>}
      </div>}

      {page === "explore" && <div style={{ animation: "fadeIn .4s" }}>
        <h2 style={{ fontFamily: "'Outfit'", fontSize: mobile ? 22 : 26, fontWeight: 900, marginBottom: 18 }}>🔍 Explore</h2>
        {loading ? <Loader /> : <>
          <Section title="🏆 Highest Metacritic Scores" mobile={mobile}>
            <div className="hide-scroll" style={{ display: "flex", gap: mobile ? 10 : 14, overflowX: "auto", paddingBottom: 4 }}>
              {bestOfAllTime.map((g, i) => <div key={g.id} style={{ minWidth: mobile ? 200 : 230, flex: "0 0 auto" }}><GameCard game={g} delay={i * 60} onClick={setSel} mobile={mobile} userData={userData} /></div>)}</div></Section>
          <Section title="🔥 Popular This Year" mobile={mobile}>
            <div className="hide-scroll" style={{ display: "flex", gap: mobile ? 10 : 14, overflowX: "auto", paddingBottom: 4 }}>
              {popular.map((g, i) => <div key={g.id} style={{ minWidth: mobile ? 200 : 230, flex: "0 0 auto" }}><GameCard game={g} delay={i * 60} onClick={setSel} mobile={mobile} userData={userData} /></div>)}</div></Section>
          <Section title="🆕 Just Dropped" mobile={mobile}>
            <div className="hide-scroll" style={{ display: "flex", gap: mobile ? 10 : 14, overflowX: "auto", paddingBottom: 4 }}>
              {newReleases.map((g, i) => <div key={g.id} style={{ minWidth: mobile ? 200 : 230, flex: "0 0 auto" }}><GameCard game={g} delay={i * 60} onClick={setSel} mobile={mobile} userData={userData} /></div>)}</div></Section>
          {upcoming.length > 0 && <Section title="📅 Upcoming" mobile={mobile}>
            <div className="hide-scroll" style={{ display: "flex", gap: mobile ? 10 : 14, overflowX: "auto", paddingBottom: 4 }}>
              {upcoming.map((g, i) => <div key={g.id} style={{ minWidth: mobile ? 200 : 230, flex: "0 0 auto" }}><GameCard game={g} delay={i * 60} onClick={setSel} mobile={mobile} userData={userData} /></div>)}</div></Section>}
        </>}</div>}

      {page === "stats" && <div style={{ animation: "fadeIn .4s" }}>
        <h2 style={{ fontFamily: "'Outfit'", fontSize: mobile ? 22 : 26, fontWeight: 900, marginBottom: 20 }}>📊 Your Stats</h2>
        {libraryGames.length > 0 ? (() => {
          const byS = (s) => libraryGames.filter(g => userData[g.id]?.status === s).length;
          const rated = libraryGames.filter(g => userData[g.id]?.myRating);
          const avgR = rated.length ? (rated.reduce((s, g) => s + userData[g.id].myRating, 0) / rated.length).toFixed(1) : "0";
          return <>
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(auto-fit,minmax(140px,1fr))", gap: 10, marginBottom: 28 }}>
              {[{ l: "In Library", v: libraryGames.length, i: "🎮", c: "#00d4ff" }, { l: "Completed", v: byS("completed"), i: "✅", c: "#00ff88" },
                { l: "Playing", v: byS("playing"), i: "▶️", c: "#8b5cf6" }, { l: "Avg Rating", v: avgR + "★", i: "⭐", c: "#FFD700" }].map((s, i) =>
                <div key={i} style={{ padding: mobile ? 14 : 18, borderRadius: 14, textAlign: "center", background: "linear-gradient(135deg," + s.c + "08," + s.c + "04)", border: "1px solid " + s.c + "18" }}>
                  <div style={{ fontSize: mobile ? 22 : 26, marginBottom: 4 }}>{s.i}</div><div style={{ fontSize: mobile ? 22 : 26, fontWeight: 900, color: s.c }}>{s.v}</div>
                  <div style={{ fontSize: 10, color: "#555", fontWeight: 700, marginTop: 2 }}>{s.l}</div></div>)}</div>
            <h3 style={{ fontFamily: "'Outfit'", fontSize: 17, fontWeight: 800, marginBottom: 14 }}>Status Breakdown</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Object.entries(STATUS_CFG).map(([k, c]) => { const cnt = byS(k), max = libraryGames.length || 1;
                return <div key={k} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 80, fontSize: 12, color: "#777", fontWeight: 600, textAlign: "right" }}>{c.label}</span>
                  <div style={{ flex: 1, height: 24, background: "rgba(255,255,255,.03)", borderRadius: 6, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: cnt > 0 ? (cnt/max*100)+"%" : "0%", background: c.color, borderRadius: 6, display: "flex", alignItems: "center", paddingLeft: 8, opacity: .8, transition: "width 1s" }}>
                      {cnt > 0 && <span style={{ fontSize: 10, fontWeight: 800 }}>{cnt}</span>}</div></div></div>; })}</div>
          </>;
        })() : <div style={{ textAlign: "center", padding: 60, color: "#555" }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>📊</div><div style={{ fontSize: 15, fontWeight: 700 }}>No stats yet</div>
          <div style={{ fontSize: 13, color: "#444", marginTop: 4 }}>Add games to your library to see stats!</div></div>}
      </div>}
    </main>

    {mobile && <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 90, background: "rgba(8,8,15,.92)", backdropFilter: "blur(20px)",
      borderTop: "1px solid rgba(255,255,255,.06)", display: "flex", paddingTop: 6, paddingBottom: "max(env(safe-area-inset-bottom, 16px), 16px)" }}>
      {NAV.map(n => <div key={n.id} onClick={() => { setPage(n.id); setSearch(""); setSearchOpen(false); }}
        style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, cursor: "pointer", padding: "4px 0" }}>
        <span style={{ fontSize: 22, opacity: page === n.id ? 1 : 0.35, transform: page === n.id ? "scale(1.1)" : "scale(1)", transition: "all .2s" }}>{n.icon}</span>
        <span style={{ fontSize: 9, fontWeight: 700, color: page === n.id ? "#00d4ff" : "#555" }}>{n.l}</span>
        {page === n.id && <div style={{ width: 4, height: 4, borderRadius: 2, background: "#00d4ff", marginTop: -1 }} />}</div>)}</div>}

    {sel && <Modal game={sel} onClose={() => setSel(null)} mobile={mobile} userData={userData} setUserData={setUserData} />}
  </div>;
}
