import { useState, useEffect } from "react";

const PLATFORMS = {
  PC: { icon: "🖥️", color: "#00d4ff" },
  PS5: { icon: "🎮", color: "#006FCD" },
  Xbox: { icon: "🟢", color: "#107C10" },
  Switch: { icon: "🔴", color: "#E60012" },
};

const STATUS_CFG = {
  completed: { color: "#00ff88", label: "Completed", icon: "✓" },
  playing: { color: "#00d4ff", label: "Playing", icon: "▶" },
  wishlist: { color: "#FFD700", label: "Wishlist", icon: "☆" },
  dropped: { color: "#ff4444", label: "Dropped", icon: "✕" },
  backlog: { color: "#8b5cf6", label: "Backlog", icon: "◷" },
};

const GAMES = [
  { id:1, title:"Elden Ring", year:2022, platforms:["PC","PS5","Xbox"], genre:"Action RPG", rating:4.8, reviews:12400, myRating:5, status:"completed", playtime:186, completion:94, img:"https://cdn.akamai.steamstatic.com/steam/apps/1245620/header.jpg" },
  { id:2, title:"Baldur's Gate 3", year:2023, platforms:["PC","PS5"], genre:"RPG", rating:4.9, reviews:18200, myRating:5, status:"completed", playtime:240, completion:100, img:"https://cdn.akamai.steamstatic.com/steam/apps/1086940/header.jpg" },
  { id:3, title:"God of War Ragnarök", year:2022, platforms:["PS5","PC"], genre:"Action", rating:4.7, reviews:9800, myRating:4, status:"completed", playtime:62, completion:87, img:"https://cdn.akamai.steamstatic.com/steam/apps/2322010/header.jpg" },
  { id:4, title:"Cyberpunk 2077", year:2020, platforms:["PC","PS5","Xbox"], genre:"RPG", rating:4.3, reviews:15600, myRating:4, status:"completed", playtime:130, completion:76, img:"https://cdn.akamai.steamstatic.com/steam/apps/1091500/header.jpg" },
  { id:5, title:"Ghost of Tsushima", year:2024, platforms:["PC","PS5"], genre:"Action", rating:4.6, reviews:8200, myRating:null, status:"playing", playtime:45, completion:55, img:"https://cdn.akamai.steamstatic.com/steam/apps/2215430/header.jpg" },
  { id:6, title:"Red Dead Redemption 2", year:2019, platforms:["PC","PS5","Xbox"], genre:"Action", rating:4.9, reviews:21000, myRating:5, status:"completed", playtime:210, completion:68, img:"https://cdn.akamai.steamstatic.com/steam/apps/1174180/header.jpg" },
  { id:7, title:"Sekiro", year:2019, platforms:["PC","PS5","Xbox"], genre:"Action", rating:4.7, reviews:11200, myRating:5, status:"completed", playtime:75, completion:90, img:"https://cdn.akamai.steamstatic.com/steam/apps/814380/header.jpg" },
  { id:8, title:"Marvel Rivals", year:2024, platforms:["PC","PS5","Xbox"], genre:"FPS", rating:4.1, reviews:7800, myRating:4, status:"playing", playtime:95, completion:null, img:"https://cdn.akamai.steamstatic.com/steam/apps/2767030/header.jpg" },
  { id:9, title:"The Witcher 3", year:2015, platforms:["PC","PS5","Xbox","Switch"], genre:"RPG", rating:4.9, reviews:25000, myRating:5, status:"completed", playtime:320, completion:85, img:"https://cdn.akamai.steamstatic.com/steam/apps/292030/header.jpg" },
  { id:10, title:"Hollow Knight: Silksong", year:2025, platforms:["PC","PS5","Xbox","Switch"], genre:"Action", rating:null, reviews:0, myRating:null, status:"wishlist", playtime:0, completion:0, img:"https://cdn.akamai.steamstatic.com/steam/apps/1030300/header.jpg" },
  { id:11, title:"Hades II", year:2024, platforms:["PC"], genre:"Action", rating:4.6, reviews:5400, myRating:null, status:"playing", playtime:28, completion:35, img:"https://cdn.akamai.steamstatic.com/steam/apps/1145350/header.jpg" },
  { id:12, title:"Black Myth Wukong", year:2024, platforms:["PC","PS5"], genre:"Action RPG", rating:4.5, reviews:9100, myRating:4, status:"completed", playtime:42, completion:78, img:"https://cdn.akamai.steamstatic.com/steam/apps/2358720/header.jpg" },
];

const REVIEWS = [
  { user:"GamerX", avatar:"😎", game:"Elden Ring", gid:1, rating:5, text:"A masterpiece that redefines open-world design. Every corner hides discovery.", likes:342, time:"2h" },
  { user:"NightOwl", avatar:"🦉", game:"Baldur's Gate 3", gid:2, rating:5, text:"Larian raised the bar for every RPG. 240 hours and I want to start over.", likes:218, time:"4h" },
  { user:"RetroKing", avatar:"👾", game:"Red Dead Redemption 2", gid:6, rating:5, text:"Arthur Morgan's story will stay with me forever. Gaming's greatest narrative.", likes:456, time:"5h" },
  { user:"ProSniper", avatar:"🎯", game:"Marvel Rivals", gid:8, rating:4, text:"Best hero shooter in years. The Marvel IP makes every match feel epic.", likes:89, time:"8h" },
  { user:"SoulsVet", avatar:"⚔️", game:"Sekiro", gid:7, rating:5, text:"The combat system is unmatched. Once it clicks, nothing else compares.", likes:267, time:"12h" },
];

const LISTS = [
  { title:"Games That Made Me Cry", emoji:"😭", count:12, author:"EmotionalGamer", gids:[2,6,9] },
  { title:"Best Boss Fights Ever", emoji:"👹", count:25, author:"BossHunter", gids:[1,7,12] },
  { title:"Cozy Weekend Games", emoji:"🌧️", count:18, author:"CozyCorner", gids:[9,2,5] },
  { title:"Hardest Platinum Trophies", emoji:"🏆", count:30, author:"TrophyAddict", gids:[1,7,4] },
];

const Stars = ({rating,size=14,interactive,onRate}) => {
  const [h,setH]=useState(0);
  return <div style={{display:"flex",gap:1}}>{[1,2,3,4,5].map(s=>
    <span key={s} onMouseEnter={()=>interactive&&setH(s)} onMouseLeave={()=>interactive&&setH(0)}
      onClick={()=>interactive&&onRate?.(s)} style={{fontSize:size,cursor:interactive?"pointer":"default",
      color:s<=(h||rating)?"#FFD700":"#2a2a3a",transition:"all .15s",
      transform:interactive&&s<=h?"scale(1.2)":"scale(1)",
      filter:s<=(h||rating)?"drop-shadow(0 0 3px rgba(255,215,0,.4))":"none"}}>★</span>
  )}</div>;
};

const Ring = ({pct,size=52,stroke=3.5}) => {
  const r=(size-stroke)/2, c=r*2*Math.PI;
  const col=pct===100?"#FFD700":pct>=70?"#00ff88":"#00d4ff";
  return <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#161625" strokeWidth={stroke}/>
    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={stroke}
      strokeDasharray={c} strokeDashoffset={c-(pct/100)*c} strokeLinecap="round"
      style={{transition:"stroke-dashoffset .8s cubic-bezier(.4,0,.2,1)"}}/>
    <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
      fill="#fff" fontSize={size*.22} fontWeight="800"
      style={{transform:"rotate(90deg)",transformOrigin:"center"}}>{pct}%</text>
  </svg>;
};

const Section = ({title,action,onAction,children}) => (
  <div style={{marginBottom:36}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
      <h2 style={{fontFamily:"'Outfit',sans-serif",fontSize:19,fontWeight:800}}>{title}</h2>
      {action && <span onClick={onAction} style={{fontSize:12,color:"#00d4ff",cursor:"pointer",fontWeight:700}}>{action}</span>}
    </div>
    {children}
  </div>
);

const GameCard = ({game,onClick,wide,delay=0}) => {
  const [hov,setHov]=useState(false);
  const [vis,setVis]=useState(false);
  const [err,setErr]=useState(false);
  useEffect(()=>{const t=setTimeout(()=>setVis(true),delay);return()=>clearTimeout(t)},[delay]);

  return <div onClick={()=>onClick?.(game)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
    style={{borderRadius:16,overflow:"hidden",cursor:"pointer",position:"relative",
      aspectRatio:wide?"16/9":"16/10",
      opacity:vis?1:0,transform:vis?(hov?"translateY(-6px) scale(1.015)":"none"):"translateY(16px)",
      transition:"all .4s cubic-bezier(.22,1,.36,1)",
      boxShadow:hov?"0 24px 48px rgba(0,0,0,.6),0 0 0 1px rgba(0,212,255,.15)":"0 4px 24px rgba(0,0,0,.3),0 0 0 1px rgba(255,255,255,.04)"}}>
    {!err?<img src={game.img} alt={game.title} onError={()=>setErr(true)}
      style={{width:"100%",height:"100%",objectFit:"cover",transition:"transform .6s cubic-bezier(.22,1,.36,1)",
        transform:hov?"scale(1.08)":"scale(1)"}}/>
      :<div style={{width:"100%",height:"100%",background:"linear-gradient(135deg,#0f0c29,#302b63,#24243e)",
        display:"flex",alignItems:"center",justifyContent:"center",fontSize:48,color:"#ffffff30"}}>🎮</div>}
    <div style={{position:"absolute",inset:0,
      background:hov?"linear-gradient(to top,rgba(0,0,0,.95) 0%,rgba(0,0,0,.5) 45%,rgba(0,0,0,.05) 100%)"
        :"linear-gradient(to top,rgba(0,0,0,.88) 0%,rgba(0,0,0,.25) 50%,transparent 100%)",transition:"all .4s"}}/>
    {game.status&&<div style={{position:"absolute",top:10,left:10,padding:"3px 10px",borderRadius:20,
      background:"rgba(0,0,0,.55)",backdropFilter:"blur(8px)",border:`1px solid ${STATUS_CFG[game.status]?.color}40`,
      fontSize:10,fontWeight:800,color:STATUS_CFG[game.status]?.color,display:"flex",alignItems:"center",gap:3}}>
      {STATUS_CFG[game.status]?.icon} {STATUS_CFG[game.status]?.label}</div>}
    {game.completion>0&&<div style={{position:"absolute",top:10,right:10}}>
      <Ring pct={game.completion} size={36} stroke={2.5}/></div>}
    <div style={{position:"absolute",bottom:0,left:0,right:0,padding:wide?"20px 24px":"12px 14px"}}>
      <h3 style={{fontSize:wide?22:14,fontWeight:800,margin:0,textShadow:"0 2px 8px rgba(0,0,0,.8)"}}>{game.title}</h3>
      <div style={{display:"flex",alignItems:"center",gap:6,marginTop:4,fontSize:11,color:"rgba(255,255,255,.55)"}}>
        <span>{game.year}</span><span style={{opacity:.3}}>·</span><span>{game.genre}</span>
        {game.playtime>0&&<><span style={{opacity:.3}}>·</span><span style={{color:"#00d4ff"}}>{game.playtime}h</span></>}
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:7,opacity:hov?1:.75,transition:"opacity .3s"}}>
        {game.rating?<div style={{display:"flex",alignItems:"center",gap:5}}>
          <Stars rating={Math.round(game.rating)} size={11}/><span style={{fontSize:12,fontWeight:800,color:"#FFD700"}}>{game.rating}</span>
        </div>:<span style={{fontSize:10,color:"#ffffff35",fontStyle:"italic"}}>Coming Soon</span>}
        <div style={{display:"flex",gap:3}}>
          {game.platforms.map(p=><span key={p} style={{fontSize:8,fontWeight:800,padding:"2px 5px",
            borderRadius:3,background:"rgba(255,255,255,.1)",color:PLATFORMS[p]?.color}}>{p}</span>)}
        </div>
      </div>
    </div>
  </div>;
};

const Modal = ({game,onClose}) => {
  const [mr,setMr]=useState(game.myRating||0);
  const [st,setSt]=useState(game.status);
  const [tab,setTab]=useState("overview");
  const [err,setErr]=useState(false);

  return <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:1000,
    background:"rgba(0,0,0,.88)",backdropFilter:"blur(24px)",
    display:"flex",alignItems:"center",justifyContent:"center",animation:"fadeIn .25s",padding:16}}>
    <div onClick={e=>e.stopPropagation()} style={{background:"#0c0c18",borderRadius:24,
      width:"100%",maxWidth:700,maxHeight:"88vh",overflow:"auto",
      border:"1px solid rgba(255,255,255,.06)",boxShadow:"0 40px 120px rgba(0,0,0,.9)",
      animation:"slideUp .35s cubic-bezier(.22,1,.36,1)"}}>
      <div style={{position:"relative",height:220,overflow:"hidden"}}>
        {!err?<img src={game.img} alt="" onError={()=>setErr(true)}
          style={{width:"100%",height:"100%",objectFit:"cover"}}/>
          :<div style={{width:"100%",height:"100%",background:"linear-gradient(135deg,#0f0c29,#302b63)"}}/>}
        <div style={{position:"absolute",inset:0,
          background:"linear-gradient(to top,#0c0c18 0%,rgba(12,12,24,.6) 50%,rgba(12,12,24,.2) 100%)"}}/>
        <button onClick={onClose} style={{position:"absolute",top:14,right:14,width:38,height:38,borderRadius:10,
          background:"rgba(0,0,0,.5)",backdropFilter:"blur(10px)",border:"1px solid rgba(255,255,255,.1)",
          color:"#fff",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        <div style={{position:"absolute",bottom:18,left:24,right:24,display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
          <div>
            <h2 style={{fontSize:28,fontWeight:900,margin:0,textShadow:"0 4px 16px rgba(0,0,0,.8)"}}>{game.title}</h2>
            <div style={{color:"rgba(255,255,255,.45)",fontSize:13,marginTop:2}}>{game.year} · {game.genre}{game.reviews>0&&` · ${(game.reviews/1000).toFixed(1)}k reviews`}</div>
          </div>
          {game.rating&&<div style={{textAlign:"center"}}><div style={{fontSize:36,fontWeight:900,color:"#FFD700",lineHeight:1}}>{game.rating}</div><Stars rating={Math.round(game.rating)} size={10}/></div>}
        </div>
      </div>
      <div style={{padding:"18px 24px 28px"}}>
        <div style={{display:"flex",gap:6,marginBottom:18,flexWrap:"wrap"}}>
          {game.platforms.map(p=><span key={p} style={{display:"flex",alignItems:"center",gap:4,
            padding:"4px 10px",borderRadius:6,fontSize:11,fontWeight:700,
            background:PLATFORMS[p]?.color+"10",color:PLATFORMS[p]?.color,
            border:`1px solid ${PLATFORMS[p]?.color}28`}}>{PLATFORMS[p]?.icon} {p}</span>)}
        </div>
        <div style={{padding:18,borderRadius:14,background:"rgba(255,255,255,.025)",border:"1px solid rgba(255,255,255,.05)",marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:14}}>
            <div>
              <div style={{fontSize:10,color:"#555",fontWeight:700,letterSpacing:".08em",marginBottom:6}}>YOUR RATING</div>
              <Stars rating={mr} size={26} interactive onRate={setMr}/>
            </div>
            <div>
              <div style={{fontSize:10,color:"#555",fontWeight:700,letterSpacing:".08em",marginBottom:6}}>STATUS</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {Object.entries(STATUS_CFG).map(([k,c])=><button key={k} onClick={()=>setSt(k)} style={{
                  padding:"4px 12px",borderRadius:18,fontSize:10,fontWeight:700,cursor:"pointer",
                  border:`1px solid ${st===k?c.color:"#222"}`,background:st===k?c.color+"15":"transparent",
                  color:st===k?c.color:"#555",transition:"all .2s"}}>{c.icon} {c.label}</button>)}
              </div>
            </div>
          </div>
        </div>
        <div style={{display:"flex",borderBottom:"1px solid rgba(255,255,255,.05)",marginBottom:18}}>
          {["overview","reviews"].map(t=><button key={t} onClick={()=>setTab(t)} style={{
            padding:"8px 18px",background:"none",border:"none",fontSize:12,fontWeight:700,cursor:"pointer",
            color:tab===t?"#00d4ff":"#444",borderBottom:tab===t?"2px solid #00d4ff":"2px solid transparent",
            textTransform:"capitalize",transition:"all .2s"}}>{t}</button>)}
        </div>
        {tab==="overview"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
          {[{l:"PLAYTIME",v:`${game.playtime}h`,c:"#00d4ff"},{l:"COMPLETION",ring:true},{l:"MY RATING",v:mr?`${mr}/5`:"—",c:"#FFD700"}].map((s,i)=>
            <div key={i} style={{padding:14,borderRadius:12,background:"rgba(255,255,255,.025)",textAlign:"center"}}>
              <div style={{fontSize:10,color:"#444",fontWeight:700}}>{s.l}</div>
              {s.ring?<div style={{marginTop:6,display:"flex",justifyContent:"center"}}><Ring pct={game.completion||0} size={52} stroke={4}/></div>
                :<div style={{fontSize:24,fontWeight:900,color:s.c,marginTop:4}}>{s.v}</div>}
            </div>)}
        </div>}
        {tab==="reviews"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
          {REVIEWS.filter(r=>r.gid===game.id).length>0?REVIEWS.filter(r=>r.gid===game.id).map((r,i)=>
            <div key={i} style={{padding:14,borderRadius:12,background:"rgba(255,255,255,.025)"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                <span style={{fontSize:22}}>{r.avatar}</span>
                <span style={{fontWeight:700,fontSize:13}}>{r.user}</span>
                <div style={{marginLeft:"auto"}}><Stars rating={r.rating} size={10}/></div>
              </div>
              <p style={{color:"#888",fontSize:12.5,lineHeight:1.6,margin:0}}>{r.text}</p>
              <div style={{display:"flex",gap:12,marginTop:8,fontSize:11,color:"#444"}}>
                <span>❤️ {r.likes}</span><span>💬 Reply</span></div>
            </div>)
          :<div style={{textAlign:"center",padding:36,color:"#444"}}>
            <div style={{fontSize:32,marginBottom:8}}>💬</div><div style={{fontSize:13}}>No reviews yet — be the first!</div></div>}
        </div>}
      </div>
    </div>
  </div>;
};

export default function App(){
  const [page,setPage]=useState("home");
  const [sel,setSel]=useState(null);
  const [filter,setF]=useState("all");
  const [search,setSearch]=useState("");

  const filtered=GAMES.filter(g=>{
    const fm=filter==="all"||g.status===filter||g.platforms.includes(filter)||g.genre===filter;
    return fm&&g.title.toLowerCase().includes(search.toLowerCase());
  });

  const NAV=[{id:"home",icon:"🏠",l:"Home"},{id:"library",icon:"📚",l:"Library"},
    {id:"explore",icon:"🔍",l:"Explore"},{id:"stats",icon:"📊",l:"Stats"},{id:"lists",icon:"📝",l:"Lists"}];

  return <div style={{fontFamily:"'DM Sans','Outfit',system-ui,sans-serif",background:"#08080f",color:"#fff",minHeight:"100vh"}}>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,100..1000&family=Outfit:wght@100..900&display=swap');
      *{box-sizing:border-box;margin:0;padding:0}
      ::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#222;border-radius:3px}
      @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      @keyframes slideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
      body{background:#08080f}img{-webkit-user-drag:none}
    `}</style>

    {/* NAV */}
    <nav style={{position:"sticky",top:0,zIndex:100,background:"rgba(8,8,15,.82)",backdropFilter:"blur(24px) saturate(1.4)",
      borderBottom:"1px solid rgba(255,255,255,.04)",padding:"0 20px",height:54,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:20}}>
        <div onClick={()=>setPage("home")} style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer"}}>
          <div style={{width:28,height:28,borderRadius:7,background:"linear-gradient(135deg,#00d4ff,#8b5cf6)",
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900}}>G</div>
          <span style={{fontFamily:"'Outfit'",fontSize:17,fontWeight:900,letterSpacing:".04em",
            background:"linear-gradient(135deg,#00d4ff,#8b5cf6)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Gameboxed</span>
        </div>
        <div style={{display:"flex",gap:2}}>
          {NAV.map(n=><button key={n.id} onClick={()=>{setPage(n.id);setF("all");}} style={{
            padding:"5px 10px",borderRadius:7,border:"none",background:page===n.id?"rgba(255,255,255,.06)":"transparent",
            color:page===n.id?"#00d4ff":"#555",cursor:"pointer",fontSize:11,fontWeight:700,
            display:"flex",alignItems:"center",gap:4,transition:"all .2s"}}>
            <span style={{fontSize:12}}>{n.icon}</span>{n.l}</button>)}
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{position:"relative"}}>
          <input placeholder="Search..." value={search} onChange={e=>{setSearch(e.target.value);if(e.target.value)setPage("library");}}
            style={{padding:"6px 10px 6px 30px",borderRadius:8,border:"1px solid rgba(255,255,255,.06)",
              background:"rgba(255,255,255,.04)",color:"#fff",fontSize:12,width:160,outline:"none",transition:"all .3s"}}
            onFocus={e=>{e.target.style.width="220px";e.target.style.borderColor="rgba(0,212,255,.3)";}}
            onBlur={e=>{e.target.style.width="160px";e.target.style.borderColor="rgba(255,255,255,.06)";}}/>
          <span style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",fontSize:12,color:"#444"}}>🔍</span>
        </div>
        <div style={{width:30,height:30,borderRadius:7,background:"linear-gradient(135deg,#00d4ff,#8b5cf6)",
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,cursor:"pointer"}}>M</div>
      </div>
    </nav>

    <main style={{maxWidth:1200,margin:"0 auto",padding:"20px 18px 80px"}}>

      {page==="home"&&<div style={{animation:"fadeIn .4s"}}>
        <div style={{borderRadius:22,padding:"44px 36px",marginBottom:36,
          background:"linear-gradient(135deg,#0a0a18 0%,#12122a 40%,#0d1a30 100%)",
          border:"1px solid rgba(255,255,255,.04)",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:-80,right:-40,width:350,height:350,borderRadius:"50%",
            background:"radial-gradient(circle,rgba(0,212,255,.06),transparent 70%)"}}/>
          <h1 style={{fontFamily:"'Outfit'",fontSize:40,fontWeight:900,letterSpacing:"-.03em",lineHeight:1.05,marginBottom:12,position:"relative",
            background:"linear-gradient(135deg,#fff 20%,#00d4ff 80%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
            Track Every Game.<br/>Share Your Journey.</h1>
          <p style={{color:"#666",fontSize:14,maxWidth:460,lineHeight:1.7,marginBottom:24,position:"relative"}}>
            Your personal gaming diary. Rate, review, and build your ultimate game collection.</p>
          <div style={{display:"flex",gap:10,position:"relative"}}>
            <button onClick={()=>setPage("library")} style={{padding:"10px 24px",borderRadius:10,border:"none",
              background:"linear-gradient(135deg,#00d4ff,#0088bb)",color:"#fff",fontSize:13,fontWeight:800,
              cursor:"pointer",boxShadow:"0 4px 20px rgba(0,212,255,.25)"}}>My Library →</button>
            <button onClick={()=>setPage("explore")} style={{padding:"10px 24px",borderRadius:10,
              border:"1px solid rgba(255,255,255,.08)",background:"rgba(255,255,255,.03)",
              color:"#fff",fontSize:13,fontWeight:800,cursor:"pointer"}}>Explore</button>
          </div>
        </div>

        <Section title="🎮 Now Playing" action="View All →" onAction={()=>{setF("playing");setPage("library");}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))",gap:14}}>
            {GAMES.filter(g=>g.status==="playing").map((g,i)=><GameCard key={g.id} game={g} delay={i*80} onClick={setSel}/>)}
          </div>
        </Section>

        <Section title="⭐ Featured">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            {GAMES.filter(g=>g.rating>=4.8).slice(0,2).map((g,i)=><GameCard key={g.id} game={g} wide delay={i*100} onClick={setSel}/>)}
          </div>
        </Section>

        <Section title="⚡ Activity">
          <div style={{borderRadius:14,overflow:"hidden",border:"1px solid rgba(255,255,255,.04)",background:"rgba(255,255,255,.015)"}}>
            {[{u:"You",a:"started playing",g:"Ghost of Tsushima",t:"2h"},{u:"AhmadK",a:"completed",g:"Elden Ring",t:"3h"},
              {u:"Sara_Plays",a:"reviewed",g:"Baldur's Gate 3",t:"5h"},{u:"You",a:"added to wishlist",g:"Hollow Knight: Silksong",t:"1d"},
              {u:"DarkSoulsKid",a:"platinumed",g:"Sekiro",t:"1d"}].map((a,i)=>{
              const gm=GAMES.find(g=>g.title===a.g);
              return <div key={i} style={{padding:"10px 16px",display:"flex",alignItems:"center",gap:10,
                borderBottom:"1px solid rgba(255,255,255,.03)",cursor:"pointer",transition:"background .2s"}}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.02)"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                {gm&&<img src={gm.img} alt="" style={{width:42,height:20,borderRadius:3,objectFit:"cover"}}/>}
                <div style={{flex:1,fontSize:12}}><span style={{color:"#00d4ff",fontWeight:700}}>{a.u}</span>
                  <span style={{color:"#555"}}> {a.a} </span><span style={{fontWeight:700}}>{a.g}</span></div>
                <span style={{fontSize:10,color:"#333"}}>{a.t}</span>
              </div>;})}
          </div>
        </Section>

        <Section title="💬 Popular Reviews">
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
            {REVIEWS.map((r,i)=>{const gm=GAMES.find(g=>g.id===r.gid);
              return <div key={i} style={{borderRadius:14,overflow:"hidden",
                background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.04)",transition:"all .3s",cursor:"pointer"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(255,255,255,.1)"}
                onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(255,255,255,.04)"}>
                {gm&&<div style={{position:"relative",height:70,overflow:"hidden"}}>
                  <img src={gm.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover",opacity:.45}}/>
                  <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,transparent,rgba(8,8,15,.9))"}}/>
                  <span style={{position:"absolute",bottom:6,left:12,fontSize:11,fontWeight:700,color:"#00d4ff"}}>{r.game}</span>
                </div>}
                <div style={{padding:"10px 12px 12px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                    <span style={{fontSize:20}}>{r.avatar}</span>
                    <span style={{fontWeight:700,fontSize:12}}>{r.user}</span>
                    <div style={{marginLeft:"auto"}}><Stars rating={r.rating} size={10}/></div>
                  </div>
                  <p style={{color:"#777",fontSize:12,lineHeight:1.5,margin:0}}>{r.text}</p>
                  <div style={{display:"flex",gap:12,marginTop:8,fontSize:11,color:"#444"}}>
                    <span>❤️ {r.likes}</span><span>💬 Reply</span></div>
                </div>
              </div>;})}
          </div>
        </Section>
      </div>}

      {page==="library"&&<div style={{animation:"fadeIn .4s"}}>
        <h2 style={{fontFamily:"'Outfit'",fontSize:26,fontWeight:900,marginBottom:18}}>📚 My Library</h2>
        <div style={{display:"flex",gap:5,marginBottom:22,flexWrap:"wrap",paddingBottom:14,borderBottom:"1px solid rgba(255,255,255,.04)"}}>
          {[["all","All"],["playing","Playing"],["completed","Done"],["backlog","Backlog"],["wishlist","Wishlist"],["dropped","Dropped"]].map(([k,l])=>
            <button key={k} onClick={()=>setF(k)} style={{padding:"4px 13px",borderRadius:18,fontSize:11,fontWeight:700,cursor:"pointer",
              border:filter===k?"1px solid #00d4ff":"1px solid rgba(255,255,255,.06)",
              background:filter===k?"#00d4ff14":"transparent",color:filter===k?"#00d4ff":"#555",transition:"all .2s"}}>
              {l} <span style={{opacity:.5,marginLeft:3}}>{k==="all"?GAMES.length:GAMES.filter(g=>g.status===k).length}</span></button>)}
          <div style={{width:1,background:"rgba(255,255,255,.06)",margin:"0 3px"}}/>
          {Object.entries(PLATFORMS).map(([p,d])=>
            <button key={p} onClick={()=>setF(filter===p?"all":p)} style={{padding:"4px 10px",borderRadius:18,fontSize:11,fontWeight:700,cursor:"pointer",
              border:filter===p?`1px solid ${d.color}`:"1px solid rgba(255,255,255,.06)",
              background:filter===p?d.color+"14":"transparent",color:filter===p?d.color:"#555",transition:"all .2s"}}>
              {d.icon} {p}</button>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:14}}>
          {filtered.map((g,i)=><GameCard key={g.id} game={g} delay={i*50} onClick={setSel}/>)}
        </div>
        {!filtered.length&&<div style={{textAlign:"center",padding:60,color:"#444"}}>
          <div style={{fontSize:48,marginBottom:10}}>🎮</div><div style={{fontSize:15,fontWeight:700}}>No games found</div></div>}
      </div>}

      {page==="explore"&&<div style={{animation:"fadeIn .4s"}}>
        <h2 style={{fontFamily:"'Outfit'",fontSize:26,fontWeight:900,marginBottom:22}}>🔍 Explore</h2>
        <div style={{display:"flex",gap:7,marginBottom:32,flexWrap:"wrap"}}>
          {["Action","RPG","Action RPG","FPS","Horror"].map(g=>
            <button key={g} onClick={()=>{setF(g);setPage("library");}} style={{padding:"7px 16px",borderRadius:18,
              border:"1px solid rgba(255,255,255,.06)",background:"rgba(255,255,255,.03)",
              color:"#bbb",cursor:"pointer",fontSize:12,fontWeight:700,transition:"all .2s"}}
              onMouseEnter={e=>{e.currentTarget.style.background="#00d4ff15";e.currentTarget.style.color="#00d4ff";}}
              onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,.03)";e.currentTarget.style.color="#bbb";}}>{g}</button>)}
        </div>
        <Section title="⭐ Top Rated">
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:14}}>
            {[...GAMES].filter(g=>g.rating).sort((a,b)=>b.rating-a.rating).slice(0,4).map((g,i)=><GameCard key={g.id} game={g} delay={i*80} onClick={setSel}/>)}
          </div>
        </Section>
        <Section title="🕐 Most Played">
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:14}}>
            {[...GAMES].sort((a,b)=>b.playtime-a.playtime).slice(0,4).map((g,i)=><GameCard key={g.id} game={g} delay={i*80} onClick={setSel}/>)}
          </div>
        </Section>
      </div>}

      {page==="stats"&&<div style={{animation:"fadeIn .4s"}}>
        <h2 style={{fontFamily:"'Outfit'",fontSize:26,fontWeight:900,marginBottom:22}}>📊 Your Stats</h2>
        {(()=>{
          const comp=GAMES.filter(g=>g.status==="completed");
          const totalH=GAMES.reduce((s,g)=>s+g.playtime,0);
          const avgR=(comp.filter(g=>g.myRating).reduce((s,g)=>s+g.myRating,0)/comp.filter(g=>g.myRating).length).toFixed(1);
          const gc={};GAMES.forEach(g=>{gc[g.genre]=(gc[g.genre]||0)+1});
          const gcs=Object.entries(gc).sort((a,b)=>b[1]-a[1]);const mx=gcs[0]?.[1]||1;
          const cols=["#00d4ff","#8b5cf6","#00ff88","#FFD700","#ff6b6b"];
          return <>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:32}}>
              {[{l:"Games",v:GAMES.length,i:"🎮",c:"#00d4ff"},{l:"Completed",v:comp.length,i:"✅",c:"#00ff88"},
                {l:"Total Hours",v:totalH.toLocaleString(),i:"⏱️",c:"#8b5cf6"},{l:"Avg Rating",v:`${avgR}★`,i:"⭐",c:"#FFD700"}].map((s,i)=>
                <div key={i} style={{padding:18,borderRadius:14,textAlign:"center",
                  background:`linear-gradient(135deg,${s.c}08,${s.c}04)`,border:`1px solid ${s.c}18`}}>
                  <div style={{fontSize:26,marginBottom:4}}>{s.i}</div>
                  <div style={{fontSize:26,fontWeight:900,color:s.c}}>{s.v}</div>
                  <div style={{fontSize:10,color:"#555",fontWeight:700,marginTop:2}}>{s.l}</div>
                </div>)}
            </div>
            <h3 style={{fontFamily:"'Outfit'",fontSize:17,fontWeight:800,marginBottom:14}}>Genre Breakdown</h3>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:32}}>
              {gcs.map(([g,c],i)=><div key={g} style={{display:"flex",alignItems:"center",gap:12}}>
                <span style={{width:85,fontSize:12,color:"#777",fontWeight:600,textAlign:"right"}}>{g}</span>
                <div style={{flex:1,height:26,background:"rgba(255,255,255,.03)",borderRadius:6,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${(c/mx)*100}%`,
                    background:`linear-gradient(90deg,${cols[i%cols.length]},${cols[i%cols.length]}66)`,
                    borderRadius:6,display:"flex",alignItems:"center",paddingLeft:8,
                    transition:"width 1s cubic-bezier(.22,1,.36,1)"}}>
                    <span style={{fontSize:10,fontWeight:800}}>{c}</span></div></div>
              </div>)}
            </div>
            <h3 style={{fontFamily:"'Outfit'",fontSize:17,fontWeight:800,marginBottom:14}}>Platforms</h3>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:12,marginBottom:32}}>
              {Object.entries(PLATFORMS).map(([n,d])=>{const c=GAMES.filter(g=>g.platforms.includes(n)).length;
                return <div key={n} style={{padding:18,borderRadius:14,textAlign:"center",
                  background:d.color+"08",border:`1px solid ${d.color}18`}}>
                  <div style={{fontSize:26}}>{d.icon}</div>
                  <div style={{fontSize:22,fontWeight:900,color:d.color,marginTop:3}}>{c}</div>
                  <div style={{fontSize:11,color:"#555",fontWeight:700}}>{n}</div>
                </div>;})}
            </div>
            <h3 style={{fontFamily:"'Outfit'",fontSize:17,fontWeight:800,marginBottom:14}}>Completion Tracker</h3>
            <div style={{display:"flex",gap:18,flexWrap:"wrap"}}>
              {GAMES.filter(g=>g.completion>0).sort((a,b)=>b.completion-a.completion).map(g=>
                <div key={g.id} style={{textAlign:"center"}}>
                  <Ring pct={g.completion} size={64} stroke={4}/>
                  <div style={{fontSize:10,color:"#555",marginTop:4,maxWidth:64,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.title}</div>
                </div>)}
            </div>
          </>;
        })()}
      </div>}

      {page==="lists"&&<div style={{animation:"fadeIn .4s"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:22}}>
          <h2 style={{fontFamily:"'Outfit'",fontSize:26,fontWeight:900}}>📝 Lists</h2>
          <button style={{padding:"8px 18px",borderRadius:10,border:"none",
            background:"linear-gradient(135deg,#00d4ff,#0088bb)",color:"#fff",fontSize:12,fontWeight:800,cursor:"pointer"}}>+ Create List</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14}}>
          {LISTS.map((l,i)=>{
            const imgs=l.gids.map(id=>GAMES.find(g=>g.id===id)).filter(Boolean);
            return <div key={i} style={{borderRadius:16,overflow:"hidden",
              background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.04)",cursor:"pointer",transition:"all .3s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(0,212,255,.2)";e.currentTarget.style.transform="translateY(-4px)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,.04)";e.currentTarget.style.transform="translateY(0)";}}>
              <div style={{display:"flex",height:70,overflow:"hidden"}}>
                {imgs.map((g,j)=><img key={j} src={g.img} alt="" style={{flex:1,objectFit:"cover",opacity:.6}}/>)}
              </div>
              <div style={{padding:"14px 16px"}}>
                <div style={{fontSize:15,fontWeight:800,marginBottom:3}}>{l.emoji} {l.title}</div>
                <div style={{fontSize:11,color:"#555"}}>{l.count} games · by <span style={{color:"#00d4ff"}}>{l.author}</span></div>
              </div>
            </div>;})}
        </div>
      </div>}
    </main>

    {sel&&<Modal game={sel} onClose={()=>setSel(null)}/>}
  </div>;
}
