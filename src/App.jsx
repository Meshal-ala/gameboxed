import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

const API_KEY = "33d378268c5d452ab1f3a9cb04c89f38";
const API = "https://api.rawg.io/api";
const PARENT_PLATFORMS = { 1:{name:"PC",icon:"🖥️",color:"#00d4ff"},2:{name:"PlayStation",icon:"🎮",color:"#006FCD"},3:{name:"Xbox",icon:"🟢",color:"#107C10"},7:{name:"Nintendo",icon:"🔴",color:"#E60012"} };
const STATUS_CFG = { completed:{color:"#00ff88",label:"Completed",icon:"✓"},playing:{color:"#00d4ff",label:"Playing",icon:"▶"},wishlist:{color:"#FFD700",label:"Wishlist",icon:"☆"},dropped:{color:"#ff4444",label:"Dropped",icon:"✕"},backlog:{color:"#8b5cf6",label:"Backlog",icon:"◷"} };

const fetchGames=async(p="")=>{try{const r=await fetch(`${API}/games?key=${API_KEY}&page_size=20${p}`);const d=await r.json();return d.results||[]}catch{return[]}};
const fetchGameDetail=async(id)=>{try{const r=await fetch(`${API}/games/${id}?key=${API_KEY}`);return await r.json()}catch{return null}};
const searchGamesAPI=async(q)=>{try{const r=await fetch(`${API}/games?key=${API_KEY}&search=${encodeURIComponent(q)}&page_size=20&search_precise=true`);const d=await r.json();return d.results||[]}catch{return[]}};
const norm=(g)=>({id:g.id,title:g.name,year:g.released?.slice(0,4)||"TBA",img:g.background_image||"",rating:g.rating?Math.round(g.rating*10)/10:null,metacritic:g.metacritic,reviews:g.ratings_count||0,genre:g.genres?.map(x=>x.name).slice(0,2).join(", ")||"Unknown",platforms:(g.parent_platforms||[]).map(p=>PARENT_PLATFORMS[p.platform.id]).filter(Boolean),screenshots:g.short_screenshots?.map(s=>s.image)||[],slug:g.slug});

const loadCloudLibrary=async(uid)=>{const{data}=await supabase.from("user_games").select("*").eq("user_id",uid);const lib={};(data||[]).forEach(r=>{lib[r.game_id]={status:r.status,myRating:r.my_rating,title:r.game_title,img:r.game_img}});return lib};
const saveToCloud=async(uid,gid,f)=>{const{data:ex}=await supabase.from("user_games").select("id").eq("user_id",uid).eq("game_id",gid).single();if(ex){await supabase.from("user_games").update({status:f.status,my_rating:f.myRating,game_title:f.title,game_img:f.img,updated_at:new Date().toISOString()}).eq("id",ex.id)}else{await supabase.from("user_games").insert({user_id:uid,game_id:gid,status:f.status,my_rating:f.myRating,game_title:f.title,game_img:f.img})}};
const loadProfile=async(uid)=>{const{data}=await supabase.from("profiles").select("*").eq("id",uid).single();return data};
const updateProfile=async(uid,fields)=>{await supabase.from("profiles").update(fields).eq("id",uid)};

const useIsMobile=()=>{const[m,setM]=useState(window.innerWidth<768);useEffect(()=>{const h=()=>setM(window.innerWidth<768);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h)},[]);return m};

/* ── Components ── */
const Stars=({rating,size=14,interactive,onRate})=>{const[h,setH]=useState(0);return<div style={{display:"flex",gap:1}}>{[1,2,3,4,5].map(s=><span key={s} onMouseEnter={()=>interactive&&setH(s)} onMouseLeave={()=>interactive&&setH(0)} onClick={()=>interactive&&onRate?.(s)} style={{fontSize:size,cursor:interactive?"pointer":"default",color:s<=(h||rating)?"#FFD700":"#2a2a3a",transition:"all .15s",transform:interactive&&s<=h?"scale(1.2)":"scale(1)",filter:s<=(h||rating)?"drop-shadow(0 0 3px rgba(255,215,0,.4))":"none"}}>★</span>)}</div>};
const Loader=()=><div style={{display:"flex",justifyContent:"center",padding:40}}><div style={{width:32,height:32,border:"3px solid #1a1a2e",borderTopColor:"#00d4ff",borderRadius:"50%",animation:"spin .8s linear infinite"}}/></div>;

const GameCard=({game,onClick,wide,delay=0,mobile,userData})=>{
  const[hov,setHov]=useState(false);const[vis,setVis]=useState(false);const[err,setErr]=useState(false);
  useEffect(()=>{const t=setTimeout(()=>setVis(true),delay);return()=>clearTimeout(t)},[delay]);
  const ud=userData?.[game.id];
  return<div onClick={()=>onClick?.(game)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
    style={{borderRadius:12,overflow:"hidden",cursor:"pointer",position:"relative",aspectRatio:wide?"16/7":"2/3",
      opacity:vis?1:0,transform:vis?(hov&&!mobile?"translateY(-4px)":"none"):"translateY(12px)",
      transition:"all .35s cubic-bezier(.22,1,.36,1)",
      boxShadow:hov&&!mobile?"0 16px 40px rgba(0,0,0,.5)":"0 2px 12px rgba(0,0,0,.2)"}}>
    {!err&&game.img?<img src={game.img} alt={game.title} onError={()=>setErr(true)} loading="lazy"
      style={{width:"100%",height:"100%",objectFit:"cover",transition:"transform .5s",transform:hov&&!mobile?"scale(1.05)":"scale(1)"}}/>
      :<div style={{width:"100%",height:"100%",background:"linear-gradient(135deg,#16213e,#0f3460)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:40,color:"#ffffff20"}}>🎮</div>}
    <div style={{position:"absolute",inset:0,background:wide?"linear-gradient(to right,rgba(0,0,0,.85) 0%,rgba(0,0,0,.3) 60%,transparent 100%)":"linear-gradient(to top,rgba(0,0,0,.9) 0%,rgba(0,0,0,.1) 60%,transparent 100%)"}}/>
    {ud?.status&&<div style={{position:"absolute",top:6,left:6,padding:"2px 7px",borderRadius:12,background:"rgba(0,0,0,.6)",fontSize:8,fontWeight:800,color:STATUS_CFG[ud.status]?.color,letterSpacing:".04em"}}>{STATUS_CFG[ud.status]?.label.toUpperCase()}</div>}
    <div style={{position:"absolute",bottom:0,left:0,right:0,padding:wide?"24px 28px":"10px 10px"}}>
      {wide&&<div style={{fontSize:11,color:"#00d4ff",fontWeight:700,marginBottom:4,letterSpacing:".06em"}}>FEATURED</div>}
      <h3 style={{fontSize:wide?24:13,fontWeight:wide?900:700,margin:0,lineHeight:1.2}}>{game.title}</h3>
      {wide&&<div style={{fontSize:12,color:"rgba(255,255,255,.5)",marginTop:4}}>{game.year} · {game.genre}</div>}
      {!wide&&game.rating&&<div style={{display:"flex",alignItems:"center",gap:3,marginTop:3}}><Stars rating={Math.round(game.rating)} size={8}/><span style={{fontSize:9,color:"#FFD700",fontWeight:700}}>{game.rating}</span></div>}
    </div>
  </div>};

/* ── Auth Modal ── */
const AuthModal=({onClose,onAuth})=>{
  const[mode,setMode]=useState("login");const[email,setEmail]=useState("");const[password,setPassword]=useState("");const[name,setName]=useState("");const[error,setError]=useState("");const[loading,setLoading]=useState(false);const[sent,setSent]=useState(false);
  const handleSubmit=async()=>{setError("");setLoading(true);try{if(mode==="signup"){const{error:e}=await supabase.auth.signUp({email,password,options:{data:{display_name:name}}});if(e)throw e;setSent(true)}else{const{data,error:e}=await supabase.auth.signInWithPassword({email,password});if(e)throw e;onAuth(data.user);onClose()}}catch(e){setError(e.message)}setLoading(false)};
  const inp={width:"100%",padding:"12px 14px",borderRadius:10,border:"1px solid rgba(255,255,255,.08)",background:"rgba(255,255,255,.04)",color:"#fff",fontSize:14,outline:"none",marginBottom:10};
  return<div onClick={onClose} style={{position:"fixed",inset:0,zIndex:2000,background:"rgba(0,0,0,.85)",backdropFilter:"blur(24px)",display:"flex",alignItems:"center",justifyContent:"center",animation:"fadeIn .2s",padding:16}}>
    <div onClick={e=>e.stopPropagation()} style={{background:"#111118",borderRadius:20,width:"100%",maxWidth:380,padding:"32px 28px",border:"1px solid rgba(255,255,255,.06)",animation:"slideUp .3s cubic-bezier(.22,1,.36,1)"}}>
      {sent?<div style={{textAlign:"center"}}><div style={{fontSize:48,marginBottom:12}}>📧</div><h2 style={{fontSize:20,fontWeight:800,marginBottom:8}}>Check Your Email</h2>
        <p style={{color:"#888",fontSize:13,lineHeight:1.6}}>We sent a link to <span style={{color:"#00d4ff"}}>{email}</span></p>
        <button onClick={onClose} style={{marginTop:20,padding:"10px 24px",borderRadius:10,border:"none",background:"#00d4ff",color:"#000",fontSize:13,fontWeight:800,cursor:"pointer"}}>OK</button></div>
      :<><div style={{textAlign:"center",marginBottom:24}}><h2 style={{fontSize:22,fontWeight:900}}>{mode==="login"?"Sign in":"Join Gameboxed"}</h2>
        <p style={{color:"#555",fontSize:12,marginTop:4}}>{mode==="login"?"Welcome back":"Track your gaming journey"}</p></div>
        {error&&<div style={{padding:"10px 12px",borderRadius:8,background:"#ff444412",border:"1px solid #ff444425",color:"#ff6666",fontSize:12,marginBottom:12}}>{error}</div>}
        {mode==="signup"&&<input placeholder="Display name" value={name} onChange={e=>setName(e.target.value)} style={inp}/>}
        <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={inp}/>
        <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSubmit()} style={inp}/>
        <button onClick={handleSubmit} disabled={loading} style={{width:"100%",padding:"12px",borderRadius:10,border:"none",marginTop:4,background:loading?"#333":"#00d4ff",color:loading?"#666":"#000",fontSize:14,fontWeight:800,cursor:loading?"default":"pointer"}}>{loading?"...":mode==="login"?"Sign In":"Create Account"}</button>
        <div style={{textAlign:"center",marginTop:14,fontSize:12,color:"#555"}}>{mode==="login"?"New here? ":"Have an account? "}
          <span onClick={()=>{setMode(mode==="login"?"signup":"login");setError("")}} style={{color:"#00d4ff",cursor:"pointer",fontWeight:700}}>{mode==="login"?"Create account":"Sign in"}</span></div></>}
    </div></div>};

/* ── Edit Profile Modal ── */
const EditProfileModal=({profile,onClose,onSave})=>{
  const[name,setName]=useState(profile?.display_name||"");const[username,setUsername]=useState(profile?.username||"");const[bio,setBio]=useState(profile?.bio||"");const[loading,setLoading]=useState(false);
  const save=async()=>{setLoading(true);await onSave({display_name:name,username:username.toLowerCase().replace(/[^a-z0-9_]/g,""),bio});setLoading(false);onClose()};
  const inp={width:"100%",padding:"12px 14px",borderRadius:10,border:"1px solid rgba(255,255,255,.08)",background:"rgba(255,255,255,.04)",color:"#fff",fontSize:14,outline:"none",marginBottom:12};
  return<div onClick={onClose} style={{position:"fixed",inset:0,zIndex:2000,background:"rgba(0,0,0,.85)",backdropFilter:"blur(24px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
    <div onClick={e=>e.stopPropagation()} style={{background:"#111118",borderRadius:20,width:"100%",maxWidth:380,padding:"28px 24px",border:"1px solid rgba(255,255,255,.06)"}}>
      <h2 style={{fontSize:20,fontWeight:900,marginBottom:20}}>Edit Profile</h2>
      <label style={{fontSize:11,color:"#555",fontWeight:700,letterSpacing:".06em",display:"block",marginBottom:4}}>DISPLAY NAME</label><input value={name} onChange={e=>setName(e.target.value)} style={inp}/>
      <label style={{fontSize:11,color:"#555",fontWeight:700,letterSpacing:".06em",display:"block",marginBottom:4}}>USERNAME</label><input value={username} onChange={e=>setUsername(e.target.value)} style={inp} placeholder="username"/>
      <label style={{fontSize:11,color:"#555",fontWeight:700,letterSpacing:".06em",display:"block",marginBottom:4}}>BIO</label><textarea value={bio} onChange={e=>setBio(e.target.value)} rows={3} style={{...inp,resize:"none",fontFamily:"inherit"}} placeholder="Tell us about your gaming life..."/>
      <div style={{display:"flex",gap:8,marginTop:4}}>
        <button onClick={onClose} style={{flex:1,padding:"11px",borderRadius:10,border:"1px solid rgba(255,255,255,.08)",background:"transparent",color:"#888",fontSize:13,fontWeight:700,cursor:"pointer"}}>Cancel</button>
        <button onClick={save} disabled={loading} style={{flex:1,padding:"11px",borderRadius:10,border:"none",background:"#00d4ff",color:"#000",fontSize:13,fontWeight:800,cursor:"pointer"}}>{loading?"Saving...":"Save"}</button></div>
    </div></div>};

/* ── Game Detail Modal ── */
const Modal=({game,onClose,mobile,userData,setUserData,user,setShowAuth})=>{
  const[detail,setDetail]=useState(null);const[loadingD,setLoadingD]=useState(true);const ud=userData[game.id]||{};
  const[mr,setMr]=useState(ud.myRating||0);const[st,setSt]=useState(ud.status||"");const[tab,setTab]=useState("about");
  useEffect(()=>{setLoadingD(true);fetchGameDetail(game.id).then(d=>{setDetail(d);setLoadingD(false)});},[game.id]);
  const upd=async(f,v)=>{if(!user){setShowAuth(true);return}const nud={...ud,[f]:v,title:game.title,img:game.img};if(f==="myRating")setMr(v);if(f==="status")setSt(v);const nd={...userData,[game.id]:nud};setUserData(nd);await saveToCloud(user.id,game.id,nud)};

  return<div onClick={onClose} style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,.92)",backdropFilter:"blur(20px)",display:"flex",alignItems:mobile?"flex-end":"center",justifyContent:"center",animation:"fadeIn .2s",padding:mobile?0:16}}>
    <div onClick={e=>e.stopPropagation()} style={{background:"#111118",width:"100%",maxWidth:mobile?"100%":640,maxHeight:mobile?"92vh":"85vh",borderRadius:mobile?"20px 20px 0 0":20,overflow:"auto",border:mobile?"none":"1px solid rgba(255,255,255,.06)",
      animation:mobile?"slideFromBottom .3s cubic-bezier(.22,1,.36,1)":"slideUp .3s cubic-bezier(.22,1,.36,1)"}}>
      {mobile&&<div onClick={onClose} style={{display:"flex",justifyContent:"center",padding:"10px 0 0"}}><div style={{width:36,height:4,borderRadius:2,background:"rgba(255,255,255,.15)"}}/></div>}
      <div style={{position:"relative",height:mobile?160:200,overflow:"hidden"}}>
        <img src={game.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,#111118 0%,rgba(17,17,24,.4) 100%)"}}/>
        {!mobile&&<button onClick={onClose} style={{position:"absolute",top:12,right:12,width:34,height:34,borderRadius:17,background:"rgba(0,0,0,.4)",border:"none",color:"#fff",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>}
        <div style={{position:"absolute",bottom:12,left:mobile?16:20,right:mobile?16:20}}>
          <h2 style={{fontSize:mobile?20:26,fontWeight:900,margin:0}}>{game.title}</h2>
          <div style={{color:"rgba(255,255,255,.4)",fontSize:12,marginTop:2}}>{game.year} · {game.genre}</div></div>
      </div>
      <div style={{padding:mobile?"12px 16px 28px":"16px 20px 24px"}}>
        {/* Rating row */}
        <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:16,padding:"12px 0",borderBottom:"1px solid rgba(255,255,255,.04)"}}>
          {game.rating&&<div style={{textAlign:"center"}}><div style={{fontSize:11,color:"#555",fontWeight:700}}>RATING</div><div style={{fontSize:22,fontWeight:900,color:"#FFD700"}}>{game.rating}</div></div>}
          {game.metacritic&&<div style={{textAlign:"center"}}><div style={{fontSize:11,color:"#555",fontWeight:700}}>METACRITIC</div><div style={{fontSize:22,fontWeight:900,color:game.metacritic>=75?"#00ff88":"#FFD700"}}>{game.metacritic}</div></div>}
          <div style={{textAlign:"center"}}><div style={{fontSize:11,color:"#555",fontWeight:700}}>YOUR RATING</div><div style={{fontSize:22,fontWeight:900,color:"#00d4ff"}}>{mr||"—"}</div></div>
          <div style={{marginLeft:"auto",display:"flex",gap:4}}>{game.platforms.map((p,i)=><span key={i} style={{fontSize:9,fontWeight:700,padding:"3px 7px",borderRadius:4,background:p.color+"10",color:p.color}}>{p.name}</span>)}</div>
        </div>

        {/* User actions */}
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          <div style={{flex:1}}>
            <div style={{fontSize:10,color:"#444",fontWeight:700,marginBottom:6,letterSpacing:".06em"}}>RATE</div>
            <Stars rating={mr} size={mobile?22:24} interactive onRate={v=>upd("myRating",v)}/></div>
          <div style={{flex:1}}>
            <div style={{fontSize:10,color:"#444",fontWeight:700,marginBottom:6,letterSpacing:".06em"}}>STATUS</div>
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
              {Object.entries(STATUS_CFG).map(([k,c])=><button key={k} onClick={()=>upd("status",k)} style={{padding:"4px 10px",borderRadius:14,fontSize:10,fontWeight:700,cursor:"pointer",border:st===k?"1px solid "+c.color:"1px solid #1a1a2a",background:st===k?c.color+"12":"transparent",color:st===k?c.color:"#555"}}>{c.label}</button>)}</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",gap:0,borderBottom:"1px solid rgba(255,255,255,.04)",marginBottom:14}}>
          {["about","screenshots"].map(t=><button key={t} onClick={()=>setTab(t)} style={{padding:"8px 16px",background:"none",border:"none",fontSize:12,fontWeight:700,cursor:"pointer",color:tab===t?"#fff":"#444",borderBottom:tab===t?"2px solid #00d4ff":"2px solid transparent",textTransform:"capitalize"}}>{t}</button>)}</div>

        {tab==="about"&&(loadingD?<Loader/>:detail?.description_raw&&<p style={{color:"#777",fontSize:13,lineHeight:1.7,maxHeight:120,overflow:"hidden",WebkitMaskImage:"linear-gradient(to bottom,black 70%,transparent)"}}>{detail.description_raw.slice(0,500)}</p>)}
        {tab==="screenshots"&&game.screenshots?.length>1&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          {game.screenshots.slice(1,7).map((s,i)=><img key={i} src={s} alt="" loading="lazy" style={{width:"100%",borderRadius:8,aspectRatio:"16/9",objectFit:"cover"}}/>)}</div>}
      </div>
    </div></div>};

/* ═══ MAIN APP ═══ */
export default function App(){
  const mobile=useIsMobile();
  const[page,setPage]=useState("home");const[sel,setSel]=useState(null);const[search,setSearch]=useState("");const[searchOpen,setSearchOpen]=useState(false);
  const[userData,setUserData]=useState({});const[user,setUser]=useState(null);const[profile,setProfile]=useState(null);
  const[showAuth,setShowAuth]=useState(false);const[showEditProfile,setShowEditProfile]=useState(false);
  const[popular,setPopular]=useState([]);const[bestOfAllTime,setBestOfAllTime]=useState([]);const[newReleases,setNewReleases]=useState([]);const[upcoming,setUpcoming]=useState([]);
  const[searchResults,setSearchResults]=useState([]);const[loading,setLoading]=useState(true);const[searching,setSearching]=useState(false);const[libFilter,setLibFilter]=useState("all");
  const searchTimer=useRef(null);

  useEffect(()=>{supabase.auth.getSession().then(({data:{session}})=>{const u=session?.user||null;setUser(u);if(u){loadCloudLibrary(u.id).then(setUserData);loadProfile(u.id).then(setProfile)}});
    const{data:{subscription}}=supabase.auth.onAuthStateChange((_e,session)=>{const u=session?.user||null;setUser(u);if(u){loadCloudLibrary(u.id).then(setUserData);loadProfile(u.id).then(setProfile)}else{setUserData({});setProfile(null)}});
    return()=>subscription.unsubscribe()},[]);

  useEffect(()=>{setLoading(true);const today=new Date().toISOString().slice(0,10);const ly=new Date(Date.now()-365*864e5).toISOString().slice(0,10);const ny=new Date(Date.now()+365*864e5).toISOString().slice(0,10);
    Promise.all([fetchGames(`&dates=${ly},${today}&ordering=-rating&metacritic=70,100`),fetchGames(`&ordering=-metacritic&metacritic=85,100`),fetchGames(`&dates=${ly},${today}&ordering=-released`),fetchGames(`&dates=${today},${ny}&ordering=-added`)]).then(([p,b,n,u])=>{setPopular(p.map(norm));setBestOfAllTime(b.map(norm));setNewReleases(n.map(norm));setUpcoming(u.map(norm));setLoading(false)})},[]);

  useEffect(()=>{if(searchTimer.current)clearTimeout(searchTimer.current);if(!search.trim()){setSearchResults([]);return}setSearching(true);
    searchTimer.current=setTimeout(()=>{searchGamesAPI(search).then(r=>{setSearchResults(r.map(norm));setSearching(false)})},400)},[search]);

  const allGames=[...popular,...bestOfAllTime,...newReleases,...upcoming,...searchResults];
  const libraryGames=Object.entries(userData).filter(([_,v])=>v.status).map(([id,v])=>{const f=allGames.find(g=>g.id===parseInt(id));return f||{id:parseInt(id),title:v.title||"Unknown",img:v.img||"",year:"",genre:"",rating:null,platforms:[],metacritic:null}});
  const filteredLib=libFilter==="all"?libraryGames:libraryGames.filter(g=>userData[g.id]?.status===libFilter);
  const handleSignOut=async()=>{await supabase.auth.signOut();setUser(null);setUserData({});setProfile(null);setPage("home")};
  const displayName=profile?.display_name||user?.user_metadata?.display_name||user?.email?.split("@")[0]||"";
  const initial=displayName.charAt(0).toUpperCase()||"?";
  const heroGame=popular[0]||bestOfAllTime[0];
  const handleSaveProfile=async(fields)=>{await updateProfile(user.id,fields);setProfile({...profile,...fields})};

  // Dynamic nav based on auth
  const NAV=user?[{id:"home",icon:"🏠",l:"Home"},{id:"explore",icon:"🔍",l:"Explore"},{id:"library",icon:"📚",l:"Library"},{id:"stats",icon:"📊",l:"Stats"},{id:"profile",icon:"👤",l:"Profile"}]
    :[{id:"home",icon:"🏠",l:"Home"},{id:"explore",icon:"🔍",l:"Explore"}];

  return<div style={{fontFamily:"'DM Sans','Outfit',system-ui,sans-serif",background:"#0b0b10",color:"#fff",minHeight:"100vh"}}>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,100..1000&family=Outfit:wght@100..900&display=swap');
      *{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#222;border-radius:3px}
      @keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
      @keyframes slideFromBottom{from{transform:translateY(100%)}to{transform:translateY(0)}}@keyframes spin{to{transform:rotate(360deg)}}
      body{background:#0b0b10;overflow-x:hidden}img{-webkit-user-drag:none}.hide-scroll::-webkit-scrollbar{display:none}.hide-scroll{-ms-overflow-style:none;scrollbar-width:none}
      @media(max-width:767px){*{-webkit-tap-highlight-color:transparent}}`}</style>

    {showAuth&&<AuthModal onClose={()=>setShowAuth(false)} onAuth={u=>{setUser(u);setShowAuth(false)}}/>}
    {showEditProfile&&<EditProfileModal profile={profile} onClose={()=>setShowEditProfile(false)} onSave={handleSaveProfile}/>}

    {/* DESKTOP NAV */}
    {!mobile&&<nav style={{position:"sticky",top:0,zIndex:100,background:"rgba(11,11,16,.85)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,.04)",padding:"0 32px",height:52,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:28}}>
        <span onClick={()=>{setPage("home");setSearch("")}} style={{fontFamily:"'Outfit'",fontSize:16,fontWeight:900,letterSpacing:".06em",cursor:"pointer",color:"#00d4ff"}}>GAMEBOXED</span>
        <div style={{display:"flex",gap:0}}>{NAV.filter(n=>n.id!=="profile").map(n=><button key={n.id} onClick={()=>{setPage(n.id);setSearch("")}} style={{padding:"6px 12px",borderRadius:6,border:"none",background:"transparent",color:page===n.id?"#fff":"#555",cursor:"pointer",fontSize:12,fontWeight:600,transition:"color .2s"}}>{n.l}</button>)}</div></div>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{position:"relative"}}><input placeholder="Search games..." value={search} onChange={e=>{setSearch(e.target.value);if(e.target.value)setPage("search")}}
          style={{padding:"7px 12px 7px 32px",borderRadius:8,border:"1px solid rgba(255,255,255,.06)",background:"rgba(255,255,255,.03)",color:"#fff",fontSize:12,width:180,outline:"none"}}/>
          <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",fontSize:12,color:"#444"}}>🔍</span></div>
        {user?<div onClick={()=>setPage("profile")} style={{width:30,height:30,borderRadius:15,background:"linear-gradient(135deg,#00d4ff,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,cursor:"pointer"}}>{initial}</div>
          :<button onClick={()=>setShowAuth(true)} style={{padding:"7px 16px",borderRadius:8,border:"none",background:"#00d4ff",color:"#000",fontSize:11,fontWeight:800,cursor:"pointer"}}>Sign In</button>}
      </div></nav>}

    {/* MOBILE TOP */}
    {mobile&&<div style={{position:"sticky",top:0,zIndex:100,background:"rgba(11,11,16,.9)",backdropFilter:"blur(20px)",padding:"0 16px",height:48,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid rgba(255,255,255,.04)"}}>
      {searchOpen?<div style={{flex:1,display:"flex",alignItems:"center",gap:8}}>
        <input autoFocus placeholder="Search games..." value={search} onChange={e=>{setSearch(e.target.value);if(e.target.value)setPage("search")}}
          style={{flex:1,padding:"8px 12px",borderRadius:8,border:"1px solid rgba(0,212,255,.2)",background:"rgba(255,255,255,.04)",color:"#fff",fontSize:14,outline:"none"}}/>
        <span onClick={()=>{setSearchOpen(false);setSearch("");setPage("home")}} style={{color:"#00d4ff",fontSize:12,fontWeight:700,cursor:"pointer"}}>Cancel</span></div>
      :<><span style={{fontFamily:"'Outfit'",fontSize:15,fontWeight:900,letterSpacing:".06em",color:"#00d4ff"}}>GAMEBOXED</span>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span onClick={()=>{setSearchOpen(true);setPage("search")}} style={{fontSize:16,cursor:"pointer"}}>🔍</span>
          {user?<div onClick={()=>setPage("profile")} style={{width:26,height:26,borderRadius:13,background:"linear-gradient(135deg,#00d4ff,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,cursor:"pointer"}}>{initial}</div>
            :<button onClick={()=>setShowAuth(true)} style={{padding:"5px 12px",borderRadius:6,border:"none",background:"#00d4ff",color:"#000",fontSize:10,fontWeight:800,cursor:"pointer"}}>Sign In</button>}</div></>}
    </div>}

    <main style={{maxWidth:1100,margin:"0 auto",padding:mobile?"8px 14px 90px":"16px 24px 60px"}}>

      {/* SEARCH */}
      {page==="search"&&<div style={{animation:"fadeIn .3s",paddingTop:12}}>
        <h2 style={{fontFamily:"'Outfit'",fontSize:mobile?20:24,fontWeight:900,marginBottom:16}}>{search?`"${search}"`:"Search"}</h2>
        {searching?<Loader/>:searchResults.length>0?<div style={{display:"grid",gridTemplateColumns:mobile?"repeat(3,1fr)":"repeat(auto-fill,minmax(150px,1fr))",gap:mobile?8:12}}>
          {searchResults.map((g,i)=><GameCard key={g.id} game={g} delay={i*30} onClick={setSel} mobile={mobile} userData={userData}/>)}</div>
        :search&&<div style={{textAlign:"center",padding:60,color:"#444"}}><div style={{fontSize:40,marginBottom:8}}>🔍</div>No results</div>}</div>}

      {/* HOME — Letterboxd style */}
      {page==="home"&&<div style={{animation:"fadeIn .4s"}}>
        {/* Hero backdrop */}
        {!loading&&heroGame&&<div onClick={()=>setSel(heroGame)} style={{position:"relative",borderRadius:mobile?14:16,overflow:"hidden",marginBottom:mobile?20:28,cursor:"pointer",aspectRatio:mobile?"16/9":"21/9"}}>
          <img src={heroGame.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
          <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,#0b0b10 0%,rgba(11,11,16,.3) 50%,rgba(11,11,16,.5) 100%)"}}/>
          <div style={{position:"absolute",bottom:mobile?16:28,left:mobile?16:28}}>
            <div style={{fontSize:10,color:"#00d4ff",fontWeight:700,letterSpacing:".1em",marginBottom:4}}>FEATURED</div>
            <h1 style={{fontFamily:"'Outfit'",fontSize:mobile?24:40,fontWeight:900,margin:0,lineHeight:1.1}}>{heroGame.title}</h1>
            <div style={{color:"rgba(255,255,255,.4)",fontSize:mobile?11:13,marginTop:4}}>{heroGame.year} · {heroGame.genre}{heroGame.metacritic&&" · Metacritic "+heroGame.metacritic}</div>
          </div></div>}

        {/* Welcome message for non-users */}
        {!user&&!loading&&<div style={{textAlign:"center",padding:mobile?"20px 0 28px":"24px 0 36px"}}>
          <h2 style={{fontFamily:"'Outfit'",fontSize:mobile?20:28,fontWeight:900,marginBottom:6}}>Track games you've played.</h2>
          <h2 style={{fontFamily:"'Outfit'",fontSize:mobile?20:28,fontWeight:900,color:"#555",marginBottom:12}}>Tell your friends what's good.</h2>
          <button onClick={()=>setShowAuth(true)} style={{padding:"10px 28px",borderRadius:10,border:"none",background:"#00d4ff",color:"#000",fontSize:13,fontWeight:800,cursor:"pointer"}}>Get Started — It's Free</button>
        </div>}

        {loading?<Loader/>:<>
          {/* Popular */}
          <div style={{marginBottom:mobile?24:32}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <h3 style={{fontSize:mobile?14:15,fontWeight:700,color:"#999",letterSpacing:".02em"}}>POPULAR THIS WEEK</h3>
              <span onClick={()=>setPage("explore")} style={{fontSize:11,color:"#555",cursor:"pointer"}}>More →</span></div>
            <div className="hide-scroll" style={{display:"flex",gap:mobile?8:10,overflowX:"auto",paddingBottom:4}}>
              {popular.slice(0,10).map((g,i)=><div key={g.id} style={{minWidth:mobile?120:150,flex:"0 0 auto"}}><GameCard game={g} delay={i*40} onClick={setSel} mobile={mobile} userData={userData}/></div>)}</div></div>

          {/* New Releases */}
          <div style={{marginBottom:mobile?24:32}}>
            <h3 style={{fontSize:mobile?14:15,fontWeight:700,color:"#999",letterSpacing:".02em",marginBottom:10}}>NEW RELEASES</h3>
            <div className="hide-scroll" style={{display:"flex",gap:mobile?8:10,overflowX:"auto",paddingBottom:4}}>
              {newReleases.slice(0,10).map((g,i)=><div key={g.id} style={{minWidth:mobile?120:150,flex:"0 0 auto"}}><GameCard game={g} delay={i*40} onClick={setSel} mobile={mobile} userData={userData}/></div>)}</div></div>

          {/* All Time */}
          <div style={{marginBottom:mobile?24:32}}>
            <h3 style={{fontSize:mobile?14:15,fontWeight:700,color:"#999",letterSpacing:".02em",marginBottom:10}}>HIGHEST RATED</h3>
            <div className="hide-scroll" style={{display:"flex",gap:mobile?8:10,overflowX:"auto",paddingBottom:4}}>
              {bestOfAllTime.slice(0,10).map((g,i)=><div key={g.id} style={{minWidth:mobile?120:150,flex:"0 0 auto"}}><GameCard game={g} delay={i*40} onClick={setSel} mobile={mobile} userData={userData}/></div>)}</div></div>

          {upcoming.length>0&&<div style={{marginBottom:24}}>
            <h3 style={{fontSize:mobile?14:15,fontWeight:700,color:"#999",letterSpacing:".02em",marginBottom:10}}>COMING SOON</h3>
            <div className="hide-scroll" style={{display:"flex",gap:mobile?8:10,overflowX:"auto",paddingBottom:4}}>
              {upcoming.slice(0,10).map((g,i)=><div key={g.id} style={{minWidth:mobile?120:150,flex:"0 0 auto"}}><GameCard game={g} delay={i*40} onClick={setSel} mobile={mobile} userData={userData}/></div>)}</div></div>}
        </>}</div>}

      {/* EXPLORE */}
      {page==="explore"&&<div style={{animation:"fadeIn .3s",paddingTop:12}}>
        <h2 style={{fontFamily:"'Outfit'",fontSize:mobile?20:24,fontWeight:900,marginBottom:20}}>Explore</h2>
        {loading?<Loader/>:<>
          <div style={{marginBottom:28}}><h3 style={{fontSize:13,fontWeight:700,color:"#999",letterSpacing:".02em",marginBottom:10}}>HIGHEST RATED</h3>
            <div style={{display:"grid",gridTemplateColumns:mobile?"repeat(3,1fr)":"repeat(auto-fill,minmax(150px,1fr))",gap:mobile?8:10}}>
              {bestOfAllTime.map((g,i)=><GameCard key={g.id} game={g} delay={i*30} onClick={setSel} mobile={mobile} userData={userData}/>)}</div></div>
          <div style={{marginBottom:28}}><h3 style={{fontSize:13,fontWeight:700,color:"#999",letterSpacing:".02em",marginBottom:10}}>POPULAR</h3>
            <div style={{display:"grid",gridTemplateColumns:mobile?"repeat(3,1fr)":"repeat(auto-fill,minmax(150px,1fr))",gap:mobile?8:10}}>
              {popular.map((g,i)=><GameCard key={g.id} game={g} delay={i*30} onClick={setSel} mobile={mobile} userData={userData}/>)}</div></div>
          <div><h3 style={{fontSize:13,fontWeight:700,color:"#999",letterSpacing:".02em",marginBottom:10}}>LATEST</h3>
            <div style={{display:"grid",gridTemplateColumns:mobile?"repeat(3,1fr)":"repeat(auto-fill,minmax(150px,1fr))",gap:mobile?8:10}}>
              {newReleases.map((g,i)=><GameCard key={g.id} game={g} delay={i*30} onClick={setSel} mobile={mobile} userData={userData}/>)}</div></div>
        </>}</div>}

      {/* LIBRARY */}
      {page==="library"&&user&&<div style={{animation:"fadeIn .3s",paddingTop:12}}>
        <h2 style={{fontFamily:"'Outfit'",fontSize:mobile?20:24,fontWeight:900,marginBottom:16}}>Library</h2>
        {libraryGames.length>0?<>
          <div className="hide-scroll" style={{display:"flex",gap:5,marginBottom:16,overflowX:"auto",paddingBottom:6}}>
            {[["all","All"],["playing","Playing"],["completed","Completed"],["backlog","Backlog"],["wishlist","Wishlist"],["dropped","Dropped"]].map(([k,l])=>
              <button key={k} onClick={()=>setLibFilter(k)} style={{padding:"5px 14px",borderRadius:14,fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",border:libFilter===k?"1px solid #00d4ff":"1px solid rgba(255,255,255,.06)",background:libFilter===k?"#00d4ff10":"transparent",color:libFilter===k?"#00d4ff":"#555"}}>{l} <span style={{opacity:.4}}>{k==="all"?libraryGames.length:libraryGames.filter(g=>userData[g.id]?.status===k).length}</span></button>)}</div>
          <div style={{display:"grid",gridTemplateColumns:mobile?"repeat(3,1fr)":"repeat(auto-fill,minmax(150px,1fr))",gap:mobile?8:10}}>
            {filteredLib.map((g,i)=><GameCard key={g.id} game={g} delay={i*30} onClick={setSel} mobile={mobile} userData={userData}/>)}</div>
        </>:<div style={{textAlign:"center",padding:50,color:"#555"}}>
          <div style={{fontSize:40,marginBottom:10}}>📚</div><div style={{fontSize:15,fontWeight:700}}>Empty library</div>
          <div style={{fontSize:12,color:"#444",marginTop:4}}>Search and add games to get started</div></div>}</div>}

      {/* STATS */}
      {page==="stats"&&user&&<div style={{animation:"fadeIn .3s",paddingTop:12}}>
        <h2 style={{fontFamily:"'Outfit'",fontSize:mobile?20:24,fontWeight:900,marginBottom:20}}>Stats</h2>
        {libraryGames.length>0?(()=>{const byS=s=>libraryGames.filter(g=>userData[g.id]?.status===s).length;const rated=libraryGames.filter(g=>userData[g.id]?.myRating);const avgR=rated.length?(rated.reduce((s,g)=>s+userData[g.id].myRating,0)/rated.length).toFixed(1):"—";
          return<>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:mobile?8:10,marginBottom:28}}>
              {[{l:"Games",v:libraryGames.length,c:"#00d4ff"},{l:"Completed",v:byS("completed"),c:"#00ff88"},{l:"Playing",v:byS("playing"),c:"#8b5cf6"},{l:"Avg ★",v:avgR,c:"#FFD700"}].map((s,i)=>
                <div key={i} style={{padding:mobile?12:16,borderRadius:12,textAlign:"center",background:s.c+"06",border:"1px solid "+s.c+"12"}}>
                  <div style={{fontSize:mobile?20:24,fontWeight:900,color:s.c}}>{s.v}</div><div style={{fontSize:9,color:"#555",fontWeight:700,marginTop:2}}>{s.l}</div></div>)}</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {Object.entries(STATUS_CFG).map(([k,c])=>{const cnt=byS(k),max=libraryGames.length||1;
                return<div key={k} style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{width:70,fontSize:11,color:"#666",fontWeight:600,textAlign:"right"}}>{c.label}</span>
                  <div style={{flex:1,height:20,background:"rgba(255,255,255,.03)",borderRadius:4,overflow:"hidden"}}>
                    <div style={{height:"100%",width:cnt>0?(cnt/max*100)+"%":"0%",background:c.color,borderRadius:4,opacity:.7,transition:"width .8s",display:"flex",alignItems:"center",paddingLeft:6}}>
                      {cnt>0&&<span style={{fontSize:9,fontWeight:800}}>{cnt}</span>}</div></div></div>})}</div>
          </>})():<div style={{textAlign:"center",padding:50,color:"#555"}}><div style={{fontSize:40,marginBottom:8}}>📊</div>No stats yet</div>}</div>}

      {/* PROFILE */}
      {page==="profile"&&user&&<div style={{animation:"fadeIn .3s",paddingTop:12}}>
        <div style={{display:"flex",alignItems:mobile?"center":"flex-start",gap:mobile?16:20,marginBottom:28,flexDirection:mobile?"column":"row"}}>
          <div style={{width:mobile?80:100,height:mobile?80:100,borderRadius:"50%",background:"linear-gradient(135deg,#00d4ff,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:mobile?32:40,fontWeight:900,flexShrink:0}}>{initial}</div>
          <div style={{textAlign:mobile?"center":"left",flex:1}}>
            <h2 style={{fontSize:mobile?22:28,fontWeight:900}}>{profile?.display_name||displayName}</h2>
            {profile?.username&&<div style={{color:"#555",fontSize:13}}>@{profile.username}</div>}
            {profile?.bio&&<p style={{color:"#888",fontSize:13,lineHeight:1.5,marginTop:6}}>{profile.bio}</p>}
            <div style={{display:"flex",gap:20,marginTop:10,justifyContent:mobile?"center":"flex-start"}}>
              <div style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:900,color:"#fff"}}>{libraryGames.length}</div><div style={{fontSize:10,color:"#555"}}>Games</div></div>
              <div style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:900,color:"#fff"}}>{libraryGames.filter(g=>userData[g.id]?.status==="completed").length}</div><div style={{fontSize:10,color:"#555"}}>Completed</div></div>
              <div style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:900,color:"#fff"}}>0</div><div style={{fontSize:10,color:"#555"}}>Followers</div></div>
              <div style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:900,color:"#fff"}}>0</div><div style={{fontSize:10,color:"#555"}}>Following</div></div>
            </div>
            <div style={{display:"flex",gap:8,marginTop:12,justifyContent:mobile?"center":"flex-start"}}>
              <button onClick={()=>setShowEditProfile(true)} style={{padding:"7px 18px",borderRadius:8,border:"1px solid rgba(255,255,255,.1)",background:"transparent",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>Edit Profile</button>
              <button onClick={handleSignOut} style={{padding:"7px 18px",borderRadius:8,border:"1px solid rgba(255,255,255,.06)",background:"transparent",color:"#ff4444",fontSize:12,fontWeight:700,cursor:"pointer"}}>Sign Out</button>
            </div>
          </div>
        </div>

        {/* User's games */}
        {libraryGames.length>0&&<>
          <h3 style={{fontSize:13,fontWeight:700,color:"#999",letterSpacing:".02em",marginBottom:10}}>GAMES</h3>
          <div style={{display:"grid",gridTemplateColumns:mobile?"repeat(3,1fr)":"repeat(auto-fill,minmax(150px,1fr))",gap:mobile?8:10}}>
            {libraryGames.map((g,i)=><GameCard key={g.id} game={g} delay={i*30} onClick={setSel} mobile={mobile} userData={userData}/>)}</div></>}
      </div>}
    </main>

    {/* MOBILE BOTTOM TAB */}
    {mobile&&<div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:90,background:"rgba(11,11,16,.94)",backdropFilter:"blur(20px)",borderTop:"1px solid rgba(255,255,255,.04)",display:"flex",paddingTop:4,paddingBottom:"max(env(safe-area-inset-bottom,14px),14px)"}}>
      {NAV.map(n=><div key={n.id} onClick={()=>{setPage(n.id);setSearch("");setSearchOpen(false)}}
        style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:1,cursor:"pointer",padding:"4px 0"}}>
        <span style={{fontSize:20,opacity:page===n.id?1:.3,transition:"all .2s"}}>{n.icon}</span>
        <span style={{fontSize:8,fontWeight:700,color:page===n.id?"#00d4ff":"#555"}}>{n.l}</span></div>)}</div>}

    {sel&&<Modal game={sel} onClose={()=>setSel(null)} mobile={mobile} userData={userData} setUserData={setUserData} user={user} setShowAuth={setShowAuth}/>}
  </div>}
