import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

const AK="33d378268c5d452ab1f3a9cb04c89f38",AP="https://api.rawg.io/api";
const PP={1:{n:"PC",c:"#66ccff"},2:{n:"PS",c:"#4f8fdb"},3:{n:"Xbox",c:"#5dc264"},7:{n:"Switch",c:"#e85d5d"}};
const SC={completed:{c:"#4ade80",l:"Completed",e:"✓"},playing:{c:"#60a5fa",l:"Playing",e:"▶"},wishlist:{c:"#fbbf24",l:"Wishlist",e:"☆"},dropped:{c:"#f87171",l:"Dropped",e:"✕"},backlog:{c:"#a78bfa",l:"Backlog",e:"◷"}};
const SUPA_URL="https://gatarbmbvjrrbcemsdhl.supabase.co";

/* API */
const fg=async(p="")=>{try{return(await(await fetch(`${AP}/games?key=${AK}&page_size=12${p}`)).json()).results||[]}catch{return[]}};
const fgd=async id=>{try{return await(await fetch(`${AP}/games/${id}?key=${AK}`)).json()}catch{return null}};
const sga=async q=>{try{return(await(await fetch(`${AP}/games?key=${AK}&search=${encodeURIComponent(q)}&page_size=20&search_precise=true`)).json()).results||[]}catch{return[]}};
const nm=g=>({id:g.id,title:g.name,year:g.released?.slice(0,4)||"TBA",img:g.background_image||"",rating:g.rating?Math.round(g.rating*10)/10:null,metacritic:g.metacritic,reviews:g.ratings_count||0,genre:g.genres?.map(x=>x.name).slice(0,2).join(", ")||"",platforms:(g.parent_platforms||[]).map(p=>PP[p.platform.id]).filter(Boolean),screenshots:g.short_screenshots?.map(s=>s.image)||[]});

/* Supabase helpers */
const lcl=async u=>{const{data}=await supabase.from("user_games").select("*").eq("user_id",u);const l={};(data||[]).forEach(r=>{l[r.game_id]={status:r.status,myRating:r.my_rating,title:r.game_title,img:r.game_img}});return l};
const stc=async(u,g,f)=>{const{data:e}=await supabase.from("user_games").select("id").eq("user_id",u).eq("game_id",g).single();if(e)await supabase.from("user_games").update({status:f.status,my_rating:f.myRating,game_title:f.title,game_img:f.img,updated_at:new Date().toISOString()}).eq("id",e.id);else await supabase.from("user_games").insert({user_id:u,game_id:g,status:f.status,my_rating:f.myRating,game_title:f.title,game_img:f.img})};
const lp=async u=>{const{data}=await supabase.from("profiles").select("*").eq("id",u).single();return data};
const upf=async(u,f)=>await supabase.from("profiles").update(f).eq("id",u);
const searchPeople=async q=>{const{data}=await supabase.from("profiles").select("*").ilike("display_name",`%${q}%`).limit(20);return data||[]};
const searchLists=async q=>{const{data}=await supabase.from("lists").select("*,profiles(display_name,username,avatar_url)").ilike("title",`%${q}%`).eq("is_public",true).limit(20);return data||[]};
const loadLists=async u=>{const{data}=await supabase.from("lists").select("*").eq("user_id",u);return data||[]};
const createList=async(u,t)=>await supabase.from("lists").insert({user_id:u,title:t}).select().single();
const postActivity=async(uid,action,game)=>{await supabase.from("activities").insert({user_id:uid,action,game_id:game?.id,game_title:game?.title,game_img:game?.img,rating:game?.rating})};
const loadFeed=async uid=>{const{data:fo}=await supabase.from("follows").select("following_id").eq("follower_id",uid);const ids=[uid,...(fo||[]).map(f=>f.following_id)];const{data}=await supabase.from("activities").select("*,profiles(display_name,username,avatar_url)").in("user_id",ids).order("created_at",{ascending:false}).limit(30);return data||[]};
const loadAllFeed=async()=>{const{data}=await supabase.from("activities").select("*,profiles(display_name,username,avatar_url)").order("created_at",{ascending:false}).limit(30);return data||[]};
const loadGameReviews=async gid=>{const{data}=await supabase.from("reviews").select("*,profiles(display_name,username,avatar_url)").eq("game_id",gid).order("created_at",{ascending:false}).limit(20);return data||[]};
const postReview=async(uid,game,rating,text)=>{await supabase.from("reviews").insert({user_id:uid,game_id:game.id,game_title:game.title,game_img:game.img,rating,text});await postActivity(uid,"reviewed",game)};
const loadRecentReviews=async()=>{const{data}=await supabase.from("reviews").select("*,profiles(display_name,username,avatar_url)").order("created_at",{ascending:false}).limit(8);return data||[]};
const followUser=async(me,them)=>{await supabase.from("follows").insert({follower_id:me,following_id:them})};
const unfollowUser=async(me,them)=>{await supabase.from("follows").delete().eq("follower_id",me).eq("following_id",them)};
const checkFollow=async(me,them)=>{const{data}=await supabase.from("follows").select("id").eq("follower_id",me).eq("following_id",them).single();return!!data};
const getFC=async uid=>{const{count:ers}=await supabase.from("follows").select("*",{count:"exact",head:true}).eq("following_id",uid);const{count:ing}=await supabase.from("follows").select("*",{count:"exact",head:true}).eq("follower_id",uid);return{followers:ers||0,following:ing||0}};
const getUserGames=async uid=>{const{data}=await supabase.from("user_games").select("*").eq("user_id",uid);return data||[]};

/* Avatar */
const getAvatarUrl=url=>url?`${SUPA_URL}/storage/v1/object/public/avatars/${url}`:null;
const uploadAvatar=async(uid,file)=>{const ext=file.name.split(".").pop();const path=`${uid}/avatar.${ext}`;await supabase.storage.from("avatars").upload(path,file,{upsert:true});await upf(uid,{avatar_url:path});return path};

const useM=()=>{const[m,setM]=useState(window.innerWidth<768);useEffect(()=>{const h=()=>setM(window.innerWidth<768);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h)},[]);return m};
const timeAgo=d=>{const s=Math.floor((Date.now()-new Date(d))/1000);if(s<60)return"now";if(s<3600)return Math.floor(s/60)+"m";if(s<86400)return Math.floor(s/3600)+"h";return Math.floor(s/86400)+"d"};

/* ── Stars ── */
const Stars=({rating=0,size=14,interactive,onRate})=>{const[hov,setHov]=useState(0);const ac=hov||rating;
  const clk=(s,e)=>{if(!interactive||!onRate)return;const r=e.currentTarget.getBoundingClientRect();onRate(e.clientX-r.left<r.width/2?s-.5:s)};
  return<div style={{display:"flex",gap:1,alignItems:"center"}}>{[1,2,3,4,5].map(s=>{const f=s<=Math.floor(ac),h=!f&&s-.5<=ac&&s>ac-.5;
    return<span key={s} onClick={e=>clk(s,e)} onMouseEnter={()=>interactive&&setHov(s)} onMouseLeave={()=>interactive&&setHov(0)}
      style={{fontSize:size,cursor:interactive?"pointer":"default",position:"relative",lineHeight:1,color:f?"#fbbf24":h?"#fbbf24":"#2a2a2e",transition:"all .15s",transform:interactive&&s<=Math.ceil(hov)?"scale(1.15)":"scale(1)"}}>
      {h?<><span style={{position:"absolute",overflow:"hidden",width:"50%"}}>★</span><span style={{color:"#2a2a2e"}}>★</span></>:"★"}</span>})}
    {interactive&&ac>0&&<span style={{fontSize:size*.65,color:"#fbbf24",fontWeight:700,marginLeft:3}}>{ac}</span>}</div>};

const Loader=()=><div style={{display:"flex",justifyContent:"center",padding:40}}><div style={{width:28,height:28,border:"3px solid #1c1c22",borderTopColor:"#fbbf24",borderRadius:"50%",animation:"spin .8s linear infinite"}}/></div>;

/* ── Avatar component ── */
const Av=({url,name,size=32,onClick})=>{
  const src=getAvatarUrl(url);
  return<div onClick={onClick} style={{width:size,height:size,borderRadius:size/2,background:src?"#1c1c22":"linear-gradient(135deg,#fbbf24,#f59e0b)",
    display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.4,fontWeight:800,cursor:onClick?"pointer":"default",overflow:"hidden",flexShrink:0,border:"2px solid #26262e"}}>
    {src?<img src={src} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:(name||"?").charAt(0).toUpperCase()}</div>};

/* ── Game Card ── */
const GC=({game:g,onClick,delay=0,mobile:m,userData:ud,size="normal"})=>{const[hov,setHov]=useState(false);const[vis,setVis]=useState(false);const[err,setErr]=useState(false);
  useEffect(()=>{const t=setTimeout(()=>setVis(true),delay);return()=>clearTimeout(t)},[delay]);const u=ud?.[g.id];const tn=size==="tiny";
  return<div onClick={()=>onClick?.(g)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
    style={{borderRadius:tn?8:12,overflow:"hidden",cursor:"pointer",position:"relative",aspectRatio:tn?"3/4":"2/3",
      opacity:vis?1:0,transform:vis?(hov&&!m?"translateY(-4px)":"none"):"translateY(10px)",transition:"all .3s cubic-bezier(.22,1,.36,1)",
      boxShadow:hov?"0 16px 40px rgba(0,0,0,.5)":"0 2px 10px rgba(0,0,0,.2)",border:"1px solid rgba(255,255,255,.04)"}}>
    {!err&&g.img?<img src={g.img} alt={g.title} onError={()=>setErr(true)} loading="lazy"
      style={{width:"100%",height:"100%",objectFit:"cover",transition:"transform .5s",transform:hov&&!m?"scale(1.05)":"scale(1)"}}/>
      :<div style={{width:"100%",height:"100%",background:"linear-gradient(145deg,#1c1c28,#2a2a3a)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:tn?18:36,color:"#ffffff10"}}>🎮</div>}
    <div style={{position:"absolute",inset:0,background:tn?"linear-gradient(to top,rgba(12,12,16,.9) 0%,transparent 60%)":"linear-gradient(to top,rgba(12,12,16,.92) 0%,rgba(12,12,16,.1) 50%,transparent 100%)"}}/>
    {u?.status&&!tn&&<div style={{position:"absolute",top:6,left:6,padding:"2px 7px",borderRadius:10,background:"rgba(12,12,16,.7)",backdropFilter:"blur(4px)",fontSize:8,fontWeight:800,color:SC[u.status]?.c,letterSpacing:".03em"}}>{SC[u.status]?.l}</div>}
    {g.metacritic&&!tn&&<div style={{position:"absolute",top:6,right:6,padding:"2px 6px",borderRadius:6,background:"rgba(12,12,16,.7)",fontSize:9,fontWeight:900,color:g.metacritic>=75?"#4ade80":g.metacritic>=50?"#fbbf24":"#f87171"}}>{g.metacritic}</div>}
    <div style={{position:"absolute",bottom:0,left:0,right:0,padding:tn?"5px 6px":"10px"}}>
      <div style={{fontSize:tn?9:13,fontWeight:700,lineHeight:1.25,overflow:"hidden",textOverflow:"ellipsis",display:"-webkit-box",WebkitLineClamp:tn?1:2,WebkitBoxOrient:"vertical"}}>{g.title}</div>
      {!tn&&g.rating&&<div style={{display:"flex",alignItems:"center",gap:3,marginTop:3}}><Stars rating={Math.round(g.rating)} size={8}/><span style={{fontSize:9,color:"#fbbf24",fontWeight:700}}>{g.rating}</span></div>}
      {!tn&&<div style={{fontSize:8,color:"rgba(255,255,255,.3)",marginTop:2}}>{g.year}{g.genre?" · "+g.genre.split(",")[0]:""}</div>}
    </div></div>};

/* ── Wide Card ── */
const WC=({game:g,onClick,mobile:m,label})=>{const[hov,setHov]=useState(false);
  return<div onClick={()=>onClick?.(g)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
    style={{borderRadius:14,overflow:"hidden",cursor:"pointer",position:"relative",aspectRatio:m?"16/8":"21/8",transition:"all .3s",marginBottom:m?20:28,border:"1px solid rgba(255,255,255,.04)",
      boxShadow:hov?"0 20px 50px rgba(0,0,0,.5)":"0 4px 16px rgba(0,0,0,.2)"}}>
    <img src={g.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover",transition:"transform .6s",transform:hov?"scale(1.03)":"scale(1)"}}/>
    <div style={{position:"absolute",inset:0,background:"linear-gradient(115deg,rgba(12,12,16,.9) 0%,rgba(12,12,16,.4) 50%,transparent 100%)"}}/>
    <div style={{position:"absolute",bottom:m?16:24,left:m?16:28}}>
      {label&&<div style={{fontSize:10,color:"#fbbf24",fontWeight:800,letterSpacing:".12em",marginBottom:4}}>{label}</div>}
      <h3 style={{fontFamily:"'Outfit'",fontSize:m?20:32,fontWeight:900,margin:0,lineHeight:1.1}}>{g.title}</h3>
      <div style={{fontSize:m?10:13,color:"rgba(255,255,255,.35)",marginTop:4}}>{g.year} · {g.genre}{g.metacritic?" · "+g.metacritic:""}</div>
    </div></div>};

const Sec=({title,children,action,onAction})=><div style={{marginBottom:32}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
  <h3 style={{fontSize:12,fontWeight:800,color:"#666",letterSpacing:".08em",textTransform:"uppercase"}}>{title}</h3>{action&&<span onClick={onAction} style={{fontSize:11,color:"#555",cursor:"pointer",fontWeight:600}}>More →</span>}</div>{children}</div>;

/* ── Auth ── */
const Auth=({onClose,onAuth})=>{const[mode,setMode]=useState("login");const[email,setEmail]=useState("");const[pw,setPw]=useState("");const[name,setName]=useState("");const[err,setErr]=useState("");const[ld,setLd]=useState(false);const[sent,setSent]=useState(false);
  const go=async()=>{setErr("");setLd(true);try{if(mode==="signup"){const{error:e}=await supabase.auth.signUp({email,password:pw,options:{data:{display_name:name}}});if(e)throw e;setSent(true)}else{const{data,error:e}=await supabase.auth.signInWithPassword({email,password:pw});if(e)throw e;onAuth(data.user);onClose()}}catch(e){setErr(e.message)}setLd(false)};
  const i={width:"100%",padding:"13px 16px",borderRadius:12,border:"1px solid #26262e",background:"#1a1a22",color:"#fff",fontSize:14,outline:"none",marginBottom:10};
  return<div onClick={onClose} style={{position:"fixed",inset:0,zIndex:2000,background:"rgba(0,0,0,.8)",backdropFilter:"blur(20px)",display:"flex",alignItems:"center",justifyContent:"center",animation:"fadeIn .2s",padding:16}}>
    <div onClick={e=>e.stopPropagation()} style={{background:"#16161e",borderRadius:24,width:"100%",maxWidth:400,padding:"36px 32px",border:"1px solid #26262e",animation:"slideUp .3s cubic-bezier(.22,1,.36,1)"}}>
      {sent?<div style={{textAlign:"center"}}><div style={{fontSize:48,marginBottom:16}}>📧</div><h2 style={{fontSize:22,fontWeight:900,marginBottom:8}}>Check your email</h2><p style={{color:"#888",fontSize:14}}>Confirmation link sent to <span style={{color:"#fbbf24"}}>{email}</span></p>
        <button onClick={onClose} style={{marginTop:24,padding:"12px 28px",borderRadius:12,border:"none",background:"#fbbf24",color:"#000",fontSize:14,fontWeight:800,cursor:"pointer"}}>Done</button></div>
      :<><div style={{textAlign:"center",marginBottom:28}}><h2 style={{fontFamily:"'Outfit'",fontSize:26,fontWeight:900}}>{mode==="login"?"Welcome back":"Join Gameboxed"}</h2><p style={{color:"#555",fontSize:13,marginTop:6}}>{mode==="login"?"Sign in to your account":"Create your gaming profile"}</p></div>
        {err&&<div style={{padding:"12px 14px",borderRadius:10,background:"#f8717112",border:"1px solid #f8717125",color:"#f87171",fontSize:13,marginBottom:14}}>{err}</div>}
        {mode==="signup"&&<input placeholder="Display name" value={name} onChange={e=>setName(e.target.value)} style={i}/>}
        <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={i}/>
        <input type="password" placeholder="Password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()} style={i}/>
        <button onClick={go} disabled={ld} style={{width:"100%",padding:"13px",borderRadius:12,border:"none",marginTop:6,background:ld?"#333":"#fbbf24",color:"#000",fontSize:15,fontWeight:800,cursor:ld?"default":"pointer",transition:"all .2s"}}>{ld?"...":mode==="login"?"Sign In":"Create Account"}</button>
        <div style={{textAlign:"center",marginTop:18,fontSize:13,color:"#555"}}>{mode==="login"?"New here? ":"Already joined? "}<span onClick={()=>{setMode(mode==="login"?"signup":"login");setErr("")}} style={{color:"#fbbf24",cursor:"pointer",fontWeight:700}}>{mode==="login"?"Create account":"Sign in"}</span></div></>}</div></div>};

/* ── Edit Profile ── */
const EP=({profile:p,onClose,onSave,userId})=>{const[n,setN]=useState(p?.display_name||"");const[u,setU]=useState(p?.username||"");const[b,setB]=useState(p?.bio||"");const[ld,setLd]=useState(false);const[uploading,setUploading]=useState(false);const fileRef=useRef();
  const s=async()=>{setLd(true);await onSave({display_name:n,username:u.toLowerCase().replace(/[^a-z0-9_]/g,""),bio:b});setLd(false);onClose()};
  const handleFile=async e=>{const file=e.target.files[0];if(!file)return;setUploading(true);try{const path=await uploadAvatar(userId,file);await onSave({avatar_url:path})}catch(e){console.error(e)}setUploading(false)};
  const i={width:"100%",padding:"12px 14px",borderRadius:10,border:"1px solid #26262e",background:"#1a1a22",color:"#fff",fontSize:14,outline:"none",marginBottom:14};
  return<div onClick={onClose} style={{position:"fixed",inset:0,zIndex:2000,background:"rgba(0,0,0,.8)",backdropFilter:"blur(20px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
    <div onClick={e=>e.stopPropagation()} style={{background:"#16161e",borderRadius:24,width:"100%",maxWidth:400,padding:"32px 28px",border:"1px solid #26262e"}}>
      <h2 style={{fontSize:22,fontWeight:900,marginBottom:20}}>Edit Profile</h2>
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20}}>
        <Av url={p?.avatar_url} name={n} size={56}/>
        <div><input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{display:"none"}}/>
          <button onClick={()=>fileRef.current?.click()} style={{padding:"7px 14px",borderRadius:8,border:"1px solid #26262e",background:"transparent",color:"#fbbf24",fontSize:12,fontWeight:700,cursor:"pointer"}}>{uploading?"Uploading...":"Change Photo"}</button></div></div>
      <label style={{fontSize:11,color:"#555",fontWeight:700,letterSpacing:".06em",display:"block",marginBottom:4}}>NAME</label><input value={n} onChange={e=>setN(e.target.value)} style={i}/>
      <label style={{fontSize:11,color:"#555",fontWeight:700,letterSpacing:".06em",display:"block",marginBottom:4}}>USERNAME</label><input value={u} onChange={e=>setU(e.target.value)} style={i} placeholder="username"/>
      <label style={{fontSize:11,color:"#555",fontWeight:700,letterSpacing:".06em",display:"block",marginBottom:4}}>BIO</label><textarea value={b} onChange={e=>setB(e.target.value)} rows={3} style={{...i,resize:"none",fontFamily:"inherit"}} placeholder="About you..."/>
      <div style={{display:"flex",gap:10,marginTop:6}}><button onClick={onClose} style={{flex:1,padding:"12px",borderRadius:12,border:"1px solid #26262e",background:"transparent",color:"#888",fontSize:13,fontWeight:700,cursor:"pointer"}}>Cancel</button>
        <button onClick={s} disabled={ld} style={{flex:1,padding:"12px",borderRadius:12,border:"none",background:"#fbbf24",color:"#000",fontSize:13,fontWeight:800,cursor:"pointer"}}>{ld?"...":"Save"}</button></div></div></div>};

/* ── User Profile Page ── */
const UserProfile=({userId:viewId,onClose,currentUser,mobile:m,onFollow})=>{
  const[prof,setProf]=useState(null);const[fc,setFc]=useState({followers:0,following:0});const[games,setGames]=useState([]);const[isFol,setIsFol]=useState(false);const[ld,setLd]=useState(true);
  useEffect(()=>{(async()=>{setLd(true);const[p,c,g]=await Promise.all([lp(viewId),getFC(viewId),getUserGames(viewId)]);setProf(p);setFc(c);setGames(g);
    if(currentUser)setIsFol(await checkFollow(currentUser.id,viewId));setLd(false)})()},[viewId]);
  const toggle=async()=>{if(!currentUser)return;if(isFol){await unfollowUser(currentUser.id,viewId);setIsFol(false);setFc(p=>({...p,followers:p.followers-1}))}else{await followUser(currentUser.id,viewId);setIsFol(true);setFc(p=>({...p,followers:p.followers+1}))};onFollow?.()};
  if(ld)return<div onClick={onClose} style={{position:"fixed",inset:0,zIndex:1500,background:"rgba(0,0,0,.85)",display:"flex",alignItems:"center",justifyContent:"center"}}><Loader/></div>;
  const isMe=currentUser?.id===viewId;
  return<div onClick={onClose} style={{position:"fixed",inset:0,zIndex:1500,background:"rgba(0,0,0,.85)",backdropFilter:"blur(20px)",display:"flex",alignItems:m?"flex-end":"center",justifyContent:"center",animation:"fadeIn .2s",padding:m?0:16}}>
    <div onClick={e=>e.stopPropagation()} style={{background:"#12121a",width:"100%",maxWidth:m?"100%":500,maxHeight:m?"90vh":"80vh",borderRadius:m?"24px 24px 0 0":24,overflow:"auto",border:m?"none":"1px solid #26262e",animation:m?"slideFromBottom .3s cubic-bezier(.22,1,.36,1)":"slideUp .3s cubic-bezier(.22,1,.36,1)"}}>
      {m&&<div onClick={onClose} style={{display:"flex",justifyContent:"center",padding:"10px 0 0"}}><div style={{width:36,height:4,borderRadius:2,background:"rgba(255,255,255,.12)"}}/></div>}
      <div style={{padding:"24px 24px 28px",textAlign:"center"}}>
        <Av url={prof?.avatar_url} name={prof?.display_name} size={80}/>
        <h2 style={{fontSize:22,fontWeight:900,marginTop:12}}>{prof?.display_name||"User"}</h2>
        {prof?.username&&<div style={{color:"#555",fontSize:13,marginTop:2}}>@{prof.username}</div>}
        {prof?.bio&&<p style={{color:"#888",fontSize:13,lineHeight:1.5,marginTop:8,maxWidth:300,margin:"8px auto 0"}}>{prof.bio}</p>}
        <div style={{display:"flex",gap:24,justifyContent:"center",marginTop:16}}>
          {[{v:games.length,l:"Games"},{v:games.filter(g=>g.status==="completed").length,l:"Completed"},{v:fc.followers,l:"Followers"},{v:fc.following,l:"Following"}].map((s,i)=>
            <div key={i}><div style={{fontSize:18,fontWeight:900}}>{s.v}</div><div style={{fontSize:10,color:"#555"}}>{s.l}</div></div>)}</div>
        {!isMe&&currentUser&&<button onClick={toggle} style={{marginTop:16,padding:"8px 28px",borderRadius:10,border:isFol?"1px solid #26262e":"none",background:isFol?"transparent":"#fbbf24",color:isFol?"#888":"#000",fontSize:13,fontWeight:800,cursor:"pointer"}}>{isFol?"Following":"Follow"}</button>}
        {!m&&<button onClick={onClose} style={{marginTop:12,padding:"8px 20px",borderRadius:8,border:"1px solid #26262e",background:"transparent",color:"#555",fontSize:12,fontWeight:600,cursor:"pointer"}}>Close</button>}
      </div></div></div>};

/* ── Game Detail ── */
const GD=({game:g,onClose,mobile:m,userData:ud,setUserData,user,setShowAuth,refreshFeed})=>{
  const[det,setDet]=useState(null);const[ldg,setLdg]=useState(true);const d=ud[g.id]||{};
  const[mr,setMr]=useState(d.myRating||0);const[st,setSt]=useState(d.status||"");const[tab,setTab]=useState("about");
  const[revs,setRevs]=useState([]);const[revText,setRevText]=useState("");const[revR,setRevR]=useState(0);const[posting,setPosting]=useState(false);
  useEffect(()=>{setLdg(true);fgd(g.id).then(d=>{setDet(d);setLdg(false)});loadGameReviews(g.id).then(setRevs)},[g.id]);
  const sv=async(f,v)=>{if(!user){setShowAuth(true);return}const nd={...d,[f]:v,title:g.title,img:g.img};if(f==="myRating"){setMr(v);await postActivity(user.id,"rated",{...g,rating:v})}if(f==="status"){setSt(v);await postActivity(user.id,v==="completed"?"completed":v==="playing"?"started playing":"added to "+v,g)}
    const nu={...ud,[g.id]:nd};setUserData(nu);await stc(user.id,g.id,nd);refreshFeed?.()};
  const submitRev=async()=>{if(!user||!revText.trim())return;setPosting(true);await postReview(user.id,g,revR,revText);setRevText("");setRevR(0);setRevs(await loadGameReviews(g.id));setPosting(false);refreshFeed?.()};

  return<div onClick={onClose} style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,.88)",backdropFilter:"blur(20px)",display:"flex",alignItems:m?"flex-end":"center",justifyContent:"center",animation:"fadeIn .2s",padding:m?0:16}}>
    <div onClick={e=>e.stopPropagation()} style={{background:"#12121a",width:"100%",maxWidth:m?"100%":660,maxHeight:m?"92vh":"88vh",borderRadius:m?"24px 24px 0 0":24,overflow:"auto",border:m?"none":"1px solid #26262e",animation:m?"slideFromBottom .3s cubic-bezier(.22,1,.36,1)":"slideUp .3s cubic-bezier(.22,1,.36,1)"}}>
      {m&&<div onClick={onClose} style={{display:"flex",justifyContent:"center",padding:"10px 0 0"}}><div style={{width:36,height:4,borderRadius:2,background:"rgba(255,255,255,.12)"}}/></div>}
      <div style={{position:"relative",height:m?170:210,overflow:"hidden"}}>
        <img src={g.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,#12121a 0%,rgba(18,18,26,.3) 100%)"}}/>
        {!m&&<button onClick={onClose} style={{position:"absolute",top:14,right:14,width:36,height:36,borderRadius:18,background:"rgba(0,0,0,.4)",border:"none",color:"#fff",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>}
        <div style={{position:"absolute",bottom:14,left:m?16:24,right:m?16:24}}>
          <h2 style={{fontFamily:"'Outfit'",fontSize:m?22:28,fontWeight:900,margin:0}}>{g.title}</h2>
          <div style={{color:"rgba(255,255,255,.35)",fontSize:12,marginTop:3}}>{g.year} · {g.genre}</div></div></div>
      <div style={{padding:m?"14px 16px 32px":"20px 24px 28px"}}>
        {/* Scores */}
        <div style={{display:"flex",gap:20,marginBottom:18,padding:"14px 0",borderBottom:"1px solid #1e1e28"}}>
          {g.rating&&<div><div style={{fontSize:10,color:"#555",fontWeight:700}}>COMMUNITY</div><div style={{fontSize:22,fontWeight:900,color:"#fbbf24"}}>{g.rating}</div></div>}
          {g.metacritic&&<div><div style={{fontSize:10,color:"#555",fontWeight:700}}>METACRITIC</div><div style={{fontSize:22,fontWeight:900,color:g.metacritic>=75?"#4ade80":"#fbbf24"}}>{g.metacritic}</div></div>}
          <div><div style={{fontSize:10,color:"#555",fontWeight:700}}>YOUR SCORE</div><div style={{fontSize:22,fontWeight:900,color:"#60a5fa"}}>{mr||"—"}</div></div>
          <div style={{marginLeft:"auto",display:"flex",gap:4,alignItems:"center"}}>{g.platforms.map((p,i)=><span key={i} style={{fontSize:9,fontWeight:700,padding:"3px 7px",borderRadius:6,background:"#1e1e28",color:p.c}}>{p.n}</span>)}</div>
        </div>

        {/* Rate + Status */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:18}}>
          <div><div style={{fontSize:10,color:"#555",fontWeight:700,marginBottom:8,letterSpacing:".06em"}}>YOUR RATING</div><Stars rating={mr} size={m?22:26} interactive onRate={v=>sv("myRating",v)}/></div>
          <div><div style={{fontSize:10,color:"#555",fontWeight:700,marginBottom:8,letterSpacing:".06em"}}>STATUS</div>
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{Object.entries(SC).map(([k,c])=><button key={k} onClick={()=>sv("status",k)} style={{padding:"5px 10px",borderRadius:10,fontSize:10,fontWeight:700,cursor:"pointer",border:st===k?"1px solid "+c.c:"1px solid #1e1e28",background:st===k?c.c+"15":"#1a1a22",color:st===k?c.c:"#666",transition:"all .2s"}}>{c.l}</button>)}</div></div>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",borderBottom:"1px solid #1e1e28",marginBottom:16}}>
          {["about","reviews","media"].map(t=><button key={t} onClick={()=>setTab(t)} style={{padding:"10px 16px",background:"none",border:"none",fontSize:12,fontWeight:700,cursor:"pointer",color:tab===t?"#fbbf24":"#555",borderBottom:tab===t?"2px solid #fbbf24":"2px solid transparent",textTransform:"capitalize",transition:"all .2s"}}>{t}{t==="reviews"&&revs.length>0?` (${revs.length})`:""}</button>)}</div>

        {tab==="about"&&(ldg?<Loader/>:det?.description_raw&&<p style={{color:"#999",fontSize:13,lineHeight:1.8,maxHeight:180,overflow:"hidden",WebkitMaskImage:"linear-gradient(to bottom,black 75%,transparent)"}}>{det.description_raw.slice(0,600)}</p>)}

        {tab==="reviews"&&<div>
          {user&&<div style={{marginBottom:18,padding:16,borderRadius:14,background:"#1a1a22",border:"1px solid #1e1e28"}}>
            <div style={{fontSize:10,color:"#555",fontWeight:700,marginBottom:8}}>WRITE A REVIEW</div>
            <Stars rating={revR} size={20} interactive onRate={setRevR}/>
            <textarea value={revText} onChange={e=>setRevText(e.target.value)} rows={3} placeholder="Share your thoughts..." style={{width:"100%",marginTop:10,padding:"12px 14px",borderRadius:10,border:"1px solid #26262e",background:"#16161e",color:"#fff",fontSize:13,outline:"none",resize:"none",fontFamily:"inherit"}}/>
            <button onClick={submitRev} disabled={posting||!revText.trim()} style={{marginTop:8,padding:"9px 18px",borderRadius:10,border:"none",background:revText.trim()?"#fbbf24":"#1e1e28",color:revText.trim()?"#000":"#555",fontSize:12,fontWeight:800,cursor:revText.trim()?"pointer":"default"}}>{posting?"Posting...":"Post"}</button>
          </div>}
          {revs.length>0?revs.map(r=><div key={r.id} style={{padding:14,borderRadius:12,background:"#1a1a22",border:"1px solid #1e1e28",marginBottom:8}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <Av url={r.profiles?.avatar_url} name={r.profiles?.display_name} size={28}/>
              <div><div style={{fontSize:12,fontWeight:700}}>{r.profiles?.display_name||"User"}</div>{r.profiles?.username&&<div style={{fontSize:9,color:"#555"}}>@{r.profiles.username}</div>}</div>
              {r.rating>0&&<div style={{marginLeft:"auto"}}><Stars rating={r.rating} size={9}/></div>}
              <span style={{fontSize:10,color:"#444"}}>{timeAgo(r.created_at)}</span></div>
            <p style={{color:"#aaa",fontSize:13,lineHeight:1.6,margin:0}}>{r.text}</p></div>)
          :<div style={{textAlign:"center",padding:30,color:"#555",fontSize:13}}>No reviews yet</div>}
        </div>}

        {tab==="media"&&g.screenshots?.length>1&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{g.screenshots.slice(1,7).map((s,i)=><img key={i} src={s} alt="" loading="lazy" style={{width:"100%",borderRadius:10,aspectRatio:"16/9",objectFit:"cover"}}/>)}</div>}
      </div></div></div>};

/* ═══ MAIN ═══ */
export default function App(){
  const m=useM();const[pg,setPg]=useState("home");const[sel,setSel]=useState(null);const[q,setQ]=useState("");const[qOpen,setQOpen]=useState(false);
  const[ud,setUd]=useState({});const[user,setUser]=useState(null);const[prof,setProf]=useState(null);const[fc,setFc]=useState({followers:0,following:0});
  const[sa,setSa]=useState(false);const[ep,setEp]=useState(false);const[viewUserId,setViewUserId]=useState(null);
  const[popular,setPopular]=useState([]);const[best,setBest]=useState([]);const[fresh,setFresh]=useState([]);const[soon,setSoon]=useState([]);const[action,setAction]=useState([]);const[rpg,setRpg]=useState([]);
  const[sr,setSr]=useState([]);const[peopleSr,setPeopleSr]=useState([]);const[listsSr,setListsSr]=useState([]);
  const[ld,setLd]=useState(true);const[sng,setSng]=useState(false);const[lf,setLf]=useState("all");const[sTab,setSTab]=useState("games");
  const[myLists,setMyLists]=useState([]);const[newLN,setNewLN]=useState("");
  const[feed,setFeed]=useState([]);const[recentRevs,setRecentRevs]=useState([]);
  const stt=useRef(null);

  const refreshFeed=()=>{if(user)loadFeed(user.id).then(setFeed);else loadAllFeed().then(setFeed);loadRecentReviews().then(setRecentRevs)};

  useEffect(()=>{supabase.auth.getSession().then(({data:{session}})=>{const u=session?.user||null;setUser(u);if(u){lcl(u.id).then(setUd);lp(u.id).then(setProf);loadLists(u.id).then(setMyLists);loadFeed(u.id).then(setFeed);getFC(u.id).then(setFc)}else loadAllFeed().then(setFeed)});
    loadRecentReviews().then(setRecentRevs);
    const{data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>{const u=session?.user||null;setUser(u);if(u){lcl(u.id).then(setUd);lp(u.id).then(setProf);loadLists(u.id).then(setMyLists);loadFeed(u.id).then(setFeed);getFC(u.id).then(setFc)}else{setUd({});setProf(null);loadAllFeed().then(setFeed)}});return()=>subscription.unsubscribe()},[]);

  useEffect(()=>{setLd(true);const td=new Date().toISOString().slice(0,10),ly=new Date(Date.now()-365*864e5).toISOString().slice(0,10),ny=new Date(Date.now()+365*864e5).toISOString().slice(0,10);
    Promise.all([fg(`&dates=${ly},${td}&ordering=-rating&metacritic=70,100`),fg(`&ordering=-metacritic&metacritic=85,100`),fg(`&dates=${ly},${td}&ordering=-released`),fg(`&dates=${td},${ny}&ordering=-added`),
      fg(`&genres=action&ordering=-rating&metacritic=75,100&page_size=8`),fg(`&genres=role-playing-games-rpg&ordering=-rating&metacritic=75,100&page_size=8`)
    ]).then(([p,b,n,u,a,r])=>{setPopular(p.map(nm));setBest(b.map(nm));setFresh(n.map(nm));setSoon(u.map(nm));setAction(a.map(nm));setRpg(r.map(nm));setLd(false)})},[]);

  useEffect(()=>{if(stt.current)clearTimeout(stt.current);if(!q.trim()){setSr([]);setPeopleSr([]);setListsSr([]);return}setSng(true);
    stt.current=setTimeout(async()=>{const[g,p,l]=await Promise.all([sga(q),searchPeople(q),searchLists(q)]);setSr(g.map(nm));setPeopleSr(p);setListsSr(l);setSng(false)},400)},[q]);

  const all=[...popular,...best,...fresh,...soon,...action,...rpg,...sr];
  const lib=Object.entries(ud).filter(([_,v])=>v.status).map(([id,v])=>{const f=all.find(g=>g.id===parseInt(id));return f||{id:parseInt(id),title:v.title||"?",img:v.img||"",year:"",genre:"",rating:null,platforms:[]}});
  const flib=lf==="all"?lib:lib.filter(g=>ud[g.id]?.status===lf);
  const so=async()=>{await supabase.auth.signOut();setUser(null);setUd({});setProf(null);setPg("home")};
  const dn=prof?.display_name||user?.user_metadata?.display_name||"";const ini=(dn||"?").charAt(0).toUpperCase();
  const sP=async f=>{await upf(user.id,f);setProf({...prof,...f})};
  const hcl=async()=>{if(!newLN.trim()||!user)return;const{data}=await createList(user.id,newLN);if(data)setMyLists([...myLists,data]);setNewLN("")};
  const NAV=user?[{id:"home",i:"🏠",l:"Home"},{id:"explore",i:"🔍",l:"Explore"},{id:"feed",i:"⚡",l:"Activity"},{id:"library",i:"📚",l:"Library"},{id:"profile",i:"👤",l:"Profile"}]:[{id:"home",i:"🏠",l:"Home"},{id:"explore",i:"🔍",l:"Explore"}];

  return<div style={{fontFamily:"'DM Sans','Outfit',system-ui,sans-serif",background:"#0c0c12",color:"#eee",minHeight:"100vh"}}>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,100..1000&family=Outfit:wght@100..900&display=swap');
      *{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#2a2a32;border-radius:3px}
      @keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
      @keyframes slideFromBottom{from{transform:translateY(100%)}to{transform:translateY(0)}}@keyframes spin{to{transform:rotate(360deg)}}
      body{background:#0c0c12;overflow-x:hidden}img{-webkit-user-drag:none}.hs::-webkit-scrollbar{display:none}.hs{-ms-overflow-style:none;scrollbar-width:none}
      @media(max-width:767px){*{-webkit-tap-highlight-color:transparent}}
      input::placeholder,textarea::placeholder{color:#444}`}</style>

    {sa&&<Auth onClose={()=>setSa(false)} onAuth={u=>{setUser(u);setSa(false)}}/>}
    {ep&&<EP profile={prof} onClose={()=>setEp(false)} onSave={sP} userId={user?.id}/>}
    {viewUserId&&<UserProfile userId={viewUserId} onClose={()=>setViewUserId(null)} currentUser={user} mobile={m} onFollow={refreshFeed}/>}

    {/* NAV Desktop */}
    {!m&&<nav style={{position:"sticky",top:0,zIndex:100,background:"rgba(12,12,18,.88)",backdropFilter:"blur(20px)",borderBottom:"1px solid #1e1e28",padding:"0 32px",height:52,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:32}}>
        <span onClick={()=>{setPg("home");setQ("")}} style={{fontFamily:"'Outfit'",fontSize:16,fontWeight:900,letterSpacing:".06em",cursor:"pointer",color:"#fbbf24"}}>GAMEBOXED</span>
        <div style={{display:"flex",gap:2}}>{NAV.filter(n=>n.id!=="profile").map(n=><button key={n.id} onClick={()=>{setPg(n.id);setQ("")}} style={{padding:"7px 14px",borderRadius:8,border:"none",background:pg===n.id?"#1e1e28":"transparent",color:pg===n.id?"#fff":"#666",cursor:"pointer",fontSize:12,fontWeight:700,transition:"all .2s"}}>{n.l}</button>)}</div></div>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{position:"relative"}}><input placeholder="Search..." value={q} onChange={e=>{setQ(e.target.value);if(e.target.value)setPg("search")}}
          style={{padding:"8px 14px 8px 34px",borderRadius:10,border:"1px solid #1e1e28",background:"#16161e",color:"#fff",fontSize:12,width:200,outline:"none",transition:"all .3s"}}
          onFocus={e=>e.target.style.borderColor="#fbbf2444"} onBlur={e=>e.target.style.borderColor="#1e1e28"}/>
          <span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",fontSize:13,color:"#444"}}>🔍</span></div>
        {user?<Av url={prof?.avatar_url} name={dn} size={30} onClick={()=>setPg("profile")}/>
          :<button onClick={()=>setSa(true)} style={{padding:"7px 18px",borderRadius:10,border:"none",background:"#fbbf24",color:"#000",fontSize:12,fontWeight:800,cursor:"pointer"}}>Sign In</button>}</div></nav>}

    {/* NAV Mobile */}
    {m&&<div style={{position:"sticky",top:0,zIndex:100,background:"rgba(12,12,18,.92)",backdropFilter:"blur(20px)",padding:"0 14px",height:48,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid #1e1e28"}}>
      {qOpen?<div style={{flex:1,display:"flex",alignItems:"center",gap:8}}>
        <input autoFocus placeholder="Search..." value={q} onChange={e=>{setQ(e.target.value);if(e.target.value)setPg("search")}}
          style={{flex:1,padding:"8px 14px",borderRadius:10,border:"1px solid #fbbf2433",background:"#16161e",color:"#fff",fontSize:14,outline:"none"}}/>
        <span onClick={()=>{setQOpen(false);setQ("");setPg("home")}} style={{color:"#fbbf24",fontSize:12,fontWeight:700,cursor:"pointer"}}>Cancel</span></div>
      :<><span style={{fontFamily:"'Outfit'",fontSize:15,fontWeight:900,letterSpacing:".06em",color:"#fbbf24"}}>GAMEBOXED</span>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span onClick={()=>{setQOpen(true);setPg("search")}} style={{fontSize:16,cursor:"pointer"}}>🔍</span>
          {user?<Av url={prof?.avatar_url} name={dn} size={26} onClick={()=>setPg("profile")}/>
            :<button onClick={()=>setSa(true)} style={{padding:"5px 14px",borderRadius:8,border:"none",background:"#fbbf24",color:"#000",fontSize:10,fontWeight:800,cursor:"pointer"}}>Sign In</button>}</div></>}</div>}

    <main style={{maxWidth:1100,margin:"0 auto",padding:m?"10px 12px 90px":"20px 28px 50px"}}>

      {/* SEARCH */}
      {pg==="search"&&<div style={{animation:"fadeIn .3s",paddingTop:8}}>
        <div style={{display:"flex",borderBottom:"1px solid #1e1e28",marginBottom:16}}>
          {[{k:"games",l:"Games",c:sr.length},{k:"people",l:"People",c:peopleSr.length},{k:"lists",l:"Lists",c:listsSr.length}].map(t=>
            <button key={t.k} onClick={()=>setSTab(t.k)} style={{padding:"10px 18px",background:"none",border:"none",fontSize:13,fontWeight:700,cursor:"pointer",color:sTab===t.k?"#fbbf24":"#555",borderBottom:sTab===t.k?"2px solid #fbbf24":"2px solid transparent"}}>{t.l}{q&&!sng&&t.c>0&&<span style={{marginLeft:4,fontSize:10,color:"#555"}}>{t.c}</span>}</button>)}</div>
        {sng?<Loader/>:<>
          {sTab==="games"&&(sr.length>0?<div style={{display:"grid",gridTemplateColumns:m?"repeat(3,1fr)":"repeat(auto-fill,minmax(150px,1fr))",gap:m?8:12}}>{sr.map((g,i)=><GC key={g.id} game={g} delay={i*20} onClick={setSel} mobile={m} userData={ud}/>)}</div>:q&&<div style={{textAlign:"center",padding:50,color:"#555"}}>No games</div>)}
          {sTab==="people"&&(peopleSr.length>0?<div style={{display:"flex",flexDirection:"column",gap:8}}>{peopleSr.map(p=>
            <div key={p.id} onClick={()=>setViewUserId(p.id)} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",borderRadius:14,background:"#16161e",border:"1px solid #1e1e28",cursor:"pointer",transition:"all .2s"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor="#fbbf2433"} onMouseLeave={e=>e.currentTarget.style.borderColor="#1e1e28"}>
              <Av url={p.avatar_url} name={p.display_name} size={44}/>
              <div style={{flex:1}}><div style={{fontSize:15,fontWeight:700}}>{p.display_name||"User"}</div>{p.username&&<div style={{fontSize:12,color:"#555"}}>@{p.username}</div>}
                {p.bio&&<div style={{fontSize:11,color:"#666",marginTop:2}}>{p.bio.slice(0,80)}</div>}</div>
              <span style={{fontSize:11,color:"#444"}}>View →</span></div>)}</div>
          :q&&<div style={{textAlign:"center",padding:50,color:"#555"}}>No people found</div>)}
          {sTab==="lists"&&(listsSr.length>0?<div style={{display:"flex",flexDirection:"column",gap:8}}>{listsSr.map(l=><div key={l.id} style={{padding:"14px 16px",borderRadius:14,background:"#16161e",border:"1px solid #1e1e28"}}>
            <div style={{fontSize:15,fontWeight:700}}>📝 {l.title}</div>{l.description&&<div style={{fontSize:12,color:"#666",marginTop:2}}>{l.description}</div>}
            <div style={{fontSize:11,color:"#555",marginTop:4}}>{l.game_ids?.length||0} games · {l.profiles?.display_name||"Unknown"}</div></div>)}</div>
          :q&&<div style={{textAlign:"center",padding:50,color:"#555"}}>No lists</div>)}
        </>}</div>}

      {/* HOME */}
      {pg==="home"&&<div style={{animation:"fadeIn .4s"}}>
        {!user&&!ld&&<div style={{textAlign:"center",padding:m?"24px 0":"36px 0",borderBottom:"1px solid #1e1e28",marginBottom:m?24:32}}>
          <h1 style={{fontFamily:"'Outfit'",fontSize:m?24:38,fontWeight:900,lineHeight:1.15,marginBottom:8}}>Track games you've played.</h1>
          <h1 style={{fontFamily:"'Outfit'",fontSize:m?24:38,fontWeight:900,lineHeight:1.15,color:"#333",marginBottom:16}}>Tell your friends what's good.</h1>
          <button onClick={()=>setSa(true)} style={{padding:"12px 32px",borderRadius:12,border:"none",background:"#fbbf24",color:"#000",fontSize:14,fontWeight:800,cursor:"pointer",transition:"all .2s"}}>Get Started — Free</button></div>}
        {ld?<Loader/>:<>
          {popular[0]&&<WC game={popular[0]} onClick={setSel} mobile={m} label="TRENDING"/>}
          <Sec title="Popular this week" action="More →" onAction={()=>setPg("explore")}><div style={{display:"grid",gridTemplateColumns:m?"repeat(3,1fr)":"repeat(6,1fr)",gap:m?8:12}}>{popular.slice(1,7).map((g,i)=><GC key={g.id} game={g} delay={i*30} onClick={setSel} mobile={m} userData={ud}/>)}</div></Sec>

          {/* Community Reviews */}
          {recentRevs.length>0&&<Sec title="Community reviews">
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {recentRevs.slice(0,m?3:4).map(r=><div key={r.id} style={{display:"flex",gap:12,padding:"12px 14px",borderRadius:14,background:"#16161e",border:"1px solid #1e1e28"}}>
                {r.game_img&&<img src={r.game_img} alt="" style={{width:48,height:64,borderRadius:8,objectFit:"cover",flexShrink:0,cursor:"pointer"}}/>}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                    <Av url={r.profiles?.avatar_url} name={r.profiles?.display_name} size={22} onClick={()=>setViewUserId(r.user_id)}/>
                    <span style={{fontSize:12,fontWeight:700,cursor:"pointer"}} onClick={()=>setViewUserId(r.user_id)}>{r.profiles?.display_name||"User"}</span>
                    <span style={{fontSize:10,color:"#444"}}>on</span>
                    <span style={{fontSize:12,fontWeight:700,color:"#fbbf24"}}>{r.game_title}</span>
                    <span style={{fontSize:9,color:"#333",marginLeft:"auto"}}>{timeAgo(r.created_at)}</span></div>
                  {r.rating>0&&<Stars rating={r.rating} size={9}/>}
                  <p style={{color:"#888",fontSize:12,lineHeight:1.5,margin:"4px 0 0",overflow:"hidden",textOverflow:"ellipsis",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{r.text}</p>
                </div></div>)}</div></Sec>}

          <Sec title="Just released"><div style={{display:"grid",gridTemplateColumns:m?"repeat(3,1fr)":"repeat(6,1fr)",gap:m?8:12}}>{fresh.slice(0,6).map((g,i)=><GC key={g.id} game={g} delay={i*30} onClick={setSel} mobile={m} userData={ud}/>)}</div></Sec>
          {best[0]&&<WC game={best[0]} onClick={setSel} mobile={m} label="HIGHEST RATED"/>}
          <Sec title="All-time greats"><div style={{display:"grid",gridTemplateColumns:m?"repeat(3,1fr)":"repeat(6,1fr)",gap:m?8:12}}>{best.slice(1,7).map((g,i)=><GC key={g.id} game={g} delay={i*30} onClick={setSel} mobile={m} userData={ud}/>)}</div></Sec>
          {soon.length>0&&<Sec title="Coming soon"><div style={{display:"grid",gridTemplateColumns:m?"repeat(4,1fr)":"repeat(8,1fr)",gap:m?6:8}}>{soon.slice(0,8).map((g,i)=><GC key={g.id} game={g} delay={i*20} onClick={setSel} mobile={m} userData={ud} size="tiny"/>)}</div></Sec>}
          <Sec title="Top action"><div style={{display:"grid",gridTemplateColumns:m?"repeat(3,1fr)":"repeat(6,1fr)",gap:m?8:12}}>{action.slice(0,6).map((g,i)=><GC key={g.id} game={g} delay={i*30} onClick={setSel} mobile={m} userData={ud}/>)}</div></Sec>
          <Sec title="Top RPGs"><div style={{display:"grid",gridTemplateColumns:m?"repeat(3,1fr)":"repeat(6,1fr)",gap:m?8:12}}>{rpg.slice(0,6).map((g,i)=><GC key={g.id} game={g} delay={i*30} onClick={setSel} mobile={m} userData={ud}/>)}</div></Sec>
        </>}</div>}

      {/* FEED */}
      {pg==="feed"&&user&&<div style={{animation:"fadeIn .3s",paddingTop:8}}>
        <h2 style={{fontFamily:"'Outfit'",fontSize:m?20:24,fontWeight:900,marginBottom:18}}>Activity</h2>
        {feed.length>0?<div style={{display:"flex",flexDirection:"column",gap:6}}>
          {feed.map(a=><div key={a.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:14,background:"#16161e",border:"1px solid #1e1e28",transition:"all .2s"}}>
            <Av url={a.profiles?.avatar_url} name={a.profiles?.display_name} size={32} onClick={()=>setViewUserId(a.user_id)}/>
            {a.game_img&&<img src={a.game_img} alt="" style={{width:38,height:22,borderRadius:4,objectFit:"cover",cursor:"pointer"}} onClick={()=>{const g=all.find(x=>x.id===a.game_id);if(g)setSel(g)}}/>}
            <div style={{flex:1,fontSize:12}}><span style={{fontWeight:700,cursor:"pointer"}} onClick={()=>setViewUserId(a.user_id)}>{a.profiles?.display_name||"User"}</span>
              <span style={{color:"#555"}}> {a.action} </span>{a.game_title&&<span style={{fontWeight:700,color:"#fbbf24"}}>{a.game_title}</span>}
              {a.action==="rated"&&a.rating&&<span style={{color:"#fbbf24",marginLeft:4}}>★{a.rating}</span>}</div>
            <span style={{fontSize:9,color:"#333",flexShrink:0}}>{timeAgo(a.created_at)}</span></div>)}</div>
        :<div style={{textAlign:"center",padding:50,color:"#555"}}><div style={{fontSize:36,marginBottom:8}}>⚡</div>No activity yet</div>}</div>}

      {/* EXPLORE */}
      {pg==="explore"&&<div style={{animation:"fadeIn .3s",paddingTop:8}}>
        <h2 style={{fontFamily:"'Outfit'",fontSize:m?20:24,fontWeight:900,marginBottom:18}}>Explore</h2>
        {ld?<Loader/>:<>
          <Sec title="Highest rated"><div style={{display:"grid",gridTemplateColumns:m?"repeat(3,1fr)":"repeat(auto-fill,minmax(150px,1fr))",gap:m?8:12}}>{best.map((g,i)=><GC key={g.id} game={g} delay={i*20} onClick={setSel} mobile={m} userData={ud}/>)}</div></Sec>
          <Sec title="Popular"><div style={{display:"grid",gridTemplateColumns:m?"repeat(3,1fr)":"repeat(auto-fill,minmax(150px,1fr))",gap:m?8:12}}>{popular.map((g,i)=><GC key={g.id} game={g} delay={i*20} onClick={setSel} mobile={m} userData={ud}/>)}</div></Sec>
          <Sec title="New releases"><div style={{display:"grid",gridTemplateColumns:m?"repeat(3,1fr)":"repeat(auto-fill,minmax(150px,1fr))",gap:m?8:12}}>{fresh.map((g,i)=><GC key={g.id} game={g} delay={i*20} onClick={setSel} mobile={m} userData={ud}/>)}</div></Sec>
        </>}</div>}

      {/* LIBRARY */}
      {pg==="library"&&user&&<div style={{animation:"fadeIn .3s",paddingTop:8}}>
        <h2 style={{fontFamily:"'Outfit'",fontSize:m?20:24,fontWeight:900,marginBottom:16}}>Library</h2>
        {lib.length>0?<><div className="hs" style={{display:"flex",gap:6,marginBottom:16,overflowX:"auto",paddingBottom:4}}>
          {[["all","All"],["playing","Playing"],["completed","Completed"],["backlog","Backlog"],["wishlist","Wishlist"],["dropped","Dropped"]].map(([k,l])=>
            <button key={k} onClick={()=>setLf(k)} style={{padding:"6px 14px",borderRadius:12,fontSize:12,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",border:lf===k?"1px solid #fbbf24":"1px solid #1e1e28",background:lf===k?"#fbbf2410":"#16161e",color:lf===k?"#fbbf24":"#666",transition:"all .2s"}}>{l} <span style={{opacity:.4}}>{k==="all"?lib.length:lib.filter(g=>ud[g.id]?.status===k).length}</span></button>)}</div>
          <div style={{display:"grid",gridTemplateColumns:m?"repeat(3,1fr)":"repeat(auto-fill,minmax(150px,1fr))",gap:m?8:12}}>{flib.map((g,i)=><GC key={g.id} game={g} delay={i*20} onClick={setSel} mobile={m} userData={ud}/>)}</div>
        </>:<div style={{textAlign:"center",padding:50,color:"#555"}}><div style={{fontSize:36,marginBottom:8}}>📚</div>Search and add games</div>}</div>}

      {/* STATS */}
      {pg==="stats"&&user&&<div style={{animation:"fadeIn .3s",paddingTop:8}}>
        <h2 style={{fontFamily:"'Outfit'",fontSize:m?20:24,fontWeight:900,marginBottom:18}}>Stats</h2>
        {lib.length>0?(()=>{const bs=s=>lib.filter(g=>ud[g.id]?.status===s).length;const rt=lib.filter(g=>ud[g.id]?.myRating);const av=rt.length?(rt.reduce((s,g)=>s+ud[g.id].myRating,0)/rt.length).toFixed(1):"—";
          return<><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:m?8:12,marginBottom:28}}>
            {[{l:"Games",v:lib.length,c:"#60a5fa"},{l:"Done",v:bs("completed"),c:"#4ade80"},{l:"Playing",v:bs("playing"),c:"#a78bfa"},{l:"Avg ★",v:av,c:"#fbbf24"}].map((s,i)=>
              <div key={i} style={{padding:m?12:16,borderRadius:14,textAlign:"center",background:"#16161e",border:"1px solid #1e1e28"}}>
                <div style={{fontSize:m?20:26,fontWeight:900,color:s.c}}>{s.v}</div><div style={{fontSize:10,color:"#555",fontWeight:700,marginTop:2}}>{s.l}</div></div>)}</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {Object.entries(SC).map(([k,c])=>{const cn=bs(k),mx=lib.length||1;
                return<div key={k} style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{width:70,fontSize:12,color:"#666",fontWeight:600,textAlign:"right"}}>{c.l}</span>
                  <div style={{flex:1,height:20,background:"#1a1a22",borderRadius:6,overflow:"hidden"}}>
                    <div style={{height:"100%",width:cn>0?(cn/mx*100)+"%":"0%",background:c.c,borderRadius:6,opacity:.6,transition:"width .8s",display:"flex",alignItems:"center",paddingLeft:6}}>
                      {cn>0&&<span style={{fontSize:9,fontWeight:800}}>{cn}</span>}</div></div></div>})}</div></>
        })():<div style={{textAlign:"center",padding:50,color:"#555"}}>Add games to see stats</div>}</div>}

      {/* PROFILE */}
      {pg==="profile"&&user&&<div style={{animation:"fadeIn .3s",paddingTop:8}}>
        <div style={{display:"flex",alignItems:m?"center":"flex-start",gap:m?16:24,marginBottom:28,flexDirection:m?"column":"row"}}>
          <Av url={prof?.avatar_url} name={dn} size={m?80:100}/>
          <div style={{textAlign:m?"center":"left",flex:1}}>
            <h2 style={{fontFamily:"'Outfit'",fontSize:m?22:28,fontWeight:900}}>{prof?.display_name||dn}</h2>
            {prof?.username&&<div style={{color:"#555",fontSize:13,marginTop:2}}>@{prof.username}</div>}
            {prof?.bio&&<p style={{color:"#888",fontSize:13,lineHeight:1.5,marginTop:6}}>{prof.bio}</p>}
            <div style={{display:"flex",gap:20,marginTop:12,justifyContent:m?"center":"flex-start"}}>
              {[{v:lib.length,l:"Games"},{v:lib.filter(g=>ud[g.id]?.status==="completed").length,l:"Completed"},{v:fc.followers,l:"Followers"},{v:fc.following,l:"Following"}].map((s,i)=>
                <div key={i}><div style={{fontSize:18,fontWeight:900}}>{s.v}</div><div style={{fontSize:10,color:"#555"}}>{s.l}</div></div>)}</div>
            <div style={{display:"flex",gap:8,marginTop:12,justifyContent:m?"center":"flex-start"}}>
              <button onClick={()=>setEp(true)} style={{padding:"8px 18px",borderRadius:10,border:"1px solid #26262e",background:"transparent",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>Edit Profile</button>
              <button onClick={so} style={{padding:"8px 18px",borderRadius:10,border:"1px solid #26262e",background:"transparent",color:"#f87171",fontSize:12,fontWeight:700,cursor:"pointer"}}>Sign Out</button></div></div></div>
        <div style={{marginBottom:24}}>
          <h3 style={{fontSize:12,fontWeight:800,color:"#666",letterSpacing:".08em",marginBottom:12}}>MY LISTS</h3>
          {myLists.map(l=><div key={l.id} style={{padding:"12px 14px",borderRadius:12,background:"#16161e",border:"1px solid #1e1e28",marginBottom:6}}>
            <div style={{fontSize:14,fontWeight:700}}>📝 {l.title}</div><div style={{fontSize:10,color:"#555",marginTop:2}}>{l.game_ids?.length||0} games</div></div>)}
          <div style={{display:"flex",gap:8,marginTop:8}}><input placeholder="New list name..." value={newLN} onChange={e=>setNewLN(e.target.value)} onKeyDown={e=>e.key==="Enter"&&hcl()}
            style={{flex:1,padding:"10px 14px",borderRadius:10,border:"1px solid #1e1e28",background:"#16161e",color:"#fff",fontSize:13,outline:"none"}}/>
            <button onClick={hcl} style={{padding:"10px 16px",borderRadius:10,border:"none",background:"#fbbf24",color:"#000",fontSize:12,fontWeight:800,cursor:"pointer"}}>Create</button></div></div>
        {lib.length>0&&<><h3 style={{fontSize:12,fontWeight:800,color:"#666",letterSpacing:".08em",marginBottom:12}}>GAMES</h3>
          <div style={{display:"grid",gridTemplateColumns:m?"repeat(3,1fr)":"repeat(auto-fill,minmax(150px,1fr))",gap:m?8:12}}>{lib.map((g,i)=><GC key={g.id} game={g} delay={i*20} onClick={setSel} mobile={m} userData={ud}/>)}</div></>}
      </div>}
    </main>

    {m&&<div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:90,background:"rgba(12,12,18,.95)",backdropFilter:"blur(20px)",borderTop:"1px solid #1e1e28",display:"flex",paddingTop:6,paddingBottom:"max(env(safe-area-inset-bottom,14px),14px)"}}>
      {NAV.map(n=><div key={n.id} onClick={()=>{setPg(n.id);setQ("");setQOpen(false)}} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,cursor:"pointer",padding:"2px 0"}}>
        <span style={{fontSize:19,opacity:pg===n.id?1:.3,transition:"all .2s"}}>{n.i}</span>
        <span style={{fontSize:8,fontWeight:700,color:pg===n.id?"#fbbf24":"#555"}}>{n.l}</span></div>)}</div>}

    {sel&&<GD game={sel} onClose={()=>setSel(null)} mobile={m} userData={ud} setUserData={setUd} user={user} setShowAuth={setSa} refreshFeed={refreshFeed}/>}
  </div>}
