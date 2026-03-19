import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";

const AK="33d378268c5d452ab1f3a9cb04c89f38",AP="https://api.rawg.io/api",SU="https://gatarbmbvjrrbcemsdhl.supabase.co";
const PP={1:{n:"PC",c:"#818cf8"},2:{n:"PS",c:"#60a5fa"},3:{n:"Xbox",c:"#34d399"},7:{n:"Switch",c:"#fb7185"}};
const SC={completed:{c:"#34d399",l:"Completed",bg:"#34d39915"},playing:{c:"#60a5fa",l:"Playing",bg:"#60a5fa15"},wishlist:{c:"#fbbf24",l:"Wishlist",bg:"#fbbf2415"},dropped:{c:"#fb7185",l:"Dropped",bg:"#fb718515"},backlog:{c:"#a78bfa",l:"Backlog",bg:"#a78bfa15"}};

const fg=async(p="")=>{try{return(await(await fetch(`${AP}/games?key=${AK}&page_size=20${p}`)).json()).results||[]}catch{return[]}};
const fgd=async id=>{try{return await(await fetch(`${AP}/games/${id}?key=${AK}`)).json()}catch{return null}};
const sga=async q=>{try{return(await(await fetch(`${AP}/games?key=${AK}&search=${encodeURIComponent(q)}&page_size=20&search_precise=true`)).json()).results||[]}catch{return[]}};
const nm=g=>({id:g.id,t:g.name,y:g.released?.slice(0,4)||"TBA",img:g.background_image||"",r:g.rating?Math.round(g.rating*10)/10:null,mc:g.metacritic,genre:g.genres?.map(x=>x.name).slice(0,2).join(", ")||"",pf:(g.parent_platforms||[]).map(p=>PP[p.platform.id]).filter(Boolean),ss:g.short_screenshots?.map(s=>s.image)||[]});

/* Supabase */
const lcl=async u=>{const{data}=await supabase.from("user_games").select("*").eq("user_id",u);const l={};(data||[]).forEach(r=>{l[r.game_id]={status:r.status,myRating:r.my_rating,title:r.game_title,img:r.game_img}});return l};
const stc=async(u,g,f)=>{const{data:e}=await supabase.from("user_games").select("id").eq("user_id",u).eq("game_id",g).single();if(e)await supabase.from("user_games").update({status:f.status,my_rating:f.myRating,game_title:f.title,game_img:f.img,updated_at:new Date().toISOString()}).eq("id",e.id);else await supabase.from("user_games").insert({user_id:u,game_id:g,status:f.status,my_rating:f.myRating,game_title:f.title,game_img:f.img})};
const lp=async u=>{const{data}=await supabase.from("profiles").select("*").eq("id",u).single();return data};
const upf=async(u,f)=>{const{error}=await supabase.from("profiles").update(f).eq("id",u);return!error};
const searchPeople=async q=>{const{data}=await supabase.from("profiles").select("*").ilike("display_name",`%${q}%`).limit(20);return data||[]};
const searchLists=async q=>{const{data}=await supabase.from("lists").select("*,profiles(display_name,username,avatar_url)").ilike("title",`%${q}%`).eq("is_public",true).limit(20);return data||[]};
const loadLists=async u=>{const{data}=await supabase.from("lists").select("*").eq("user_id",u);return data||[]};
const createList=async(u,t)=>await supabase.from("lists").insert({user_id:u,title:t}).select().single();
const postAct=async(uid,act,g)=>{await supabase.from("activities").insert({user_id:uid,action:act,game_id:g?.id,game_title:g?.title,game_img:g?.img,rating:g?.rating})};
const loadFeed=async uid=>{const{data:fo}=await supabase.from("follows").select("following_id").eq("follower_id",uid);const ids=[uid,...(fo||[]).map(f=>f.following_id)];const{data}=await supabase.from("activities").select("*,profiles(display_name,username,avatar_url)").in("user_id",ids).order("created_at",{ascending:false}).limit(40);return data||[]};
const loadAllFeed=async()=>{const{data}=await supabase.from("activities").select("*,profiles(display_name,username,avatar_url)").order("created_at",{ascending:false}).limit(40);return data||[]};
const loadGR=async gid=>{const{data}=await supabase.from("reviews").select("*,profiles(display_name,username,avatar_url)").eq("game_id",gid).order("created_at",{ascending:false}).limit(20);return data||[]};
const postRev=async(uid,g,r,t)=>{await supabase.from("reviews").insert({user_id:uid,game_id:g.id,game_title:g.t,game_img:g.img,rating:r,text:t});await postAct(uid,"reviewed",{id:g.id,title:g.t,img:g.img})};
const loadRR=async()=>{const{data}=await supabase.from("reviews").select("*,profiles(display_name,username,avatar_url)").order("created_at",{ascending:false}).limit(10);return data||[]};
const followU=async(a,b)=>await supabase.from("follows").insert({follower_id:a,following_id:b});
const unfollowU=async(a,b)=>await supabase.from("follows").delete().eq("follower_id",a).eq("following_id",b);
const chkF=async(a,b)=>{const{data}=await supabase.from("follows").select("id").eq("follower_id",a).eq("following_id",b).single();return!!data};
const getFC=async u=>{const{count:a}=await supabase.from("follows").select("*",{count:"exact",head:true}).eq("following_id",u);const{count:b}=await supabase.from("follows").select("*",{count:"exact",head:true}).eq("follower_id",u);return{followers:a||0,following:b||0}};
const getUG=async u=>{const{data}=await supabase.from("user_games").select("*").eq("user_id",u);return data||[]};
const getFollowersList=async u=>{const{data}=await supabase.from("follows").select("follower_id").eq("following_id",u);if(!data?.length)return[];const{data:p}=await supabase.from("profiles").select("*").in("id",data.map(r=>r.follower_id));return p||[]};
const getFollowingList=async u=>{const{data}=await supabase.from("follows").select("following_id").eq("follower_id",u);if(!data?.length)return[];const{data:p}=await supabase.from("profiles").select("*").in("id",data.map(r=>r.following_id));return p||[]};

/* FIXED Avatar - unique filename each time */
const getAvUrl=(url,v)=>url?`${SU}/storage/v1/object/public/avatars/${url}?v=${v||0}`:null;
const upAv=async(uid,file)=>{const ext=file.name.split(".").pop();const p=`${uid}/avatar_${Date.now()}.${ext}`;const{error}=await supabase.storage.from("avatars").upload(p,file,{upsert:true});if(error)throw error;await upf(uid,{avatar_url:p});return p};

const useM=()=>{const[m,setM]=useState(window.innerWidth<768);useEffect(()=>{const h=()=>setM(window.innerWidth<768);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h)},[]);return m};
const tA=d=>{const s=Math.floor((Date.now()-new Date(d))/1000);if(s<60)return"now";if(s<3600)return Math.floor(s/60)+"m";if(s<86400)return Math.floor(s/3600)+"h";return Math.floor(s/86400)+"d"};

/* Stars */
const Stars=({rating=0,size=14,interactive,onRate})=>{const[h,setH]=useState(0);const a=h||rating;
  const c=(s,e)=>{if(!interactive||!onRate)return;const r=e.currentTarget.getBoundingClientRect();onRate(e.clientX-r.left<r.width/2?s-.5:s)};
  return<div style={{display:"flex",gap:1,alignItems:"center"}}>{[1,2,3,4,5].map(s=>{const f=s<=Math.floor(a),hf=!f&&s-.5<=a&&s>a-.5;
    return<span key={s} onClick={e=>c(s,e)} onMouseEnter={()=>interactive&&setH(s)} onMouseLeave={()=>interactive&&setH(0)}
      style={{fontSize:size,cursor:interactive?"pointer":"default",position:"relative",lineHeight:1,color:f||hf?"#fbbf24":"#2e1065",transition:"all .15s",transform:interactive&&s<=Math.ceil(h)?"scale(1.15)":"scale(1)"}}>
      {hf?<><span style={{position:"absolute",overflow:"hidden",width:"50%"}}>★</span><span style={{color:"#2e1065"}}>★</span></>:"★"}</span>})}
    {interactive&&a>0&&<span style={{fontSize:size*.65,color:"#fbbf24",fontWeight:700,marginLeft:3}}>{a}</span>}</div>};

const Loader=()=><div style={{display:"flex",justifyContent:"center",padding:32}}><div style={{width:24,height:24,border:"2.5px solid #3b0764",borderTopColor:"#a78bfa",borderRadius:"50%",animation:"spin .7s linear infinite"}}/></div>;
const Av=({url,name,size=32,onClick,v})=>{const s=getAvUrl(url,v);return<div onClick={onClick} style={{width:size,height:size,borderRadius:size/2,background:s?"#1e1b4b":"linear-gradient(135deg,#a78bfa,#818cf8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.38,fontWeight:800,cursor:onClick?"pointer":"default",overflow:"hidden",flexShrink:0,color:"#fff",border:`2px solid rgba(167,139,250,.2)`}}>{s?<img src={s} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:(name||"?").charAt(0).toUpperCase()}</div>};

/* Card */
const GC=({game:g,onClick,delay=0,mobile:m,ud,sz="md"})=>{const[hov,setHov]=useState(false);const[vis,setVis]=useState(false);const[err,setErr]=useState(false);
  useEffect(()=>{const t=setTimeout(()=>setVis(true),delay);return()=>clearTimeout(t)},[delay]);const u=ud?.[g.id];const xs=sz==="xs";
  return<div onClick={()=>onClick?.(g)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
    style={{borderRadius:xs?8:12,overflow:"hidden",cursor:"pointer",position:"relative",aspectRatio:xs?"1/1.2":"2/3",
      opacity:vis?1:0,transform:vis?(hov&&!m?"translateY(-4px) scale(1.02)":"none"):"translateY(8px)",transition:"all .3s cubic-bezier(.4,0,.2,1)",
      boxShadow:hov?"0 20px 40px rgba(0,0,0,.4),0 0 0 1px rgba(167,139,250,.2)":"0 4px 16px rgba(0,0,0,.2),0 0 0 1px rgba(255,255,255,.03)"}}>
    {!err&&g.img?<img src={g.img} alt={g.t} onError={()=>setErr(true)} loading="lazy"
      style={{width:"100%",height:"100%",objectFit:"cover",transition:"transform .5s",transform:hov&&!m?"scale(1.06)":"scale(1)"}}/>
      :<div style={{width:"100%",height:"100%",background:"linear-gradient(145deg,#1e1b4b,#312e81)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:xs?14:28,color:"#4c1d95"}}>🎮</div>}
    <div style={{position:"absolute",inset:0,background:xs?"linear-gradient(to top,#0c0a1dee 0%,transparent 50%)":"linear-gradient(to top,#0c0a1dee 0%,#0c0a1d44 40%,transparent 100%)"}}/>
    {u?.status&&!xs&&<div style={{position:"absolute",top:5,left:5,padding:"2px 7px",borderRadius:8,background:SC[u.status]?.bg,backdropFilter:"blur(8px)",fontSize:7,fontWeight:800,color:SC[u.status]?.c,border:`1px solid ${SC[u.status]?.c}30`}}>{SC[u.status]?.l}</div>}
    {g.mc&&!xs&&<div style={{position:"absolute",top:5,right:5,padding:"2px 6px",borderRadius:6,background:"rgba(12,10,29,.7)",backdropFilter:"blur(8px)",fontSize:8,fontWeight:900,color:g.mc>=75?"#34d399":"#fbbf24"}}>{g.mc}</div>}
    <div style={{position:"absolute",bottom:0,left:0,right:0,padding:xs?"4px 5px":"8px 10px"}}>
      <div style={{fontSize:xs?9:13,fontWeight:700,lineHeight:1.2,overflow:"hidden",textOverflow:"ellipsis",display:"-webkit-box",WebkitLineClamp:xs?1:2,WebkitBoxOrient:"vertical",color:"#ede9fe"}}>{g.t}</div>
      {!xs&&g.r&&<div style={{display:"flex",alignItems:"center",gap:3,marginTop:3}}><span style={{fontSize:9,color:"#fbbf24",fontWeight:800}}>★ {g.r}</span></div>}
      {!xs&&<div style={{fontSize:7,color:"#7c3aed80",marginTop:1}}>{g.y}</div>}
    </div></div>};

const Hero=({games,onClick,m})=>{const[idx,setIdx]=useState(0);const g=games[idx];
  useEffect(()=>{const t=setInterval(()=>setIdx(i=>(i+1)%Math.min(games.length,5)),5000);return()=>clearInterval(t)},[games.length]);
  if(!g)return null;
  return<div onClick={()=>onClick?.(g)} style={{position:"relative",width:"100%",aspectRatio:m?"16/10":"21/8",borderRadius:m?16:20,overflow:"hidden",cursor:"pointer",marginBottom:m?20:28,boxShadow:"0 8px 32px rgba(0,0,0,.3),0 0 0 1px rgba(167,139,250,.1)"}}>
    <img src={g.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
    <div style={{position:"absolute",inset:0,background:"linear-gradient(115deg,#0c0a1dee 0%,#0c0a1d99 35%,transparent 65%)"}}/>
    <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,#0c0a1d 0%,transparent 35%)"}}/>
    <div style={{position:"absolute",bottom:m?16:32,left:m?16:32,right:m?70:null}}>
      <div style={{display:"inline-block",padding:"3px 10px",borderRadius:6,background:"linear-gradient(135deg,#7c3aed,#6d28d9)",fontSize:9,fontWeight:800,letterSpacing:".1em",marginBottom:6}}>FEATURED</div>
      <h2 style={{fontFamily:"'Outfit'",fontSize:m?24:42,fontWeight:900,margin:0,lineHeight:1.05,color:"#f5f3ff"}}>{g.t}</h2>
      <div style={{fontSize:m?11:14,color:"#a78bfa",marginTop:4,fontWeight:500}}>{g.y} · {g.genre}</div></div>
    <div style={{position:"absolute",bottom:m?16:32,right:m?16:32,display:"flex",gap:5}}>
      {games.slice(0,5).map((_,i)=><div key={i} onClick={e=>{e.stopPropagation();setIdx(i)}} style={{width:i===idx?20:8,height:8,borderRadius:4,background:i===idx?"#a78bfa":"#4c1d95",transition:"all .3s",cursor:"pointer"}}/>)}</div></div>};

const Sec=({title,children,extra})=><div style={{marginBottom:28}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
  <h3 style={{fontSize:12,fontWeight:800,color:"#a78bfa",letterSpacing:".08em"}}>{title}</h3>{extra}</div>{children}</div>;

/* Auth */
const Auth=({onClose,onAuth})=>{const[mode,setMode]=useState("login");const[email,setEmail]=useState("");const[pw,setPw]=useState("");const[name,setName]=useState("");const[err,setErr]=useState("");const[ld,setLd]=useState(false);const[sent,setSent]=useState(false);
  const go=async()=>{setErr("");setLd(true);try{if(mode==="signup"){const{error:e}=await supabase.auth.signUp({email,password:pw,options:{data:{display_name:name}}});if(e)throw e;setSent(true)}else{const{data,error:e}=await supabase.auth.signInWithPassword({email,password:pw});if(e)throw e;onAuth(data.user);onClose()}}catch(e){setErr(e.message)}setLd(false)};
  const inp={width:"100%",padding:"14px 16px",borderRadius:12,border:"1px solid #312e81",background:"#1e1b4b",color:"#f5f3ff",fontSize:14,outline:"none",marginBottom:12};
  return<div onClick={onClose} style={{position:"fixed",inset:0,zIndex:2000,background:"rgba(12,10,29,.95)",backdropFilter:"blur(24px)",display:"flex",alignItems:"center",justifyContent:"center",animation:"fadeIn .15s",padding:16}}>
    <div onClick={e=>e.stopPropagation()} style={{background:"linear-gradient(145deg,#1a1744,#1e1b4b)",borderRadius:24,width:"100%",maxWidth:400,padding:"40px 32px",border:"1px solid #312e81",boxShadow:"0 24px 64px rgba(0,0,0,.5)",animation:"slideUp .3s cubic-bezier(.4,0,.2,1)"}}>
      {sent?<div style={{textAlign:"center"}}><div style={{fontSize:48,marginBottom:16}}>📧</div><h2 style={{fontSize:22,fontWeight:800,color:"#f5f3ff"}}>Check your email</h2><p style={{color:"#a78bfa",fontSize:14,marginTop:8}}>We sent a link to <b>{email}</b></p>
        <button onClick={onClose} style={{marginTop:24,padding:"12px 28px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#7c3aed,#6d28d9)",color:"#fff",fontSize:14,fontWeight:800,cursor:"pointer"}}>Done</button></div>
      :<><div style={{marginBottom:32}}><h2 style={{fontFamily:"'Outfit'",fontSize:28,fontWeight:900,color:"#f5f3ff"}}>{mode==="login"?"Welcome back":"Join Gameboxed"}</h2><p style={{color:"#7c3aed",fontSize:14,marginTop:6}}>{mode==="login"?"Sign in to your account":"Create your gaming profile"}</p></div>
        {err&&<div style={{padding:"12px",borderRadius:10,background:"#fb718515",border:"1px solid #fb718530",color:"#fb7185",fontSize:13,marginBottom:14}}>{err}</div>}
        {mode==="signup"&&<input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} style={inp}/>}
        <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={inp}/>
        <input type="password" placeholder="Password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()} style={inp}/>
        <button onClick={go} disabled={ld} style={{width:"100%",padding:"14px",borderRadius:12,border:"none",marginTop:8,background:ld?"#312e81":"linear-gradient(135deg,#7c3aed,#6d28d9)",color:ld?"#4c1d95":"#fff",fontSize:15,fontWeight:800,cursor:ld?"default":"pointer",boxShadow:"0 4px 20px rgba(124,58,237,.3)"}}>{ld?"...":mode==="login"?"Sign In":"Create Account"}</button>
        <p style={{textAlign:"center",marginTop:18,fontSize:13,color:"#7c3aed"}}>{mode==="login"?"No account? ":"Already joined? "}<span onClick={()=>{setMode(mode==="login"?"signup":"login");setErr("")}} style={{color:"#a78bfa",cursor:"pointer",fontWeight:700,textDecoration:"underline"}}>{mode==="login"?"Sign up":"Sign in"}</span></p></>}</div></div>};

/* Edit Profile - PROPERLY FIXED */
const EP=({prof,onClose,userId,onDone})=>{const[n,setN]=useState(prof?.display_name||"");const[u,setU]=useState(prof?.username||"");const[b,setB]=useState(prof?.bio||"");const[ld,setLd]=useState(false);const[upl,setUpl]=useState(false);const[avPrev,setAvPrev]=useState(null);const fr=useRef();
  const sv=async()=>{setLd(true);await upf(userId,{display_name:n,username:u.toLowerCase().replace(/[^a-z0-9_]/g,""),bio:b});setLd(false);onDone();onClose()};
  const hf=async e=>{const f=e.target.files[0];if(!f)return;setUpl(true);setAvPrev(URL.createObjectURL(f));try{await upAv(userId,f);onDone()}catch(er){console.error("Upload error:",er)}setUpl(false)};
  const inp={width:"100%",padding:"12px 14px",borderRadius:12,border:"1px solid #312e81",background:"#1e1b4b",color:"#f5f3ff",fontSize:14,outline:"none",marginBottom:14};
  return<div onClick={onClose} style={{position:"fixed",inset:0,zIndex:2000,background:"rgba(12,10,29,.95)",backdropFilter:"blur(20px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
    <div onClick={e=>e.stopPropagation()} style={{background:"linear-gradient(145deg,#1a1744,#1e1b4b)",borderRadius:24,width:"100%",maxWidth:400,padding:"32px 28px",border:"1px solid #312e81"}}>
      <h2 style={{fontSize:22,fontWeight:900,marginBottom:24,color:"#f5f3ff"}}>Edit Profile</h2>
      <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:24}}>
        <div style={{width:64,height:64,borderRadius:32,overflow:"hidden",background:"#1e1b4b",border:"2px solid #312e81",flexShrink:0}}>
          {avPrev?<img src={avPrev} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            :prof?.avatar_url?<img src={getAvUrl(prof.avatar_url,Date.now())} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            :<div style={{width:"100%",height:"100%",background:"linear-gradient(135deg,#a78bfa,#818cf8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:800,color:"#fff"}}>{(n||"?").charAt(0).toUpperCase()}</div>}</div>
        <div><input ref={fr} type="file" accept="image/*" onChange={hf} style={{display:"none"}}/>
          <button onClick={()=>fr.current?.click()} style={{padding:"8px 16px",borderRadius:10,border:"1px solid #312e81",background:"#312e8140",color:"#a78bfa",fontSize:12,fontWeight:700,cursor:"pointer"}}>{upl?"Uploading...":"Upload Photo"}</button></div></div>
      <label style={{fontSize:10,color:"#7c3aed",fontWeight:700,letterSpacing:".08em",display:"block",marginBottom:4}}>DISPLAY NAME</label><input value={n} onChange={e=>setN(e.target.value)} style={inp}/>
      <label style={{fontSize:10,color:"#7c3aed",fontWeight:700,letterSpacing:".08em",display:"block",marginBottom:4}}>USERNAME</label><input value={u} onChange={e=>setU(e.target.value)} style={inp} placeholder="username"/>
      <label style={{fontSize:10,color:"#7c3aed",fontWeight:700,letterSpacing:".08em",display:"block",marginBottom:4}}>BIO</label><textarea value={b} onChange={e=>setB(e.target.value)} rows={3} style={{...inp,resize:"none",fontFamily:"inherit"}} placeholder="Tell the world about your gaming life..."/>
      <div style={{display:"flex",gap:10,marginTop:6}}><button onClick={onClose} style={{flex:1,padding:"13px",borderRadius:12,border:"1px solid #312e81",background:"transparent",color:"#7c3aed",fontSize:14,fontWeight:700,cursor:"pointer"}}>Cancel</button>
        <button onClick={sv} disabled={ld} style={{flex:1,padding:"13px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#7c3aed,#6d28d9)",color:"#fff",fontSize:14,fontWeight:800,cursor:"pointer"}}>{ld?"...":"Save"}</button></div></div></div>};

/* Followers List */
const FLM=({userId,type,onClose,m,setVU})=>{const[list,setList]=useState([]);const[ld,setLd]=useState(true);
  useEffect(()=>{(async()=>{setLd(true);setList(type==="followers"?await getFollowersList(userId):await getFollowingList(userId));setLd(false)})()},[userId,type]);
  return<div onClick={onClose} style={{position:"fixed",inset:0,zIndex:1800,background:"rgba(12,10,29,.95)",backdropFilter:"blur(16px)",display:"flex",alignItems:m?"flex-end":"center",justifyContent:"center",animation:"fadeIn .15s",padding:m?0:16}}>
    <div onClick={e=>e.stopPropagation()} style={{background:"#1a1744",width:"100%",maxWidth:m?"100%":400,maxHeight:m?"80vh":"70vh",borderRadius:m?"20px 20px 0 0":20,overflow:"auto",border:m?"none":"1px solid #312e81"}}>
      {m&&<div onClick={onClose} style={{display:"flex",justifyContent:"center",padding:"10px 0 0"}}><div style={{width:32,height:3,borderRadius:2,background:"#312e81"}}/></div>}
      <div style={{padding:"20px 20px 24px"}}><h3 style={{fontSize:18,fontWeight:900,marginBottom:16,color:"#f5f3ff"}}>{type==="followers"?"Followers":"Following"}</h3>
        {ld?<Loader/>:list.length>0?list.map(p=><div key={p.id} onClick={()=>{onClose();setTimeout(()=>setVU(p.id),50)}} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",borderRadius:12,marginBottom:4,cursor:"pointer",transition:"background .15s"}}
          onMouseEnter={e=>e.currentTarget.style.background="#1e1b4b"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <Av url={p.avatar_url} name={p.display_name} size={36}/><div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:"#f5f3ff"}}>{p.display_name}</div>{p.username&&<div style={{fontSize:11,color:"#7c3aed"}}>@{p.username}</div>}</div></div>)
        :<div style={{textAlign:"center",padding:30,color:"#7c3aed"}}>No {type} yet</div>}</div></div></div>};

/* User Profile */
const UP=({viewId,onClose,me,m,onFollow,setVU})=>{const[p,setP]=useState(null);const[fc,setFc]=useState({followers:0,following:0});const[gs,setGs]=useState([]);const[isF,setIsF]=useState(false);const[ld,setLd]=useState(true);const[flM,setFlM]=useState(null);
  useEffect(()=>{(async()=>{setLd(true);const[pr,c,g]=await Promise.all([lp(viewId),getFC(viewId),getUG(viewId)]);setP(pr);setFc(c);setGs(g);if(me)setIsF(await chkF(me.id,viewId));setLd(false)})()},[viewId]);
  const tog=async()=>{if(!me)return;if(isF){await unfollowU(me.id,viewId);setIsF(false);setFc(x=>({...x,followers:x.followers-1}))}else{await followU(me.id,viewId);setIsF(true);setFc(x=>({...x,followers:x.followers+1}))};onFollow?.()};
  if(ld)return<div onClick={onClose} style={{position:"fixed",inset:0,zIndex:1500,background:"rgba(12,10,29,.95)",display:"flex",alignItems:"center",justifyContent:"center"}}><Loader/></div>;
  return<><div onClick={onClose} style={{position:"fixed",inset:0,zIndex:1500,background:"rgba(12,10,29,.95)",backdropFilter:"blur(16px)",display:"flex",alignItems:m?"flex-end":"center",justifyContent:"center",padding:m?0:16}}>
    <div onClick={e=>e.stopPropagation()} style={{background:"linear-gradient(145deg,#1a1744,#1e1b4b)",width:"100%",maxWidth:m?"100%":440,borderRadius:m?"20px 20px 0 0":24,overflow:"auto",border:m?"none":"1px solid #312e81"}}>
      {m&&<div onClick={onClose} style={{display:"flex",justifyContent:"center",padding:"10px 0 0"}}><div style={{width:32,height:3,borderRadius:2,background:"#312e81"}}/></div>}
      <div style={{padding:"28px 24px",textAlign:"center"}}>
        <Av url={p?.avatar_url} name={p?.display_name} size={80} v={Date.now()}/>
        <h2 style={{fontSize:22,fontWeight:900,marginTop:12,color:"#f5f3ff"}}>{p?.display_name||"User"}</h2>
        {p?.username&&<div style={{color:"#7c3aed",fontSize:13,marginTop:2}}>@{p.username}</div>}
        {p?.bio&&<p style={{color:"#a78bfa",fontSize:13,lineHeight:1.6,marginTop:8}}>{p.bio}</p>}
        <div style={{display:"flex",gap:24,justifyContent:"center",marginTop:16}}>
          <div><div style={{fontSize:18,fontWeight:900,color:"#f5f3ff"}}>{gs.length}</div><div style={{fontSize:10,color:"#7c3aed"}}>Games</div></div>
          <div onClick={()=>setFlM("followers")} style={{cursor:"pointer"}}><div style={{fontSize:18,fontWeight:900,color:"#f5f3ff"}}>{fc.followers}</div><div style={{fontSize:10,color:"#a78bfa",textDecoration:"underline"}}>Followers</div></div>
          <div onClick={()=>setFlM("following")} style={{cursor:"pointer"}}><div style={{fontSize:18,fontWeight:900,color:"#f5f3ff"}}>{fc.following}</div><div style={{fontSize:10,color:"#a78bfa",textDecoration:"underline"}}>Following</div></div></div>
        {me&&me.id!==viewId&&<button onClick={tog} style={{marginTop:16,padding:"10px 32px",borderRadius:12,border:isF?"1px solid #312e81":"none",background:isF?"transparent":"linear-gradient(135deg,#7c3aed,#6d28d9)",color:isF?"#a78bfa":"#fff",fontSize:14,fontWeight:800,cursor:"pointer",boxShadow:isF?"none":"0 4px 16px rgba(124,58,237,.3)"}}>{isF?"Following ✓":"Follow"}</button>}
      </div></div></div>
    {flM&&<FLM userId={viewId} type={flM} onClose={()=>setFlM(null)} m={m} setVU={setVU}/>}</>};

/* Game Detail */
const GD=({game:g,onClose,m,ud,setUd,user:me,setSa,refresh,setVU,avV})=>{
  const[det,setDet]=useState(null);const[ldg,setLdg]=useState(true);const d=ud[g.id]||{};
  const[mr,setMr]=useState(d.myRating||0);const[st,setSt]=useState(d.status||"");const[tab,setTab]=useState("about");
  const[rvs,setRvs]=useState([]);const[rt,setRt]=useState("");const[rr,setRr]=useState(0);const[posting,setPosting]=useState(false);
  useEffect(()=>{setLdg(true);fgd(g.id).then(d=>{setDet(d);setLdg(false)});loadGR(g.id).then(setRvs)},[g.id]);
  const sv=async(f,v)=>{if(!me){setSa(true);return}const nd={...d,[f]:v,title:g.t,img:g.img};if(f==="myRating"){setMr(v);await postAct(me.id,"rated",{id:g.id,title:g.t,img:g.img,rating:v})}if(f==="status"){setSt(v);await postAct(me.id,v==="completed"?"completed":v==="playing"?"started playing":"added to "+v,{id:g.id,title:g.t,img:g.img})}
    setUd({...ud,[g.id]:nd});await stc(me.id,g.id,nd);refresh?.()};
  const subRev=async()=>{if(!me||!rt.trim())return;setPosting(true);await postRev(me.id,g,rr,rt);setRt("");setRr(0);setRvs(await loadGR(g.id));setPosting(false);refresh?.()};
  return<div onClick={onClose} style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(12,10,29,.95)",backdropFilter:"blur(16px)",display:"flex",alignItems:m?"flex-end":"center",justifyContent:"center",animation:"fadeIn .15s",padding:m?0:16}}>
    <div onClick={e=>e.stopPropagation()} style={{background:"linear-gradient(145deg,#1a1744,#1e1b4b)",width:"100%",maxWidth:m?"100%":660,maxHeight:m?"93vh":"88vh",borderRadius:m?"20px 20px 0 0":24,overflow:"auto",border:m?"none":"1px solid #312e81"}}>
      {m&&<div onClick={onClose} style={{display:"flex",justifyContent:"center",padding:"10px 0 0"}}><div style={{width:32,height:3,borderRadius:2,background:"#312e81"}}/></div>}
      <div style={{position:"relative",height:m?180:230,overflow:"hidden"}}><img src={g.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,#1a1744 0%,transparent 100%)"}}/>
        {!m&&<button onClick={onClose} style={{position:"absolute",top:14,right:14,width:34,height:34,borderRadius:17,background:"#0c0a1daa",border:"1px solid #312e81",color:"#f5f3ff",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>}
        <div style={{position:"absolute",bottom:16,left:m?16:24}}><h2 style={{fontFamily:"'Outfit'",fontSize:m?24:30,fontWeight:900,color:"#f5f3ff"}}>{g.t}</h2>
          <div style={{color:"#a78bfa",fontSize:12,marginTop:3}}>{g.y} · {g.genre}</div></div></div>
      <div style={{padding:m?"14px 16px 36px":"20px 24px 28px"}}>
        <div style={{display:"flex",gap:0,marginBottom:18,background:"#0c0a1d",borderRadius:14,overflow:"hidden",border:"1px solid #1e1b4b"}}>
          {[{l:"Community",v:g.r,c:"#fbbf24"},{l:"Metacritic",v:g.mc,c:g.mc>=75?"#34d399":"#fbbf24"},{l:"Yours",v:mr||"—",c:"#818cf8"}].map((s,i)=>
            <div key={i} style={{flex:1,padding:"14px 8px",textAlign:"center",borderRight:i<2?"1px solid #1e1b4b":"none"}}>
              <div style={{fontSize:9,color:"#7c3aed",fontWeight:700}}>{s.l}</div><div style={{fontSize:22,fontWeight:900,color:typeof s.v==="number"?s.c:"#4c1d95",marginTop:3}}>{s.v||"—"}</div></div>)}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:18}}>
          <div><div style={{fontSize:9,color:"#7c3aed",fontWeight:700,marginBottom:8}}>YOUR RATING</div><Stars rating={mr} size={m?24:28} interactive onRate={v=>sv("myRating",v)}/></div>
          <div><div style={{fontSize:9,color:"#7c3aed",fontWeight:700,marginBottom:8}}>STATUS</div>
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{Object.entries(SC).map(([k,c])=><button key={k} onClick={()=>sv("status",k)} style={{padding:"5px 10px",borderRadius:10,fontSize:10,fontWeight:700,cursor:"pointer",border:"1px solid "+(st===k?c.c:"#1e1b4b"),background:st===k?c.bg:"#0c0a1d",color:st===k?c.c:"#4c1d95",transition:"all .15s"}}>{c.l}</button>)}</div></div></div>
        <div style={{display:"flex",borderBottom:"1px solid #1e1b4b",marginBottom:16}}>
          {["about","reviews","media"].map(t=><button key={t} onClick={()=>setTab(t)} style={{padding:"10px 16px",background:"none",border:"none",fontSize:13,fontWeight:700,cursor:"pointer",color:tab===t?"#a78bfa":"#4c1d95",borderBottom:tab===t?"2px solid #a78bfa":"2px solid transparent",textTransform:"capitalize"}}>{t}{t==="reviews"&&rvs.length?` ${rvs.length}`:""}</button>)}</div>
        {tab==="about"&&(ldg?<Loader/>:det?.description_raw&&<p style={{color:"#a78bfa",fontSize:14,lineHeight:1.8}}>{det.description_raw.slice(0,600)}</p>)}
        {tab==="reviews"&&<div>
          {me&&<div style={{marginBottom:18,padding:16,borderRadius:14,background:"#0c0a1d",border:"1px solid #1e1b4b"}}>
            <Stars rating={rr} size={20} interactive onRate={setRr}/>
            <textarea value={rt} onChange={e=>setRt(e.target.value)} rows={3} placeholder="Share your thoughts..." style={{width:"100%",marginTop:10,padding:"12px",borderRadius:10,border:"1px solid #312e81",background:"#1e1b4b",color:"#f5f3ff",fontSize:14,outline:"none",resize:"none",fontFamily:"inherit"}}/>
            <button onClick={subRev} disabled={posting||!rt.trim()} style={{marginTop:8,padding:"10px 20px",borderRadius:10,border:"none",background:rt.trim()?"linear-gradient(135deg,#7c3aed,#6d28d9)":"#1e1b4b",color:rt.trim()?"#fff":"#4c1d95",fontSize:13,fontWeight:800,cursor:rt.trim()?"pointer":"default"}}>{posting?"...":"Post Review"}</button></div>}
          {rvs.map(r=><div key={r.id} style={{padding:14,borderRadius:12,background:"#0c0a1d",border:"1px solid #1e1b4b",marginBottom:8}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <Av url={r.profiles?.avatar_url} name={r.profiles?.display_name} size={28} onClick={()=>{onClose();setVU(r.user_id)}} v={avV}/>
              <span style={{fontSize:13,fontWeight:700,color:"#f5f3ff",cursor:"pointer",flex:1}} onClick={()=>{onClose();setVU(r.user_id)}}>{r.profiles?.display_name}</span>
              {r.rating>0&&<Stars rating={r.rating} size={10}/>}<span style={{fontSize:10,color:"#4c1d95"}}>{tA(r.created_at)}</span></div>
            <p style={{color:"#c4b5fd",fontSize:13,lineHeight:1.7,margin:0}}>{r.text}</p></div>)}
          {!rvs.length&&<div style={{textAlign:"center",padding:28,color:"#4c1d95"}}>No reviews yet</div>}</div>}
        {tab==="media"&&g.ss?.length>1&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{g.ss.slice(1,7).map((s,i)=><img key={i} src={s} alt="" loading="lazy" style={{width:"100%",borderRadius:10,aspectRatio:"16/9",objectFit:"cover"}}/>)}</div>}
      </div></div></div>};

/* ═══ MAIN ═══ */
export default function App(){
  const m=useM();const[pg,setPg]=useState("home");const[sel,setSel]=useState(null);const[q,setQ]=useState("");const[qO,setQO]=useState(false);
  const[ud,setUd]=useState({});const[user,setUser]=useState(null);const[prof,setProf]=useState(null);const[avV,setAvV]=useState(Date.now());const[fc,setFc]=useState({followers:0,following:0});
  const[sa,setSa]=useState(false);const[ep,setEp]=useState(false);const[vU,setVU]=useState(null);const[flM,setFlM]=useState(null);
  const[pop,setPop]=useState([]);const[best,setBest]=useState([]);const[fresh,setFresh]=useState([]);const[soon,setSoon]=useState([]);const[act,setAct]=useState([]);const[rpg,setRpg]=useState([]);const[indie,setIndie]=useState([]);
  const[sr,setSr]=useState([]);const[pSr,setPSr]=useState([]);const[lSr,setLSr]=useState([]);
  const[ld,setLd]=useState(true);const[sng,setSng]=useState(false);const[lf,setLf]=useState("all");const[sT,setST]=useState("games");
  const[myL,setMyL]=useState([]);const[nLN,setNLN]=useState("");const[feed,setFeed]=useState([]);const[rRev,setRRev]=useState([]);
  const stt=useRef(null);
  const rf=()=>{if(user)loadFeed(user.id).then(setFeed);else loadAllFeed().then(setFeed);loadRR().then(setRRev)};
  const reloadProf=useCallback(async()=>{if(!user)return;const p=await lp(user.id);setProf(p);setAvV(Date.now())},[user]);

  useEffect(()=>{supabase.auth.getSession().then(({data:{session}})=>{const u=session?.user||null;setUser(u);if(u){lcl(u.id).then(setUd);lp(u.id).then(setProf);loadLists(u.id).then(setMyL);loadFeed(u.id).then(setFeed);getFC(u.id).then(setFc)}else loadAllFeed().then(setFeed)});loadRR().then(setRRev);
    const{data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>{const u=session?.user||null;setUser(u);if(u){lcl(u.id).then(setUd);lp(u.id).then(setProf);loadLists(u.id).then(setMyL);loadFeed(u.id).then(setFeed);getFC(u.id).then(setFc)}else{setUd({});setProf(null)}});return()=>subscription.unsubscribe()},[]);

  useEffect(()=>{setLd(true);const td=new Date().toISOString().slice(0,10),ly=new Date(Date.now()-365*864e5).toISOString().slice(0,10),ny=new Date(Date.now()+365*864e5).toISOString().slice(0,10);
    Promise.all([fg(`&dates=${ly},${td}&ordering=-rating&metacritic=70,100`),fg(`&ordering=-metacritic&metacritic=85,100`),fg(`&dates=${ly},${td}&ordering=-released`),fg(`&dates=${td},${ny}&ordering=-added`),
      fg(`&genres=action&ordering=-rating&metacritic=75,100&page_size=8`),fg(`&genres=role-playing-games-rpg&ordering=-rating&metacritic=75,100&page_size=8`),fg(`&genres=indie&ordering=-rating&metacritic=75,100&page_size=8`)
    ]).then(([p,b,n,u,a,r,i])=>{setPop(p.map(nm));setBest(b.map(nm));setFresh(n.map(nm));setSoon(u.map(nm));setAct(a.map(nm));setRpg(r.map(nm));setIndie(i.map(nm));setLd(false)})},[]);

  useEffect(()=>{if(stt.current)clearTimeout(stt.current);if(!q.trim()){setSr([]);setPSr([]);setLSr([]);return}setSng(true);
    stt.current=setTimeout(async()=>{const[g,p,l]=await Promise.all([sga(q),searchPeople(q),searchLists(q)]);setSr(g.map(nm));setPSr(p);setLSr(l);setSng(false)},400)},[q]);

  const all=[...pop,...best,...fresh,...soon,...act,...rpg,...indie,...sr];
  const lib=Object.entries(ud).filter(([_,v])=>v.status).map(([id,v])=>{const f=all.find(g=>g.id===parseInt(id));return f||{id:parseInt(id),t:v.title||"?",img:v.img||"",y:"",genre:"",r:null,pf:[]}});
  const flib=lf==="all"?lib:lib.filter(g=>ud[g.id]?.status===lf);
  const so=async()=>{await supabase.auth.signOut();setUser(null);setUd({});setProf(null);setPg("home")};
  const dn=prof?.display_name||user?.user_metadata?.display_name||"";
  const hcl=async()=>{if(!nLN.trim()||!user)return;const{data}=await createList(user.id,nLN);if(data)setMyL([...myL,data]);setNLN("")};
  const NAV=user?[{id:"home",i:"🏠",l:"Home"},{id:"explore",i:"🔍",l:"Explore"},{id:"feed",i:"⚡",l:"Activity"},{id:"library",i:"📚",l:"Library"},{id:"profile",i:"👤",l:"Profile"}]:[{id:"home",i:"🏠",l:"Home"},{id:"explore",i:"🔍",l:"Explore"}];

  return<div className="gbx" style={{fontFamily:"'DM Sans','Outfit',system-ui,sans-serif",color:"#ede9fe",minHeight:"100vh"}}>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,100..1000&family=Outfit:wght@100..900&display=swap');
      *{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:3px;height:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#312e81;border-radius:2px}
      @keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
      @keyframes slideFromBottom{from{transform:translateY(100%)}to{transform:translateY(0)}}@keyframes spin{to{transform:rotate(360deg)}}
      body{margin:0;overflow-x:hidden}img{-webkit-user-drag:none}.hs::-webkit-scrollbar{display:none}.hs{-ms-overflow-style:none;scrollbar-width:none}
      @media(max-width:767px){*{-webkit-tap-highlight-color:transparent}}input::placeholder,textarea::placeholder{color:#4c1d95}
      .gbx{background:#0c0a1d;background-image:radial-gradient(ellipse 80% 50% at 50% -10%,rgba(124,58,237,.12),transparent),radial-gradient(ellipse 50% 40% at 100% 50%,rgba(99,102,241,.08),transparent),radial-gradient(ellipse 50% 40% at 0% 80%,rgba(124,58,237,.06),transparent);background-attachment:fixed}`}</style>

    {sa&&<Auth onClose={()=>setSa(false)} onAuth={u=>{setUser(u);setSa(false)}}/>}
    {ep&&<EP prof={prof} onClose={()=>setEp(false)} userId={user?.id} onDone={reloadProf}/>}
    {vU&&<UP viewId={vU} onClose={()=>setVU(null)} me={user} m={m} onFollow={rf} setVU={setVU}/>}
    {flM&&<FLM userId={user?.id} type={flM} onClose={()=>setFlM(null)} m={m} setVU={setVU}/>}

    {!m&&<nav style={{position:"sticky",top:0,zIndex:100,background:"rgba(12,10,29,.85)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(124,58,237,.1)",padding:"0 28px",height:50,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:24}}>
        <span onClick={()=>{setPg("home");setQ("")}} style={{fontFamily:"'Outfit'",fontSize:16,fontWeight:900,letterSpacing:".06em",cursor:"pointer",background:"linear-gradient(135deg,#a78bfa,#818cf8)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>GAMEBOXED</span>
        <div style={{display:"flex",gap:2}}>{NAV.filter(n=>n.id!=="profile").map(n=><button key={n.id} onClick={()=>{setPg(n.id);setQ("")}} style={{padding:"6px 14px",borderRadius:8,border:"none",background:pg===n.id?"rgba(124,58,237,.12)":"transparent",color:pg===n.id?"#c4b5fd":"#6d28d9",cursor:"pointer",fontSize:12,fontWeight:700}}>{n.l}</button>)}</div></div>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{position:"relative"}}><input placeholder="Search..." value={q} onChange={e=>{setQ(e.target.value);if(e.target.value)setPg("search")}}
          style={{padding:"8px 14px 8px 32px",borderRadius:10,border:"1px solid rgba(124,58,237,.15)",background:"rgba(124,58,237,.06)",color:"#f5f3ff",fontSize:12,width:190,outline:"none"}}/>
          <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",fontSize:12,color:"#6d28d9"}}>🔍</span></div>
        {user?<Av url={prof?.avatar_url} name={dn} size={30} onClick={()=>setPg("profile")} v={avV}/>
          :<button onClick={()=>setSa(true)} style={{padding:"7px 18px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#7c3aed,#6d28d9)",color:"#fff",fontSize:12,fontWeight:800,cursor:"pointer"}}>Sign In</button>}</div></nav>}

    {m&&<div style={{position:"sticky",top:0,zIndex:100,background:"rgba(12,10,29,.88)",backdropFilter:"blur(20px)",padding:"0 14px",height:46,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid rgba(124,58,237,.1)"}}>
      {qO?<div style={{flex:1,display:"flex",alignItems:"center",gap:6}}>
        <input autoFocus placeholder="Search..." value={q} onChange={e=>{setQ(e.target.value);if(e.target.value)setPg("search")}}
          style={{flex:1,padding:"8px 14px",borderRadius:10,border:"1px solid rgba(124,58,237,.2)",background:"rgba(124,58,237,.06)",color:"#f5f3ff",fontSize:14,outline:"none"}}/>
        <span onClick={()=>{setQO(false);setQ("");setPg("home")}} style={{color:"#a78bfa",fontSize:12,fontWeight:700,cursor:"pointer"}}>✕</span></div>
      :<><span style={{fontFamily:"'Outfit'",fontSize:15,fontWeight:900,background:"linear-gradient(135deg,#a78bfa,#818cf8)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>GAMEBOXED</span>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span onClick={()=>{setQO(true);setPg("search")}} style={{fontSize:15,cursor:"pointer",color:"#7c3aed"}}>🔍</span>
          {user?<Av url={prof?.avatar_url} name={dn} size={26} onClick={()=>setPg("profile")} v={avV}/>
            :<span onClick={()=>setSa(true)} style={{fontSize:12,color:"#a78bfa",fontWeight:800,cursor:"pointer"}}>Sign In</span>}</div></>}</div>}

    <main style={{maxWidth:1100,margin:"0 auto",padding:m?"8px 12px 86px":"16px 24px 44px"}}>

      {pg==="search"&&<div style={{animation:"fadeIn .2s"}}>
        <div style={{display:"flex",borderBottom:"1px solid rgba(124,58,237,.1)",marginBottom:14}}>
          {[{k:"games",l:"Games",c:sr.length},{k:"people",l:"People",c:pSr.length},{k:"lists",l:"Lists",c:lSr.length}].map(t=>
            <button key={t.k} onClick={()=>setST(t.k)} style={{padding:"10px 16px",background:"none",border:"none",fontSize:13,fontWeight:700,cursor:"pointer",color:sT===t.k?"#a78bfa":"#4c1d95",borderBottom:sT===t.k?"2px solid #a78bfa":"2px solid transparent"}}>{t.l}{q&&!sng&&t.c>0?` ${t.c}`:""}</button>)}</div>
        {sng?<Loader/>:<>
          {sT==="games"&&(sr.length>0?<div style={{display:"grid",gridTemplateColumns:m?"repeat(3,1fr)":"repeat(auto-fill,minmax(140px,1fr))",gap:m?8:12}}>{sr.map((g,i)=><GC key={g.id} game={g} delay={i*15} onClick={setSel} mobile={m} ud={ud}/>)}</div>:q&&<p style={{textAlign:"center",padding:40,color:"#4c1d95"}}>No games</p>)}
          {sT==="people"&&(pSr.length>0?<div style={{display:"flex",flexDirection:"column",gap:8}}>{pSr.map(p=>
            <div key={p.id} onClick={()=>setVU(p.id)} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",borderRadius:14,background:"rgba(124,58,237,.06)",border:"1px solid rgba(124,58,237,.1)",cursor:"pointer",transition:"border .2s"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(167,139,250,.3)"} onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(124,58,237,.1)"}>
              <Av url={p.avatar_url} name={p.display_name} size={44} v={avV}/><div style={{flex:1}}><div style={{fontSize:15,fontWeight:700,color:"#f5f3ff"}}>{p.display_name}</div>{p.username&&<div style={{fontSize:12,color:"#7c3aed"}}>@{p.username}</div>}</div>
              <span style={{color:"#4c1d95"}}>→</span></div>)}</div>:q&&<p style={{textAlign:"center",padding:40,color:"#4c1d95"}}>No people</p>)}
          {sT==="lists"&&(lSr.length>0?<div style={{display:"flex",flexDirection:"column",gap:8}}>{lSr.map(l=><div key={l.id} style={{padding:"14px 16px",borderRadius:14,background:"rgba(124,58,237,.06)",border:"1px solid rgba(124,58,237,.1)"}}>
            <div style={{fontSize:15,fontWeight:700,color:"#f5f3ff"}}>📝 {l.title}</div><div style={{fontSize:11,color:"#7c3aed",marginTop:4}}>{l.game_ids?.length||0} games · {l.profiles?.display_name}</div></div>)}</div>:q&&<p style={{textAlign:"center",padding:40,color:"#4c1d95"}}>No lists</p>)}
        </>}</div>}

      {pg==="home"&&<div style={{animation:"fadeIn .3s"}}>
        {!user&&!ld&&<div style={{textAlign:"center",padding:m?"20px 0 24px":"32px 0 36px",borderBottom:"1px solid rgba(124,58,237,.08)",marginBottom:m?16:24}}>
          <h1 style={{fontFamily:"'Outfit'",fontSize:m?26:44,fontWeight:900,lineHeight:1.1,color:"#f5f3ff"}}>Track games you've played.</h1>
          <h1 style={{fontFamily:"'Outfit'",fontSize:m?26:44,fontWeight:900,lineHeight:1.1,color:"#2e1065",marginBottom:16}}>Tell your friends what's good.</h1>
          <button onClick={()=>setSa(true)} style={{padding:"13px 32px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#7c3aed,#6d28d9)",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer",boxShadow:"0 4px 24px rgba(124,58,237,.4)"}}>Get Started — Free</button></div>}
        {ld?<Loader/>:<div style={{display:m?"block":"grid",gridTemplateColumns:"1fr 280px",gap:24}}>
          <div>
            <Hero games={pop} onClick={setSel} m={m}/>
            <Sec title="POPULAR" extra={<span onClick={()=>setPg("explore")} style={{fontSize:11,color:"#6d28d9",cursor:"pointer",fontWeight:600}}>See all →</span>}><div style={{display:"grid",gridTemplateColumns:m?"repeat(3,1fr)":"repeat(5,1fr)",gap:m?8:10}}>{pop.slice(0,m?6:5).map((g,i)=><GC key={g.id} game={g} delay={i*20} onClick={setSel} mobile={m} ud={ud}/>)}</div></Sec>
            <Sec title="NEW RELEASES"><div style={{display:"grid",gridTemplateColumns:m?"repeat(3,1fr)":"repeat(5,1fr)",gap:m?8:10}}>{fresh.slice(0,m?6:5).map((g,i)=><GC key={g.id} game={g} delay={i*20} onClick={setSel} mobile={m} ud={ud}/>)}</div></Sec>
            <Sec title="ALL-TIME BEST"><div style={{display:"grid",gridTemplateColumns:m?"repeat(3,1fr)":"repeat(5,1fr)",gap:m?8:10}}>{best.slice(0,m?6:5).map((g,i)=><GC key={g.id} game={g} delay={i*20} onClick={setSel} mobile={m} ud={ud}/>)}</div></Sec>
            <Sec title="COMING SOON"><div style={{display:"grid",gridTemplateColumns:m?"repeat(4,1fr)":"repeat(6,1fr)",gap:m?6:8}}>{soon.slice(0,m?8:6).map((g,i)=><GC key={g.id} game={g} delay={i*15} onClick={setSel} mobile={m} ud={ud} sz="xs"/>)}</div></Sec>
            <Sec title="ACTION"><div style={{display:"grid",gridTemplateColumns:m?"repeat(3,1fr)":"repeat(5,1fr)",gap:m?8:10}}>{act.slice(0,m?6:5).map((g,i)=><GC key={g.id} game={g} delay={i*20} onClick={setSel} mobile={m} ud={ud}/>)}</div></Sec>
            <Sec title="RPG"><div style={{display:"grid",gridTemplateColumns:m?"repeat(3,1fr)":"repeat(5,1fr)",gap:m?8:10}}>{rpg.slice(0,m?6:5).map((g,i)=><GC key={g.id} game={g} delay={i*20} onClick={setSel} mobile={m} ud={ud}/>)}</div></Sec>
            <Sec title="INDIE"><div style={{display:"grid",gridTemplateColumns:m?"repeat(3,1fr)":"repeat(5,1fr)",gap:m?8:10}}>{indie.slice(0,m?6:5).map((g,i)=><GC key={g.id} game={g} delay={i*20} onClick={setSel} mobile={m} ud={ud}/>)}</div></Sec>
          </div>
          {!m&&<div>
            {rRev.length>0&&<div style={{marginBottom:24}}><h3 style={{fontSize:12,fontWeight:800,color:"#a78bfa",letterSpacing:".08em",marginBottom:12}}>REVIEWS</h3>
              {rRev.slice(0,5).map(r=><div key={r.id} style={{padding:"12px",borderRadius:12,background:"rgba(124,58,237,.06)",border:"1px solid rgba(124,58,237,.08)",marginBottom:8}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                  <Av url={r.profiles?.avatar_url} name={r.profiles?.display_name} size={20} onClick={()=>setVU(r.user_id)} v={avV}/>
                  <span style={{fontSize:11,fontWeight:700,flex:1,cursor:"pointer",color:"#f5f3ff"}} onClick={()=>setVU(r.user_id)}>{r.profiles?.display_name}</span>
                  {r.rating>0&&<span style={{fontSize:9,color:"#fbbf24"}}>★{r.rating}</span>}<span style={{fontSize:9,color:"#2e1065"}}>{tA(r.created_at)}</span></div>
                <div style={{fontSize:11,color:"#a78bfa",fontWeight:700,marginBottom:3}}>{r.game_title}</div>
                <p style={{fontSize:11,color:"#7c3aed",lineHeight:1.4,margin:0,overflow:"hidden",textOverflow:"ellipsis",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{r.text}</p></div>)}</div>}
            <div><h3 style={{fontSize:12,fontWeight:800,color:"#a78bfa",letterSpacing:".08em",marginBottom:12}}>ACTIVITY</h3>
              {feed.slice(0,8).map(a=><div key={a.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderBottom:"1px solid rgba(124,58,237,.06)",fontSize:11}}>
                <Av url={a.profiles?.avatar_url} name={a.profiles?.display_name} size={20} onClick={()=>setVU(a.user_id)} v={avV}/>
                <div style={{flex:1,minWidth:0}}><span style={{fontWeight:700,cursor:"pointer",color:"#f5f3ff"}} onClick={()=>setVU(a.user_id)}>{a.profiles?.display_name}</span>
                  <span style={{color:"#4c1d95"}}> {a.action} </span>{a.game_title&&<span style={{color:"#a78bfa",fontWeight:600}}>{a.game_title}</span>}</div>
                <span style={{fontSize:9,color:"#2e1065",flexShrink:0}}>{tA(a.created_at)}</span></div>)}</div>
          </div>}
        </div>}</div>}

      {pg==="feed"&&user&&<div style={{animation:"fadeIn .2s"}}>
        <h2 style={{fontFamily:"'Outfit'",fontSize:m?20:24,fontWeight:900,marginBottom:16,color:"#f5f3ff"}}>Activity</h2>
        {feed.length>0?feed.map(a=><div key={a.id} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderRadius:12,background:"rgba(124,58,237,.06)",border:"1px solid rgba(124,58,237,.08)",marginBottom:5}}>
          <Av url={a.profiles?.avatar_url} name={a.profiles?.display_name} size={28} onClick={()=>setVU(a.user_id)} v={avV}/>
          {a.game_img&&<img src={a.game_img} alt="" style={{width:32,height:18,borderRadius:4,objectFit:"cover"}}/>}
          <div style={{flex:1,fontSize:12}}><span style={{fontWeight:700,cursor:"pointer",color:"#f5f3ff"}} onClick={()=>setVU(a.user_id)}>{a.profiles?.display_name}</span>
            <span style={{color:"#4c1d95"}}> {a.action} </span>{a.game_title&&<span style={{color:"#a78bfa",fontWeight:700}}>{a.game_title}</span>}</div>
          <span style={{fontSize:9,color:"#2e1065"}}>{tA(a.created_at)}</span></div>)
        :<div style={{textAlign:"center",padding:40,color:"#4c1d95"}}>No activity yet</div>}</div>}

      {pg==="explore"&&<div style={{animation:"fadeIn .2s"}}>
        <h2 style={{fontFamily:"'Outfit'",fontSize:m?20:24,fontWeight:900,marginBottom:16,color:"#f5f3ff"}}>Explore</h2>
        {ld?<Loader/>:<>{[{t:"HIGHEST RATED",d:best},{t:"POPULAR",d:pop},{t:"NEW",d:fresh},{t:"ACTION",d:act},{t:"RPG",d:rpg},{t:"INDIE",d:indie}].map(s=>
          <Sec key={s.t} title={s.t}><div style={{display:"grid",gridTemplateColumns:m?"repeat(3,1fr)":"repeat(auto-fill,minmax(140px,1fr))",gap:m?8:12}}>{s.d.map((g,i)=><GC key={g.id} game={g} delay={i*15} onClick={setSel} mobile={m} ud={ud}/>)}</div></Sec>)}</>}</div>}

      {pg==="library"&&user&&<div style={{animation:"fadeIn .2s"}}>
        <h2 style={{fontFamily:"'Outfit'",fontSize:m?20:24,fontWeight:900,marginBottom:16,color:"#f5f3ff"}}>Library</h2>
        {lib.length>0?<><div className="hs" style={{display:"flex",gap:5,marginBottom:14,overflowX:"auto"}}>
          {[["all","All"],["playing","Playing"],["completed","Completed"],["backlog","Backlog"],["wishlist","Wishlist"],["dropped","Dropped"]].map(([k,l])=>
            <button key={k} onClick={()=>setLf(k)} style={{padding:"6px 14px",borderRadius:10,fontSize:12,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",border:"1px solid "+(lf===k?"#a78bfa":"rgba(124,58,237,.1)"),background:lf===k?"rgba(167,139,250,.1)":"rgba(124,58,237,.04)",color:lf===k?"#a78bfa":"#6d28d9"}}>{l} {k==="all"?lib.length:lib.filter(g=>ud[g.id]?.status===k).length}</button>)}</div>
          <div style={{display:"grid",gridTemplateColumns:m?"repeat(3,1fr)":"repeat(auto-fill,minmax(140px,1fr))",gap:m?8:12}}>{flib.map((g,i)=><GC key={g.id} game={g} delay={i*15} onClick={setSel} mobile={m} ud={ud}/>)}</div>
        </>:<div style={{textAlign:"center",padding:40,color:"#4c1d95"}}>Search and add games</div>}</div>}

      {pg==="stats"&&user&&<div style={{animation:"fadeIn .2s"}}>
        <h2 style={{fontFamily:"'Outfit'",fontSize:m?20:24,fontWeight:900,marginBottom:16,color:"#f5f3ff"}}>Stats</h2>
        {lib.length>0?(()=>{const bs=s=>lib.filter(g=>ud[g.id]?.status===s).length;const rt=lib.filter(g=>ud[g.id]?.myRating);const av=rt.length?(rt.reduce((s,g)=>s+ud[g.id].myRating,0)/rt.length).toFixed(1):"—";
          return<><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:m?8:12,marginBottom:24}}>
            {[{l:"Games",v:lib.length,c:"#818cf8"},{l:"Done",v:bs("completed"),c:"#34d399"},{l:"Playing",v:bs("playing"),c:"#a78bfa"},{l:"Avg ★",v:av,c:"#fbbf24"}].map((s,i)=>
              <div key={i} style={{padding:m?12:16,borderRadius:14,textAlign:"center",background:"rgba(124,58,237,.06)",border:"1px solid rgba(124,58,237,.08)"}}>
                <div style={{fontSize:m?20:24,fontWeight:900,color:s.c}}>{s.v}</div><div style={{fontSize:10,color:"#7c3aed",fontWeight:700,marginTop:2}}>{s.l}</div></div>)}</div>
            {Object.entries(SC).map(([k,c])=>{const cn=bs(k),mx=lib.length||1;
              return<div key={k} style={{display:"flex",alignItems:"center",gap:10,marginBottom:5}}>
                <span style={{width:65,fontSize:12,color:"#7c3aed",fontWeight:600,textAlign:"right"}}>{c.l}</span>
                <div style={{flex:1,height:18,background:"rgba(124,58,237,.06)",borderRadius:6,overflow:"hidden"}}>
                  <div style={{height:"100%",width:cn>0?(cn/mx*100)+"%":"0%",background:c.c,borderRadius:6,opacity:.5,transition:"width .6s"}}></div></div></div>})}</>
        })():<p style={{textAlign:"center",padding:40,color:"#4c1d95"}}>Add games to see stats</p>}</div>}

      {pg==="profile"&&user&&<div style={{animation:"fadeIn .2s"}}>
        <div style={{display:"flex",alignItems:m?"center":"flex-start",gap:m?16:24,marginBottom:28,flexDirection:m?"column":"row"}}>
          <Av url={prof?.avatar_url} name={dn} size={m?80:96} v={avV}/>
          <div style={{textAlign:m?"center":"left",flex:1}}>
            <h2 style={{fontFamily:"'Outfit'",fontSize:m?22:28,fontWeight:900,color:"#f5f3ff"}}>{prof?.display_name||dn}</h2>
            {prof?.username&&<div style={{color:"#7c3aed",fontSize:13,marginTop:2}}>@{prof.username}</div>}
            {prof?.bio&&<p style={{color:"#a78bfa",fontSize:14,lineHeight:1.6,marginTop:6}}>{prof.bio}</p>}
            <div style={{display:"flex",gap:20,marginTop:12,justifyContent:m?"center":"flex-start"}}>
              <div><div style={{fontSize:18,fontWeight:900,color:"#f5f3ff"}}>{lib.length}</div><div style={{fontSize:10,color:"#7c3aed"}}>Games</div></div>
              <div><div style={{fontSize:18,fontWeight:900,color:"#f5f3ff"}}>{lib.filter(g=>ud[g.id]?.status==="completed").length}</div><div style={{fontSize:10,color:"#7c3aed"}}>Done</div></div>
              <div onClick={()=>setFlM("followers")} style={{cursor:"pointer"}}><div style={{fontSize:18,fontWeight:900,color:"#f5f3ff"}}>{fc.followers}</div><div style={{fontSize:10,color:"#a78bfa",textDecoration:"underline"}}>Followers</div></div>
              <div onClick={()=>setFlM("following")} style={{cursor:"pointer"}}><div style={{fontSize:18,fontWeight:900,color:"#f5f3ff"}}>{fc.following}</div><div style={{fontSize:10,color:"#a78bfa",textDecoration:"underline"}}>Following</div></div></div>
            <div style={{display:"flex",gap:8,marginTop:12,justifyContent:m?"center":"flex-start"}}>
              <button onClick={()=>setEp(true)} style={{padding:"8px 20px",borderRadius:10,border:"1px solid rgba(124,58,237,.2)",background:"rgba(124,58,237,.06)",color:"#c4b5fd",fontSize:12,fontWeight:700,cursor:"pointer"}}>Edit Profile</button>
              <button onClick={so} style={{padding:"8px 20px",borderRadius:10,border:"1px solid rgba(124,58,237,.2)",background:"rgba(124,58,237,.06)",color:"#fb7185",fontSize:12,fontWeight:700,cursor:"pointer"}}>Sign Out</button></div></div></div>
        <div style={{marginBottom:24}}>
          <h3 style={{fontSize:12,fontWeight:800,color:"#a78bfa",letterSpacing:".08em",marginBottom:12}}>LISTS</h3>
          {myL.map(l=><div key={l.id} style={{padding:"12px 14px",borderRadius:10,background:"rgba(124,58,237,.06)",border:"1px solid rgba(124,58,237,.08)",marginBottom:5,fontSize:14,fontWeight:700,color:"#f5f3ff"}}>📝 {l.title}</div>)}
          <div style={{display:"flex",gap:6,marginTop:8}}><input placeholder="New list..." value={nLN} onChange={e=>setNLN(e.target.value)} onKeyDown={e=>e.key==="Enter"&&hcl()}
            style={{flex:1,padding:"10px 14px",borderRadius:10,border:"1px solid rgba(124,58,237,.15)",background:"rgba(124,58,237,.06)",color:"#f5f3ff",fontSize:13,outline:"none"}}/>
            <button onClick={hcl} style={{padding:"10px 16px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#7c3aed,#6d28d9)",color:"#fff",fontSize:12,fontWeight:800,cursor:"pointer"}}>Create</button></div></div>
        {lib.length>0&&<><h3 style={{fontSize:12,fontWeight:800,color:"#a78bfa",letterSpacing:".08em",marginBottom:12}}>GAMES</h3>
          <div style={{display:"grid",gridTemplateColumns:m?"repeat(3,1fr)":"repeat(auto-fill,minmax(140px,1fr))",gap:m?8:12}}>{lib.map((g,i)=><GC key={g.id} game={g} delay={i*15} onClick={setSel} mobile={m} ud={ud}/>)}</div></>}
      </div>}
    </main>

    {m&&<div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:90,background:"rgba(12,10,29,.95)",backdropFilter:"blur(16px)",borderTop:"1px solid rgba(124,58,237,.1)",display:"flex",paddingTop:5,paddingBottom:"max(env(safe-area-inset-bottom,12px),12px)"}}>
      {NAV.map(n=><div key={n.id} onClick={()=>{setPg(n.id);setQ("");setQO(false)}} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,cursor:"pointer",padding:"2px 0"}}>
        <span style={{fontSize:18,opacity:pg===n.id?1:.25,transition:"all .15s"}}>{n.i}</span>
        <span style={{fontSize:8,fontWeight:800,color:pg===n.id?"#a78bfa":"#4c1d95"}}>{n.l}</span></div>)}</div>}

    {sel&&<GD game={sel} onClose={()=>setSel(null)} m={m} ud={ud} setUd={setUd} user={user} setSa={setSa} refresh={rf} setVU={setVU} avV={avV}/>}
  </div>}
