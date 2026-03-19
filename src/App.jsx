import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

const AK="33d378268c5d452ab1f3a9cb04c89f38",AP="https://api.rawg.io/api";
const PP={1:{n:"PC",c:"#10b981"},2:{n:"PS",c:"#6366f1"},3:{n:"Xbox",c:"#22c55e"},7:{n:"Switch",c:"#ef4444"}};
const SC={completed:{c:"#10b981",l:"Completed"},playing:{c:"#3b82f6",l:"Playing"},wishlist:{c:"#f59e0b",l:"Wishlist"},dropped:{c:"#ef4444",l:"Dropped"},backlog:{c:"#8b5cf6",l:"Backlog"}};
const SU="https://gatarbmbvjrrbcemsdhl.supabase.co";

const fg=async(p="")=>{try{return(await(await fetch(`${AP}/games?key=${AK}&page_size=20${p}`)).json()).results||[]}catch{return[]}};
const fgd=async id=>{try{return await(await fetch(`${AP}/games/${id}?key=${AK}`)).json()}catch{return null}};
const sga=async q=>{try{return(await(await fetch(`${AP}/games?key=${AK}&search=${encodeURIComponent(q)}&page_size=20&search_precise=true`)).json()).results||[]}catch{return[]}};
const nm=g=>({id:g.id,title:g.name,year:g.released?.slice(0,4)||"TBA",img:g.background_image||"",rating:g.rating?Math.round(g.rating*10)/10:null,mc:g.metacritic,genre:g.genres?.map(x=>x.name).slice(0,2).join(", ")||"",pf:(g.parent_platforms||[]).map(p=>PP[p.platform.id]).filter(Boolean),ss:g.short_screenshots?.map(s=>s.image)||[]});

const lcl=async u=>{const{data}=await supabase.from("user_games").select("*").eq("user_id",u);const l={};(data||[]).forEach(r=>{l[r.game_id]={status:r.status,myRating:r.my_rating,title:r.game_title,img:r.game_img}});return l};
const stc=async(u,g,f)=>{const{data:e}=await supabase.from("user_games").select("id").eq("user_id",u).eq("game_id",g).single();if(e)await supabase.from("user_games").update({status:f.status,my_rating:f.myRating,game_title:f.title,game_img:f.img,updated_at:new Date().toISOString()}).eq("id",e.id);else await supabase.from("user_games").insert({user_id:u,game_id:g,status:f.status,my_rating:f.myRating,game_title:f.title,game_img:f.img})};
const lp=async u=>{const{data}=await supabase.from("profiles").select("*").eq("id",u).single();return data};
const upf=async(u,f)=>await supabase.from("profiles").update(f).eq("id",u);
const searchPeople=async q=>{const{data}=await supabase.from("profiles").select("*").ilike("display_name",`%${q}%`).limit(20);return data||[]};
const searchLists=async q=>{const{data}=await supabase.from("lists").select("*,profiles(display_name,username,avatar_url)").ilike("title",`%${q}%`).eq("is_public",true).limit(20);return data||[]};
const loadLists=async u=>{const{data}=await supabase.from("lists").select("*").eq("user_id",u);return data||[]};
const createList=async(u,t)=>await supabase.from("lists").insert({user_id:u,title:t}).select().single();
const postAct=async(uid,act,g)=>{await supabase.from("activities").insert({user_id:uid,action:act,game_id:g?.id,game_title:g?.title,game_img:g?.img,rating:g?.rating})};
const loadFeed=async uid=>{const{data:fo}=await supabase.from("follows").select("following_id").eq("follower_id",uid);const ids=[uid,...(fo||[]).map(f=>f.following_id)];const{data}=await supabase.from("activities").select("*,profiles(display_name,username,avatar_url)").in("user_id",ids).order("created_at",{ascending:false}).limit(40);return data||[]};
const loadAllFeed=async()=>{const{data}=await supabase.from("activities").select("*,profiles(display_name,username,avatar_url)").order("created_at",{ascending:false}).limit(40);return data||[]};
const loadGR=async gid=>{const{data}=await supabase.from("reviews").select("*,profiles(display_name,username,avatar_url)").eq("game_id",gid).order("created_at",{ascending:false}).limit(20);return data||[]};
const postRev=async(uid,g,r,t)=>{await supabase.from("reviews").insert({user_id:uid,game_id:g.id,game_title:g.title,game_img:g.img,rating:r,text:t});await postAct(uid,"reviewed",g)};
const loadRR=async()=>{const{data}=await supabase.from("reviews").select("*,profiles(display_name,username,avatar_url)").order("created_at",{ascending:false}).limit(10);return data||[]};
const followU=async(a,b)=>await supabase.from("follows").insert({follower_id:a,following_id:b});
const unfollowU=async(a,b)=>await supabase.from("follows").delete().eq("follower_id",a).eq("following_id",b);
const chkF=async(a,b)=>{const{data}=await supabase.from("follows").select("id").eq("follower_id",a).eq("following_id",b).single();return!!data};
const getFC=async u=>{const{count:a}=await supabase.from("follows").select("*",{count:"exact",head:true}).eq("following_id",u);const{count:b}=await supabase.from("follows").select("*",{count:"exact",head:true}).eq("follower_id",u);return{followers:a||0,following:b||0}};
const getUG=async u=>{const{data}=await supabase.from("user_games").select("*").eq("user_id",u);return data||[]};

/* FIXED: Simple two-step query for followers/following */
const getFollowersList=async u=>{
  const{data:rows}=await supabase.from("follows").select("follower_id").eq("following_id",u);
  if(!rows||!rows.length)return[];
  const ids=rows.map(r=>r.follower_id);
  const{data:profiles}=await supabase.from("profiles").select("*").in("id",ids);
  return profiles||[];
};
const getFollowingList=async u=>{
  const{data:rows}=await supabase.from("follows").select("following_id").eq("follower_id",u);
  if(!rows||!rows.length)return[];
  const ids=rows.map(r=>r.following_id);
  const{data:profiles}=await supabase.from("profiles").select("*").in("id",ids);
  return profiles||[];
};

/* FIXED: Stable avatar URL with version key */
let avatarVersion=Date.now();
const getAvUrl=url=>url?`${SU}/storage/v1/object/public/avatars/${url}?v=${avatarVersion}`:null;
const upAv=async(uid,file)=>{
  const p=`${uid}/avatar.${file.name.split(".").pop()}`;
  await supabase.storage.from("avatars").upload(p,file,{upsert:true});
  await upf(uid,{avatar_url:p});
  avatarVersion=Date.now();
  return p;
};

const useM=()=>{const[m,setM]=useState(window.innerWidth<768);useEffect(()=>{const h=()=>setM(window.innerWidth<768);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h)},[]);return m};
const tA=d=>{const s=Math.floor((Date.now()-new Date(d))/1000);if(s<60)return"now";if(s<3600)return Math.floor(s/60)+"m";if(s<86400)return Math.floor(s/3600)+"h";return Math.floor(s/86400)+"d"};

const Stars=({rating=0,size=14,interactive,onRate})=>{const[h,setH]=useState(0);const a=h||rating;
  const c=(s,e)=>{if(!interactive||!onRate)return;const r=e.currentTarget.getBoundingClientRect();onRate(e.clientX-r.left<r.width/2?s-.5:s)};
  return<div style={{display:"flex",gap:1,alignItems:"center"}}>{[1,2,3,4,5].map(s=>{const f=s<=Math.floor(a),hf=!f&&s-.5<=a&&s>a-.5;
    return<span key={s} onClick={e=>c(s,e)} onMouseEnter={()=>interactive&&setH(s)} onMouseLeave={()=>interactive&&setH(0)}
      style={{fontSize:size,cursor:interactive?"pointer":"default",position:"relative",lineHeight:1,color:f?"#f59e0b":hf?"#f59e0b":"#334155",transition:"all .15s",transform:interactive&&s<=Math.ceil(h)?"scale(1.15)":"scale(1)"}}>
      {hf?<><span style={{position:"absolute",overflow:"hidden",width:"50%"}}>★</span><span style={{color:"#334155"}}>★</span></>:"★"}</span>})}
    {interactive&&a>0&&<span style={{fontSize:size*.65,color:"#f59e0b",fontWeight:700,marginLeft:3}}>{a}</span>}</div>};

const Loader=()=><div style={{display:"flex",justifyContent:"center",padding:32}}><div style={{width:24,height:24,border:"2.5px solid #1e293b",borderTopColor:"#10b981",borderRadius:"50%",animation:"spin .7s linear infinite"}}/></div>;
const Av=({url,name,size=32,onClick})=>{const s=getAvUrl(url);return<div onClick={onClick} style={{width:size,height:size,borderRadius:size/2,background:s?"#1e293b":"linear-gradient(135deg,#10b981,#059669)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.38,fontWeight:800,cursor:onClick?"pointer":"default",overflow:"hidden",flexShrink:0,color:"#fff"}}>{s?<img src={s} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:(name||"?").charAt(0).toUpperCase()}</div>};

const GC=({game:g,onClick,delay=0,mobile:m,ud,sz="md"})=>{const[hov,setHov]=useState(false);const[vis,setVis]=useState(false);const[err,setErr]=useState(false);
  useEffect(()=>{const t=setTimeout(()=>setVis(true),delay);return()=>clearTimeout(t)},[delay]);const u=ud?.[g.id];const xs=sz==="xs";
  return<div onClick={()=>onClick?.(g)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
    style={{borderRadius:xs?6:10,overflow:"hidden",cursor:"pointer",position:"relative",aspectRatio:xs?"1/1.2":"2/3",
      opacity:vis?1:0,transform:vis?(hov&&!m?"translateY(-3px) scale(1.01)":"none"):"translateY(8px)",transition:"all .25s ease",
      outline:hov?"1px solid rgba(16,185,129,.25)":"1px solid rgba(148,163,184,.08)"}}>
    {!err&&g.img?<img src={g.img} alt={g.title} onError={()=>setErr(true)} loading="lazy"
      style={{width:"100%",height:"100%",objectFit:"cover",transition:"transform .4s ease",transform:hov&&!m?"scale(1.06)":"scale(1)"}}/>
      :<div style={{width:"100%",height:"100%",background:"linear-gradient(145deg,#1e293b,#334155)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:xs?14:24,color:"#475569"}}>🎮</div>}
    <div style={{position:"absolute",inset:0,background:xs?"linear-gradient(to top,#0f172aee 0%,transparent 50%)":"linear-gradient(to top,#0f172aee 0%,#0f172a33 45%,transparent 100%)"}}/>
    {u?.status&&!xs&&<div style={{position:"absolute",top:4,left:4,padding:"1px 5px",borderRadius:6,background:"#0f172acc",fontSize:7,fontWeight:800,color:SC[u.status]?.c}}>{SC[u.status]?.l}</div>}
    {g.mc&&!xs&&<div style={{position:"absolute",top:4,right:4,padding:"1px 5px",borderRadius:4,background:"#0f172acc",fontSize:8,fontWeight:900,color:g.mc>=75?"#10b981":"#f59e0b"}}>{g.mc}</div>}
    <div style={{position:"absolute",bottom:0,left:0,right:0,padding:xs?"3px 4px":"7px 8px"}}>
      <div style={{fontSize:xs?8:12,fontWeight:700,lineHeight:1.2,overflow:"hidden",textOverflow:"ellipsis",display:"-webkit-box",WebkitLineClamp:xs?1:2,WebkitBoxOrient:"vertical",color:"#f1f5f9"}}>{g.title}</div>
      {!xs&&g.rating&&<span style={{fontSize:8,color:"#f59e0b",fontWeight:800}}>★ {g.rating}</span>}
      {!xs&&<div style={{fontSize:7,color:"#64748b",marginTop:1}}>{g.year}</div>}
    </div></div>};

const Hero=({games,onClick,m})=>{const[idx,setIdx]=useState(0);const g=games[idx];
  useEffect(()=>{const t=setInterval(()=>setIdx(i=>(i+1)%Math.min(games.length,5)),6000);return()=>clearInterval(t)},[games.length]);
  if(!g)return null;
  return<div onClick={()=>onClick?.(g)} style={{position:"relative",width:"100%",aspectRatio:m?"16/10":"21/9",borderRadius:m?12:16,overflow:"hidden",cursor:"pointer",marginBottom:m?16:24,border:"1px solid rgba(148,163,184,.1)"}}>
    <img src={g.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
    <div style={{position:"absolute",inset:0,background:"linear-gradient(115deg,#0f172aee 0%,#0f172a88 40%,transparent 70%)"}}/>
    <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,#0f172a 0%,transparent 40%)"}}/>
    <div style={{position:"absolute",bottom:m?16:28,left:m?16:28,right:m?80:null}}>
      <div style={{fontSize:9,color:"#10b981",fontWeight:800,letterSpacing:".14em",marginBottom:4}}>FEATURED</div>
      <h2 style={{fontFamily:"'Outfit'",fontSize:m?22:36,fontWeight:900,margin:0,lineHeight:1.1,color:"#f1f5f9"}}>{g.title}</h2>
      <div style={{fontSize:m?11:13,color:"#94a3b8",marginTop:4}}>{g.year} · {g.genre}</div></div>
    <div style={{position:"absolute",bottom:m?16:28,right:m?16:28,display:"flex",gap:4}}>
      {games.slice(0,5).map((_,i)=><div key={i} onClick={e=>{e.stopPropagation();setIdx(i)}} style={{width:i===idx?16:6,height:6,borderRadius:3,background:i===idx?"#10b981":"#475569",transition:"all .3s",cursor:"pointer"}}/>)}</div></div>};

const Sec=({title,children})=><div style={{marginBottom:24}}><h3 style={{fontSize:11,fontWeight:800,color:"#64748b",letterSpacing:".1em",marginBottom:8}}>{title}</h3>{children}</div>;

const Auth=({onClose,onAuth})=>{const[mode,setMode]=useState("login");const[email,setEmail]=useState("");const[pw,setPw]=useState("");const[name,setName]=useState("");const[err,setErr]=useState("");const[ld,setLd]=useState(false);const[sent,setSent]=useState(false);
  const go=async()=>{setErr("");setLd(true);try{if(mode==="signup"){const{error:e}=await supabase.auth.signUp({email,password:pw,options:{data:{display_name:name}}});if(e)throw e;setSent(true)}else{const{data,error:e}=await supabase.auth.signInWithPassword({email,password:pw});if(e)throw e;onAuth(data.user);onClose()}}catch(e){setErr(e.message)}setLd(false)};
  const i={width:"100%",padding:"13px 16px",borderRadius:10,border:"1px solid #334155",background:"#1e293b",color:"#f1f5f9",fontSize:14,outline:"none",marginBottom:10};
  return<div onClick={onClose} style={{position:"fixed",inset:0,zIndex:2000,background:"#0f172af0",backdropFilter:"blur(20px)",display:"flex",alignItems:"center",justifyContent:"center",animation:"fadeIn .15s",padding:16}}>
    <div onClick={e=>e.stopPropagation()} style={{background:"#1e293b",borderRadius:20,width:"100%",maxWidth:380,padding:"36px 30px",border:"1px solid #334155",animation:"slideUp .25s ease"}}>
      {sent?<div style={{textAlign:"center"}}><div style={{fontSize:40,marginBottom:16}}>📧</div><h2 style={{fontSize:20,fontWeight:800,color:"#f1f5f9"}}>Check your email</h2><p style={{color:"#94a3b8",fontSize:13,marginTop:8}}>Link sent to <span style={{color:"#10b981"}}>{email}</span></p>
        <button onClick={onClose} style={{marginTop:20,padding:"11px 24px",borderRadius:10,border:"none",background:"#10b981",color:"#000",fontSize:14,fontWeight:800,cursor:"pointer"}}>Done</button></div>
      :<><div style={{marginBottom:28}}><h2 style={{fontFamily:"'Outfit'",fontSize:24,fontWeight:900,color:"#f1f5f9"}}>{mode==="login"?"Welcome back":"Create account"}</h2><p style={{color:"#64748b",fontSize:13,marginTop:4}}>{mode==="login"?"Sign in to continue":"Start tracking your games"}</p></div>
        {err&&<div style={{padding:"10px 12px",borderRadius:8,background:"#ef444418",border:"1px solid #ef444430",color:"#ef4444",fontSize:12,marginBottom:12}}>{err}</div>}
        {mode==="signup"&&<input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} style={i}/>}
        <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={i}/>
        <input type="password" placeholder="Password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()} style={i}/>
        <button onClick={go} disabled={ld} style={{width:"100%",padding:"13px",borderRadius:10,border:"none",marginTop:6,background:ld?"#334155":"#10b981",color:ld?"#64748b":"#000",fontSize:15,fontWeight:800,cursor:ld?"default":"pointer"}}>{ld?"...":mode==="login"?"Sign In":"Create Account"}</button>
        <p style={{textAlign:"center",marginTop:16,fontSize:13,color:"#64748b"}}>{mode==="login"?"No account? ":"Already joined? "}<span onClick={()=>{setMode(mode==="login"?"signup":"login");setErr("")}} style={{color:"#10b981",cursor:"pointer",fontWeight:700}}>{mode==="login"?"Sign up":"Sign in"}</span></p></>}</div></div>};

/* FIXED: Edit Profile - proper reload */
const EP=({profile:p,onClose,onSave,userId,reloadProfile})=>{const[n,setN]=useState(p?.display_name||"");const[u,setU]=useState(p?.username||"");const[b,setB]=useState(p?.bio||"");const[ld,setLd]=useState(false);const[upl,setUpl]=useState(false);const fr=useRef();
  const sv=async()=>{setLd(true);await onSave({display_name:n,username:u.toLowerCase().replace(/[^a-z0-9_]/g,""),bio:b});setLd(false);onClose()};
  const hf=async e=>{const f=e.target.files[0];if(!f)return;setUpl(true);try{const path=await upAv(userId,f);await reloadProfile();setUpl(false);onClose()}catch(er){console.error(er);setUpl(false)}};
  const i={width:"100%",padding:"12px 14px",borderRadius:10,border:"1px solid #334155",background:"#1e293b",color:"#f1f5f9",fontSize:14,outline:"none",marginBottom:12};
  return<div onClick={onClose} style={{position:"fixed",inset:0,zIndex:2000,background:"#0f172af0",backdropFilter:"blur(20px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
    <div onClick={e=>e.stopPropagation()} style={{background:"#1e293b",borderRadius:20,width:"100%",maxWidth:380,padding:"28px 24px",border:"1px solid #334155"}}>
      <h2 style={{fontSize:20,fontWeight:900,marginBottom:20,color:"#f1f5f9"}}>Edit Profile</h2>
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20}}><Av url={p?.avatar_url} name={n} size={56}/><div><input ref={fr} type="file" accept="image/*" onChange={hf} style={{display:"none"}}/>
        <button onClick={()=>fr.current?.click()} style={{padding:"7px 14px",borderRadius:8,border:"1px solid #334155",background:"transparent",color:"#10b981",fontSize:12,fontWeight:700,cursor:"pointer"}}>{upl?"Uploading...":"Change Photo"}</button></div></div>
      <label style={{fontSize:10,color:"#64748b",fontWeight:700,letterSpacing:".08em",display:"block",marginBottom:4}}>NAME</label><input value={n} onChange={e=>setN(e.target.value)} style={i}/>
      <label style={{fontSize:10,color:"#64748b",fontWeight:700,letterSpacing:".08em",display:"block",marginBottom:4}}>USERNAME</label><input value={u} onChange={e=>setU(e.target.value)} style={i} placeholder="username"/>
      <label style={{fontSize:10,color:"#64748b",fontWeight:700,letterSpacing:".08em",display:"block",marginBottom:4}}>BIO</label><textarea value={b} onChange={e=>setB(e.target.value)} rows={3} style={{...i,resize:"none",fontFamily:"inherit"}}/>
      <div style={{display:"flex",gap:8,marginTop:4}}><button onClick={onClose} style={{flex:1,padding:"12px",borderRadius:10,border:"1px solid #334155",background:"transparent",color:"#94a3b8",fontSize:13,fontWeight:700,cursor:"pointer"}}>Cancel</button>
        <button onClick={sv} disabled={ld} style={{flex:1,padding:"12px",borderRadius:10,border:"none",background:"#10b981",color:"#000",fontSize:13,fontWeight:800,cursor:"pointer"}}>{ld?"...":"Save"}</button></div></div></div>};

/* FIXED: Followers/Following List */
const FLModal=({userId,type,onClose,mobile:m,setVU})=>{const[list,setList]=useState([]);const[ld,setLd]=useState(true);
  useEffect(()=>{(async()=>{setLd(true);const data=type==="followers"?await getFollowersList(userId):await getFollowingList(userId);setList(data);setLd(false)})()},[userId,type]);
  return<div onClick={onClose} style={{position:"fixed",inset:0,zIndex:1800,background:"#0f172af0",backdropFilter:"blur(16px)",display:"flex",alignItems:m?"flex-end":"center",justifyContent:"center",animation:"fadeIn .15s",padding:m?0:16}}>
    <div onClick={e=>e.stopPropagation()} style={{background:"#1e293b",width:"100%",maxWidth:m?"100%":400,maxHeight:m?"80vh":"70vh",borderRadius:m?"20px 20px 0 0":20,overflow:"auto",border:m?"none":"1px solid #334155"}}>
      {m&&<div onClick={onClose} style={{display:"flex",justifyContent:"center",padding:"10px 0 0"}}><div style={{width:32,height:3,borderRadius:2,background:"#334155"}}/></div>}
      <div style={{padding:"20px 20px 24px"}}>
        <h3 style={{fontSize:18,fontWeight:900,marginBottom:16,color:"#f1f5f9"}}>{type==="followers"?"Followers":"Following"}</h3>
        {ld?<Loader/>:list.length>0?list.map(p=>
          <div key={p.id} onClick={()=>{onClose();setTimeout(()=>setVU(p.id),100)}} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",borderRadius:10,marginBottom:4,cursor:"pointer",background:"transparent",transition:"background .15s"}}
            onMouseEnter={e=>e.currentTarget.style.background="#0f172a"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <Av url={p.avatar_url} name={p.display_name} size={36}/>
            <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:"#f1f5f9"}}>{p.display_name||"User"}</div>
              {p.username&&<div style={{fontSize:11,color:"#64748b"}}>@{p.username}</div>}</div>
            <span style={{color:"#475569",fontSize:11}}>→</span></div>)
        :<div style={{textAlign:"center",padding:30,color:"#64748b",fontSize:13}}>No {type} yet</div>}
      </div></div></div>};

/* User Profile */
const UP=({viewId,onClose,me,mobile:m,onFollow,setVU})=>{const[p,setP]=useState(null);const[fc,setFc]=useState({followers:0,following:0});const[gs,setGs]=useState([]);const[isF,setIsF]=useState(false);const[ld,setLd]=useState(true);const[flM,setFlM]=useState(null);
  useEffect(()=>{(async()=>{setLd(true);const[pr,c,g]=await Promise.all([lp(viewId),getFC(viewId),getUG(viewId)]);setP(pr);setFc(c);setGs(g);if(me)setIsF(await chkF(me.id,viewId));setLd(false)})()},[viewId]);
  const tog=async()=>{if(!me)return;if(isF){await unfollowU(me.id,viewId);setIsF(false);setFc(x=>({...x,followers:x.followers-1}))}else{await followU(me.id,viewId);setIsF(true);setFc(x=>({...x,followers:x.followers+1}))};onFollow?.()};
  if(ld)return<div onClick={onClose} style={{position:"fixed",inset:0,zIndex:1500,background:"#0f172af0",display:"flex",alignItems:"center",justifyContent:"center"}}><Loader/></div>;
  return<><div onClick={onClose} style={{position:"fixed",inset:0,zIndex:1500,background:"#0f172af0",backdropFilter:"blur(16px)",display:"flex",alignItems:m?"flex-end":"center",justifyContent:"center",animation:"fadeIn .15s",padding:m?0:16}}>
    <div onClick={e=>e.stopPropagation()} style={{background:"#1e293b",width:"100%",maxWidth:m?"100%":440,borderRadius:m?"20px 20px 0 0":20,overflow:"auto",border:m?"none":"1px solid #334155"}}>
      {m&&<div onClick={onClose} style={{display:"flex",justifyContent:"center",padding:"10px 0 0"}}><div style={{width:32,height:3,borderRadius:2,background:"#334155"}}/></div>}
      <div style={{padding:"28px 24px",textAlign:"center"}}>
        <Av url={p?.avatar_url} name={p?.display_name} size={72}/>
        <h2 style={{fontSize:20,fontWeight:900,marginTop:10,color:"#f1f5f9"}}>{p?.display_name||"User"}</h2>
        {p?.username&&<div style={{color:"#64748b",fontSize:12,marginTop:2}}>@{p.username}</div>}
        {p?.bio&&<p style={{color:"#94a3b8",fontSize:13,lineHeight:1.5,marginTop:8}}>{p.bio}</p>}
        <div style={{display:"flex",gap:20,justifyContent:"center",marginTop:14}}>
          <div><div style={{fontSize:16,fontWeight:900,color:"#f1f5f9"}}>{gs.length}</div><div style={{fontSize:9,color:"#64748b"}}>Games</div></div>
          <div><div style={{fontSize:16,fontWeight:900,color:"#f1f5f9"}}>{gs.filter(x=>x.status==="completed").length}</div><div style={{fontSize:9,color:"#64748b"}}>Completed</div></div>
          <div onClick={()=>setFlM("followers")} style={{cursor:"pointer"}}><div style={{fontSize:16,fontWeight:900,color:"#f1f5f9"}}>{fc.followers}</div><div style={{fontSize:9,color:"#10b981",textDecoration:"underline"}}>Followers</div></div>
          <div onClick={()=>setFlM("following")} style={{cursor:"pointer"}}><div style={{fontSize:16,fontWeight:900,color:"#f1f5f9"}}>{fc.following}</div><div style={{fontSize:9,color:"#10b981",textDecoration:"underline"}}>Following</div></div>
        </div>
        {me&&me.id!==viewId&&<button onClick={tog} style={{marginTop:14,padding:"8px 28px",borderRadius:10,border:isF?"1px solid #334155":"none",background:isF?"transparent":"#10b981",color:isF?"#94a3b8":"#000",fontSize:13,fontWeight:800,cursor:"pointer"}}>{isF?"Following ✓":"Follow"}</button>}
      </div></div></div>
    {flM&&<FLModal userId={viewId} type={flM} onClose={()=>setFlM(null)} mobile={m} setVU={setVU}/>}</>};

/* Game Detail */
const GD=({game:g,onClose,mobile:m,ud,setUd,user:me,setSa,refresh,setVU})=>{
  const[det,setDet]=useState(null);const[ldg,setLdg]=useState(true);const d=ud[g.id]||{};
  const[mr,setMr]=useState(d.myRating||0);const[st,setSt]=useState(d.status||"");const[tab,setTab]=useState("about");
  const[rvs,setRvs]=useState([]);const[rt,setRt]=useState("");const[rr,setRr]=useState(0);const[posting,setPosting]=useState(false);
  useEffect(()=>{setLdg(true);fgd(g.id).then(d=>{setDet(d);setLdg(false)});loadGR(g.id).then(setRvs)},[g.id]);
  const sv=async(f,v)=>{if(!me){setSa(true);return}const nd={...d,[f]:v,title:g.title,img:g.img};if(f==="myRating"){setMr(v);await postAct(me.id,"rated",{...g,rating:v})}if(f==="status"){setSt(v);await postAct(me.id,v==="completed"?"completed":v==="playing"?"started playing":"added to "+v,g)}
    setUd({...ud,[g.id]:nd});await stc(me.id,g.id,nd);refresh?.()};
  const subRev=async()=>{if(!me||!rt.trim())return;setPosting(true);await postRev(me.id,g,rr,rt);setRt("");setRr(0);setRvs(await loadGR(g.id));setPosting(false);refresh?.()};
  return<div onClick={onClose} style={{position:"fixed",inset:0,zIndex:1000,background:"#0f172af0",backdropFilter:"blur(16px)",display:"flex",alignItems:m?"flex-end":"center",justifyContent:"center",animation:"fadeIn .15s",padding:m?0:16}}>
    <div onClick={e=>e.stopPropagation()} style={{background:"#1e293b",width:"100%",maxWidth:m?"100%":660,maxHeight:m?"93vh":"88vh",borderRadius:m?"20px 20px 0 0":20,overflow:"auto",border:m?"none":"1px solid #334155"}}>
      {m&&<div onClick={onClose} style={{display:"flex",justifyContent:"center",padding:"10px 0 0"}}><div style={{width:32,height:3,borderRadius:2,background:"#334155"}}/></div>}
      <div style={{position:"relative",height:m?170:220,overflow:"hidden"}}><img src={g.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,#1e293b 0%,transparent 100%)"}}/>
        {!m&&<button onClick={onClose} style={{position:"absolute",top:14,right:14,width:32,height:32,borderRadius:16,background:"#0f172aaa",border:"none",color:"#f1f5f9",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>}
        <div style={{position:"absolute",bottom:14,left:m?16:24}}><h2 style={{fontFamily:"'Outfit'",fontSize:m?22:28,fontWeight:900,color:"#f1f5f9"}}>{g.title}</h2>
          <div style={{color:"#94a3b8",fontSize:12,marginTop:3}}>{g.year} · {g.genre}</div></div></div>
      <div style={{padding:m?"12px 16px 32px":"18px 24px 28px"}}>
        <div style={{display:"flex",gap:0,marginBottom:16,background:"#0f172a",borderRadius:12,overflow:"hidden",border:"1px solid #1e293b"}}>
          {[{l:"Community",v:g.rating,c:"#f59e0b"},{l:"Metacritic",v:g.mc,c:g.mc>=75?"#10b981":"#f59e0b"},{l:"Yours",v:mr||"—",c:"#3b82f6"}].map((s,i)=>
            <div key={i} style={{flex:1,padding:"12px 8px",textAlign:"center",borderRight:i<2?"1px solid #1e293b":"none"}}>
              <div style={{fontSize:9,color:"#64748b",fontWeight:700}}>{s.l}</div><div style={{fontSize:20,fontWeight:900,color:typeof s.v==="number"?s.c:"#475569",marginTop:2}}>{s.v||"—"}</div></div>)}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
          <div><div style={{fontSize:9,color:"#64748b",fontWeight:700,marginBottom:6}}>YOUR RATING</div><Stars rating={mr} size={m?22:26} interactive onRate={v=>sv("myRating",v)}/></div>
          <div><div style={{fontSize:9,color:"#64748b",fontWeight:700,marginBottom:6}}>STATUS</div>
            <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>{Object.entries(SC).map(([k,c])=><button key={k} onClick={()=>sv("status",k)} style={{padding:"4px 8px",borderRadius:8,fontSize:9,fontWeight:700,cursor:"pointer",border:"1px solid "+(st===k?c.c:"#334155"),background:st===k?c.c+"18":"#0f172a",color:st===k?c.c:"#64748b"}}>{c.l}</button>)}</div></div></div>
        <div style={{display:"flex",borderBottom:"1px solid #334155",marginBottom:14}}>
          {["about","reviews","media"].map(t=><button key={t} onClick={()=>setTab(t)} style={{padding:"9px 14px",background:"none",border:"none",fontSize:12,fontWeight:700,cursor:"pointer",color:tab===t?"#10b981":"#475569",borderBottom:tab===t?"2px solid #10b981":"2px solid transparent",textTransform:"capitalize"}}>{t}{t==="reviews"&&rvs.length?` ${rvs.length}`:""}</button>)}</div>
        {tab==="about"&&(ldg?<Loader/>:det?.description_raw&&<p style={{color:"#94a3b8",fontSize:13,lineHeight:1.8}}>{det.description_raw.slice(0,600)}</p>)}
        {tab==="reviews"&&<div>
          {me&&<div style={{marginBottom:16,padding:14,borderRadius:12,background:"#0f172a",border:"1px solid #1e293b"}}>
            <Stars rating={rr} size={18} interactive onRate={setRr}/>
            <textarea value={rt} onChange={e=>setRt(e.target.value)} rows={3} placeholder="Write your review..." style={{width:"100%",marginTop:8,padding:"10px 12px",borderRadius:8,border:"1px solid #334155",background:"#1e293b",color:"#f1f5f9",fontSize:13,outline:"none",resize:"none",fontFamily:"inherit"}}/>
            <button onClick={subRev} disabled={posting||!rt.trim()} style={{marginTop:6,padding:"8px 16px",borderRadius:8,border:"none",background:rt.trim()?"#10b981":"#334155",color:rt.trim()?"#000":"#475569",fontSize:12,fontWeight:800,cursor:rt.trim()?"pointer":"default"}}>{posting?"...":"Post"}</button></div>}
          {rvs.map(r=><div key={r.id} style={{padding:12,borderRadius:10,background:"#0f172a",border:"1px solid #1e293b",marginBottom:6}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <Av url={r.profiles?.avatar_url} name={r.profiles?.display_name} size={26} onClick={()=>{onClose();setVU(r.user_id)}}/>
              <span style={{fontSize:12,fontWeight:700,color:"#f1f5f9",cursor:"pointer",flex:1}} onClick={()=>{onClose();setVU(r.user_id)}}>{r.profiles?.display_name||"User"}</span>
              {r.rating>0&&<Stars rating={r.rating} size={9}/>}<span style={{fontSize:10,color:"#475569"}}>{tA(r.created_at)}</span></div>
            <p style={{color:"#94a3b8",fontSize:13,lineHeight:1.6,margin:0}}>{r.text}</p></div>)}
          {!rvs.length&&<div style={{textAlign:"center",padding:24,color:"#475569"}}>No reviews yet</div>}</div>}
        {tab==="media"&&g.ss?.length>1&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>{g.ss.slice(1,7).map((s,i)=><img key={i} src={s} alt="" loading="lazy" style={{width:"100%",borderRadius:8,aspectRatio:"16/9",objectFit:"cover"}}/>)}</div>}
      </div></div></div>};

/* ═══ MAIN ═══ */
export default function App(){
  const m=useM();const[pg,setPg]=useState("home");const[sel,setSel]=useState(null);const[q,setQ]=useState("");const[qO,setQO]=useState(false);
  const[ud,setUd]=useState({});const[user,setUser]=useState(null);const[prof,setProf]=useState(null);const[fc,setFc]=useState({followers:0,following:0});
  const[sa,setSa]=useState(false);const[ep,setEp]=useState(false);const[vU,setVU]=useState(null);const[flM,setFlM]=useState(null);
  const[pop,setPop]=useState([]);const[best,setBest]=useState([]);const[fresh,setFresh]=useState([]);const[soon,setSoon]=useState([]);const[act,setAct]=useState([]);const[rpg,setRpg]=useState([]);const[indie,setIndie]=useState([]);
  const[sr,setSr]=useState([]);const[pSr,setPSr]=useState([]);const[lSr,setLSr]=useState([]);
  const[ld,setLd]=useState(true);const[sng,setSng]=useState(false);const[lf,setLf]=useState("all");const[sT,setST]=useState("games");
  const[myL,setMyL]=useState([]);const[nLN,setNLN]=useState("");const[feed,setFeed]=useState([]);const[rRev,setRRev]=useState([]);
  const stt=useRef(null);
  const rf=()=>{if(user)loadFeed(user.id).then(setFeed);else loadAllFeed().then(setFeed);loadRR().then(setRRev)};
  const reloadProfile=async()=>{if(!user)return;avatarVersion=Date.now();const p=await lp(user.id);setProf(p)};

  useEffect(()=>{supabase.auth.getSession().then(({data:{session}})=>{const u=session?.user||null;setUser(u);if(u){lcl(u.id).then(setUd);lp(u.id).then(setProf);loadLists(u.id).then(setMyL);loadFeed(u.id).then(setFeed);getFC(u.id).then(setFc)}else loadAllFeed().then(setFeed)});loadRR().then(setRRev);
    const{data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>{const u=session?.user||null;setUser(u);if(u){lcl(u.id).then(setUd);lp(u.id).then(setProf);loadLists(u.id).then(setMyL);loadFeed(u.id).then(setFeed);getFC(u.id).then(setFc)}else{setUd({});setProf(null)}});return()=>subscription.unsubscribe()},[]);

  useEffect(()=>{setLd(true);const td=new Date().toISOString().slice(0,10),ly=new Date(Date.now()-365*864e5).toISOString().slice(0,10),ny=new Date(Date.now()+365*864e5).toISOString().slice(0,10);
    Promise.all([fg(`&dates=${ly},${td}&ordering=-rating&metacritic=70,100`),fg(`&ordering=-metacritic&metacritic=85,100`),fg(`&dates=${ly},${td}&ordering=-released`),fg(`&dates=${td},${ny}&ordering=-added`),
      fg(`&genres=action&ordering=-rating&metacritic=75,100&page_size=8`),fg(`&genres=role-playing-games-rpg&ordering=-rating&metacritic=75,100&page_size=8`),fg(`&genres=indie&ordering=-rating&metacritic=75,100&page_size=8`)
    ]).then(([p,b,n,u,a,r,i])=>{setPop(p.map(nm));setBest(b.map(nm));setFresh(n.map(nm));setSoon(u.map(nm));setAct(a.map(nm));setRpg(r.map(nm));setIndie(i.map(nm));setLd(false)})},[]);

  useEffect(()=>{if(stt.current)clearTimeout(stt.current);if(!q.trim()){setSr([]);setPSr([]);setLSr([]);return}setSng(true);
    stt.current=setTimeout(async()=>{const[g,p,l]=await Promise.all([sga(q),searchPeople(q),searchLists(q)]);setSr(g.map(nm));setPSr(p);setLSr(l);setSng(false)},400)},[q]);

  const all=[...pop,...best,...fresh,...soon,...act,...rpg,...indie,...sr];
  const lib=Object.entries(ud).filter(([_,v])=>v.status).map(([id,v])=>{const f=all.find(g=>g.id===parseInt(id));return f||{id:parseInt(id),title:v.title||"?",img:v.img||"",year:"",genre:"",rating:null,pf:[]}});
  const flib=lf==="all"?lib:lib.filter(g=>ud[g.id]?.status===lf);
  const so=async()=>{await supabase.auth.signOut();setUser(null);setUd({});setProf(null);setPg("home")};
  const dn=prof?.display_name||user?.user_metadata?.display_name||"";
  const sP=async f=>{await upf(user.id,f);const p=await lp(user.id);setProf(p)};
  const hcl=async()=>{if(!nLN.trim()||!user)return;const{data}=await createList(user.id,nLN);if(data)setMyL([...myL,data]);setNLN("")};
  const NAV=user?[{id:"home",i:"🏠",l:"Home"},{id:"explore",i:"🔍",l:"Explore"},{id:"feed",i:"⚡",l:"Activity"},{id:"library",i:"📚",l:"Library"},{id:"profile",i:"👤",l:"Profile"}]:[{id:"home",i:"🏠",l:"Home"},{id:"explore",i:"🔍",l:"Explore"}];

  return<div className="app-bg" style={{fontFamily:"'DM Sans','Outfit',system-ui,sans-serif",color:"#e2e8f0",minHeight:"100vh"}}>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,100..1000&family=Outfit:wght@100..900&display=swap');
      *{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:3px;height:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#334155;border-radius:2px}
      @keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
      @keyframes slideFromBottom{from{transform:translateY(100%)}to{transform:translateY(0)}}@keyframes spin{to{transform:rotate(360deg)}}
      body{margin:0;overflow-x:hidden;background:#0f172a}img{-webkit-user-drag:none}.hs::-webkit-scrollbar{display:none}.hs{-ms-overflow-style:none;scrollbar-width:none}
      @media(max-width:767px){*{-webkit-tap-highlight-color:transparent}}input::placeholder,textarea::placeholder{color:#475569}
      .app-bg{background:radial-gradient(ellipse 80% 50% at 50% -20%,rgba(16,185,129,.07),transparent),radial-gradient(ellipse 60% 40% at 100% 0%,rgba(99,102,241,.05),transparent),radial-gradient(ellipse 50% 50% at 0% 100%,rgba(16,185,129,.04),transparent),radial-gradient(ellipse 40% 30% at 80% 80%,rgba(59,130,246,.03),transparent),linear-gradient(180deg,#0f172a 0%,#131c2e 50%,#0f172a 100%);background-attachment:fixed;position:relative}
      .app-bg::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;background-image:linear-gradient(rgba(148,163,184,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,.025) 1px,transparent 1px);background-size:60px 60px}
      .app-bg>*{position:relative;z-index:1}`}</style>

    {sa&&<Auth onClose={()=>setSa(false)} onAuth={u=>{setUser(u);setSa(false)}}/>}
    {ep&&<EP profile={prof} onClose={()=>setEp(false)} onSave={sP} userId={user?.id} reloadProfile={reloadProfile}/>}
    {vU&&<UP viewId={vU} onClose={()=>setVU(null)} me={user} mobile={m} onFollow={rf} setVU={setVU}/>}
    {flM&&<FLModal userId={user?.id} type={flM} onClose={()=>setFlM(null)} mobile={m} setVU={setVU}/>}

    {!m&&<nav style={{position:"sticky",top:0,zIndex:100,background:"#0f172ae8",backdropFilter:"blur(16px)",borderBottom:"1px solid rgba(148,163,184,.08)",padding:"0 28px",height:48,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:24}}>
        <span onClick={()=>{setPg("home");setQ("")}} style={{fontFamily:"'Outfit'",fontSize:15,fontWeight:900,letterSpacing:".08em",cursor:"pointer",color:"#10b981"}}>GAMEBOXED</span>
        <div style={{display:"flex",gap:1}}>{NAV.filter(n=>n.id!=="profile").map(n=><button key={n.id} onClick={()=>{setPg(n.id);setQ("")}} style={{padding:"5px 12px",borderRadius:6,border:"none",background:pg===n.id?"rgba(148,163,184,.08)":"transparent",color:pg===n.id?"#e2e8f0":"#64748b",cursor:"pointer",fontSize:12,fontWeight:600}}>{n.l}</button>)}</div></div>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{position:"relative"}}><input placeholder="Search..." value={q} onChange={e=>{setQ(e.target.value);if(e.target.value)setPg("search")}}
          style={{padding:"7px 12px 7px 30px",borderRadius:8,border:"1px solid rgba(148,163,184,.1)",background:"rgba(148,163,184,.05)",color:"#f1f5f9",fontSize:12,width:180,outline:"none"}}/>
          <span style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",fontSize:12,color:"#475569"}}>🔍</span></div>
        {user?<Av url={prof?.avatar_url} name={dn} size={28} onClick={()=>setPg("profile")}/>
          :<button onClick={()=>setSa(true)} style={{padding:"6px 16px",borderRadius:8,border:"none",background:"#10b981",color:"#000",fontSize:11,fontWeight:800,cursor:"pointer"}}>Sign In</button>}</div></nav>}

    {m&&<div style={{position:"sticky",top:0,zIndex:100,background:"#0f172ae8",backdropFilter:"blur(16px)",padding:"0 12px",height:44,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid rgba(148,163,184,.08)"}}>
      {qO?<div style={{flex:1,display:"flex",alignItems:"center",gap:6}}>
        <input autoFocus placeholder="Search..." value={q} onChange={e=>{setQ(e.target.value);if(e.target.value)setPg("search")}}
          style={{flex:1,padding:"7px 12px",borderRadius:8,border:"1px solid #10b98133",background:"rgba(148,163,184,.05)",color:"#f1f5f9",fontSize:13,outline:"none"}}/>
        <span onClick={()=>{setQO(false);setQ("");setPg("home")}} style={{color:"#10b981",fontSize:12,fontWeight:700,cursor:"pointer"}}>✕</span></div>
      :<><span style={{fontFamily:"'Outfit'",fontSize:14,fontWeight:900,letterSpacing:".08em",color:"#10b981"}}>GAMEBOXED</span>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span onClick={()=>{setQO(true);setPg("search")}} style={{fontSize:14,cursor:"pointer",color:"#64748b"}}>🔍</span>
          {user?<Av url={prof?.avatar_url} name={dn} size={24} onClick={()=>setPg("profile")}/>
            :<span onClick={()=>setSa(true)} style={{fontSize:11,color:"#10b981",fontWeight:800,cursor:"pointer"}}>Sign In</span>}</div></>}</div>}

    <main style={{maxWidth:1100,margin:"0 auto",padding:m?"6px 10px 82px":"12px 24px 40px"}}>

      {pg==="search"&&<div style={{animation:"fadeIn .2s"}}>
        <div style={{display:"flex",borderBottom:"1px solid rgba(148,163,184,.08)",marginBottom:12}}>
          {[{k:"games",l:"Games",c:sr.length},{k:"people",l:"People",c:pSr.length},{k:"lists",l:"Lists",c:lSr.length}].map(t=>
            <button key={t.k} onClick={()=>setST(t.k)} style={{padding:"8px 14px",background:"none",border:"none",fontSize:12,fontWeight:700,cursor:"pointer",color:sT===t.k?"#10b981":"#475569",borderBottom:sT===t.k?"2px solid #10b981":"2px solid transparent"}}>{t.l}{q&&!sng&&t.c>0?` ${t.c}`:""}</button>)}</div>
        {sng?<Loader/>:<>
          {sT==="games"&&(sr.length>0?<div style={{display:"grid",gridTemplateColumns:m?"repeat(3,1fr)":"repeat(auto-fill,minmax(130px,1fr))",gap:m?6:10}}>{sr.map((g,i)=><GC key={g.id} game={g} delay={i*15} onClick={setSel} mobile={m} ud={ud}/>)}</div>:q&&<p style={{textAlign:"center",padding:40,color:"#475569"}}>No games</p>)}
          {sT==="people"&&(pSr.length>0?<div style={{display:"flex",flexDirection:"column",gap:6}}>{pSr.map(p=>
            <div key={p.id} onClick={()=>setVU(p.id)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:12,background:"rgba(148,163,184,.04)",border:"1px solid rgba(148,163,184,.08)",cursor:"pointer"}}>
              <Av url={p.avatar_url} name={p.display_name} size={40}/><div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:"#f1f5f9"}}>{p.display_name||"User"}</div>{p.username&&<div style={{fontSize:11,color:"#64748b"}}>@{p.username}</div>}</div>
              <span style={{fontSize:11,color:"#475569"}}>→</span></div>)}</div>:q&&<p style={{textAlign:"center",padding:40,color:"#475569"}}>No people</p>)}
          {sT==="lists"&&(lSr.length>0?<div style={{display:"flex",flexDirection:"column",gap:6}}>{lSr.map(l=><div key={l.id} style={{padding:"12px 14px",borderRadius:12,background:"rgba(148,163,184,.04)",border:"1px solid rgba(148,163,184,.08)"}}>
            <div style={{fontSize:14,fontWeight:700,color:"#f1f5f9"}}>📝 {l.title}</div><div style={{fontSize:10,color:"#64748b",marginTop:3}}>{l.game_ids?.length||0} games · {l.profiles?.display_name}</div></div>)}</div>:q&&<p style={{textAlign:"center",padding:40,color:"#475569"}}>No lists</p>)}
        </>}</div>}

      {pg==="home"&&<div style={{animation:"fadeIn .3s"}}>
        {!user&&!ld&&<div style={{textAlign:"center",padding:m?"16px 0 20px":"24px 0 28px",borderBottom:"1px solid rgba(148,163,184,.06)",marginBottom:m?12:20}}>
          <h1 style={{fontFamily:"'Outfit'",fontSize:m?22:36,fontWeight:900,lineHeight:1.15,color:"#f1f5f9"}}>Track games you've played.</h1>
          <h1 style={{fontFamily:"'Outfit'",fontSize:m?22:36,fontWeight:900,lineHeight:1.15,color:"#334155",marginBottom:12}}>Tell your friends what's good.</h1>
          <button onClick={()=>setSa(true)} style={{padding:"11px 28px",borderRadius:10,border:"none",background:"#10b981",color:"#000",fontSize:14,fontWeight:800,cursor:"pointer"}}>Get Started — Free</button></div>}
        {ld?<Loader/>:<div style={{display:m?"block":"grid",gridTemplateColumns:"1fr 280px",gap:20}}>
          <div>
            <Hero games={pop} onClick={setSel} m={m}/>
            <Sec title="POPULAR"><div style={{display:"grid",gridTemplateColumns:m?"repeat(3,1fr)":"repeat(5,1fr)",gap:m?6:8}}>{pop.slice(0,m?6:5).map((g,i)=><GC key={g.id} game={g} delay={i*20} onClick={setSel} mobile={m} ud={ud}/>)}</div></Sec>
            <Sec title="NEW RELEASES"><div style={{display:"grid",gridTemplateColumns:m?"repeat(3,1fr)":"repeat(5,1fr)",gap:m?6:8}}>{fresh.slice(0,m?6:5).map((g,i)=><GC key={g.id} game={g} delay={i*20} onClick={setSel} mobile={m} ud={ud}/>)}</div></Sec>
            <Sec title="ALL-TIME BEST"><div style={{display:"grid",gridTemplateColumns:m?"repeat(3,1fr)":"repeat(5,1fr)",gap:m?6:8}}>{best.slice(0,m?6:5).map((g,i)=><GC key={g.id} game={g} delay={i*20} onClick={setSel} mobile={m} ud={ud}/>)}</div></Sec>
            <Sec title="COMING SOON"><div style={{display:"grid",gridTemplateColumns:m?"repeat(4,1fr)":"repeat(6,1fr)",gap:m?5:6}}>{soon.slice(0,m?8:6).map((g,i)=><GC key={g.id} game={g} delay={i*15} onClick={setSel} mobile={m} ud={ud} sz="xs"/>)}</div></Sec>
            <Sec title="ACTION"><div style={{display:"grid",gridTemplateColumns:m?"repeat(3,1fr)":"repeat(5,1fr)",gap:m?6:8}}>{act.slice(0,m?6:5).map((g,i)=><GC key={g.id} game={g} delay={i*20} onClick={setSel} mobile={m} ud={ud}/>)}</div></Sec>
            <Sec title="RPG"><div style={{display:"grid",gridTemplateColumns:m?"repeat(3,1fr)":"repeat(5,1fr)",gap:m?6:8}}>{rpg.slice(0,m?6:5).map((g,i)=><GC key={g.id} game={g} delay={i*20} onClick={setSel} mobile={m} ud={ud}/>)}</div></Sec>
            <Sec title="INDIE"><div style={{display:"grid",gridTemplateColumns:m?"repeat(3,1fr)":"repeat(5,1fr)",gap:m?6:8}}>{indie.slice(0,m?6:5).map((g,i)=><GC key={g.id} game={g} delay={i*20} onClick={setSel} mobile={m} ud={ud}/>)}</div></Sec>
          </div>
          {!m&&<div>
            {rRev.length>0&&<div style={{marginBottom:20}}><h3 style={{fontSize:11,fontWeight:800,color:"#64748b",letterSpacing:".1em",marginBottom:10}}>RECENT REVIEWS</h3>
              {rRev.slice(0,5).map(r=><div key={r.id} style={{padding:"10px 12px",borderRadius:10,background:"rgba(148,163,184,.04)",border:"1px solid rgba(148,163,184,.06)",marginBottom:6}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                  <Av url={r.profiles?.avatar_url} name={r.profiles?.display_name} size={20} onClick={()=>setVU(r.user_id)}/>
                  <span style={{fontSize:11,fontWeight:700,flex:1,cursor:"pointer",color:"#f1f5f9"}} onClick={()=>setVU(r.user_id)}>{r.profiles?.display_name}</span>
                  {r.rating>0&&<span style={{fontSize:9,color:"#f59e0b"}}>★{r.rating}</span>}<span style={{fontSize:9,color:"#334155"}}>{tA(r.created_at)}</span></div>
                <div style={{fontSize:11,color:"#10b981",fontWeight:700,marginBottom:2}}>{r.game_title}</div>
                <p style={{fontSize:11,color:"#94a3b8",lineHeight:1.4,margin:0,overflow:"hidden",textOverflow:"ellipsis",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{r.text}</p></div>)}</div>}
            <div><h3 style={{fontSize:11,fontWeight:800,color:"#64748b",letterSpacing:".1em",marginBottom:10}}>ACTIVITY</h3>
              {feed.slice(0,8).map(a=><div key={a.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderBottom:"1px solid rgba(148,163,184,.06)",fontSize:11}}>
                <Av url={a.profiles?.avatar_url} name={a.profiles?.display_name} size={20} onClick={()=>setVU(a.user_id)}/>
                <div style={{flex:1,minWidth:0}}><span style={{fontWeight:700,cursor:"pointer",color:"#f1f5f9"}} onClick={()=>setVU(a.user_id)}>{a.profiles?.display_name}</span>
                  <span style={{color:"#475569"}}> {a.action} </span>{a.game_title&&<span style={{color:"#10b981",fontWeight:600}}>{a.game_title}</span>}</div>
                <span style={{fontSize:9,color:"#334155",flexShrink:0}}>{tA(a.created_at)}</span></div>)}</div>
          </div>}
        </div>}</div>}

      {pg==="feed"&&user&&<div style={{animation:"fadeIn .2s"}}>
        <h2 style={{fontFamily:"'Outfit'",fontSize:m?18:22,fontWeight:900,marginBottom:14,color:"#f1f5f9"}}>Activity</h2>
        {feed.length>0?feed.map(a=><div key={a.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,background:"rgba(148,163,184,.04)",border:"1px solid rgba(148,163,184,.06)",marginBottom:4}}>
          <Av url={a.profiles?.avatar_url} name={a.profiles?.display_name} size={28} onClick={()=>setVU(a.user_id)}/>
          {a.game_img&&<img src={a.game_img} alt="" style={{width:32,height:18,borderRadius:3,objectFit:"cover"}}/>}
          <div style={{flex:1,fontSize:12}}><span style={{fontWeight:700,cursor:"pointer",color:"#f1f5f9"}} onClick={()=>setVU(a.user_id)}>{a.profiles?.display_name}</span>
            <span style={{color:"#475569"}}> {a.action} </span>{a.game_title&&<span style={{color:"#10b981",fontWeight:700}}>{a.game_title}</span>}
            {a.action==="rated"&&a.rating&&<span style={{color:"#f59e0b"}}> ★{a.rating}</span>}</div>
          <span style={{fontSize:9,color:"#334155"}}>{tA(a.created_at)}</span></div>)
        :<div style={{textAlign:"center",padding:40,color:"#475569"}}>No activity yet</div>}</div>}

      {pg==="explore"&&<div style={{animation:"fadeIn .2s"}}>
        <h2 style={{fontFamily:"'Outfit'",fontSize:m?18:22,fontWeight:900,marginBottom:14,color:"#f1f5f9"}}>Explore</h2>
        {ld?<Loader/>:<>{[{t:"HIGHEST RATED",d:best},{t:"POPULAR",d:pop},{t:"NEW",d:fresh},{t:"ACTION",d:act},{t:"RPG",d:rpg},{t:"INDIE",d:indie}].map(s=>
          <Sec key={s.t} title={s.t}><div style={{display:"grid",gridTemplateColumns:m?"repeat(3,1fr)":"repeat(auto-fill,minmax(130px,1fr))",gap:m?6:10}}>{s.d.map((g,i)=><GC key={g.id} game={g} delay={i*15} onClick={setSel} mobile={m} ud={ud}/>)}</div></Sec>)}</>}</div>}

      {pg==="library"&&user&&<div style={{animation:"fadeIn .2s"}}>
        <h2 style={{fontFamily:"'Outfit'",fontSize:m?18:22,fontWeight:900,marginBottom:14,color:"#f1f5f9"}}>Library</h2>
        {lib.length>0?<><div className="hs" style={{display:"flex",gap:4,marginBottom:12,overflowX:"auto"}}>
          {[["all","All"],["playing","Playing"],["completed","Completed"],["backlog","Backlog"],["wishlist","Wishlist"],["dropped","Dropped"]].map(([k,l])=>
            <button key={k} onClick={()=>setLf(k)} style={{padding:"5px 12px",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",border:"1px solid "+(lf===k?"#10b981":"rgba(148,163,184,.1)"),background:lf===k?"#10b98115":"rgba(148,163,184,.04)",color:lf===k?"#10b981":"#64748b"}}>{l} {k==="all"?lib.length:lib.filter(g=>ud[g.id]?.status===k).length}</button>)}</div>
          <div style={{display:"grid",gridTemplateColumns:m?"repeat(3,1fr)":"repeat(auto-fill,minmax(130px,1fr))",gap:m?6:10}}>{flib.map((g,i)=><GC key={g.id} game={g} delay={i*15} onClick={setSel} mobile={m} ud={ud}/>)}</div>
        </>:<div style={{textAlign:"center",padding:40,color:"#475569"}}>Search and add games</div>}</div>}

      {pg==="stats"&&user&&<div style={{animation:"fadeIn .2s"}}>
        <h2 style={{fontFamily:"'Outfit'",fontSize:m?18:22,fontWeight:900,marginBottom:14,color:"#f1f5f9"}}>Stats</h2>
        {lib.length>0?(()=>{const bs=s=>lib.filter(g=>ud[g.id]?.status===s).length;const rt=lib.filter(g=>ud[g.id]?.myRating);const av=rt.length?(rt.reduce((s,g)=>s+ud[g.id].myRating,0)/rt.length).toFixed(1):"—";
          return<><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:m?6:10,marginBottom:20}}>
            {[{l:"Games",v:lib.length,c:"#3b82f6"},{l:"Done",v:bs("completed"),c:"#10b981"},{l:"Playing",v:bs("playing"),c:"#8b5cf6"},{l:"Avg ★",v:av,c:"#f59e0b"}].map((s,i)=>
              <div key={i} style={{padding:m?10:14,borderRadius:10,textAlign:"center",background:"rgba(148,163,184,.04)",border:"1px solid rgba(148,163,184,.06)"}}>
                <div style={{fontSize:m?18:22,fontWeight:900,color:s.c}}>{s.v}</div><div style={{fontSize:9,color:"#64748b",fontWeight:700,marginTop:2}}>{s.l}</div></div>)}</div>
            {Object.entries(SC).map(([k,c])=>{const cn=bs(k),mx=lib.length||1;
              return<div key={k} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                <span style={{width:60,fontSize:11,color:"#64748b",fontWeight:600,textAlign:"right"}}>{c.l}</span>
                <div style={{flex:1,height:16,background:"rgba(148,163,184,.04)",borderRadius:4,overflow:"hidden"}}>
                  <div style={{height:"100%",width:cn>0?(cn/mx*100)+"%":"0%",background:c.c,borderRadius:4,opacity:.5,transition:"width .6s"}}></div></div></div>})}</>
        })():<p style={{textAlign:"center",padding:40,color:"#475569"}}>Add games to see stats</p>}</div>}

      {pg==="profile"&&user&&<div style={{animation:"fadeIn .2s"}}>
        <div style={{display:"flex",alignItems:m?"center":"flex-start",gap:m?14:20,marginBottom:24,flexDirection:m?"column":"row"}}>
          <Av url={prof?.avatar_url} name={dn} size={m?72:88}/>
          <div style={{textAlign:m?"center":"left",flex:1}}>
            <h2 style={{fontFamily:"'Outfit'",fontSize:m?20:26,fontWeight:900,color:"#f1f5f9"}}>{prof?.display_name||dn}</h2>
            {prof?.username&&<div style={{color:"#64748b",fontSize:12,marginTop:2}}>@{prof.username}</div>}
            {prof?.bio&&<p style={{color:"#94a3b8",fontSize:13,lineHeight:1.5,marginTop:6}}>{prof.bio}</p>}
            <div style={{display:"flex",gap:18,marginTop:10,justifyContent:m?"center":"flex-start"}}>
              <div><div style={{fontSize:16,fontWeight:900,color:"#f1f5f9"}}>{lib.length}</div><div style={{fontSize:9,color:"#64748b"}}>Games</div></div>
              <div><div style={{fontSize:16,fontWeight:900,color:"#f1f5f9"}}>{lib.filter(g=>ud[g.id]?.status==="completed").length}</div><div style={{fontSize:9,color:"#64748b"}}>Done</div></div>
              <div onClick={()=>setFlM("followers")} style={{cursor:"pointer"}}><div style={{fontSize:16,fontWeight:900,color:"#f1f5f9"}}>{fc.followers}</div><div style={{fontSize:9,color:"#10b981",textDecoration:"underline"}}>Followers</div></div>
              <div onClick={()=>setFlM("following")} style={{cursor:"pointer"}}><div style={{fontSize:16,fontWeight:900,color:"#f1f5f9"}}>{fc.following}</div><div style={{fontSize:9,color:"#10b981",textDecoration:"underline"}}>Following</div></div>
            </div>
            <div style={{display:"flex",gap:6,marginTop:10,justifyContent:m?"center":"flex-start"}}>
              <button onClick={()=>setEp(true)} style={{padding:"7px 16px",borderRadius:8,border:"1px solid rgba(148,163,184,.1)",background:"transparent",color:"#e2e8f0",fontSize:11,fontWeight:700,cursor:"pointer"}}>Edit Profile</button>
              <button onClick={so} style={{padding:"7px 16px",borderRadius:8,border:"1px solid rgba(148,163,184,.1)",background:"transparent",color:"#ef4444",fontSize:11,fontWeight:700,cursor:"pointer"}}>Sign Out</button></div></div></div>
        <div style={{marginBottom:20}}>
          <h3 style={{fontSize:11,fontWeight:800,color:"#64748b",letterSpacing:".1em",marginBottom:10}}>LISTS</h3>
          {myL.map(l=><div key={l.id} style={{padding:"10px 12px",borderRadius:8,background:"rgba(148,163,184,.04)",border:"1px solid rgba(148,163,184,.06)",marginBottom:4,fontSize:13,fontWeight:700,color:"#f1f5f9"}}>📝 {l.title}</div>)}
          <div style={{display:"flex",gap:6,marginTop:6}}><input placeholder="New list..." value={nLN} onChange={e=>setNLN(e.target.value)} onKeyDown={e=>e.key==="Enter"&&hcl()}
            style={{flex:1,padding:"9px 12px",borderRadius:8,border:"1px solid rgba(148,163,184,.1)",background:"rgba(148,163,184,.04)",color:"#f1f5f9",fontSize:12,outline:"none"}}/>
            <button onClick={hcl} style={{padding:"9px 14px",borderRadius:8,border:"none",background:"#10b981",color:"#000",fontSize:11,fontWeight:800,cursor:"pointer"}}>Create</button></div></div>
        {lib.length>0&&<><h3 style={{fontSize:11,fontWeight:800,color:"#64748b",letterSpacing:".1em",marginBottom:10}}>GAMES</h3>
          <div style={{display:"grid",gridTemplateColumns:m?"repeat(3,1fr)":"repeat(auto-fill,minmax(130px,1fr))",gap:m?6:10}}>{lib.map((g,i)=><GC key={g.id} game={g} delay={i*15} onClick={setSel} mobile={m} ud={ud}/>)}</div></>}
      </div>}
    </main>

    {m&&<div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:90,background:"#0f172af5",backdropFilter:"blur(16px)",borderTop:"1px solid rgba(148,163,184,.08)",display:"flex",paddingTop:4,paddingBottom:"max(env(safe-area-inset-bottom,10px),10px)"}}>
      {NAV.map(n=><div key={n.id} onClick={()=>{setPg(n.id);setQ("");setQO(false)}} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:1,cursor:"pointer",padding:"2px 0"}}>
        <span style={{fontSize:17,opacity:pg===n.id?1:.25,transition:"all .15s"}}>{n.i}</span>
        <span style={{fontSize:7,fontWeight:800,color:pg===n.id?"#10b981":"#475569"}}>{n.l}</span></div>)}</div>}

    {sel&&<GD game={sel} onClose={()=>setSel(null)} mobile={m} ud={ud} setUd={setUd} user={user} setSa={setSa} refresh={rf} setVU={setVU}/>}
  </div>}
