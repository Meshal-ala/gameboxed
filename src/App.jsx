import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

const AK = "33d378268c5d452ab1f3a9cb04c89f38", AP = "https://api.rawg.io/api";
const PP = {1:{n:"PC",i:"🖥️",c:"#00d4ff"},2:{n:"PlayStation",i:"🎮",c:"#006FCD"},3:{n:"Xbox",i:"🟢",c:"#107C10"},7:{n:"Nintendo",i:"🔴",c:"#E60012"}};
const SC = {completed:{c:"#00ff88",l:"Completed"},playing:{c:"#00d4ff",l:"Playing"},wishlist:{c:"#FFD700",l:"Wishlist"},dropped:{c:"#ff4444",l:"Dropped"},backlog:{c:"#8b5cf6",l:"Backlog"}};

const fg=async(p="")=>{try{const r=await fetch(`${AP}/games?key=${AK}&page_size=12${p}`);return(await r.json()).results||[]}catch{return[]}};
const fgd=async(id)=>{try{return await(await fetch(`${AP}/games/${id}?key=${AK}`)).json()}catch{return null}};
const sga=async(q)=>{try{return(await(await fetch(`${AP}/games?key=${AK}&search=${encodeURIComponent(q)}&page_size=20&search_precise=true`)).json()).results||[]}catch{return[]}};
const nm=g=>({id:g.id,title:g.name,year:g.released?.slice(0,4)||"TBA",img:g.background_image||"",rating:g.rating?Math.round(g.rating*10)/10:null,metacritic:g.metacritic,reviews:g.ratings_count||0,genre:g.genres?.map(x=>x.name).slice(0,2).join(", ")||"Unknown",platforms:(g.parent_platforms||[]).map(p=>PP[p.platform.id]).filter(Boolean),screenshots:g.short_screenshots?.map(s=>s.image)||[],slug:g.slug});

const lcl=async u=>{const{data}=await supabase.from("user_games").select("*").eq("user_id",u);const l={};(data||[]).forEach(r=>{l[r.game_id]={status:r.status,myRating:r.my_rating,title:r.game_title,img:r.game_img}});return l};
const stc=async(u,g,f)=>{const{data:e}=await supabase.from("user_games").select("id").eq("user_id",u).eq("game_id",g).single();if(e)await supabase.from("user_games").update({status:f.status,my_rating:f.myRating,game_title:f.title,game_img:f.img,updated_at:new Date().toISOString()}).eq("id",e.id);else await supabase.from("user_games").insert({user_id:u,game_id:g,status:f.status,my_rating:f.myRating,game_title:f.title,game_img:f.img})};
const lp=async u=>{const{data}=await supabase.from("profiles").select("*").eq("id",u).single();return data};
const upf=async(u,f)=>await supabase.from("profiles").update(f).eq("id",u);
const searchPeople=async q=>{const{data}=await supabase.from("profiles").select("*").ilike("display_name",`%${q}%`).limit(20);return data||[]};
const searchLists=async q=>{const{data}=await supabase.from("lists").select("*,profiles(display_name,username)").ilike("title",`%${q}%`).eq("is_public",true).limit(20);return data||[]};
const loadLists=async u=>{const{data}=await supabase.from("lists").select("*").eq("user_id",u);return data||[]};
const createList=async(u,title,desc)=>await supabase.from("lists").insert({user_id:u,title,description:desc}).select().single();
const updateList=async(id,fields)=>await supabase.from("lists").update(fields).eq("id",id);

const useM=()=>{const[m,setM]=useState(window.innerWidth<768);useEffect(()=>{const h=()=>setM(window.innerWidth<768);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h)},[]);return m};

/* ── Half-Star Rating ── */
const Stars=({rating=0,size=14,interactive,onRate})=>{
  const[hov,setHov]=useState(0);
  const active=hov||rating;
  const handleClick=(star,e)=>{
    if(!interactive||!onRate)return;
    const rect=e.currentTarget.getBoundingClientRect();
    const x=e.clientX-rect.left;
    const half=x<rect.width/2;
    onRate(half?star-0.5:star);
  };
  return<div style={{display:"flex",gap:1,alignItems:"center"}}>{[1,2,3,4,5].map(s=>{
    const full=s<=Math.floor(active);const half=!full&&s-0.5<=active&&s>active-0.5;
    return<span key={s} onClick={e=>handleClick(s,e)}
      onMouseEnter={()=>interactive&&setHov(s)} onMouseLeave={()=>interactive&&setHov(0)}
      style={{fontSize:size,cursor:interactive?"pointer":"default",position:"relative",lineHeight:1,
        color:full?"#FFD700":half?"#FFD700":"#2a2a3a",transition:"all .15s",
        transform:interactive&&s<=Math.ceil(hov)?"scale(1.15)":"scale(1)",
        filter:(full||half)?"drop-shadow(0 0 3px rgba(255,215,0,.4))":"none"}}>
      {half?<><span style={{position:"absolute",overflow:"hidden",width:"50%"}}>★</span><span style={{color:"#2a2a3a"}}>★</span></>:"★"}
    </span>})}{interactive&&active>0&&<span style={{fontSize:size*.7,color:"#FFD700",fontWeight:700,marginLeft:3}}>{active}</span>}</div>};

const Loader=()=><div style={{display:"flex",justifyContent:"center",padding:40}}><div style={{width:28,height:28,border:"3px solid #1a1a2e",borderTopColor:"#00d4ff",borderRadius:"50%",animation:"spin .8s linear infinite"}}/></div>;

/* ── Game Card ── */
const GC=({game:g,onClick,delay=0,mobile:m,userData:ud,size="normal"})=>{
  const[hov,setHov]=useState(false);const[vis,setVis]=useState(false);const[err,setErr]=useState(false);
  useEffect(()=>{const t=setTimeout(()=>setVis(true),delay);return()=>clearTimeout(t)},[delay]);
  const u=ud?.[g.id];const sm=size==="small";const tn=size==="tiny";
  return<div onClick={()=>onClick?.(g)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
    style={{borderRadius:tn?6:sm?8:10,overflow:"hidden",cursor:"pointer",position:"relative",aspectRatio:tn?"3/4":"2/3",
      opacity:vis?1:0,transform:vis?(hov&&!m?"translateY(-3px)":"none"):"translateY(10px)",
      transition:"all .3s cubic-bezier(.22,1,.36,1)",
      boxShadow:hov&&!m?"0 12px 30px rgba(0,0,0,.5)":"0 2px 8px rgba(0,0,0,.15)"}}>
    {!err&&g.img?<img src={g.img} alt={g.title} onError={()=>setErr(true)} loading="lazy"
      style={{width:"100%",height:"100%",objectFit:"cover",transition:"transform .4s",transform:hov&&!m?"scale(1.04)":"scale(1)"}}/>
      :<div style={{width:"100%",height:"100%",background:"linear-gradient(135deg,#16213e,#0f3460)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:tn?16:sm?24:32,color:"#ffffff15"}}>🎮</div>}
    <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,.88) 0%,rgba(0,0,0,.05) 55%,transparent 100%)"}}/>
    {u?.status&&!tn&&<div style={{position:"absolute",top:sm?3:5,left:sm?3:5,padding:sm?"1px 4px":"2px 6px",borderRadius:8,background:"rgba(0,0,0,.6)",fontSize:sm?6:7,fontWeight:800,color:SC[u.status]?.c,letterSpacing:".04em"}}>{SC[u.status]?.l.toUpperCase()}</div>}
    <div style={{position:"absolute",bottom:0,left:0,right:0,padding:tn?"4px":sm?"5px":"8px 9px"}}>
      <div style={{fontSize:tn?8:sm?9:12,fontWeight:700,lineHeight:1.2,overflow:"hidden",textOverflow:"ellipsis",display:"-webkit-box",WebkitLineClamp:tn?1:2,WebkitBoxOrient:"vertical"}}>{g.title}</div>
      {!tn&&!sm&&g.rating&&<div style={{display:"flex",alignItems:"center",gap:2,marginTop:2}}><Stars rating={Math.round(g.rating)} size={7}/><span style={{fontSize:8,color:"#FFD700",fontWeight:700}}>{g.rating}</span></div>}
      {!tn&&<div style={{fontSize:tn?6:7,color:"rgba(255,255,255,.3)",marginTop:1}}>{g.year}</div>}
    </div></div>};

/* ── Wide Card ── */
const WC=({game:g,onClick,mobile:m,userData:ud,label})=>{
  const[hov,setHov]=useState(false);
  return<div onClick={()=>onClick?.(g)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
    style={{borderRadius:12,overflow:"hidden",cursor:"pointer",position:"relative",aspectRatio:m?"16/9":"21/9",
      boxShadow:hov&&!m?"0 16px 40px rgba(0,0,0,.5)":"0 2px 12px rgba(0,0,0,.2)",transition:"all .3s",marginBottom:m?20:28}}>
    <img src={g.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover",transition:"transform .5s",transform:hov&&!m?"scale(1.03)":"scale(1)"}}/>
    <div style={{position:"absolute",inset:0,background:"linear-gradient(to right,rgba(0,0,0,.85) 0%,rgba(0,0,0,.2) 70%,transparent 100%)"}}/>
    <div style={{position:"absolute",bottom:m?14:20,left:m?14:24}}>
      {label&&<div style={{fontSize:9,color:"#00d4ff",fontWeight:700,letterSpacing:".1em",marginBottom:3}}>{label}</div>}
      <h3 style={{fontSize:m?18:28,fontWeight:900,margin:0,lineHeight:1.15}}>{g.title}</h3>
      <div style={{fontSize:m?10:12,color:"rgba(255,255,255,.4)",marginTop:3}}>{g.year} · {g.genre}</div>
    </div></div>};

const Sec=({title,children,action,onAction})=><div style={{marginBottom:28}}>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
    <h3 style={{fontSize:13,fontWeight:700,color:"#888",letterSpacing:".04em"}}>{title}</h3>
    {action&&<span onClick={onAction} style={{fontSize:11,color:"#444",cursor:"pointer",fontWeight:600}}>More →</span>}</div>{children}</div>;

/* ── Auth ── */
const Auth=({onClose,onAuth})=>{const[mode,setMode]=useState("login");const[email,setEmail]=useState("");const[pw,setPw]=useState("");const[name,setName]=useState("");const[err,setErr]=useState("");const[ld,setLd]=useState(false);const[sent,setSent]=useState(false);
  const go=async()=>{setErr("");setLd(true);try{if(mode==="signup"){const{error:e}=await supabase.auth.signUp({email,password:pw,options:{data:{display_name:name}}});if(e)throw e;setSent(true)}else{const{data,error:e}=await supabase.auth.signInWithPassword({email,password:pw});if(e)throw e;onAuth(data.user);onClose()}}catch(e){setErr(e.message)}setLd(false)};
  const i={width:"100%",padding:"12px 14px",borderRadius:10,border:"1px solid rgba(255,255,255,.08)",background:"rgba(255,255,255,.04)",color:"#fff",fontSize:14,outline:"none",marginBottom:10};
  return<div onClick={onClose} style={{position:"fixed",inset:0,zIndex:2000,background:"rgba(0,0,0,.85)",backdropFilter:"blur(24px)",display:"flex",alignItems:"center",justifyContent:"center",animation:"fadeIn .2s",padding:16}}>
    <div onClick={e=>e.stopPropagation()} style={{background:"#111118",borderRadius:20,width:"100%",maxWidth:380,padding:"32px 28px",border:"1px solid rgba(255,255,255,.06)",animation:"slideUp .3s cubic-bezier(.22,1,.36,1)"}}>
      {sent?<div style={{textAlign:"center"}}><div style={{fontSize:48,marginBottom:12}}>📧</div><h2 style={{fontSize:20,fontWeight:800,marginBottom:8}}>Check Your Email</h2><p style={{color:"#888",fontSize:13}}>Link sent to <span style={{color:"#00d4ff"}}>{email}</span></p>
        <button onClick={onClose} style={{marginTop:20,padding:"10px 24px",borderRadius:10,border:"none",background:"#00d4ff",color:"#000",fontSize:13,fontWeight:800,cursor:"pointer"}}>OK</button></div>
      :<><div style={{textAlign:"center",marginBottom:24}}><h2 style={{fontSize:22,fontWeight:900}}>{mode==="login"?"Sign in":"Join Gameboxed"}</h2><p style={{color:"#555",fontSize:12,marginTop:4}}>{mode==="login"?"Welcome back":"Track your gaming journey"}</p></div>
        {err&&<div style={{padding:"10px 12px",borderRadius:8,background:"#ff444412",border:"1px solid #ff444425",color:"#ff6666",fontSize:12,marginBottom:12}}>{err}</div>}
        {mode==="signup"&&<input placeholder="Display name" value={name} onChange={e=>setName(e.target.value)} style={i}/>}
        <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={i}/>
        <input type="password" placeholder="Password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()} style={i}/>
        <button onClick={go} disabled={ld} style={{width:"100%",padding:"12px",borderRadius:10,border:"none",marginTop:4,background:ld?"#333":"#00d4ff",color:ld?"#666":"#000",fontSize:14,fontWeight:800,cursor:ld?"default":"pointer"}}>{ld?"...":mode==="login"?"Sign In":"Create Account"}</button>
        <div style={{textAlign:"center",marginTop:14,fontSize:12,color:"#555"}}>{mode==="login"?"New? ":"Have account? "}<span onClick={()=>{setMode(mode==="login"?"signup":"login");setErr("")}} style={{color:"#00d4ff",cursor:"pointer",fontWeight:700}}>{mode==="login"?"Create account":"Sign in"}</span></div></>}</div></div>};

/* ── Edit Profile ── */
const EP=({profile:p,onClose,onSave})=>{const[n,setN]=useState(p?.display_name||"");const[u,setU]=useState(p?.username||"");const[b,setB]=useState(p?.bio||"");const[ld,setLd]=useState(false);
  const s=async()=>{setLd(true);await onSave({display_name:n,username:u.toLowerCase().replace(/[^a-z0-9_]/g,""),bio:b});setLd(false);onClose()};
  const i={width:"100%",padding:"12px 14px",borderRadius:10,border:"1px solid rgba(255,255,255,.08)",background:"rgba(255,255,255,.04)",color:"#fff",fontSize:14,outline:"none",marginBottom:12};
  return<div onClick={onClose} style={{position:"fixed",inset:0,zIndex:2000,background:"rgba(0,0,0,.85)",backdropFilter:"blur(24px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
    <div onClick={e=>e.stopPropagation()} style={{background:"#111118",borderRadius:20,width:"100%",maxWidth:380,padding:"28px 24px",border:"1px solid rgba(255,255,255,.06)"}}>
      <h2 style={{fontSize:20,fontWeight:900,marginBottom:20}}>Edit Profile</h2>
      <label style={{fontSize:11,color:"#555",fontWeight:700,letterSpacing:".06em",display:"block",marginBottom:4}}>NAME</label><input value={n} onChange={e=>setN(e.target.value)} style={i}/>
      <label style={{fontSize:11,color:"#555",fontWeight:700,letterSpacing:".06em",display:"block",marginBottom:4}}>USERNAME</label><input value={u} onChange={e=>setU(e.target.value)} style={i} placeholder="username"/>
      <label style={{fontSize:11,color:"#555",fontWeight:700,letterSpacing:".06em",display:"block",marginBottom:4}}>BIO</label><textarea value={b} onChange={e=>setB(e.target.value)} rows={3} style={{...i,resize:"none",fontFamily:"inherit"}} placeholder="About you..."/>
      <div style={{display:"flex",gap:8,marginTop:4}}>
        <button onClick={onClose} style={{flex:1,padding:"11px",borderRadius:10,border:"1px solid rgba(255,255,255,.08)",background:"transparent",color:"#888",fontSize:13,fontWeight:700,cursor:"pointer"}}>Cancel</button>
        <button onClick={s} disabled={ld} style={{flex:1,padding:"11px",borderRadius:10,border:"none",background:"#00d4ff",color:"#000",fontSize:13,fontWeight:800,cursor:"pointer"}}>{ld?"...":"Save"}</button></div></div></div>};

/* ── Game Detail ── */
const GD=({game:g,onClose,mobile:m,userData:ud,setUserData,user,setShowAuth})=>{
  const[det,setDet]=useState(null);const[ldg,setLdg]=useState(true);const d=ud[g.id]||{};
  const[mr,setMr]=useState(d.myRating||0);const[st,setSt]=useState(d.status||"");const[tab,setTab]=useState("about");
  useEffect(()=>{setLdg(true);fgd(g.id).then(d=>{setDet(d);setLdg(false)});},[g.id]);
  const sv=async(f,v)=>{if(!user){setShowAuth(true);return}const nd={...d,[f]:v,title:g.title,img:g.img};if(f==="myRating")setMr(v);if(f==="status")setSt(v);const nu={...ud,[g.id]:nd};setUserData(nu);await stc(user.id,g.id,nd)};

  return<div onClick={onClose} style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,.92)",backdropFilter:"blur(20px)",display:"flex",alignItems:m?"flex-end":"center",justifyContent:"center",animation:"fadeIn .2s",padding:m?0:16}}>
    <div onClick={e=>e.stopPropagation()} style={{background:"#111118",width:"100%",maxWidth:m?"100%":640,maxHeight:m?"92vh":"85vh",borderRadius:m?"20px 20px 0 0":20,overflow:"auto",border:m?"none":"1px solid rgba(255,255,255,.06)",animation:m?"slideFromBottom .3s cubic-bezier(.22,1,.36,1)":"slideUp .3s cubic-bezier(.22,1,.36,1)"}}>
      {m&&<div onClick={onClose} style={{display:"flex",justifyContent:"center",padding:"10px 0 0"}}><div style={{width:36,height:4,borderRadius:2,background:"rgba(255,255,255,.15)"}}/></div>}
      <div style={{position:"relative",height:m?160:200,overflow:"hidden"}}>
        <img src={g.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,#111118 0%,rgba(17,17,24,.4) 100%)"}}/>
        {!m&&<button onClick={onClose} style={{position:"absolute",top:12,right:12,width:34,height:34,borderRadius:17,background:"rgba(0,0,0,.4)",border:"none",color:"#fff",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>}
        <div style={{position:"absolute",bottom:12,left:m?16:20,right:m?16:20}}>
          <h2 style={{fontSize:m?20:26,fontWeight:900,margin:0}}>{g.title}</h2>
          <div style={{color:"rgba(255,255,255,.4)",fontSize:12,marginTop:2}}>{g.year} · {g.genre}</div></div></div>
      <div style={{padding:m?"12px 16px 28px":"16px 20px 24px"}}>
        <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:16,padding:"12px 0",borderBottom:"1px solid rgba(255,255,255,.04)"}}>
          {g.rating&&<div><div style={{fontSize:10,color:"#555",fontWeight:700}}>RATING</div><div style={{fontSize:20,fontWeight:900,color:"#FFD700"}}>{g.rating}</div></div>}
          {g.metacritic&&<div><div style={{fontSize:10,color:"#555",fontWeight:700}}>META</div><div style={{fontSize:20,fontWeight:900,color:g.metacritic>=75?"#00ff88":"#FFD700"}}>{g.metacritic}</div></div>}
          <div><div style={{fontSize:10,color:"#555",fontWeight:700}}>YOURS</div><div style={{fontSize:20,fontWeight:900,color:"#00d4ff"}}>{mr||"—"}</div></div>
          <div style={{marginLeft:"auto",display:"flex",gap:3}}>{g.platforms.map((p,i)=><span key={i} style={{fontSize:8,fontWeight:700,padding:"3px 6px",borderRadius:4,background:p.c+"10",color:p.c}}>{p.n}</span>)}</div></div>

        {/* Half-star rating */}
        <div style={{marginBottom:16}}>
          <div style={{fontSize:10,color:"#444",fontWeight:700,marginBottom:6,letterSpacing:".06em"}}>YOUR RATING</div>
          <Stars rating={mr} size={m?24:28} interactive onRate={v=>sv("myRating",v)}/></div>

        <div style={{marginBottom:16}}>
          <div style={{fontSize:10,color:"#444",fontWeight:700,marginBottom:6,letterSpacing:".06em"}}>STATUS</div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{Object.entries(SC).map(([k,c])=><button key={k} onClick={()=>sv("status",k)} style={{padding:"4px 10px",borderRadius:14,fontSize:10,fontWeight:700,cursor:"pointer",border:st===k?"1px solid "+c.c:"1px solid #1a1a2a",background:st===k?c.c+"12":"transparent",color:st===k?c.c:"#555"}}>{c.l}</button>)}</div></div>

        <div style={{display:"flex",gap:0,borderBottom:"1px solid rgba(255,255,255,.04)",marginBottom:14}}>
          {["about","screenshots"].map(t=><button key={t} onClick={()=>setTab(t)} style={{padding:"8px 16px",background:"none",border:"none",fontSize:12,fontWeight:700,cursor:"pointer",color:tab===t?"#fff":"#444",borderBottom:tab===t?"2px solid #00d4ff":"2px solid transparent",textTransform:"capitalize"}}>{t}</button>)}</div>
        {tab==="about"&&(ldg?<Loader/>:det?.description_raw&&<p style={{color:"#777",fontSize:13,lineHeight:1.7,maxHeight:140,overflow:"hidden",WebkitMaskImage:"linear-gradient(to bottom,black 70%,transparent)"}}>{det.description_raw.slice(0,500)}</p>)}
        {tab==="screenshots"&&g.screenshots?.length>1&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>{g.screenshots.slice(1,7).map((s,i)=><img key={i} src={s} alt="" loading="lazy" style={{width:"100%",borderRadius:8,aspectRatio:"16/9",objectFit:"cover"}}/>)}</div>}
      </div></div></div>};

/* ═══ MAIN ═══ */
export default function App(){
  const m=useM();const[pg,setPg]=useState("home");const[sel,setSel]=useState(null);const[q,setQ]=useState("");const[qOpen,setQOpen]=useState(false);
  const[ud,setUd]=useState({});const[user,setUser]=useState(null);const[prof,setProf]=useState(null);
  const[sa,setSa]=useState(false);const[ep,setEp]=useState(false);
  const[popular,setPopular]=useState([]);const[best,setBest]=useState([]);const[fresh,setFresh]=useState([]);const[soon,setSoon]=useState([]);const[action,setAction]=useState([]);const[rpg,setRpg]=useState([]);
  const[sr,setSr]=useState([]);const[peopleSr,setPeopleSr]=useState([]);const[listsSr,setListsSr]=useState([]);
  const[ld,setLd]=useState(true);const[sng,setSng]=useState(false);const[lf,setLf]=useState("all");const[searchTab,setSearchTab]=useState("games");
  const[myLists,setMyLists]=useState([]);const[newListName,setNewListName]=useState("");
  const stt=useRef(null);

  useEffect(()=>{supabase.auth.getSession().then(({data:{session}})=>{const u=session?.user||null;setUser(u);if(u){lcl(u.id).then(setUd);lp(u.id).then(setProf);loadLists(u.id).then(setMyLists)}});
    const{data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>{const u=session?.user||null;setUser(u);if(u){lcl(u.id).then(setUd);lp(u.id).then(setProf);loadLists(u.id).then(setMyLists)}else{setUd({});setProf(null);setMyLists([])}});return()=>subscription.unsubscribe()},[]);

  useEffect(()=>{setLd(true);const td=new Date().toISOString().slice(0,10);const ly=new Date(Date.now()-365*864e5).toISOString().slice(0,10);const ny=new Date(Date.now()+365*864e5).toISOString().slice(0,10);
    Promise.all([fg(`&dates=${ly},${td}&ordering=-rating&metacritic=70,100`),fg(`&ordering=-metacritic&metacritic=85,100`),fg(`&dates=${ly},${td}&ordering=-released`),fg(`&dates=${td},${ny}&ordering=-added`),
      fg(`&genres=action&ordering=-rating&metacritic=75,100&page_size=8`),fg(`&genres=role-playing-games-rpg&ordering=-rating&metacritic=75,100&page_size=8`)
    ]).then(([p,b,n,u,a,r])=>{setPopular(p.map(nm));setBest(b.map(nm));setFresh(n.map(nm));setSoon(u.map(nm));setAction(a.map(nm));setRpg(r.map(nm));setLd(false)})},[]);

  useEffect(()=>{if(stt.current)clearTimeout(stt.current);if(!q.trim()){setSr([]);setPeopleSr([]);setListsSr([]);return}setSng(true);
    stt.current=setTimeout(async()=>{
      const[games,people,lists]=await Promise.all([sga(q),searchPeople(q),searchLists(q)]);
      setSr(games.map(nm));setPeopleSr(people);setListsSr(lists);setSng(false)},400)},[q]);

  const all=[...popular,...best,...fresh,...soon,...action,...rpg,...sr];
  const lib=Object.entries(ud).filter(([_,v])=>v.status).map(([id,v])=>{const f=all.find(g=>g.id===parseInt(id));return f||{id:parseInt(id),title:v.title||"?",img:v.img||"",year:"",genre:"",rating:null,platforms:[],metacritic:null}});
  const flib=lf==="all"?lib:lib.filter(g=>ud[g.id]?.status===lf);
  const so=async()=>{await supabase.auth.signOut();setUser(null);setUd({});setProf(null);setPg("home")};
  const dn=prof?.display_name||user?.user_metadata?.display_name||user?.email?.split("@")[0]||"";
  const ini=dn.charAt(0).toUpperCase()||"?";
  const sP=async f=>{await upf(user.id,f);setProf({...prof,...f})};
  const handleCreateList=async()=>{if(!newListName.trim()||!user)return;const{data}=await createList(user.id,newListName,"");if(data)setMyLists([...myLists,data]);setNewListName("")};
  const NAV=user?[{id:"home",i:"🏠",l:"Home"},{id:"explore",i:"🔍",l:"Explore"},{id:"library",i:"📚",l:"Library"},{id:"stats",i:"📊",l:"Stats"},{id:"profile",i:"👤",l:"Profile"}]:[{id:"home",i:"🏠",l:"Home"},{id:"explore",i:"🔍",l:"Explore"}];

  return<div style={{fontFamily:"'DM Sans','Outfit',system-ui,sans-serif",background:"#0b0b10",color:"#fff",minHeight:"100vh"}}>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,100..1000&family=Outfit:wght@100..900&display=swap');
      *{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#222;border-radius:3px}
      @keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
      @keyframes slideFromBottom{from{transform:translateY(100%)}to{transform:translateY(0)}}@keyframes spin{to{transform:rotate(360deg)}}
      body{background:#0b0b10;overflow-x:hidden}img{-webkit-user-drag:none}.hs::-webkit-scrollbar{display:none}.hs{-ms-overflow-style:none;scrollbar-width:none}
      @media(max-width:767px){*{-webkit-tap-highlight-color:transparent}}`}</style>

    {sa&&<Auth onClose={()=>setSa(false)} onAuth={u=>{setUser(u);setSa(false)}}/>}
    {ep&&<EP profile={prof} onClose={()=>setEp(false)} onSave={sP}/>}

    {/* NAV */}
    {!m&&<nav style={{position:"sticky",top:0,zIndex:100,background:"rgba(11,11,16,.85)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,.04)",padding:"0 32px",height:50,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:28}}>
        <span onClick={()=>{setPg("home");setQ("")}} style={{fontFamily:"'Outfit'",fontSize:15,fontWeight:900,letterSpacing:".06em",cursor:"pointer",color:"#00d4ff"}}>GAMEBOXED</span>
        <div style={{display:"flex",gap:0}}>{NAV.filter(n=>n.id!=="profile").map(n=><button key={n.id} onClick={()=>{setPg(n.id);setQ("")}} style={{padding:"6px 12px",borderRadius:6,border:"none",background:"transparent",color:pg===n.id?"#fff":"#555",cursor:"pointer",fontSize:12,fontWeight:600}}>{n.l}</button>)}</div></div>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{position:"relative"}}><input placeholder="Search games, people, lists..." value={q} onChange={e=>{setQ(e.target.value);if(e.target.value)setPg("search")}}
          style={{padding:"7px 12px 7px 32px",borderRadius:8,border:"1px solid rgba(255,255,255,.06)",background:"rgba(255,255,255,.03)",color:"#fff",fontSize:12,width:220,outline:"none"}}/>
          <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",fontSize:12,color:"#444"}}>🔍</span></div>
        {user?<div onClick={()=>setPg("profile")} style={{width:28,height:28,borderRadius:14,background:"linear-gradient(135deg,#00d4ff,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,cursor:"pointer"}}>{ini}</div>
          :<button onClick={()=>setSa(true)} style={{padding:"6px 16px",borderRadius:8,border:"none",background:"#00d4ff",color:"#000",fontSize:11,fontWeight:800,cursor:"pointer"}}>Sign In</button>}</div></nav>}

    {m&&<div style={{position:"sticky",top:0,zIndex:100,background:"rgba(11,11,16,.92)",backdropFilter:"blur(20px)",padding:"0 14px",height:46,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid rgba(255,255,255,.04)"}}>
      {qOpen?<div style={{flex:1,display:"flex",alignItems:"center",gap:8}}>
        <input autoFocus placeholder="Search..." value={q} onChange={e=>{setQ(e.target.value);if(e.target.value)setPg("search")}}
          style={{flex:1,padding:"7px 12px",borderRadius:8,border:"1px solid rgba(0,212,255,.2)",background:"rgba(255,255,255,.04)",color:"#fff",fontSize:13,outline:"none"}}/>
        <span onClick={()=>{setQOpen(false);setQ("");setPg("home")}} style={{color:"#00d4ff",fontSize:12,fontWeight:700,cursor:"pointer"}}>Cancel</span></div>
      :<><span style={{fontFamily:"'Outfit'",fontSize:14,fontWeight:900,letterSpacing:".06em",color:"#00d4ff"}}>GAMEBOXED</span>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span onClick={()=>{setQOpen(true);setPg("search")}} style={{fontSize:15,cursor:"pointer"}}>🔍</span>
          {user?<div onClick={()=>setPg("profile")} style={{width:24,height:24,borderRadius:12,background:"linear-gradient(135deg,#00d4ff,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,cursor:"pointer"}}>{ini}</div>
            :<button onClick={()=>setSa(true)} style={{padding:"4px 12px",borderRadius:6,border:"none",background:"#00d4ff",color:"#000",fontSize:9,fontWeight:800,cursor:"pointer"}}>Sign In</button>}</div></>}</div>}

    <main style={{maxWidth:1100,margin:"0 auto",padding:m?"8px 12px 86px":"16px 24px 50px"}}>

      {/* ═══ SEARCH with tabs ═══ */}
      {pg==="search"&&<div style={{animation:"fadeIn .3s",paddingTop:10}}>
        <h2 style={{fontFamily:"'Outfit'",fontSize:m?18:22,fontWeight:900,marginBottom:12}}>{q?`"${q}"`:"Search"}</h2>
        {/* Tabs */}
        <div style={{display:"flex",gap:0,borderBottom:"1px solid rgba(255,255,255,.04)",marginBottom:16}}>
          {[{k:"games",l:"Games",c:sr.length},{k:"people",l:"People",c:peopleSr.length},{k:"lists",l:"Lists",c:listsSr.length}].map(t=>
            <button key={t.k} onClick={()=>setSearchTab(t.k)} style={{padding:"8px 16px",background:"none",border:"none",fontSize:12,fontWeight:700,cursor:"pointer",
              color:searchTab===t.k?"#fff":"#444",borderBottom:searchTab===t.k?"2px solid #00d4ff":"2px solid transparent"}}>
              {t.l}{q&&!sng&&<span style={{marginLeft:4,fontSize:10,color:"#555"}}>{t.c}</span>}</button>)}</div>

        {sng?<Loader/>:<>
          {/* Games tab */}
          {searchTab==="games"&&(sr.length>0?<div style={{display:"grid",gridTemplateColumns:m?"repeat(3,1fr)":"repeat(auto-fill,minmax(140px,1fr))",gap:m?6:10}}>
            {sr.map((g,i)=><GC key={g.id} game={g} delay={i*25} onClick={setSel} mobile={m} userData={ud}/>)}</div>
            :q&&<div style={{textAlign:"center",padding:50,color:"#444"}}>No games found</div>)}

          {/* People tab */}
          {searchTab==="people"&&(peopleSr.length>0?<div style={{display:"flex",flexDirection:"column",gap:8}}>
            {peopleSr.map((p,i)=><div key={p.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderRadius:12,background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.04)",cursor:"pointer",transition:"all .2s"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(0,212,255,.15)"} onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(255,255,255,.04)"}>
              <div style={{width:40,height:40,borderRadius:20,background:"linear-gradient(135deg,#00d4ff,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,flexShrink:0}}>{(p.display_name||"?").charAt(0).toUpperCase()}</div>
              <div><div style={{fontSize:14,fontWeight:700}}>{p.display_name||"Unknown"}</div>
                {p.username&&<div style={{fontSize:11,color:"#555"}}>@{p.username}</div>}
                {p.bio&&<div style={{fontSize:11,color:"#666",marginTop:2}}>{p.bio.slice(0,60)}{p.bio.length>60?"...":""}</div>}</div>
            </div>)}</div>
            :q&&<div style={{textAlign:"center",padding:50,color:"#444"}}>No people found</div>)}

          {/* Lists tab */}
          {searchTab==="lists"&&(listsSr.length>0?<div style={{display:"flex",flexDirection:"column",gap:8}}>
            {listsSr.map((l,i)=><div key={l.id} style={{padding:"12px 16px",borderRadius:12,background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.04)"}}>
              <div style={{fontSize:14,fontWeight:700,marginBottom:2}}>📝 {l.title}</div>
              {l.description&&<div style={{fontSize:11,color:"#666"}}>{l.description}</div>}
              <div style={{fontSize:10,color:"#555",marginTop:4}}>{l.game_ids?.length||0} games · by {l.profiles?.display_name||"Unknown"}</div>
            </div>)}</div>
            :q&&<div style={{textAlign:"center",padding:50,color:"#444"}}>No lists found</div>)}
        </>}</div>}

      {/* ═══ HOME ═══ */}
      {pg==="home"&&<div style={{animation:"fadeIn .4s"}}>
        {!user&&!ld&&<div style={{textAlign:"center",padding:m?"20px 0 24px":"28px 0 32px",borderBottom:"1px solid rgba(255,255,255,.04)",marginBottom:m?20:28}}>
          <h1 style={{fontFamily:"'Outfit'",fontSize:m?22:32,fontWeight:900,lineHeight:1.2,marginBottom:6}}>Track games you've played.</h1>
          <h1 style={{fontFamily:"'Outfit'",fontSize:m?22:32,fontWeight:900,lineHeight:1.2,color:"#444",marginBottom:14}}>Tell your friends what's good.</h1>
          <button onClick={()=>setSa(true)} style={{padding:"10px 28px",borderRadius:10,border:"none",background:"#00d4ff",color:"#000",fontSize:13,fontWeight:800,cursor:"pointer"}}>Get Started — It's Free</button></div>}

        {ld?<Loader/>:<>
          {popular[0]&&<WC game={popular[0]} onClick={setSel} mobile={m} userData={ud} label="TRENDING NOW"/>}

          <Sec title="POPULAR THIS WEEK" action="More →" onAction={()=>setPg("explore")}>
            <div style={{display:"grid",gridTemplateColumns:m?"repeat(3,1fr)":"repeat(6,1fr)",gap:m?6:10}}>
              {popular.slice(1,7).map((g,i)=><GC key={g.id} game={g} delay={i*30} onClick={setSel} mobile={m} userData={ud}/>)}</div></Sec>

          <Sec title="JUST RELEASED">
            <div style={{display:"grid",gridTemplateColumns:m?"repeat(3,1fr)":"repeat(6,1fr)",gap:m?6:10}}>
              {fresh.slice(0,6).map((g,i)=><GC key={g.id} game={g} delay={i*30} onClick={setSel} mobile={m} userData={ud}/>)}</div></Sec>

          {best[0]&&<WC game={best[0]} onClick={setSel} mobile={m} userData={ud} label="HIGHEST RATED"/>}

          <Sec title="ALL-TIME GREATS">
            <div style={{display:"grid",gridTemplateColumns:m?"repeat(3,1fr)":"repeat(6,1fr)",gap:m?6:10}}>
              {best.slice(1,7).map((g,i)=><GC key={g.id} game={g} delay={i*30} onClick={setSel} mobile={m} userData={ud}/>)}</div></Sec>

          {/* Coming Soon - tiny cards */}
          {soon.length>0&&<Sec title="COMING SOON">
            <div style={{display:"grid",gridTemplateColumns:m?"repeat(4,1fr)":"repeat(8,1fr)",gap:m?5:8}}>
              {soon.slice(0,m?8:8).map((g,i)=><GC key={g.id} game={g} delay={i*25} onClick={setSel} mobile={m} userData={ud} size="tiny"/>)}</div></Sec>}

          <Sec title="TOP ACTION">
            <div style={{display:"grid",gridTemplateColumns:m?"repeat(3,1fr)":"repeat(6,1fr)",gap:m?6:10}}>
              {action.slice(0,6).map((g,i)=><GC key={g.id} game={g} delay={i*30} onClick={setSel} mobile={m} userData={ud}/>)}</div></Sec>

          <Sec title="TOP RPGs">
            <div style={{display:"grid",gridTemplateColumns:m?"repeat(3,1fr)":"repeat(6,1fr)",gap:m?6:10}}>
              {rpg.slice(0,6).map((g,i)=><GC key={g.id} game={g} delay={i*30} onClick={setSel} mobile={m} userData={ud}/>)}</div></Sec>

          {fresh[0]&&<WC game={fresh[0]} onClick={setSel} mobile={m} userData={ud} label="JUST DROPPED"/>}
        </>}</div>}

      {/* EXPLORE */}
      {pg==="explore"&&<div style={{animation:"fadeIn .3s",paddingTop:10}}>
        <h2 style={{fontFamily:"'Outfit'",fontSize:m?18:22,fontWeight:900,marginBottom:18}}>Explore</h2>
        {ld?<Loader/>:<>
          <Sec title="HIGHEST RATED"><div style={{display:"grid",gridTemplateColumns:m?"repeat(3,1fr)":"repeat(auto-fill,minmax(140px,1fr))",gap:m?6:10}}>{best.map((g,i)=><GC key={g.id} game={g} delay={i*25} onClick={setSel} mobile={m} userData={ud}/>)}</div></Sec>
          <Sec title="POPULAR"><div style={{display:"grid",gridTemplateColumns:m?"repeat(3,1fr)":"repeat(auto-fill,minmax(140px,1fr))",gap:m?6:10}}>{popular.map((g,i)=><GC key={g.id} game={g} delay={i*25} onClick={setSel} mobile={m} userData={ud}/>)}</div></Sec>
          <Sec title="NEW"><div style={{display:"grid",gridTemplateColumns:m?"repeat(3,1fr)":"repeat(auto-fill,minmax(140px,1fr))",gap:m?6:10}}>{fresh.map((g,i)=><GC key={g.id} game={g} delay={i*25} onClick={setSel} mobile={m} userData={ud}/>)}</div></Sec>
        </>}</div>}

      {/* LIBRARY */}
      {pg==="library"&&user&&<div style={{animation:"fadeIn .3s",paddingTop:10}}>
        <h2 style={{fontFamily:"'Outfit'",fontSize:m?18:22,fontWeight:900,marginBottom:14}}>Library</h2>
        {lib.length>0?<>
          <div className="hs" style={{display:"flex",gap:5,marginBottom:14,overflowX:"auto",paddingBottom:4}}>
            {[["all","All"],["playing","Playing"],["completed","Completed"],["backlog","Backlog"],["wishlist","Wishlist"],["dropped","Dropped"]].map(([k,l])=>
              <button key={k} onClick={()=>setLf(k)} style={{padding:"4px 12px",borderRadius:12,fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",border:lf===k?"1px solid #00d4ff":"1px solid rgba(255,255,255,.06)",background:lf===k?"#00d4ff10":"transparent",color:lf===k?"#00d4ff":"#555"}}>{l} <span style={{opacity:.4}}>{k==="all"?lib.length:lib.filter(g=>ud[g.id]?.status===k).length}</span></button>)}</div>
          <div style={{display:"grid",gridTemplateColumns:m?"repeat(3,1fr)":"repeat(auto-fill,minmax(140px,1fr))",gap:m?6:10}}>
            {flib.map((g,i)=><GC key={g.id} game={g} delay={i*25} onClick={setSel} mobile={m} userData={ud}/>)}</div>
        </>:<div style={{textAlign:"center",padding:50,color:"#555"}}><div style={{fontSize:36,marginBottom:8}}>📚</div>Empty — search and add games</div>}</div>}

      {/* STATS */}
      {pg==="stats"&&user&&<div style={{animation:"fadeIn .3s",paddingTop:10}}>
        <h2 style={{fontFamily:"'Outfit'",fontSize:m?18:22,fontWeight:900,marginBottom:18}}>Stats</h2>
        {lib.length>0?(()=>{const bs=s=>lib.filter(g=>ud[g.id]?.status===s).length;const rt=lib.filter(g=>ud[g.id]?.myRating);const av=rt.length?(rt.reduce((s,g)=>s+ud[g.id].myRating,0)/rt.length).toFixed(1):"—";
          return<>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:m?6:10,marginBottom:24}}>
              {[{l:"Games",v:lib.length,c:"#00d4ff"},{l:"Done",v:bs("completed"),c:"#00ff88"},{l:"Playing",v:bs("playing"),c:"#8b5cf6"},{l:"Avg ★",v:av,c:"#FFD700"}].map((s,i)=>
                <div key={i} style={{padding:m?10:14,borderRadius:10,textAlign:"center",background:s.c+"06",border:"1px solid "+s.c+"10"}}>
                  <div style={{fontSize:m?18:22,fontWeight:900,color:s.c}}>{s.v}</div><div style={{fontSize:9,color:"#555",fontWeight:700,marginTop:2}}>{s.l}</div></div>)}</div>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              {Object.entries(SC).map(([k,c])=>{const cn=bs(k),mx=lib.length||1;
                return<div key={k} style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{width:66,fontSize:11,color:"#666",fontWeight:600,textAlign:"right"}}>{c.l}</span>
                  <div style={{flex:1,height:18,background:"rgba(255,255,255,.03)",borderRadius:4,overflow:"hidden"}}>
                    <div style={{height:"100%",width:cn>0?(cn/mx*100)+"%":"0%",background:c.c,borderRadius:4,opacity:.7,transition:"width .8s",display:"flex",alignItems:"center",paddingLeft:5}}>
                      {cn>0&&<span style={{fontSize:8,fontWeight:800}}>{cn}</span>}</div></div></div>})}</div></>
        })():<div style={{textAlign:"center",padding:50,color:"#555"}}>No stats yet</div>}</div>}

      {/* PROFILE */}
      {pg==="profile"&&user&&<div style={{animation:"fadeIn .3s",paddingTop:10}}>
        <div style={{display:"flex",alignItems:m?"center":"flex-start",gap:m?14:20,marginBottom:24,flexDirection:m?"column":"row"}}>
          <div style={{width:m?72:90,height:m?72:90,borderRadius:"50%",background:"linear-gradient(135deg,#00d4ff,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:m?28:36,fontWeight:900,flexShrink:0}}>{ini}</div>
          <div style={{textAlign:m?"center":"left",flex:1}}>
            <h2 style={{fontSize:m?20:26,fontWeight:900}}>{prof?.display_name||dn}</h2>
            {prof?.username&&<div style={{color:"#555",fontSize:12}}>@{prof.username}</div>}
            {prof?.bio&&<p style={{color:"#888",fontSize:12,lineHeight:1.5,marginTop:4}}>{prof.bio}</p>}
            <div style={{display:"flex",gap:18,marginTop:10,justifyContent:m?"center":"flex-start"}}>
              {[{v:lib.length,l:"Games"},{v:lib.filter(g=>ud[g.id]?.status==="completed").length,l:"Completed"},{v:0,l:"Followers"},{v:0,l:"Following"}].map((s,i)=>
                <div key={i} style={{textAlign:"center"}}><div style={{fontSize:16,fontWeight:900}}>{s.v}</div><div style={{fontSize:9,color:"#555"}}>{s.l}</div></div>)}</div>
            <div style={{display:"flex",gap:8,marginTop:10,justifyContent:m?"center":"flex-start"}}>
              <button onClick={()=>setEp(true)} style={{padding:"6px 16px",borderRadius:8,border:"1px solid rgba(255,255,255,.1)",background:"transparent",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>Edit Profile</button>
              <button onClick={so} style={{padding:"6px 16px",borderRadius:8,border:"1px solid rgba(255,255,255,.06)",background:"transparent",color:"#ff4444",fontSize:11,fontWeight:700,cursor:"pointer"}}>Sign Out</button></div></div></div>

        {/* Lists */}
        <div style={{marginBottom:24}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <h3 style={{fontSize:13,fontWeight:700,color:"#888",letterSpacing:".04em"}}>MY LISTS</h3></div>
          {myLists.length>0&&<div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}>
            {myLists.map(l=><div key={l.id} style={{padding:"10px 14px",borderRadius:10,background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.04)"}}>
              <div style={{fontSize:13,fontWeight:700}}>📝 {l.title}</div>
              <div style={{fontSize:10,color:"#555",marginTop:2}}>{l.game_ids?.length||0} games</div></div>)}</div>}
          <div style={{display:"flex",gap:6}}>
            <input placeholder="New list name..." value={newListName} onChange={e=>setNewListName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleCreateList()}
              style={{flex:1,padding:"8px 12px",borderRadius:8,border:"1px solid rgba(255,255,255,.06)",background:"rgba(255,255,255,.03)",color:"#fff",fontSize:12,outline:"none"}}/>
            <button onClick={handleCreateList} style={{padding:"8px 14px",borderRadius:8,border:"none",background:"#00d4ff",color:"#000",fontSize:11,fontWeight:800,cursor:"pointer"}}>Create</button></div>
        </div>

        {lib.length>0&&<><h3 style={{fontSize:13,fontWeight:700,color:"#888",letterSpacing:".04em",marginBottom:10}}>GAMES</h3>
          <div style={{display:"grid",gridTemplateColumns:m?"repeat(3,1fr)":"repeat(auto-fill,minmax(140px,1fr))",gap:m?6:10}}>
            {lib.map((g,i)=><GC key={g.id} game={g} delay={i*25} onClick={setSel} mobile={m} userData={ud}/>)}</div></>}
      </div>}
    </main>

    {m&&<div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:90,background:"rgba(11,11,16,.94)",backdropFilter:"blur(20px)",borderTop:"1px solid rgba(255,255,255,.04)",display:"flex",paddingTop:4,paddingBottom:"max(env(safe-area-inset-bottom,12px),12px)"}}>
      {NAV.map(n=><div key={n.id} onClick={()=>{setPg(n.id);setQ("");setQOpen(false)}} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:1,cursor:"pointer",padding:"3px 0"}}>
        <span style={{fontSize:18,opacity:pg===n.id?1:.3,transition:"all .2s"}}>{n.i}</span>
        <span style={{fontSize:8,fontWeight:700,color:pg===n.id?"#00d4ff":"#555"}}>{n.l}</span></div>)}</div>}

    {sel&&<GD game={sel} onClose={()=>setSel(null)} mobile={m} userData={ud} setUserData={setUd} user={user} setShowAuth={setSa}/>}
  </div>}
