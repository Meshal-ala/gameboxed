import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";

const AK="33d378268c5d452ab1f3a9cb04c89f38",AP="https://api.rawg.io/api",SU="https://gatarbmbvjrrbcemsdhl.supabase.co";
const PP={1:{n:"PC",c:"#6ee7b7"},2:{n:"PS",c:"#93c5fd"},3:{n:"Xbox",c:"#86efac"},7:{n:"Switch",c:"#fca5a5"}};
const SC={completed:{c:"#4ade80",l:"Completed"},playing:{c:"#60a5fa",l:"Playing"},wishlist:{c:"#facc15",l:"Wishlist"},dropped:{c:"#f87171",l:"Dropped"},backlog:{c:"#c084fc",l:"Backlog"}};

const fg=async(p="")=>{try{return(await(await fetch(`${AP}/games?key=${AK}&page_size=20${p}`)).json()).results||[]}catch{return[]}};
const fgd=async id=>{try{return await(await fetch(`${AP}/games/${id}?key=${AK}`)).json()}catch{return null}};
const sga=async q=>{try{return(await(await fetch(`${AP}/games?key=${AK}&search=${encodeURIComponent(q)}&page_size=20&search_precise=true`)).json()).results||[]}catch{return[]}};
const nm=g=>({id:g.id,t:g.name,y:g.released?.slice(0,4)||"TBA",img:g.background_image||"",r:g.rating?Math.round(g.rating*10)/10:null,mc:g.metacritic,genre:g.genres?.map(x=>x.name).slice(0,2).join(", ")||"",pf:(g.parent_platforms||[]).map(p=>PP[p.platform.id]).filter(Boolean),ss:g.short_screenshots?.map(s=>s.image)||[]});

/* Supabase */
const lcl=async u=>{const{data}=await supabase.from("user_games").select("*").eq("user_id",u);const l={};(data||[]).forEach(r=>{l[r.game_id]={status:r.status,myRating:r.my_rating,title:r.game_title,img:r.game_img}});return l};
const stc=async(u,g,f)=>{const{data:e}=await supabase.from("user_games").select("id").eq("user_id",u).eq("game_id",g).single();if(e)await supabase.from("user_games").update({status:f.status,my_rating:f.myRating,game_title:f.title,game_img:f.img,updated_at:new Date().toISOString()}).eq("id",e.id);else await supabase.from("user_games").insert({user_id:u,game_id:g,status:f.status,my_rating:f.myRating,game_title:f.title,game_img:f.img})};
const lp=async u=>{const{data,error}=await supabase.from("profiles").select("*").eq("id",u).single();if(error)console.error("lp error",error);return data};
const searchPeople=async q=>{const{data}=await supabase.from("profiles").select("*").ilike("display_name",`%${q}%`).limit(20);return data||[]};
const searchLists=async q=>{const{data}=await supabase.from("lists").select("*,profiles(display_name,username,avatar_url)").ilike("title",`%${q}%`).eq("is_public",true).limit(20);return data||[]};
const loadLists=async u=>{const{data}=await supabase.from("lists").select("*").eq("user_id",u);return data||[]};
const createList=async(u,t)=>await supabase.from("lists").insert({user_id:u,title:t}).select().single();
const postAct=async(uid,act,g)=>{await supabase.from("activities").insert({user_id:uid,action:act,game_id:g?.id,game_title:g?.title||g?.t,game_img:g?.img,rating:g?.rating})};
const loadFeed=async uid=>{const{data:fo}=await supabase.from("follows").select("following_id").eq("follower_id",uid);const ids=[uid,...(fo||[]).map(f=>f.following_id)];const{data}=await supabase.from("activities").select("*,profiles(display_name,username,avatar_url)").in("user_id",ids).order("created_at",{ascending:false}).limit(40);return data||[]};
const loadAllFeed=async()=>{const{data}=await supabase.from("activities").select("*,profiles(display_name,username,avatar_url)").order("created_at",{ascending:false}).limit(40);return data||[]};
const loadGR=async gid=>{const{data}=await supabase.from("reviews").select("*,profiles(display_name,username,avatar_url)").eq("game_id",gid).order("created_at",{ascending:false}).limit(20);return data||[]};
const postRev=async(uid,g,r,t)=>{await supabase.from("reviews").insert({user_id:uid,game_id:g.id,game_title:g.t||g.title,game_img:g.img,rating:r,text:t});await postAct(uid,"reviewed",{id:g.id,title:g.t||g.title,img:g.img})};
const loadRR=async()=>{const{data}=await supabase.from("reviews").select("*,profiles(display_name,username,avatar_url)").order("created_at",{ascending:false}).limit(10);return data||[]};
const followU=async(a,b)=>await supabase.from("follows").insert({follower_id:a,following_id:b});
const unfollowU=async(a,b)=>await supabase.from("follows").delete().eq("follower_id",a).eq("following_id",b);
const chkF=async(a,b)=>{const{data}=await supabase.from("follows").select("id").eq("follower_id",a).eq("following_id",b).single();return!!data};
const getFC=async u=>{const{count:a}=await supabase.from("follows").select("*",{count:"exact",head:true}).eq("following_id",u);const{count:b}=await supabase.from("follows").select("*",{count:"exact",head:true}).eq("follower_id",u);return{followers:a||0,following:b||0}};
const getUG=async u=>{const{data}=await supabase.from("user_games").select("*").eq("user_id",u).order("updated_at",{ascending:false});return data||[]};
const getFollowersList=async u=>{const{data}=await supabase.from("follows").select("follower_id").eq("following_id",u);if(!data?.length)return[];const{data:p}=await supabase.from("profiles").select("*").in("id",data.map(r=>r.follower_id));return p||[]};
const getFollowingList=async u=>{const{data}=await supabase.from("follows").select("following_id").eq("follower_id",u);if(!data?.length)return[];const{data:p}=await supabase.from("profiles").select("*").in("id",data.map(r=>r.following_id));return p||[]};
const getUserActs=async u=>{const{data}=await supabase.from("activities").select("*").eq("user_id",u).order("created_at",{ascending:false}).limit(15);return data||[]};

/* Avatar - unique name every upload */
const avUrl=(url,v)=>url?`${SU}/storage/v1/object/public/avatars/${url}?v=${v||1}`:null;
const upAv=async(uid,file)=>{const p=`${uid}/av_${Date.now()}.${file.name.split(".").pop()}`;const{error}=await supabase.storage.from("avatars").upload(p,file,{cacheControl:"0",upsert:false});if(error)throw error;const{error:e2}=await supabase.from("profiles").update({avatar_url:p}).eq("id",uid);if(e2)throw e2;return p};

/* FIXED profile update */
const saveProfile=async(uid,fields)=>{const{error}=await supabase.from("profiles").update(fields).eq("id",uid);if(error){console.error("Save profile error:",error);return false}return true};

const useM=()=>{const[m,setM]=useState(window.innerWidth<768);useEffect(()=>{const h=()=>setM(window.innerWidth<768);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h)},[]);return m};
const tA=d=>{const s=Math.floor((Date.now()-new Date(d))/1000);if(s<60)return"just now";if(s<3600)return Math.floor(s/60)+"m ago";if(s<86400)return Math.floor(s/3600)+"h ago";return Math.floor(s/86400)+"d ago"};

/* ── Components ── */
const Stars=({rating=0,size=14,interactive,onRate,showNum})=>{const[h,setH]=useState(0);const a=h||rating;
  const c=(s,e)=>{if(!interactive||!onRate)return;const r=e.currentTarget.getBoundingClientRect();onRate(e.clientX-r.left<r.width/2?s-.5:s)};
  return<div style={{display:"flex",gap:1,alignItems:"center"}}>{[1,2,3,4,5].map(s=>{const f=s<=Math.floor(a),hf=!f&&s-.5<=a&&s>a-.5;
    return<span key={s} onClick={e=>c(s,e)} onMouseEnter={()=>interactive&&setH(s)} onMouseLeave={()=>interactive&&setH(0)}
      style={{fontSize:size,cursor:interactive?"pointer":"default",position:"relative",lineHeight:1,color:f||hf?"#f5c518":"#3a3a3a",transition:"all .12s",transform:interactive&&s<=Math.ceil(h)?"scale(1.15)":"scale(1)"}}>
      {hf?<><span style={{position:"absolute",overflow:"hidden",width:"50%"}}>★</span><span style={{color:"#3a3a3a"}}>★</span></>:"★"}</span>})}
    {(interactive||showNum)&&a>0&&<span style={{fontSize:size*.7,color:"#f5c518",fontWeight:700,marginLeft:3}}>{a}</span>}</div>};

const Loader=()=><div style={{display:"flex",justifyContent:"center",padding:32}}><div style={{width:24,height:24,border:"2.5px solid #2a2a2a",borderTopColor:"#f5c518",borderRadius:"50%",animation:"spin .7s linear infinite"}}/></div>;

const Av=({url,name,size=32,onClick,v})=>{const s=avUrl(url,v);
  return<div onClick={onClick} style={{width:size,height:size,borderRadius:size*.15,background:s?"#1a1a1a":"linear-gradient(135deg,#f5c518,#e0b000)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.4,fontWeight:800,cursor:onClick?"pointer":"default",overflow:"hidden",flexShrink:0,color:"#000"}}>
    {s?<img src={s} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:(name||"?").charAt(0).toUpperCase()}</div>};

/* ── Game Card (IMDB poster style) ── */
const GC=({game:g,onClick,delay=0,mobile:m,ud,sz="md"})=>{const[hov,setHov]=useState(false);const[vis,setVis]=useState(false);const[err,setErr]=useState(false);
  useEffect(()=>{const t=setTimeout(()=>setVis(true),delay);return()=>clearTimeout(t)},[delay]);const u=ud?.[g.id];const xs=sz==="xs";
  return<div onClick={()=>onClick?.(g)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
    style={{borderRadius:xs?4:6,overflow:"hidden",cursor:"pointer",position:"relative",aspectRatio:xs?"1/1.3":"2/3",
      opacity:vis?1:0,transform:vis?(hov&&!m?"translateY(-4px)":"none"):"translateY(8px)",transition:"all .2s ease",
      boxShadow:hov?"0 8px 24px rgba(0,0,0,.6)":"0 2px 8px rgba(0,0,0,.3)"}}>
    {!err&&g.img?<img src={g.img} alt={g.t} onError={()=>setErr(true)} loading="lazy"
      style={{width:"100%",height:"100%",objectFit:"cover",transition:"transform .3s",transform:hov&&!m?"scale(1.04)":"scale(1)"}}/>
      :<div style={{width:"100%",height:"100%",background:"#1a1a1a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:xs?14:28,color:"#333"}}>🎮</div>}
    <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,#000 0%,transparent 60%)"}}/>
    {u?.status&&!xs&&<div style={{position:"absolute",top:0,left:0,padding:"2px 6px",background:SC[u.status]?.c,fontSize:7,fontWeight:900,color:"#000",letterSpacing:".04em"}}>{SC[u.status]?.l.toUpperCase()}</div>}
    {g.r&&!xs&&<div style={{position:"absolute",top:4,right:4,display:"flex",alignItems:"center",gap:2,padding:"2px 5px",borderRadius:3,background:"rgba(0,0,0,.8)"}}><span style={{color:"#f5c518",fontSize:9,fontWeight:900}}>★</span><span style={{color:"#fff",fontSize:9,fontWeight:800}}>{g.r}</span></div>}
    <div style={{position:"absolute",bottom:0,left:0,right:0,padding:xs?"4px":"6px 8px"}}>
      <div style={{fontSize:xs?8:11,fontWeight:700,lineHeight:1.25,overflow:"hidden",textOverflow:"ellipsis",display:"-webkit-box",WebkitLineClamp:xs?1:2,WebkitBoxOrient:"vertical",color:"#fff"}}>{g.t}</div>
      {!xs&&<div style={{fontSize:8,color:"#777",marginTop:2}}>{g.y}{g.genre?" · "+g.genre.split(",")[0]:""}</div>}
    </div></div>};

/* Hero Carousel */
const Hero=({games,onClick,m})=>{const[idx,setIdx]=useState(0);const g=games[idx];
  useEffect(()=>{const t=setInterval(()=>setIdx(i=>(i+1)%Math.min(games.length,5)),5000);return()=>clearInterval(t)},[games.length]);
  if(!g)return null;
  return<div onClick={()=>onClick?.(g)} style={{position:"relative",width:"100%",aspectRatio:m?"16/9":"2.5/1",borderRadius:8,overflow:"hidden",cursor:"pointer",marginBottom:m?16:24}}>
    <img src={g.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
    <div style={{position:"absolute",inset:0,background:"linear-gradient(to right,#000 0%,rgba(0,0,0,.5) 40%,transparent 70%)"}}/>
    <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,#121212 0%,transparent 30%)"}}/>
    <div style={{position:"absolute",bottom:m?14:28,left:m?14:28}}>
      <div style={{display:"inline-block",padding:"3px 8px",borderRadius:3,background:"#f5c518",fontSize:9,fontWeight:900,color:"#000",letterSpacing:".08em",marginBottom:6}}>FEATURED</div>
      <h2 style={{fontFamily:"'Outfit'",fontSize:m?22:40,fontWeight:900,margin:0,lineHeight:1.1,color:"#fff"}}>{g.t}</h2>
      <div style={{display:"flex",alignItems:"center",gap:8,marginTop:6}}>
        {g.r&&<div style={{display:"flex",alignItems:"center",gap:3}}><span style={{color:"#f5c518",fontSize:m?14:18,fontWeight:900}}>★</span><span style={{color:"#fff",fontSize:m?14:18,fontWeight:800}}>{g.r}</span><span style={{color:"#777",fontSize:m?11:13}}>/5</span></div>}
        <span style={{color:"#555"}}>·</span><span style={{color:"#999",fontSize:m?11:13}}>{g.y}</span>
        <span style={{color:"#555"}}>·</span><span style={{color:"#999",fontSize:m?11:13}}>{g.genre}</span></div></div>
    <div style={{position:"absolute",bottom:m?14:28,right:m?14:28,display:"flex",gap:4}}>
      {games.slice(0,5).map((_,i)=><div key={i} onClick={e=>{e.stopPropagation();setIdx(i)}} style={{width:i===idx?18:8,height:4,borderRadius:2,background:i===idx?"#f5c518":"#555",transition:"all .2s",cursor:"pointer"}}/>)}</div></div>};

const Sec=({title,children,extra})=><div style={{marginBottom:m=>24}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,borderLeft:"3px solid #f5c518",paddingLeft:10}}>
  <h3 style={{fontSize:14,fontWeight:800,color:"#fff"}}>{title}</h3>{extra}</div>{children}</div>;

/* Auth */
const Auth=({onClose,onAuth})=>{const[mode,setMode]=useState("login");const[email,setEmail]=useState("");const[pw,setPw]=useState("");const[name,setName]=useState("");const[err,setErr]=useState("");const[ld,setLd]=useState(false);const[sent,setSent]=useState(false);
  const go=async()=>{setErr("");setLd(true);try{if(mode==="signup"){const{error:e}=await supabase.auth.signUp({email,password:pw,options:{data:{display_name:name}}});if(e)throw e;setSent(true)}else{const{data,error:e}=await supabase.auth.signInWithPassword({email,password:pw});if(e)throw e;onAuth(data.user);onClose()}}catch(e){setErr(e.message)}setLd(false)};
  const inp={width:"100%",padding:"13px 14px",borderRadius:6,border:"1px solid #333",background:"#1a1a1a",color:"#fff",fontSize:14,outline:"none",marginBottom:10};
  return<div onClick={onClose} style={{position:"fixed",inset:0,zIndex:2000,background:"rgba(0,0,0,.9)",display:"flex",alignItems:"center",justifyContent:"center",animation:"fadeIn .12s",padding:16}}>
    <div onClick={e=>e.stopPropagation()} style={{background:"#1a1a1a",borderRadius:12,width:"100%",maxWidth:380,padding:"36px 28px",border:"1px solid #2a2a2a",animation:"slideUp .2s ease"}}>
      {sent?<div style={{textAlign:"center"}}><div style={{fontSize:40,marginBottom:14}}>📧</div><h2 style={{fontSize:20,fontWeight:800}}>Check your email</h2><p style={{color:"#999",fontSize:13,marginTop:8}}>Link sent to <span style={{color:"#f5c518"}}>{email}</span></p>
        <button onClick={onClose} style={{marginTop:20,padding:"11px 24px",borderRadius:6,border:"none",background:"#f5c518",color:"#000",fontSize:14,fontWeight:800,cursor:"pointer"}}>OK</button></div>
      :<><h2 style={{fontFamily:"'Outfit'",fontSize:24,fontWeight:900,marginBottom:4}}>{mode==="login"?"Sign In":"Create Account"}</h2><p style={{color:"#666",fontSize:13,marginBottom:24}}>{mode==="login"?"Welcome back to Gameboxed":"Join the community"}</p>
        {err&&<div style={{padding:"10px",borderRadius:6,background:"#f8717115",border:"1px solid #f8717130",color:"#f87171",fontSize:12,marginBottom:12}}>{err}</div>}
        {mode==="signup"&&<input placeholder="Display Name" value={name} onChange={e=>setName(e.target.value)} style={inp}/>}
        <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={inp}/>
        <input type="password" placeholder="Password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()} style={inp}/>
        <button onClick={go} disabled={ld} style={{width:"100%",padding:"13px",borderRadius:6,border:"none",marginTop:6,background:ld?"#333":"#f5c518",color:"#000",fontSize:15,fontWeight:800,cursor:ld?"default":"pointer"}}>{ld?"...":mode==="login"?"Sign In":"Create Account"}</button>
        <p style={{textAlign:"center",marginTop:16,fontSize:13,color:"#666"}}>{mode==="login"?"New here? ":"Already have an account? "}<span onClick={()=>{setMode(mode==="login"?"signup":"login");setErr("")}} style={{color:"#f5c518",cursor:"pointer",fontWeight:700}}>{mode==="login"?"Create account":"Sign in"}</span></p></>}</div></div>};

/* Edit Profile - FIXED */
const EP=({prof,onClose,userId,onDone})=>{const[n,setN]=useState(prof?.display_name||"");const[u,setU]=useState(prof?.username||"");const[b,setB]=useState(prof?.bio||"");const[ld,setLd]=useState(false);const[upl,setUpl]=useState(false);const[avPrev,setAvPrev]=useState(null);const fr=useRef();
  const sv=async()=>{setLd(true);const ok=await saveProfile(userId,{display_name:n,username:u.toLowerCase().replace(/[^a-z0-9_]/g,""),bio:b});setLd(false);if(ok){await onDone();onClose()}};
  const hf=async e=>{const f=e.target.files[0];if(!f)return;setUpl(true);setAvPrev(URL.createObjectURL(f));try{await upAv(userId,f);await onDone()}catch(er){console.error("Upload err:",er);alert("Upload failed: "+er.message)}setUpl(false)};
  const inp={width:"100%",padding:"12px",borderRadius:6,border:"1px solid #333",background:"#1a1a1a",color:"#fff",fontSize:14,outline:"none",marginBottom:12};
  return<div onClick={onClose} style={{position:"fixed",inset:0,zIndex:2000,background:"rgba(0,0,0,.9)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
    <div onClick={e=>e.stopPropagation()} style={{background:"#1a1a1a",borderRadius:12,width:"100%",maxWidth:400,padding:"28px 24px",border:"1px solid #2a2a2a"}}>
      <h2 style={{fontSize:20,fontWeight:900,marginBottom:20}}>Edit Profile</h2>
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20}}>
        <div style={{width:64,height:64,borderRadius:10,overflow:"hidden",background:"#1a1a1a",flexShrink:0}}>
          {avPrev?<img src={avPrev} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            :prof?.avatar_url?<img src={avUrl(prof.avatar_url,Date.now())} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            :<div style={{width:"100%",height:"100%",background:"linear-gradient(135deg,#f5c518,#e0b000)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:800,color:"#000"}}>{(n||"?").charAt(0).toUpperCase()}</div>}</div>
        <div><input ref={fr} type="file" accept="image/jpeg,image/png,image/webp" onChange={hf} style={{display:"none"}}/>
          <button onClick={()=>fr.current?.click()} style={{padding:"8px 14px",borderRadius:6,border:"1px solid #333",background:"#222",color:"#f5c518",fontSize:12,fontWeight:700,cursor:"pointer"}}>{upl?"Uploading...":"Upload Photo"}</button>
          <div style={{fontSize:10,color:"#555",marginTop:4}}>JPG, PNG or WebP</div></div></div>
      <label style={{fontSize:11,color:"#666",fontWeight:700,display:"block",marginBottom:4}}>NAME</label><input value={n} onChange={e=>setN(e.target.value)} style={inp}/>
      <label style={{fontSize:11,color:"#666",fontWeight:700,display:"block",marginBottom:4}}>USERNAME</label><input value={u} onChange={e=>setU(e.target.value)} style={inp} placeholder="username"/>
      <label style={{fontSize:11,color:"#666",fontWeight:700,display:"block",marginBottom:4}}>BIO</label><textarea value={b} onChange={e=>setB(e.target.value)} rows={3} style={{...inp,resize:"none",fontFamily:"inherit"}} placeholder="About you..."/>
      <div style={{display:"flex",gap:8,marginTop:4}}>
        <button onClick={onClose} style={{flex:1,padding:"12px",borderRadius:6,border:"1px solid #333",background:"transparent",color:"#999",fontSize:13,fontWeight:700,cursor:"pointer"}}>Cancel</button>
        <button onClick={sv} disabled={ld} style={{flex:1,padding:"12px",borderRadius:6,border:"none",background:"#f5c518",color:"#000",fontSize:13,fontWeight:800,cursor:"pointer"}}>{ld?"Saving...":"Save Changes"}</button></div></div></div>};

/* Followers List Modal */
const FLM=({userId,type,onClose,m,setVU})=>{const[list,setList]=useState([]);const[ld,setLd]=useState(true);
  useEffect(()=>{(async()=>{setLd(true);setList(type==="followers"?await getFollowersList(userId):await getFollowingList(userId));setLd(false)})()},[userId,type]);
  return<div onClick={onClose} style={{position:"fixed",inset:0,zIndex:1800,background:"rgba(0,0,0,.9)",display:"flex",alignItems:m?"flex-end":"center",justifyContent:"center",padding:m?0:16}}>
    <div onClick={e=>e.stopPropagation()} style={{background:"#1a1a1a",width:"100%",maxWidth:m?"100%":400,maxHeight:m?"80vh":"70vh",borderRadius:m?"16px 16px 0 0":12,overflow:"auto",border:m?"none":"1px solid #2a2a2a"}}>
      {m&&<div onClick={onClose} style={{display:"flex",justifyContent:"center",padding:"10px 0 0"}}><div style={{width:32,height:3,borderRadius:2,background:"#333"}}/></div>}
      <div style={{padding:20}}><h3 style={{fontSize:18,fontWeight:900,marginBottom:16}}>{type==="followers"?"Followers":"Following"}</h3>
        {ld?<Loader/>:list.length?list.map(p=><div key={p.id} onClick={()=>{onClose();setTimeout(()=>setVU(p.id),50)}} style={{display:"flex",alignItems:"center",gap:12,padding:"10px",borderRadius:8,cursor:"pointer",marginBottom:4}}
          onMouseEnter={e=>e.currentTarget.style.background="#222"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <Av url={p.avatar_url} name={p.display_name} size={36} v={Date.now()}/><div style={{flex:1}}><div style={{fontSize:14,fontWeight:700}}>{p.display_name}</div>{p.username&&<div style={{fontSize:11,color:"#666"}}>@{p.username}</div>}</div></div>)
        :<p style={{textAlign:"center",padding:24,color:"#555"}}>No {type} yet</p>}</div></div></div>};

/* User Profile Page (IMDB style - rich) */
const UP=({viewId,onClose,me,m,onFollow,setVU})=>{
  const[p,setP]=useState(null);const[fc,setFc]=useState({followers:0,following:0});const[gs,setGs]=useState([]);const[acts,setActs]=useState([]);const[isF,setIsF]=useState(false);const[ld,setLd]=useState(true);const[flM,setFlM]=useState(null);
  useEffect(()=>{(async()=>{setLd(true);const[pr,c,g,a]=await Promise.all([lp(viewId),getFC(viewId),getUG(viewId),getUserActs(viewId)]);setP(pr);setFc(c);setGs(g);setActs(a);if(me)setIsF(await chkF(me.id,viewId));setLd(false)})()},[viewId]);
  const tog=async()=>{if(!me)return;if(isF){await unfollowU(me.id,viewId);setIsF(false);setFc(x=>({...x,followers:x.followers-1}))}else{await followU(me.id,viewId);setIsF(true);setFc(x=>({...x,followers:x.followers+1}))};onFollow?.()};
  const topGames=gs.filter(g=>g.my_rating).sort((a,b)=>b.my_rating-a.my_rating).slice(0,5);
  if(ld)return<div onClick={onClose} style={{position:"fixed",inset:0,zIndex:1500,background:"rgba(0,0,0,.9)",display:"flex",alignItems:"center",justifyContent:"center"}}><Loader/></div>;

  return<><div onClick={onClose} style={{position:"fixed",inset:0,zIndex:1500,background:"rgba(0,0,0,.9)",display:"flex",alignItems:m?"flex-end":"center",justifyContent:"center",padding:m?0:16,overflow:"auto"}}>
    <div onClick={e=>e.stopPropagation()} style={{background:"#121212",width:"100%",maxWidth:m?"100%":550,maxHeight:m?"92vh":"90vh",borderRadius:m?"16px 16px 0 0":12,overflow:"auto",border:m?"none":"1px solid #2a2a2a"}}>
      {m&&<div onClick={onClose} style={{display:"flex",justifyContent:"center",padding:"10px 0 0"}}><div style={{width:32,height:3,borderRadius:2,background:"#333"}}/></div>}
      {/* Header */}
      <div style={{padding:"24px 24px 0",display:"flex",gap:16,alignItems:m?"center":"flex-start",flexDirection:m?"column":"row"}}>
        <Av url={p?.avatar_url} name={p?.display_name} size={m?72:80} v={Date.now()}/>
        <div style={{textAlign:m?"center":"left",flex:1}}>
          <h2 style={{fontSize:22,fontWeight:900}}>{p?.display_name||"User"}</h2>
          {p?.username&&<div style={{color:"#666",fontSize:13}}>@{p.username}</div>}
          {p?.bio&&<p style={{color:"#999",fontSize:13,lineHeight:1.5,marginTop:4}}>{p.bio}</p>}
          <div style={{display:"flex",gap:16,marginTop:10,justifyContent:m?"center":"flex-start"}}>
            <div><span style={{fontWeight:900,fontSize:16}}>{gs.length}</span> <span style={{color:"#666",fontSize:12}}>games</span></div>
            <div onClick={()=>setFlM("followers")} style={{cursor:"pointer"}}><span style={{fontWeight:900,fontSize:16}}>{fc.followers}</span> <span style={{color:"#f5c518",fontSize:12}}>followers</span></div>
            <div onClick={()=>setFlM("following")} style={{cursor:"pointer"}}><span style={{fontWeight:900,fontSize:16}}>{fc.following}</span> <span style={{color:"#f5c518",fontSize:12}}>following</span></div></div>
          {me&&me.id!==viewId&&<button onClick={tog} style={{marginTop:10,padding:"8px 24px",borderRadius:6,border:isF?"1px solid #333":"none",background:isF?"transparent":"#f5c518",color:isF?"#999":"#000",fontSize:13,fontWeight:800,cursor:"pointer"}}>{isF?"Following ✓":"Follow"}</button>}
        </div></div>

      {/* Top 5 Favorites */}
      {topGames.length>0&&<div style={{padding:"20px 24px 0"}}>
        <h3 style={{fontSize:13,fontWeight:800,color:"#f5c518",marginBottom:10,borderLeft:"3px solid #f5c518",paddingLeft:8}}>TOP RATED</h3>
        <div style={{display:"flex",gap:8,overflowX:"auto"}} className="hs">{topGames.map((g,i)=>
          <div key={g.game_id} style={{minWidth:80,textAlign:"center",flexShrink:0}}>
            <div style={{position:"relative",borderRadius:6,overflow:"hidden",aspectRatio:"2/3",marginBottom:4}}>
              {g.game_img?<img src={g.game_img} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{width:"100%",height:"100%",background:"#1a1a1a"}}/>}
              <div style={{position:"absolute",top:2,left:2,background:"#f5c518",borderRadius:3,padding:"1px 5px",fontSize:10,fontWeight:900,color:"#000"}}>#{i+1}</div></div>
            <div style={{fontSize:10,fontWeight:700,lineHeight:1.2}}>{g.game_title}</div>
            <div style={{color:"#f5c518",fontSize:10,fontWeight:800}}>★ {g.my_rating}</div></div>)}</div></div>}

      {/* Recent Activity */}
      {acts.length>0&&<div style={{padding:"20px 24px 0"}}>
        <h3 style={{fontSize:13,fontWeight:800,color:"#f5c518",marginBottom:10,borderLeft:"3px solid #f5c518",paddingLeft:8}}>RECENT ACTIVITY</h3>
        {acts.slice(0,6).map(a=><div key={a.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:"1px solid #1a1a1a",fontSize:12}}>
          {a.game_img&&<img src={a.game_img} style={{width:28,height:16,borderRadius:2,objectFit:"cover"}}/>}
          <span style={{color:"#999"}}>{a.action}</span>
          {a.game_title&&<span style={{fontWeight:700,color:"#fff"}}>{a.game_title}</span>}
          {a.action==="rated"&&a.rating&&<span style={{color:"#f5c518"}}>★{a.rating}</span>}
          <span style={{marginLeft:"auto",color:"#444",fontSize:10,flexShrink:0}}>{tA(a.created_at)}</span></div>)}</div>}

      {/* Games grid */}
      {gs.length>0&&<div style={{padding:"20px 24px 24px"}}>
        <h3 style={{fontSize:13,fontWeight:800,color:"#f5c518",marginBottom:10,borderLeft:"3px solid #f5c518",paddingLeft:8}}>ALL GAMES ({gs.length})</h3>
        <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:4}} className="hs">{gs.map(g=>
          <div key={g.game_id} style={{minWidth:60,flexShrink:0}}>
            <div style={{borderRadius:4,overflow:"hidden",aspectRatio:"2/3"}}>{g.game_img?<img src={g.game_img} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{width:"100%",height:"100%",background:"#1a1a1a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>🎮</div>}</div>
            <div style={{fontSize:8,fontWeight:600,marginTop:2,lineHeight:1.2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.game_title}</div></div>)}</div></div>}

      {!m&&<div style={{padding:"0 24px 16px"}}><button onClick={onClose} style={{padding:"8px 16px",borderRadius:6,border:"1px solid #333",background:"transparent",color:"#666",fontSize:12,cursor:"pointer"}}>Close</button></div>}
    </div></div>
    {flM&&<FLM userId={viewId} type={flM} onClose={()=>setFlM(null)} m={m} setVU={setVU}/>}</>};

/* Game Detail */
const GD=({game:g,onClose,m,ud,setUd,user:me,setSa,refresh,setVU,avV})=>{
  const[det,setDet]=useState(null);const[ldg,setLdg]=useState(true);const d=ud[g.id]||{};
  const[mr,setMr]=useState(d.myRating||0);const[st,setSt]=useState(d.status||"");const[tab,setTab]=useState("about");
  const[rvs,setRvs]=useState([]);const[rt,setRt]=useState("");const[rr,setRr]=useState(0);const[posting,setPosting]=useState(false);
  useEffect(()=>{setLdg(true);fgd(g.id).then(d=>{setDet(d);setLdg(false)});loadGR(g.id).then(setRvs)},[g.id]);
  const sv=async(f,v)=>{if(!me){setSa(true);return}const nd={...d,[f]:v,title:g.t,img:g.img};if(f==="myRating"){setMr(v);await postAct(me.id,"rated",{id:g.id,title:g.t,img:g.img,rating:v})}if(f==="status"){setSt(v);await postAct(me.id,v==="completed"?"completed":v==="playing"?"started":"added to "+v,{id:g.id,title:g.t,img:g.img})}
    setUd({...ud,[g.id]:nd});await stc(me.id,g.id,nd);refresh?.()};
  const subRev=async()=>{if(!me||!rt.trim())return;setPosting(true);await postRev(me.id,g,rr,rt);setRt("");setRr(0);setRvs(await loadGR(g.id));setPosting(false);refresh?.()};

  return<div onClick={onClose} style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,.92)",display:"flex",alignItems:m?"flex-end":"center",justifyContent:"center",animation:"fadeIn .12s",padding:m?0:16}}>
    <div onClick={e=>e.stopPropagation()} style={{background:"#121212",width:"100%",maxWidth:m?"100%":660,maxHeight:m?"93vh":"88vh",borderRadius:m?"16px 16px 0 0":12,overflow:"auto",border:m?"none":"1px solid #2a2a2a"}}>
      {m&&<div onClick={onClose} style={{display:"flex",justifyContent:"center",padding:"10px 0 0"}}><div style={{width:32,height:3,borderRadius:2,background:"#333"}}/></div>}
      <div style={{position:"relative",height:m?170:220,overflow:"hidden"}}><img src={g.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,#121212 0%,transparent 100%)"}}/>
        {!m&&<button onClick={onClose} style={{position:"absolute",top:12,right:12,width:32,height:32,borderRadius:6,background:"#000c",border:"none",color:"#fff",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>}
        <div style={{position:"absolute",bottom:14,left:m?16:24}}>
          <h2 style={{fontFamily:"'Outfit'",fontSize:m?22:30,fontWeight:900}}>{g.t}</h2>
          <div style={{color:"#999",fontSize:12,marginTop:2}}>{g.y} · {g.genre}</div></div></div>
      <div style={{padding:m?"12px 16px 32px":"16px 24px 24px"}}>
        {/* Score bar */}
        <div style={{display:"flex",alignItems:"center",gap:16,padding:"14px 0",marginBottom:14,borderBottom:"1px solid #1a1a1a"}}>
          {g.r&&<div style={{display:"flex",alignItems:"center",gap:4}}><span style={{color:"#f5c518",fontSize:24,fontWeight:900}}>★</span><div><div style={{fontSize:22,fontWeight:900}}>{g.r}<span style={{fontSize:13,color:"#666"}}>/5</span></div><div style={{fontSize:9,color:"#666"}}>COMMUNITY</div></div></div>}
          {g.mc&&<div style={{padding:"6px 12px",borderRadius:6,background:g.mc>=75?"#4ade8020":"#facc1520",border:"1px solid "+(g.mc>=75?"#4ade8040":"#facc1540")}}><div style={{fontSize:18,fontWeight:900,color:g.mc>=75?"#4ade80":"#facc15"}}>{g.mc}</div><div style={{fontSize:8,color:"#666"}}>METACRITIC</div></div>}
          <div><div style={{fontSize:18,fontWeight:900,color:"#60a5fa"}}>{mr||"—"}</div><div style={{fontSize:8,color:"#666"}}>YOUR SCORE</div></div>
          <div style={{marginLeft:"auto",display:"flex",gap:3}}>{g.pf.map((p,i)=><span key={i} style={{fontSize:9,fontWeight:700,padding:"3px 6px",borderRadius:3,background:"#1a1a1a",color:p.c}}>{p.n}</span>)}</div></div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
          <div><div style={{fontSize:10,color:"#666",fontWeight:700,marginBottom:6}}>RATE THIS GAME</div><Stars rating={mr} size={m?24:28} interactive onRate={v=>sv("myRating",v)}/></div>
          <div><div style={{fontSize:10,color:"#666",fontWeight:700,marginBottom:6}}>STATUS</div>
            <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>{Object.entries(SC).map(([k,c])=><button key={k} onClick={()=>sv("status",k)} style={{padding:"4px 8px",borderRadius:4,fontSize:9,fontWeight:700,cursor:"pointer",border:"1px solid "+(st===k?c.c:"#2a2a2a"),background:st===k?c.c+"18":"#1a1a1a",color:st===k?c.c:"#666"}}>{c.l}</button>)}</div></div></div>

        <div style={{display:"flex",borderBottom:"1px solid #2a2a2a",marginBottom:14}}>
          {["about","reviews","media"].map(t=><button key={t} onClick={()=>setTab(t)} style={{padding:"10px 14px",background:"none",border:"none",fontSize:13,fontWeight:700,cursor:"pointer",color:tab===t?"#f5c518":"#555",borderBottom:tab===t?"2px solid #f5c518":"2px solid transparent",textTransform:"capitalize"}}>{t}{t==="reviews"&&rvs.length?` (${rvs.length})`:""}</button>)}</div>

        {tab==="about"&&(ldg?<Loader/>:det?.description_raw&&<p style={{color:"#999",fontSize:13,lineHeight:1.8}}>{det.description_raw.slice(0,600)}</p>)}
        {tab==="reviews"&&<div>
          {me&&<div style={{marginBottom:16,padding:14,borderRadius:8,background:"#1a1a1a",border:"1px solid #2a2a2a"}}>
            <Stars rating={rr} size={20} interactive onRate={setRr}/>
            <textarea value={rt} onChange={e=>setRt(e.target.value)} rows={3} placeholder="Write your review..." style={{width:"100%",marginTop:8,padding:"10px",borderRadius:6,border:"1px solid #333",background:"#121212",color:"#fff",fontSize:13,outline:"none",resize:"none",fontFamily:"inherit"}}/>
            <button onClick={subRev} disabled={posting||!rt.trim()} style={{marginTop:6,padding:"8px 16px",borderRadius:6,border:"none",background:rt.trim()?"#f5c518":"#222",color:rt.trim()?"#000":"#555",fontSize:12,fontWeight:800,cursor:rt.trim()?"pointer":"default"}}>{posting?"...":"Submit"}</button></div>}
          {rvs.map(r=><div key={r.id} style={{padding:12,borderRadius:8,background:"#1a1a1a",marginBottom:6,border:"1px solid #2a2a2a"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <Av url={r.profiles?.avatar_url} name={r.profiles?.display_name} size={26} onClick={()=>{onClose();setVU(r.user_id)}} v={avV}/>
              <span style={{fontSize:13,fontWeight:700,cursor:"pointer",flex:1}} onClick={()=>{onClose();setVU(r.user_id)}}>{r.profiles?.display_name}</span>
              {r.rating>0&&<Stars rating={r.rating} size={10} showNum/>}<span style={{fontSize:10,color:"#555"}}>{tA(r.created_at)}</span></div>
            <p style={{color:"#ccc",fontSize:13,lineHeight:1.7,margin:0}}>{r.text}</p></div>)}
          {!rvs.length&&<p style={{textAlign:"center",padding:24,color:"#555"}}>No reviews yet — be the first!</p>}</div>}
        {tab==="media"&&g.ss?.length>1&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>{g.ss.slice(1,7).map((s,i)=><img key={i} src={s} alt="" loading="lazy" style={{width:"100%",borderRadius:6,aspectRatio:"16/9",objectFit:"cover"}}/>)}</div>}
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

  const grid=(d,n=5)=><div style={{display:"grid",gridTemplateColumns:m?`repeat(3,1fr)`:`repeat(${n},1fr)`,gap:m?6:10}}>{d.slice(0,m?6:n).map((g,i)=><GC key={g.id} game={g} delay={i*15} onClick={setSel} mobile={m} ud={ud}/>)}</div>;
  const sec=(t,d,n)=><div style={{marginBottom:24}}><div style={{display:"flex",alignItems:"center",marginBottom:10,borderLeft:"3px solid #f5c518",paddingLeft:10}}><h3 style={{fontSize:14,fontWeight:800}}>{t}</h3></div>{grid(d,n)}</div>;

  return<div style={{fontFamily:"'DM Sans','Outfit',system-ui,sans-serif",background:"#121212",color:"#e5e5e5",minHeight:"100vh"}}>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,100..1000&family=Outfit:wght@100..900&display=swap');
      *{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:3px;height:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#333;border-radius:2px}
      @keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
      @keyframes slideFromBottom{from{transform:translateY(100%)}to{transform:translateY(0)}}@keyframes spin{to{transform:rotate(360deg)}}
      body{margin:0;overflow-x:hidden;background:#121212}img{-webkit-user-drag:none}.hs::-webkit-scrollbar{display:none}.hs{-ms-overflow-style:none;scrollbar-width:none}
      @media(max-width:767px){*{-webkit-tap-highlight-color:transparent}}input::placeholder,textarea::placeholder{color:#555}`}</style>

    {sa&&<Auth onClose={()=>setSa(false)} onAuth={u=>{setUser(u);setSa(false)}}/>}
    {ep&&<EP prof={prof} onClose={()=>setEp(false)} userId={user?.id} onDone={reloadProf}/>}
    {vU&&<UP viewId={vU} onClose={()=>setVU(null)} me={user} m={m} onFollow={rf} setVU={setVU}/>}
    {flM&&<FLM userId={user?.id} type={flM} onClose={()=>setFlM(null)} m={m} setVU={setVU}/>}

    {/* Nav */}
    {!m&&<nav style={{position:"sticky",top:0,zIndex:100,background:"#121212ee",backdropFilter:"blur(12px)",borderBottom:"1px solid #1a1a1a",padding:"0 24px",height:48,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:20}}>
        <span onClick={()=>{setPg("home");setQ("")}} style={{fontFamily:"'Outfit'",fontSize:16,fontWeight:900,cursor:"pointer",color:"#f5c518"}}>Gameboxed</span>
        <div style={{display:"flex"}}>{NAV.filter(n=>n.id!=="profile").map(n=><button key={n.id} onClick={()=>{setPg(n.id);setQ("")}} style={{padding:"6px 12px",border:"none",background:"transparent",color:pg===n.id?"#fff":"#666",cursor:"pointer",fontSize:12,fontWeight:pg===n.id?700:500,borderBottom:pg===n.id?"2px solid #f5c518":"2px solid transparent"}}>{n.l}</button>)}</div></div>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{position:"relative"}}><input placeholder="Search games, people..." value={q} onChange={e=>{setQ(e.target.value);if(e.target.value)setPg("search")}}
          style={{padding:"7px 12px 7px 30px",borderRadius:6,border:"1px solid #2a2a2a",background:"#1a1a1a",color:"#fff",fontSize:12,width:200,outline:"none"}}/>
          <span style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",fontSize:12,color:"#555"}}>🔍</span></div>
        {user?<Av url={prof?.avatar_url} name={dn} size={28} onClick={()=>setPg("profile")} v={avV}/>
          :<button onClick={()=>setSa(true)} style={{padding:"6px 16px",borderRadius:6,border:"none",background:"#f5c518",color:"#000",fontSize:12,fontWeight:800,cursor:"pointer"}}>Sign In</button>}</div></nav>}

    {m&&<div style={{position:"sticky",top:0,zIndex:100,background:"#121212ee",backdropFilter:"blur(12px)",padding:"0 12px",height:44,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid #1a1a1a"}}>
      {qO?<div style={{flex:1,display:"flex",alignItems:"center",gap:6}}>
        <input autoFocus placeholder="Search..." value={q} onChange={e=>{setQ(e.target.value);if(e.target.value)setPg("search")}}
          style={{flex:1,padding:"7px 12px",borderRadius:6,border:"1px solid #f5c51833",background:"#1a1a1a",color:"#fff",fontSize:14,outline:"none"}}/>
        <span onClick={()=>{setQO(false);setQ("");setPg("home")}} style={{color:"#f5c518",fontSize:12,fontWeight:700,cursor:"pointer"}}>✕</span></div>
      :<><span style={{fontFamily:"'Outfit'",fontSize:15,fontWeight:900,color:"#f5c518"}}>Gameboxed</span>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span onClick={()=>{setQO(true);setPg("search")}} style={{fontSize:15,cursor:"pointer",color:"#666"}}>🔍</span>
          {user?<Av url={prof?.avatar_url} name={dn} size={24} onClick={()=>setPg("profile")} v={avV}/>
            :<span onClick={()=>setSa(true)} style={{fontSize:12,color:"#f5c518",fontWeight:800,cursor:"pointer"}}>Sign In</span>}</div></>}</div>}

    <main style={{maxWidth:1100,margin:"0 auto",padding:m?"8px 10px 84px":"14px 24px 40px"}}>

      {pg==="search"&&<div style={{animation:"fadeIn .15s"}}>
        <div style={{display:"flex",borderBottom:"1px solid #1a1a1a",marginBottom:12}}>
          {[{k:"games",l:"Games",c:sr.length},{k:"people",l:"People",c:pSr.length},{k:"lists",l:"Lists",c:lSr.length}].map(t=>
            <button key={t.k} onClick={()=>setST(t.k)} style={{padding:"8px 14px",background:"none",border:"none",fontSize:13,fontWeight:700,cursor:"pointer",color:sT===t.k?"#f5c518":"#555",borderBottom:sT===t.k?"2px solid #f5c518":"2px solid transparent"}}>{t.l}{q&&!sng&&t.c>0?` ${t.c}`:""}</button>)}</div>
        {sng?<Loader/>:<>
          {sT==="games"&&(sr.length?<div style={{display:"grid",gridTemplateColumns:m?"repeat(3,1fr)":"repeat(auto-fill,minmax(130px,1fr))",gap:m?6:10}}>{sr.map((g,i)=><GC key={g.id} game={g} delay={i*12} onClick={setSel} mobile={m} ud={ud}/>)}</div>:q&&<p style={{textAlign:"center",padding:40,color:"#555"}}>No games found</p>)}
          {sT==="people"&&(pSr.length?<div style={{display:"flex",flexDirection:"column",gap:6}}>{pSr.map(p=>
            <div key={p.id} onClick={()=>setVU(p.id)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:8,background:"#1a1a1a",border:"1px solid #2a2a2a",cursor:"pointer"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor="#f5c51844"} onMouseLeave={e=>e.currentTarget.style.borderColor="#2a2a2a"}>
              <Av url={p.avatar_url} name={p.display_name} size={40} v={avV}/><div style={{flex:1}}><div style={{fontSize:14,fontWeight:700}}>{p.display_name}</div>{p.username&&<div style={{fontSize:11,color:"#666"}}>@{p.username}</div>}{p.bio&&<div style={{fontSize:11,color:"#777",marginTop:2}}>{p.bio.slice(0,60)}</div>}</div>
              <span style={{color:"#f5c518",fontSize:12}}>View →</span></div>)}</div>:q&&<p style={{textAlign:"center",padding:40,color:"#555"}}>No people found</p>)}
          {sT==="lists"&&(lSr.length?<div style={{display:"flex",flexDirection:"column",gap:6}}>{lSr.map(l=><div key={l.id} style={{padding:"12px 14px",borderRadius:8,background:"#1a1a1a",border:"1px solid #2a2a2a"}}>
            <div style={{fontSize:14,fontWeight:700}}>📝 {l.title}</div><div style={{fontSize:11,color:"#666",marginTop:3}}>{l.game_ids?.length||0} games · {l.profiles?.display_name}</div></div>)}</div>:q&&<p style={{textAlign:"center",padding:40,color:"#555"}}>No lists found</p>)}
        </>}</div>}

      {pg==="home"&&<div style={{animation:"fadeIn .2s"}}>
        {!user&&!ld&&<div style={{textAlign:"center",padding:m?"16px 0 20px":"28px 0 32px",borderBottom:"1px solid #1a1a1a",marginBottom:m?12:20}}>
          <h1 style={{fontFamily:"'Outfit'",fontSize:m?24:42,fontWeight:900,lineHeight:1.1}}>Track games you've played.</h1>
          <h1 style={{fontFamily:"'Outfit'",fontSize:m?24:42,fontWeight:900,lineHeight:1.1,color:"#2a2a2a",marginBottom:14}}>Tell your friends what's good.</h1>
          <button onClick={()=>setSa(true)} style={{padding:"12px 32px",borderRadius:6,border:"none",background:"#f5c518",color:"#000",fontSize:15,fontWeight:800,cursor:"pointer"}}>Get Started — Free</button></div>}
        {ld?<Loader/>:<div style={{display:m?"block":"grid",gridTemplateColumns:"1fr 280px",gap:20}}>
          <div>
            <Hero games={pop} onClick={setSel} m={m}/>
            {sec("Popular",pop,5)}
            {sec("New Releases",fresh,5)}
            {sec("All-Time Best",best,5)}
            <div style={{marginBottom:24}}><div style={{display:"flex",alignItems:"center",marginBottom:10,borderLeft:"3px solid #f5c518",paddingLeft:10}}><h3 style={{fontSize:14,fontWeight:800}}>Coming Soon</h3></div>
              <div style={{display:"grid",gridTemplateColumns:m?"repeat(4,1fr)":"repeat(7,1fr)",gap:m?5:8}}>{soon.slice(0,m?8:7).map((g,i)=><GC key={g.id} game={g} delay={i*12} onClick={setSel} mobile={m} ud={ud} sz="xs"/>)}</div></div>
            {sec("Action",act,5)}
            {sec("RPG",rpg,5)}
            {sec("Indie",indie,5)}
          </div>
          {!m&&<aside>
            {rRev.length>0&&<div style={{marginBottom:20}}><h4 style={{fontSize:12,fontWeight:800,color:"#f5c518",marginBottom:10}}>Recent Reviews</h4>
              {rRev.slice(0,5).map(r=><div key={r.id} style={{padding:"10px",borderRadius:6,background:"#1a1a1a",marginBottom:6,border:"1px solid #1f1f1f"}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                  <Av url={r.profiles?.avatar_url} name={r.profiles?.display_name} size={18} onClick={()=>setVU(r.user_id)} v={avV}/>
                  <span style={{fontSize:11,fontWeight:700,flex:1,cursor:"pointer"}} onClick={()=>setVU(r.user_id)}>{r.profiles?.display_name}</span>
                  {r.rating>0&&<span style={{fontSize:9,color:"#f5c518"}}>★{r.rating}</span>}<span style={{fontSize:9,color:"#444"}}>{tA(r.created_at)}</span></div>
                <div style={{fontSize:11,color:"#f5c518",fontWeight:700,marginBottom:2}}>{r.game_title}</div>
                <p style={{fontSize:11,color:"#888",lineHeight:1.4,margin:0,overflow:"hidden",textOverflow:"ellipsis",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{r.text}</p></div>)}</div>}
            <div><h4 style={{fontSize:12,fontWeight:800,color:"#f5c518",marginBottom:10}}>Activity</h4>
              {feed.slice(0,8).map(a=><div key={a.id} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 0",borderBottom:"1px solid #1a1a1a",fontSize:11}}>
                <Av url={a.profiles?.avatar_url} name={a.profiles?.display_name} size={18} onClick={()=>setVU(a.user_id)} v={avV}/>
                <div style={{flex:1,minWidth:0}}><span style={{fontWeight:700,cursor:"pointer"}} onClick={()=>setVU(a.user_id)}>{a.profiles?.display_name}</span>
                  <span style={{color:"#555"}}> {a.action} </span>{a.game_title&&<span style={{color:"#f5c518"}}>{a.game_title}</span>}</div>
                <span style={{fontSize:9,color:"#333",flexShrink:0}}>{tA(a.created_at)}</span></div>)}</div>
          </aside>}
        </div>}</div>}

      {pg==="feed"&&user&&<div style={{animation:"fadeIn .15s"}}>
        <h2 style={{fontFamily:"'Outfit'",fontSize:m?18:22,fontWeight:900,marginBottom:14}}>Activity</h2>
        {feed.length?feed.map(a=><div key={a.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:6,background:"#1a1a1a",marginBottom:4}}>
          <Av url={a.profiles?.avatar_url} name={a.profiles?.display_name} size={28} onClick={()=>setVU(a.user_id)} v={avV}/>
          {a.game_img&&<img src={a.game_img} style={{width:32,height:18,borderRadius:2,objectFit:"cover"}}/>}
          <div style={{flex:1,fontSize:12}}><span style={{fontWeight:700,cursor:"pointer"}} onClick={()=>setVU(a.user_id)}>{a.profiles?.display_name}</span>
            <span style={{color:"#555"}}> {a.action} </span>{a.game_title&&<span style={{color:"#f5c518",fontWeight:700}}>{a.game_title}</span>}</div>
          <span style={{fontSize:10,color:"#444"}}>{tA(a.created_at)}</span></div>)
        :<p style={{textAlign:"center",padding:40,color:"#555"}}>No activity yet</p>}</div>}

      {pg==="explore"&&<div style={{animation:"fadeIn .15s"}}>
        <h2 style={{fontFamily:"'Outfit'",fontSize:m?18:22,fontWeight:900,marginBottom:14}}>Explore</h2>
        {ld?<Loader/>:<>{[{t:"Highest Rated",d:best},{t:"Popular",d:pop},{t:"New Releases",d:fresh},{t:"Action",d:act},{t:"RPG",d:rpg},{t:"Indie",d:indie}].map(s=>sec(s.t,s.d,7))}</>}</div>}

      {pg==="library"&&user&&<div style={{animation:"fadeIn .15s"}}>
        <h2 style={{fontFamily:"'Outfit'",fontSize:m?18:22,fontWeight:900,marginBottom:14}}>Library</h2>
        {lib.length?<><div className="hs" style={{display:"flex",gap:4,marginBottom:12,overflowX:"auto"}}>
          {[["all","All"],["playing","Playing"],["completed","Completed"],["backlog","Backlog"],["wishlist","Wishlist"],["dropped","Dropped"]].map(([k,l])=>
            <button key={k} onClick={()=>setLf(k)} style={{padding:"5px 12px",borderRadius:4,fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",border:"1px solid "+(lf===k?"#f5c518":"#2a2a2a"),background:lf===k?"#f5c51815":"#1a1a1a",color:lf===k?"#f5c518":"#777"}}>{l} {k==="all"?lib.length:lib.filter(g=>ud[g.id]?.status===k).length}</button>)}</div>
          <div style={{display:"grid",gridTemplateColumns:m?"repeat(3,1fr)":"repeat(auto-fill,minmax(130px,1fr))",gap:m?6:10}}>{flib.map((g,i)=><GC key={g.id} game={g} delay={i*12} onClick={setSel} mobile={m} ud={ud}/>)}</div>
        </>:<p style={{textAlign:"center",padding:40,color:"#555"}}>Search and add games</p>}</div>}

      {pg==="stats"&&user&&<div style={{animation:"fadeIn .15s"}}>
        <h2 style={{fontFamily:"'Outfit'",fontSize:m?18:22,fontWeight:900,marginBottom:14}}>Stats</h2>
        {lib.length?(()=>{const bs=s=>lib.filter(g=>ud[g.id]?.status===s).length;const rt=lib.filter(g=>ud[g.id]?.myRating);const av=rt.length?(rt.reduce((s,g)=>s+ud[g.id].myRating,0)/rt.length).toFixed(1):"—";
          return<><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:m?6:10,marginBottom:20}}>
            {[{l:"Games",v:lib.length,c:"#60a5fa"},{l:"Done",v:bs("completed"),c:"#4ade80"},{l:"Playing",v:bs("playing"),c:"#c084fc"},{l:"Avg ★",v:av,c:"#f5c518"}].map((s,i)=>
              <div key={i} style={{padding:m?10:14,borderRadius:6,textAlign:"center",background:"#1a1a1a"}}>
                <div style={{fontSize:m?18:22,fontWeight:900,color:s.c}}>{s.v}</div><div style={{fontSize:10,color:"#666",marginTop:2}}>{s.l}</div></div>)}</div>
            {Object.entries(SC).map(([k,c])=>{const cn=bs(k),mx=lib.length||1;
              return<div key={k} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                <span style={{width:65,fontSize:12,color:"#777",fontWeight:600,textAlign:"right"}}>{c.l}</span>
                <div style={{flex:1,height:16,background:"#1a1a1a",borderRadius:3,overflow:"hidden"}}>
                  <div style={{height:"100%",width:cn?(cn/mx*100)+"%":"0%",background:c.c,borderRadius:3,opacity:.6,transition:"width .6s"}}></div></div>
                <span style={{fontSize:11,color:"#555",width:20}}>{cn}</span></div>})}</>
        })():<p style={{textAlign:"center",padding:40,color:"#555"}}>Add games to see stats</p>}</div>}

      {pg==="profile"&&user&&<div style={{animation:"fadeIn .15s"}}>
        <div style={{display:"flex",alignItems:m?"center":"flex-start",gap:m?14:20,marginBottom:24,flexDirection:m?"column":"row"}}>
          <Av url={prof?.avatar_url} name={dn} size={m?72:88} v={avV}/>
          <div style={{textAlign:m?"center":"left",flex:1}}>
            <h2 style={{fontFamily:"'Outfit'",fontSize:m?20:26,fontWeight:900}}>{prof?.display_name||dn}</h2>
            {prof?.username&&<div style={{color:"#666",fontSize:13,marginTop:2}}>@{prof.username}</div>}
            {prof?.bio&&<p style={{color:"#999",fontSize:13,lineHeight:1.5,marginTop:6}}>{prof.bio}</p>}
            <div style={{display:"flex",gap:16,marginTop:10,justifyContent:m?"center":"flex-start"}}>
              <div><span style={{fontWeight:900}}>{lib.length}</span> <span style={{color:"#666",fontSize:12}}>games</span></div>
              <div onClick={()=>setFlM("followers")} style={{cursor:"pointer"}}><span style={{fontWeight:900}}>{fc.followers}</span> <span style={{color:"#f5c518",fontSize:12}}>followers</span></div>
              <div onClick={()=>setFlM("following")} style={{cursor:"pointer"}}><span style={{fontWeight:900}}>{fc.following}</span> <span style={{color:"#f5c518",fontSize:12}}>following</span></div></div>
            <div style={{display:"flex",gap:6,marginTop:10,justifyContent:m?"center":"flex-start"}}>
              <button onClick={()=>setEp(true)} style={{padding:"7px 16px",borderRadius:6,border:"1px solid #2a2a2a",background:"#1a1a1a",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>Edit Profile</button>
              <button onClick={so} style={{padding:"7px 16px",borderRadius:6,border:"1px solid #2a2a2a",background:"#1a1a1a",color:"#f87171",fontSize:12,fontWeight:700,cursor:"pointer"}}>Sign Out</button></div></div></div>
        <div style={{marginBottom:20}}><h3 style={{fontSize:13,fontWeight:800,color:"#f5c518",marginBottom:10,borderLeft:"3px solid #f5c518",paddingLeft:8}}>Lists</h3>
          {myL.map(l=><div key={l.id} style={{padding:"10px 12px",borderRadius:6,background:"#1a1a1a",marginBottom:4,fontSize:13,fontWeight:700}}>📝 {l.title}</div>)}
          <div style={{display:"flex",gap:6,marginTop:6}}><input placeholder="New list..." value={nLN} onChange={e=>setNLN(e.target.value)} onKeyDown={e=>e.key==="Enter"&&hcl()}
            style={{flex:1,padding:"9px 12px",borderRadius:6,border:"1px solid #2a2a2a",background:"#1a1a1a",color:"#fff",fontSize:12,outline:"none"}}/>
            <button onClick={hcl} style={{padding:"9px 14px",borderRadius:6,border:"none",background:"#f5c518",color:"#000",fontSize:12,fontWeight:800,cursor:"pointer"}}>Create</button></div></div>
        {lib.length>0&&<><h3 style={{fontSize:13,fontWeight:800,color:"#f5c518",marginBottom:10,borderLeft:"3px solid #f5c518",paddingLeft:8}}>Games</h3>
          <div style={{display:"grid",gridTemplateColumns:m?"repeat(3,1fr)":"repeat(auto-fill,minmax(130px,1fr))",gap:m?6:10}}>{lib.map((g,i)=><GC key={g.id} game={g} delay={i*12} onClick={setSel} mobile={m} ud={ud}/>)}</div></>}
      </div>}
    </main>

    {m&&<div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:90,background:"#121212f5",backdropFilter:"blur(12px)",borderTop:"1px solid #1a1a1a",display:"flex",paddingTop:4,paddingBottom:"max(env(safe-area-inset-bottom,10px),10px)"}}>
      {NAV.map(n=><div key={n.id} onClick={()=>{setPg(n.id);setQ("");setQO(false)}} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:1,cursor:"pointer",padding:"2px 0"}}>
        <span style={{fontSize:17,opacity:pg===n.id?1:.25}}>{n.i}</span>
        <span style={{fontSize:7,fontWeight:800,color:pg===n.id?"#f5c518":"#555"}}>{n.l}</span></div>)}</div>}

    {sel&&<GD game={sel} onClose={()=>setSel(null)} m={m} ud={ud} setUd={setUd} user={user} setSa={setSa} refresh={rf} setVU={setVU} avV={avV}/>}
  </div>}
