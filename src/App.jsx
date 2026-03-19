import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";

const AK="33d378268c5d452ab1f3a9cb04c89f38",AP="https://api.rawg.io/api",SU="https://gatarbmbvjrrbcemsdhl.supabase.co";
const PP={1:{n:"PC",c:"#67e8f9"},2:{n:"PS",c:"#818cf8"},3:{n:"Xbox",c:"#6ee7b7"},7:{n:"Switch",c:"#fda4af"}};
const SC={completed:{c:"#6ee7b7",l:"Completed"},playing:{c:"#67e8f9",l:"Playing"},wishlist:{c:"#fde68a",l:"Wishlist"},dropped:{c:"#fda4af",l:"Dropped"},backlog:{c:"#c4b5fd",l:"Backlog"}};
const glass={background:"rgba(255,255,255,.03)",backdropFilter:"blur(12px)",border:"1px solid rgba(255,255,255,.06)",borderRadius:16};

const fg=async(p="")=>{try{return(await(await fetch(`${AP}/games?key=${AK}&page_size=20${p}`)).json()).results||[]}catch{return[]}};
const fgd=async id=>{try{return await(await fetch(`${AP}/games/${id}?key=${AK}`)).json()}catch{return null}};
const sga=async q=>{try{return(await(await fetch(`${AP}/games?key=${AK}&search=${encodeURIComponent(q)}&page_size=20&search_precise=true`)).json()).results||[]}catch{return[]}};
const nm=g=>({id:g.id,t:g.name,y:g.released?.slice(0,4)||"TBA",img:g.background_image||"",r:g.rating?Math.round(g.rating*10)/10:null,mc:g.metacritic,genre:g.genres?.map(x=>x.name).slice(0,2).join(", ")||"",pf:(g.parent_platforms||[]).map(p=>PP[p.platform.id]).filter(Boolean),ss:g.short_screenshots?.map(s=>s.image)||[],desc:g.short_description||""});

const lcl=async u=>{const{data}=await supabase.from("user_games").select("*").eq("user_id",u);const l={};(data||[]).forEach(r=>{l[r.game_id]={status:r.status,myRating:r.my_rating,title:r.game_title,img:r.game_img}});return l};
const stc=async(u,g,f)=>{const{data:e}=await supabase.from("user_games").select("id").eq("user_id",u).eq("game_id",g).single();if(e)await supabase.from("user_games").update({status:f.status,my_rating:f.myRating,game_title:f.title,game_img:f.img,updated_at:new Date().toISOString()}).eq("id",e.id);else await supabase.from("user_games").insert({user_id:u,game_id:g,status:f.status,my_rating:f.myRating,game_title:f.title,game_img:f.img})};
const lp=async u=>{const{data}=await supabase.from("profiles").select("*").eq("id",u).single();return data};
const saveProf=async(uid,f)=>{const{error}=await supabase.from("profiles").update(f).eq("id",uid);return!error};
const searchPeople=async q=>{const{data}=await supabase.from("profiles").select("*").ilike("display_name",`%${q}%`).limit(20);return data||[]};
const searchLists=async q=>{const{data}=await supabase.from("lists").select("*,profiles(display_name,username,avatar_url)").ilike("title",`%${q}%`).eq("is_public",true).limit(20);return data||[]};
const loadLists=async u=>{const{data}=await supabase.from("lists").select("*").eq("user_id",u);return data||[]};
const createList=async(u,t)=>await supabase.from("lists").insert({user_id:u,title:t}).select().single();
const addGameToList=async(listId,gameId)=>{const{data:list}=await supabase.from("lists").select("game_ids").eq("id",listId).single();const ids=list?.game_ids||[];if(!ids.includes(gameId)){await supabase.from("lists").update({game_ids:[...ids,gameId]}).eq("id",listId)}};
const removeFromLib=async(uid,gameId)=>{await supabase.from("user_games").delete().eq("user_id",uid).eq("game_id",gameId)};
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

/* FIXED Avatar — single path, always overwrite */
const avUrl=(url,v)=>url?`${SU}/storage/v1/object/public/avatars/${url}?v=${v||1}`:null;
const upAv=async(uid,file)=>{
  const ext=file.name.split(".").pop();const path=`${uid}/avatar.${ext}`;
  // Delete old first, then upload new
  try{await supabase.storage.from("avatars").remove([path])}catch{}
  const{error}=await supabase.storage.from("avatars").upload(path,file,{cacheControl:"no-cache",upsert:true});
  if(error)throw error;
  await supabase.from("profiles").update({avatar_url:path}).eq("id",uid);
  return path;
};

/* News — fetch recently updated/released games with details */
const loadNews=async()=>{
  const td=new Date().toISOString().slice(0,10);const wk=new Date(Date.now()-14*864e5).toISOString().slice(0,10);
  try{const r=await fetch(`${AP}/games?key=${AK}&dates=${wk},${td}&ordering=-added&page_size=6`);const d=await r.json();
    return(d.results||[]).map(g=>({id:g.id,title:g.name,img:g.background_image,date:g.released,genre:g.genres?.[0]?.name||"",mc:g.metacritic,desc:g.genres?.map(x=>x.name).join(", ")}))
  }catch{return[]}
};

const useM=()=>{const[m,setM]=useState(window.innerWidth<768);useEffect(()=>{const h=()=>setM(window.innerWidth<768);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h)},[]);return m};
const tA=d=>{const s=Math.floor((Date.now()-new Date(d))/1000);if(s<60)return"now";if(s<3600)return Math.floor(s/60)+"m";if(s<86400)return Math.floor(s/3600)+"h";return Math.floor(s/86400)+"d"};

const Stars=({rating=0,size=14,interactive,onRate,show})=>{const[h,setH]=useState(0);const a=h||rating;
  const c=(s,e)=>{if(!interactive||!onRate)return;const r=e.currentTarget.getBoundingClientRect();onRate(e.clientX-r.left<r.width/2?s-.5:s)};
  return<div style={{display:"flex",gap:1,alignItems:"center"}}>{[1,2,3,4,5].map(s=>{const f=s<=Math.floor(a),hf=!f&&s-.5<=a&&s>a-.5;
    return<span key={s} onClick={e=>c(s,e)} onMouseEnter={()=>interactive&&setH(s)} onMouseLeave={()=>interactive&&setH(0)}
      style={{fontSize:size,cursor:interactive?"pointer":"default",position:"relative",lineHeight:1,color:f||hf?"#fde68a":"rgba(255,255,255,.08)",transition:"all .12s",transform:interactive&&s<=Math.ceil(h)?"scale(1.15)":"scale(1)"}}>
      {hf?<><span style={{position:"absolute",overflow:"hidden",width:"50%"}}>★</span><span style={{color:"rgba(255,255,255,.08)"}}>★</span></>:"★"}</span>})}
    {(interactive||show)&&a>0&&<span style={{fontSize:size*.7,color:"#fde68a",fontWeight:700,marginLeft:3}}>{a}</span>}</div>};

const Loader=()=><div style={{display:"flex",justifyContent:"center",padding:32}}><div style={{width:24,height:24,border:"2.5px solid rgba(255,255,255,.05)",borderTopColor:"#67e8f9",borderRadius:"50%",animation:"spin .7s linear infinite"}}/></div>;
const Av=({url,name,size=32,onClick,v})=>{const s=avUrl(url,v);return<div onClick={onClick} style={{width:size,height:size,borderRadius:size*.3,background:s?"rgba(255,255,255,.05)":"linear-gradient(135deg,#67e8f9,#818cf8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.38,fontWeight:800,cursor:onClick?"pointer":"default",overflow:"hidden",flexShrink:0,color:"#fff"}}>{s?<img src={s} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:(name||"?").charAt(0).toUpperCase()}</div>};

const GC=({game:g,onClick,delay=0,mobile:m,ud,big})=>{const[hov,setHov]=useState(false);const[vis,setVis]=useState(false);const[err,setErr]=useState(false);
  useEffect(()=>{const t=setTimeout(()=>setVis(true),delay);return()=>clearTimeout(t)},[delay]);const u=ud?.[g.id];
  return<div onClick={()=>onClick?.(g)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
    style={{borderRadius:big?20:14,overflow:"hidden",cursor:"pointer",position:"relative",aspectRatio:big?"16/9":"3/4",
      opacity:vis?1:0,transform:vis?(hov&&!m?"translateY(-4px) scale(1.01)":"none"):"translateY(10px)",transition:"all .3s cubic-bezier(.4,0,.2,1)",
      boxShadow:hov?"0 20px 50px rgba(0,0,0,.5)":"0 4px 20px rgba(0,0,0,.2)"}}>
    {!err&&g.img?<img src={g.img} alt={g.t} onError={()=>setErr(true)} loading="lazy"
      style={{width:"100%",height:"100%",objectFit:"cover",transition:"transform .5s",transform:hov&&!m?"scale(1.05)":"scale(1)"}}/>
      :<div style={{width:"100%",height:"100%",background:"linear-gradient(145deg,#1e1b2e,#2d2640)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:big?40:24,color:"rgba(255,255,255,.05)"}}>🎮</div>}
    <div style={{position:"absolute",inset:0,background:big?"linear-gradient(to top,rgba(15,12,25,.95) 0%,rgba(15,12,25,.3) 40%,transparent 70%)":"linear-gradient(to top,rgba(15,12,25,.92) 0%,transparent 55%)"}}/>
    {g.r&&<div style={{position:"absolute",top:big?12:8,right:big?12:8,display:"flex",alignItems:"center",gap:3,padding:"4px 8px",borderRadius:20,...glass,background:"rgba(15,12,25,.6)"}}>
      <span style={{color:"#fde68a",fontSize:big?12:9,fontWeight:900}}>★</span><span style={{color:"#fff",fontSize:big?12:9,fontWeight:800}}>{g.r}</span></div>}
    {u?.status&&<div style={{position:"absolute",top:big?12:8,left:big?12:8,padding:"3px 10px",borderRadius:20,background:SC[u.status]?.c,fontSize:big?10:7,fontWeight:900,color:"#0f0c19"}}>{SC[u.status]?.l}</div>}
    <div style={{position:"absolute",bottom:0,left:0,right:0,padding:big?"20px 24px":"10px 12px"}}>
      {big&&<div style={{display:"inline-block",padding:"3px 10px",borderRadius:20,background:"linear-gradient(135deg,#67e8f9,#818cf8)",fontSize:9,fontWeight:800,color:"#0f0c19",marginBottom:6}}>TRENDING</div>}
      <h3 style={{fontSize:big?22:13,fontWeight:big?900:700,margin:0,lineHeight:1.2,color:"#fff"}}>{g.t}</h3>
      <div style={{fontSize:big?12:8,color:"rgba(255,255,255,.4)",marginTop:big?6:3}}>{g.y}{big&&g.genre?" · "+g.genre:""}</div>
    </div></div>};

const TC=({game:g,onClick,delay=0,m,ud})=>{const[vis,setVis]=useState(false);
  useEffect(()=>{const t=setTimeout(()=>setVis(true),delay);return()=>clearTimeout(t)},[delay]);
  return<div onClick={()=>onClick?.(g)} style={{opacity:vis?1:0,transform:vis?"none":"translateY(6px)",transition:"all .2s",cursor:"pointer",textAlign:"center"}}>
    <div style={{borderRadius:10,overflow:"hidden",aspectRatio:"1",marginBottom:4,position:"relative",boxShadow:"0 4px 12px rgba(0,0,0,.2)"}}>
      {g.img?<img src={g.img} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{width:"100%",height:"100%",background:"#1e1b2e"}}/>}
      <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(15,12,25,.7) 0%,transparent 50%)"}}/>
    </div><div style={{fontSize:9,fontWeight:600,lineHeight:1.2,color:"rgba(255,255,255,.5)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.t}</div></div>};

/* Auth */
const Auth=({onClose,onAuth})=>{const[mode,setMode]=useState("login");const[email,setEmail]=useState("");const[pw,setPw]=useState("");const[name,setName]=useState("");const[err,setErr]=useState("");const[ld,setLd]=useState(false);const[sent,setSent]=useState(false);
  const go=async()=>{setErr("");setLd(true);try{if(mode==="signup"){const{error:e}=await supabase.auth.signUp({email,password:pw,options:{data:{display_name:name}}});if(e)throw e;setSent(true)}else{const{data,error:e}=await supabase.auth.signInWithPassword({email,password:pw});if(e)throw e;onAuth(data.user);onClose()}}catch(e){setErr(e.message)}setLd(false)};
  const inp={width:"100%",padding:"14px 16px",borderRadius:12,border:"1px solid rgba(255,255,255,.08)",background:"rgba(255,255,255,.04)",color:"#fff",fontSize:14,outline:"none",marginBottom:12};
  return<div onClick={onClose} style={{position:"fixed",inset:0,zIndex:2000,background:"rgba(15,12,25,.95)",backdropFilter:"blur(24px)",display:"flex",alignItems:"center",justifyContent:"center",animation:"fadeIn .15s",padding:16}}>
    <div onClick={e=>e.stopPropagation()} style={{...glass,borderRadius:24,width:"100%",maxWidth:400,padding:"40px 32px",background:"rgba(30,27,46,.8)",animation:"slideUp .25s ease"}}>
      {sent?<div style={{textAlign:"center"}}><div style={{fontSize:48,marginBottom:16}}>✉️</div><h2 style={{fontSize:22,fontWeight:800}}>Check your inbox</h2><p style={{color:"rgba(255,255,255,.5)",fontSize:14,marginTop:8}}>Link sent to <span style={{color:"#67e8f9"}}>{email}</span></p>
        <button onClick={onClose} style={{marginTop:24,padding:"12px 28px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#67e8f9,#818cf8)",color:"#0f0c19",fontSize:14,fontWeight:800,cursor:"pointer"}}>Got it</button></div>
      :<><h2 style={{fontFamily:"'Outfit'",fontSize:28,fontWeight:900,marginBottom:4}}>{mode==="login"?"Welcome back":"Join Gameboxed"}</h2>
        <p style={{color:"rgba(255,255,255,.35)",fontSize:14,marginBottom:28}}>{mode==="login"?"Sign in to continue":"Create your account"}</p>
        {err&&<div style={{padding:"12px",borderRadius:10,background:"rgba(253,164,175,.08)",border:"1px solid rgba(253,164,175,.15)",color:"#fda4af",fontSize:13,marginBottom:14}}>{err}</div>}
        {mode==="signup"&&<input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} style={inp}/>}
        <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={inp}/>
        <input type="password" placeholder="Password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()} style={inp}/>
        <button onClick={go} disabled={ld} style={{width:"100%",padding:"14px",borderRadius:12,border:"none",marginTop:8,background:ld?"rgba(255,255,255,.05)":"linear-gradient(135deg,#67e8f9,#818cf8)",color:ld?"rgba(255,255,255,.2)":"#0f0c19",fontSize:15,fontWeight:800,cursor:ld?"default":"pointer"}}>{ld?"...":mode==="login"?"Sign In":"Create Account"}</button>
        <p style={{textAlign:"center",marginTop:18,fontSize:13,color:"rgba(255,255,255,.3)"}}>{mode==="login"?"New? ":"Already joined? "}<span onClick={()=>{setMode(mode==="login"?"signup":"login");setErr("")}} style={{color:"#67e8f9",cursor:"pointer",fontWeight:700}}>{mode==="login"?"Create account":"Sign in"}</span></p></>}</div></div>};

/* Edit Profile */
const EP=({prof,onClose,userId,onDone})=>{const[n,setN]=useState(prof?.display_name||"");const[u,setU]=useState(prof?.username||"");const[b,setB]=useState(prof?.bio||"");const[ld,setLd]=useState(false);const[upl,setUpl]=useState(false);const[avP,setAvP]=useState(null);const fr=useRef();
  const sv=async()=>{setLd(true);await saveProf(userId,{display_name:n,username:u.toLowerCase().replace(/[^a-z0-9_]/g,""),bio:b});setLd(false);await onDone();onClose()};
  const hf=async e=>{const f=e.target.files[0];if(!f)return;setUpl(true);setAvP(URL.createObjectURL(f));try{await upAv(userId,f);await onDone()}catch(er){alert("Upload failed: "+er.message)}setUpl(false)};
  const inp={width:"100%",padding:"12px 14px",borderRadius:12,border:"1px solid rgba(255,255,255,.08)",background:"rgba(255,255,255,.04)",color:"#fff",fontSize:14,outline:"none",marginBottom:14};
  return<div onClick={onClose} style={{position:"fixed",inset:0,zIndex:2000,background:"rgba(15,12,25,.95)",backdropFilter:"blur(20px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
    <div onClick={e=>e.stopPropagation()} style={{...glass,borderRadius:24,width:"100%",maxWidth:400,padding:"32px 28px",background:"rgba(30,27,46,.8)"}}>
      <h2 style={{fontSize:22,fontWeight:900,marginBottom:24}}>Edit Profile</h2>
      <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:24}}>
        <div style={{width:64,height:64,borderRadius:20,overflow:"hidden",flexShrink:0,background:"rgba(255,255,255,.04)"}}>
          {avP?<img src={avP} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            :prof?.avatar_url?<img src={avUrl(prof.avatar_url,Date.now())} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            :<div style={{width:"100%",height:"100%",background:"linear-gradient(135deg,#67e8f9,#818cf8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:800}}>{(n||"?").charAt(0).toUpperCase()}</div>}</div>
        <div><input ref={fr} type="file" accept="image/jpeg,image/png,image/webp" onChange={hf} style={{display:"none"}}/>
          <button onClick={()=>fr.current?.click()} style={{padding:"8px 16px",borderRadius:10,...glass,color:"#67e8f9",fontSize:12,fontWeight:700,cursor:"pointer"}}>{upl?"Uploading...":"Upload Photo"}</button></div></div>
      <label style={{fontSize:10,color:"rgba(255,255,255,.3)",fontWeight:700,letterSpacing:".1em",display:"block",marginBottom:4}}>NAME</label><input value={n} onChange={e=>setN(e.target.value)} style={inp}/>
      <label style={{fontSize:10,color:"rgba(255,255,255,.3)",fontWeight:700,letterSpacing:".1em",display:"block",marginBottom:4}}>USERNAME</label><input value={u} onChange={e=>setU(e.target.value)} style={inp} placeholder="username"/>
      <label style={{fontSize:10,color:"rgba(255,255,255,.3)",fontWeight:700,letterSpacing:".1em",display:"block",marginBottom:4}}>BIO</label><textarea value={b} onChange={e=>setB(e.target.value)} rows={3} style={{...inp,resize:"none",fontFamily:"inherit"}}/>
      <div style={{display:"flex",gap:10,marginTop:4}}>
        <button onClick={onClose} style={{flex:1,padding:"13px",borderRadius:12,...glass,color:"rgba(255,255,255,.5)",fontSize:14,fontWeight:700,cursor:"pointer"}}>Cancel</button>
        <button onClick={sv} disabled={ld} style={{flex:1,padding:"13px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#67e8f9,#818cf8)",color:"#0f0c19",fontSize:14,fontWeight:800,cursor:"pointer"}}>{ld?"...":"Save"}</button></div></div></div>};

/* Follow List */
const FLM=({userId,type,onClose,m,goUser})=>{const[list,setList]=useState([]);const[ld,setLd]=useState(true);
  useEffect(()=>{(async()=>{setLd(true);setList(type==="followers"?await getFollowersList(userId):await getFollowingList(userId));setLd(false)})()},[userId,type]);
  return<div onClick={onClose} style={{position:"fixed",inset:0,zIndex:1800,background:"rgba(15,12,25,.95)",display:"flex",alignItems:m?"flex-end":"center",justifyContent:"center",padding:m?0:16}}>
    <div onClick={e=>e.stopPropagation()} style={{...glass,background:"rgba(30,27,46,.9)",width:"100%",maxWidth:m?"100%":400,maxHeight:m?"80vh":"70vh",borderRadius:m?"24px 24px 0 0":24,overflow:"auto"}}>
      {m&&<div onClick={onClose} style={{display:"flex",justifyContent:"center",padding:"12px 0 0"}}><div style={{width:32,height:4,borderRadius:2,background:"rgba(255,255,255,.1)"}}/></div>}
      <div style={{padding:"20px 20px 24px"}}><h3 style={{fontSize:18,fontWeight:900,marginBottom:16}}>{type==="followers"?"Followers":"Following"}</h3>
        {ld?<Loader/>:list.length?list.map(p=><div key={p.id} onClick={()=>{onClose();goUser(p.id)}} style={{display:"flex",alignItems:"center",gap:12,padding:"10px",borderRadius:12,cursor:"pointer",marginBottom:4}}
          onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.04)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <Av url={p.avatar_url} name={p.display_name} size={38} v={Date.now()}/><div style={{flex:1}}><div style={{fontSize:14,fontWeight:700}}>{p.display_name}</div>{p.username&&<div style={{fontSize:11,color:"rgba(255,255,255,.3)"}}>@{p.username}</div>}</div></div>)
        :<p style={{textAlign:"center",padding:24,color:"rgba(255,255,255,.2)"}}>No {type} yet</p>}</div></div></div>};

/* Game Detail */
const GD=({game:g,onClose,m,ud,setUd,user:me,setSa,refresh,goUser,avV,myLists,reloadLists})=>{
  const[det,setDet]=useState(null);const[ldg,setLdg]=useState(true);const d=ud[g.id]||{};
  const[mr,setMr]=useState(d.myRating||0);const[st,setSt]=useState(d.status||"");const[tab,setTab]=useState("about");
  const[rvs,setRvs]=useState([]);const[rt,setRt]=useState("");const[rr,setRr]=useState(0);const[posting,setPosting]=useState(false);const[showLists,setShowLists]=useState(false);const[addedList,setAddedList]=useState("");
  useEffect(()=>{setLdg(true);fgd(g.id).then(d=>{setDet(d);setLdg(false)});loadGR(g.id).then(setRvs)},[g.id]);
  const sv=async(f,v)=>{if(!me){setSa(true);return}const nd={...d,[f]:v,title:g.t,img:g.img};if(f==="myRating"){setMr(v);await postAct(me.id,"rated",{id:g.id,title:g.t,img:g.img,rating:v})}if(f==="status"){setSt(v);await postAct(me.id,v==="completed"?"completed":v==="playing"?"started":"added to "+v,{id:g.id,title:g.t,img:g.img})}
    setUd({...ud,[g.id]:nd});await stc(me.id,g.id,nd);refresh?.()};
  const removeGame=async()=>{if(!me)return;await removeFromLib(me.id,g.id);const n={...ud};delete n[g.id];setUd(n);setSt("");setMr(0);refresh?.()};
  const handleAddToList=async(listId)=>{await addGameToList(listId,g.id);setAddedList(listId);reloadLists?.();setTimeout(()=>setAddedList(""),2000)};
  const subRev=async()=>{if(!me||!rt.trim())return;setPosting(true);await postRev(me.id,g,rr,rt);setRt("");setRr(0);setRvs(await loadGR(g.id));setPosting(false);refresh?.()};

  return<div onClick={onClose} style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(15,12,25,.95)",backdropFilter:"blur(16px)",display:"flex",alignItems:m?"flex-end":"center",justifyContent:"center",animation:"fadeIn .12s",padding:m?0:16}}>
    <div onClick={e=>e.stopPropagation()} style={{background:"#16132a",width:"100%",maxWidth:m?"100%":660,maxHeight:m?"93vh":"88vh",borderRadius:m?"24px 24px 0 0":24,overflow:"auto",border:"1px solid rgba(255,255,255,.06)"}}>
      {m&&<div onClick={onClose} style={{display:"flex",justifyContent:"center",padding:"12px 0 0"}}><div style={{width:32,height:4,borderRadius:2,background:"rgba(255,255,255,.1)"}}/></div>}
      <div style={{position:"relative",height:m?180:240,overflow:"hidden"}}><img src={g.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,#16132a 0%,transparent 100%)"}}/>
        {!m&&<button onClick={onClose} style={{position:"absolute",top:14,right:14,width:34,height:34,borderRadius:12,...glass,background:"rgba(15,12,25,.6)",border:"none",color:"#fff",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>}
        <div style={{position:"absolute",bottom:16,left:m?16:24}}><h2 style={{fontFamily:"'Outfit'",fontSize:m?24:32,fontWeight:900}}>{g.t}</h2>
          <div style={{color:"rgba(255,255,255,.4)",fontSize:13,marginTop:3}}>{g.y} · {g.genre}</div></div></div>
      <div style={{padding:m?"14px 16px 36px":"20px 24px 28px"}}>
        <div style={{display:"flex",gap:12,marginBottom:18}}>
          {g.r&&<div style={{...glass,padding:"12px 16px",borderRadius:14,flex:1,textAlign:"center"}}><div style={{fontSize:9,color:"rgba(255,255,255,.3)",fontWeight:700}}>COMMUNITY</div><div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:4,marginTop:4}}><span style={{color:"#fde68a",fontSize:18}}>★</span><span style={{fontSize:22,fontWeight:900}}>{g.r}</span></div></div>}
          {g.mc&&<div style={{...glass,padding:"12px 16px",borderRadius:14,flex:1,textAlign:"center"}}><div style={{fontSize:9,color:"rgba(255,255,255,.3)",fontWeight:700}}>METACRITIC</div><div style={{fontSize:22,fontWeight:900,marginTop:4,color:g.mc>=75?"#6ee7b7":"#fde68a"}}>{g.mc}</div></div>}
          <div style={{...glass,padding:"12px 16px",borderRadius:14,flex:1,textAlign:"center"}}><div style={{fontSize:9,color:"rgba(255,255,255,.3)",fontWeight:700}}>YOUR SCORE</div><div style={{fontSize:22,fontWeight:900,marginTop:4,color:"#67e8f9"}}>{mr||"—"}</div></div></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:18}}>
          <div style={{...glass,padding:14,borderRadius:14}}><div style={{fontSize:9,color:"rgba(255,255,255,.3)",fontWeight:700,marginBottom:8}}>RATE</div><Stars rating={mr} size={m?22:26} interactive onRate={v=>sv("myRating",v)}/></div>
          <div style={{...glass,padding:14,borderRadius:14}}><div style={{fontSize:9,color:"rgba(255,255,255,.3)",fontWeight:700,marginBottom:8}}>STATUS</div>
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{Object.entries(SC).map(([k,c])=><button key={k} onClick={()=>sv("status",k)} style={{padding:"4px 10px",borderRadius:20,fontSize:9,fontWeight:700,cursor:"pointer",border:"none",background:st===k?c.c:"rgba(255,255,255,.04)",color:st===k?"#0f0c19":"rgba(255,255,255,.3)"}}>{c.l}</button>)}
              {st&&<button onClick={removeGame} style={{padding:"4px 10px",borderRadius:20,fontSize:9,fontWeight:700,cursor:"pointer",border:"1px solid rgba(253,164,175,.2)",background:"transparent",color:"#fda4af"}}>✕ Remove</button>}</div></div></div>
        {/* Add to List */}
        {me&&myLists?.length>0&&<div style={{marginBottom:18}}>
          <button onClick={()=>setShowLists(!showLists)} style={{padding:"8px 14px",borderRadius:12,fontSize:11,fontWeight:700,cursor:"pointer",...glass,color:"#c4b5fd",border:"1px solid rgba(196,181,253,.15)",width:"100%",textAlign:"left"}}>📝 {showLists?"Hide lists":"Add to list..."}</button>
          {showLists&&<div style={{marginTop:6,display:"flex",flexDirection:"column",gap:4}}>
            {myLists.map(l=><button key={l.id} onClick={()=>handleAddToList(l.id)} style={{padding:"8px 12px",borderRadius:10,fontSize:12,fontWeight:600,cursor:"pointer",background:addedList===l.id?"rgba(110,231,183,.1)":"rgba(255,255,255,.03)",border:addedList===l.id?"1px solid rgba(110,231,183,.2)":"1px solid rgba(255,255,255,.04)",color:addedList===l.id?"#6ee7b7":"rgba(255,255,255,.5)",textAlign:"left",transition:"all .15s"}}>{addedList===l.id?"✓ Added to ":"📝 "}{l.title}</button>)}</div>}</div>}
        <div style={{display:"flex",borderBottom:"1px solid rgba(255,255,255,.06)",marginBottom:16}}>
          {["about","reviews","media"].map(t=><button key={t} onClick={()=>setTab(t)} style={{padding:"10px 16px",background:"none",border:"none",fontSize:13,fontWeight:700,cursor:"pointer",color:tab===t?"#67e8f9":"rgba(255,255,255,.2)",borderBottom:tab===t?"2px solid #67e8f9":"2px solid transparent",textTransform:"capitalize"}}>{t}{t==="reviews"&&rvs.length?` (${rvs.length})`:""}</button>)}</div>
        {tab==="about"&&(ldg?<Loader/>:det?.description_raw&&<p style={{color:"rgba(255,255,255,.5)",fontSize:14,lineHeight:1.9}}>{det.description_raw.slice(0,600)}</p>)}
        {tab==="reviews"&&<div>
          {me&&<div style={{marginBottom:18,...glass,padding:16,borderRadius:16}}>
            <Stars rating={rr} size={20} interactive onRate={setRr}/>
            <textarea value={rt} onChange={e=>setRt(e.target.value)} rows={3} placeholder="Share your thoughts..." style={{width:"100%",marginTop:10,padding:"12px",borderRadius:10,border:"1px solid rgba(255,255,255,.06)",background:"rgba(255,255,255,.03)",color:"#fff",fontSize:14,outline:"none",resize:"none",fontFamily:"inherit"}}/>
            <button onClick={subRev} disabled={posting||!rt.trim()} style={{marginTop:8,padding:"10px 20px",borderRadius:10,border:"none",background:rt.trim()?"linear-gradient(135deg,#67e8f9,#818cf8)":"rgba(255,255,255,.04)",color:rt.trim()?"#0f0c19":"rgba(255,255,255,.15)",fontSize:13,fontWeight:800,cursor:rt.trim()?"pointer":"default"}}>{posting?"...":"Post Review"}</button></div>}
          {rvs.map(r=><div key={r.id} style={{...glass,padding:14,borderRadius:14,marginBottom:8}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <Av url={r.profiles?.avatar_url} name={r.profiles?.display_name} size={28} onClick={()=>{onClose();goUser(r.user_id)}} v={avV}/>
              <span style={{fontSize:13,fontWeight:700,cursor:"pointer",flex:1}} onClick={()=>{onClose();goUser(r.user_id)}}>{r.profiles?.display_name}</span>
              {r.rating>0&&<Stars rating={r.rating} size={10} show/>}<span style={{fontSize:10,color:"rgba(255,255,255,.15)"}}>{tA(r.created_at)}</span></div>
            <p style={{color:"rgba(255,255,255,.6)",fontSize:13,lineHeight:1.7,margin:0}}>{r.text}</p></div>)}
          {!rvs.length&&<p style={{textAlign:"center",padding:28,color:"rgba(255,255,255,.15)"}}>No reviews yet</p>}</div>}
        {tab==="media"&&g.ss?.length>1&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{g.ss.slice(1,7).map((s,i)=><img key={i} src={s} alt="" loading="lazy" style={{width:"100%",borderRadius:12,aspectRatio:"16/9",objectFit:"cover"}}/>)}</div>}
      </div></div></div>};

/* ═══ PROFILE PAGE (full page — for both self and others) ═══ */
const ProfilePage=({viewId,me,m,ud,goUser,avV,onEdit,onSignOut,allGames})=>{
  const[p,setP]=useState(null);const[fc,setFc]=useState({followers:0,following:0});const[gs,setGs]=useState([]);const[acts,setActs]=useState([]);const[isF,setIsF]=useState(false);const[ld,setLd]=useState(true);const[flM,setFlM]=useState(null);
  const isSelf=me?.id===viewId;
  useEffect(()=>{(async()=>{setLd(true);const[pr,c,g,a]=await Promise.all([lp(viewId),getFC(viewId),getUG(viewId),getUserActs(viewId)]);setP(pr);setFc(c);setGs(g);setActs(a);if(me&&!isSelf)setIsF(await chkF(me.id,viewId));setLd(false)})()},[viewId]);
  const tog=async()=>{if(!me)return;if(isF){await unfollowU(me.id,viewId);setIsF(false);setFc(x=>({...x,followers:x.followers-1}))}else{await followU(me.id,viewId);setIsF(true);setFc(x=>({...x,followers:x.followers+1}))}};
  const top5=gs.filter(g=>g.my_rating).sort((a,b)=>b.my_rating-a.my_rating).slice(0,5);
  if(ld)return<Loader/>;

  return<div style={{animation:"fadeIn .15s"}}>
    {/* Cover */}
    <div style={{height:m?90:130,borderRadius:20,background:"linear-gradient(135deg,rgba(103,232,249,.15),rgba(129,140,248,.15),rgba(196,181,253,.15))",marginBottom:m?-30:-40,position:"relative"}}/>
    <div style={{display:"flex",alignItems:m?"center":"flex-start",gap:m?14:20,marginBottom:24,flexDirection:m?"column":"row",position:"relative",padding:m?"0 12px":"0 20px"}}>
      <Av url={p?.avatar_url} name={p?.display_name} size={m?80:96} v={avV}/>
      <div style={{textAlign:m?"center":"left",flex:1}}>
        <h2 style={{fontFamily:"'Outfit'",fontSize:m?22:28,fontWeight:900}}>{p?.display_name||"User"}</h2>
        {p?.username&&<div style={{color:"rgba(255,255,255,.25)",fontSize:13,marginTop:2}}>@{p.username}</div>}
        {p?.bio&&<p style={{color:"rgba(255,255,255,.4)",fontSize:14,lineHeight:1.6,marginTop:6}}>{p.bio}</p>}
        <div style={{display:"flex",gap:16,marginTop:10,justifyContent:m?"center":"flex-start"}}>
          <div><span style={{fontWeight:900}}>{gs.length}</span> <span style={{color:"rgba(255,255,255,.2)",fontSize:12}}>games</span></div>
          <div onClick={()=>setFlM("followers")} style={{cursor:"pointer"}}><span style={{fontWeight:900}}>{fc.followers}</span> <span style={{color:"#67e8f9",fontSize:12}}>followers</span></div>
          <div onClick={()=>setFlM("following")} style={{cursor:"pointer"}}><span style={{fontWeight:900}}>{fc.following}</span> <span style={{color:"#67e8f9",fontSize:12}}>following</span></div></div>
        <div style={{display:"flex",gap:6,marginTop:10,justifyContent:m?"center":"flex-start"}}>
          {isSelf?<><button onClick={onEdit} style={{padding:"8px 18px",borderRadius:12,...glass,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>Edit Profile</button>
            <button onClick={onSignOut} style={{padding:"8px 18px",borderRadius:12,...glass,color:"#fda4af",fontSize:12,fontWeight:700,cursor:"pointer"}}>Sign Out</button></>
          :me&&<button onClick={tog} style={{padding:"9px 28px",borderRadius:12,border:isF?"1px solid rgba(255,255,255,.1)":"none",background:isF?"transparent":"linear-gradient(135deg,#67e8f9,#818cf8)",color:isF?"rgba(255,255,255,.4)":"#0f0c19",fontSize:13,fontWeight:800,cursor:"pointer"}}>{isF?"Following ✓":"Follow"}</button>}
        </div></div></div>

    {/* Favorite Games — Letterboxd exact: 4 clean posters, gold bottom bar, no text */}
    {top5.length>0&&<div style={{marginBottom:24}}><div className="sec-title">FAVORITE GAMES</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,maxWidth:m?200:280}}>
        {top5.slice(0,4).map(g=><div key={g.game_id} style={{borderRadius:4,overflow:"hidden",aspectRatio:"2/3",position:"relative",boxShadow:"0 2px 8px rgba(0,0,0,.3)",border:"1px solid rgba(255,255,255,.06)"}}>
          {g.game_img?<img src={g.game_img} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{width:"100%",height:"100%",background:"#1e1b2e"}}/>}
          <div style={{position:"absolute",bottom:0,left:0,right:0,height:3,background:"#fde68a"}}/>
        </div>)}</div></div>}

    {/* Recent Activity — Letterboxd diary style: date | poster | title | stars */}
    {acts.length>0&&<div style={{marginBottom:24}}><div className="sec-title">RECENT ACTIVITY</div>
      {acts.slice(0,8).map(a=><div key={a.id} style={{display:"grid",gridTemplateColumns:"44px 32px 1fr auto",alignItems:"center",gap:8,padding:"5px 0",borderBottom:"1px solid rgba(255,255,255,.03)"}}>
        <span style={{fontSize:10,color:"rgba(255,255,255,.15)",textAlign:"right"}}>{tA(a.created_at)}</span>
        {a.game_img?<div style={{width:32,height:44,borderRadius:3,overflow:"hidden"}}><img src={a.game_img} style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>:<div style={{width:32,height:44,borderRadius:3,background:"#1e1b2e"}}/>}
        <div><div style={{fontSize:12,fontWeight:600,lineHeight:1.2}}>{a.game_title}</div><div style={{fontSize:9,color:"rgba(255,255,255,.2)",marginTop:1}}>{a.action}</div></div>
        {a.action==="rated"&&a.rating?<Stars rating={a.rating} size={8}/>:<span/>}
      </div>)}</div>}

    {/* Games */}
    {gs.length>0&&<div><div className="sec-title">🎮 GAMES ({gs.length})</div>
      <div style={{display:"grid",gridTemplateColumns:m?"repeat(5,1fr)":"repeat(auto-fill,minmax(60px,1fr))",gap:4}}>
        {gs.map(g=><div key={g.game_id} style={{borderRadius:4,overflow:"hidden",aspectRatio:"2/3",position:"relative",boxShadow:"0 1px 4px rgba(0,0,0,.2)"}}>
          {g.game_img?<img src={g.game_img} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{width:"100%",height:"100%",background:"#1e1b2e",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10}}>🎮</div>}
          {g.status&&<div style={{position:"absolute",bottom:0,left:0,right:0,height:3,background:SC[g.status]?.c||"#fff"}}/>}
        </div>)}</div></div>}

    {flM&&<FLM userId={viewId} type={flM} onClose={()=>setFlM(null)} m={m} goUser={goUser}/>}
  </div>};

/* ═══ MAIN ═══ */
export default function App(){
  const m=useM();const[pg,setPg]=useState("home");const[sel,setSel]=useState(null);const[q,setQ]=useState("");const[qO,setQO]=useState(false);
  const[ud,setUd]=useState({});const[user,setUser]=useState(null);const[prof,setProf]=useState(null);const[avV,setAvV]=useState(Date.now());const[fc,setFc]=useState({followers:0,following:0});
  const[sa,setSa]=useState(false);const[ep,setEp]=useState(false);const[viewUID,setViewUID]=useState(null);const[flM,setFlM]=useState(null);
  const[pop,setPop]=useState([]);const[best,setBest]=useState([]);const[fresh,setFresh]=useState([]);const[soon,setSoon]=useState([]);const[actG,setActG]=useState([]);const[rpg,setRpg]=useState([]);const[indie,setIndie]=useState([]);
  const[sr,setSr]=useState([]);const[pSr,setPSr]=useState([]);const[lSr,setLSr]=useState([]);
  const[ld,setLd]=useState(true);const[sng,setSng]=useState(false);const[lf,setLf]=useState("all");const[sT,setST]=useState("games");
  const[myL,setMyL]=useState([]);const[nLN,setNLN]=useState("");const[feed,setFeed]=useState([]);const[rRev,setRRev]=useState([]);const[news,setNews]=useState([]);
  const stt=useRef(null);
  const rf=()=>{if(user)loadFeed(user.id).then(setFeed);else loadAllFeed().then(setFeed);loadRR().then(setRRev)};
  const reloadProf=useCallback(async()=>{if(!user)return;const p=await lp(user.id);setProf(p);setAvV(Date.now());getFC(user.id).then(setFc)},[user]);
  const goUser=(id)=>{setViewUID(id);setPg("viewuser")};

  useEffect(()=>{supabase.auth.getSession().then(({data:{session}})=>{const u=session?.user||null;setUser(u);if(u){lcl(u.id).then(setUd);lp(u.id).then(setProf);loadLists(u.id).then(setMyL);loadFeed(u.id).then(setFeed);getFC(u.id).then(setFc)}else loadAllFeed().then(setFeed)});loadRR().then(setRRev);loadNews().then(setNews);
    const{data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>{const u=session?.user||null;setUser(u);if(u){lcl(u.id).then(setUd);lp(u.id).then(setProf);loadLists(u.id).then(setMyL);loadFeed(u.id).then(setFeed);getFC(u.id).then(setFc)}else{setUd({});setProf(null)}});return()=>subscription.unsubscribe()},[]);

  useEffect(()=>{setLd(true);const td=new Date().toISOString().slice(0,10),ly=new Date(Date.now()-365*864e5).toISOString().slice(0,10),ny=new Date(Date.now()+365*864e5).toISOString().slice(0,10);
    Promise.all([fg(`&dates=${ly},${td}&ordering=-rating&metacritic=70,100`),fg(`&ordering=-metacritic&metacritic=85,100`),fg(`&dates=${ly},${td}&ordering=-released`),fg(`&dates=${td},${ny}&ordering=-added`),
      fg(`&genres=action&ordering=-rating&metacritic=75,100&page_size=8`),fg(`&genres=role-playing-games-rpg&ordering=-rating&metacritic=75,100&page_size=8`),fg(`&genres=indie&ordering=-rating&metacritic=75,100&page_size=8`)
    ]).then(([p,b,n,u,a,r,i])=>{setPop(p.map(nm));setBest(b.map(nm));setFresh(n.map(nm));setSoon(u.map(nm));setActG(a.map(nm));setRpg(r.map(nm));setIndie(i.map(nm));setLd(false)})},[]);

  useEffect(()=>{if(stt.current)clearTimeout(stt.current);if(!q.trim()){setSr([]);setPSr([]);setLSr([]);return}setSng(true);
    stt.current=setTimeout(async()=>{const[g,p,l]=await Promise.all([sga(q),searchPeople(q),searchLists(q)]);setSr(g.map(nm));setPSr(p);setLSr(l);setSng(false)},400)},[q]);

  const all=[...pop,...best,...fresh,...soon,...actG,...rpg,...indie,...sr];
  const lib=Object.entries(ud).filter(([_,v])=>v.status).map(([id,v])=>{const f=all.find(g=>g.id===parseInt(id));return f||{id:parseInt(id),t:v.title||"?",img:v.img||"",y:"",genre:"",r:null,pf:[]}});
  const flib=lf==="all"?lib:lib.filter(g=>ud[g.id]?.status===lf);
  const so=async()=>{await supabase.auth.signOut();setUser(null);setUd({});setProf(null);setPg("home")};
  const dn=prof?.display_name||user?.user_metadata?.display_name||"";
  const hcl=async()=>{if(!nLN.trim()||!user)return;const{data}=await createList(user.id,nLN);if(data)setMyL([...myL,data]);setNLN("")};
  const NAV=user?[{id:"home",i:"🏠",l:"Home"},{id:"explore",i:"🔍",l:"Explore"},{id:"feed",i:"⚡",l:"Activity"},{id:"library",i:"📚",l:"Library"},{id:"profile",i:"👤",l:"Profile"}]:[{id:"home",i:"🏠",l:"Home"},{id:"explore",i:"🔍",l:"Explore"}];
  const secGrid=(d,n=5)=><div style={{display:"grid",gridTemplateColumns:m?`repeat(3,1fr)`:`repeat(${n},1fr)`,gap:m?8:12}}>{d.slice(0,m?6:n).map((g,i)=><GC key={g.id} game={g} delay={i*20} onClick={setSel} mobile={m} ud={ud}/>)}</div>;

  return<div className="gbx" style={{fontFamily:"'DM Sans','Outfit',system-ui,sans-serif",color:"#fff",minHeight:"100vh"}}>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,100..1000&family=Outfit:wght@100..900&display=swap');
      *{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:3px;height:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.08);border-radius:2px}
      @keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
      @keyframes slideFromBottom{from{transform:translateY(100%)}to{transform:translateY(0)}}@keyframes spin{to{transform:rotate(360deg)}}
      body{margin:0;overflow-x:hidden}img{-webkit-user-drag:none}.hs::-webkit-scrollbar{display:none}.hs{-ms-overflow-style:none;scrollbar-width:none}
      @media(max-width:767px){*{-webkit-tap-highlight-color:transparent}}input::placeholder,textarea::placeholder{color:rgba(255,255,255,.15)}
      .gbx{background:#0f0c19;background-image:radial-gradient(ellipse 70% 50% at 20% 0%,rgba(103,232,249,.06),transparent),radial-gradient(ellipse 50% 40% at 80% 10%,rgba(129,140,248,.06),transparent),radial-gradient(ellipse 60% 50% at 50% 100%,rgba(196,181,253,.04),transparent);background-attachment:fixed}
      .sec-title{font-size:13px;font-weight:800;color:rgba(255,255,255,.25);letter-spacing:.12em;margin-bottom:12px;display:flex;align-items:center;gap:8px}
      .sec-title::before{content:'';width:16px;height:2px;background:linear-gradient(90deg,#67e8f9,#818cf8);border-radius:1px}`}</style>

    {sa&&<Auth onClose={()=>setSa(false)} onAuth={u=>{setUser(u);setSa(false)}}/>}
    {ep&&<EP prof={prof} onClose={()=>setEp(false)} userId={user?.id} onDone={reloadProf}/>}

    {/* Nav */}
    {!m&&<nav style={{position:"sticky",top:0,zIndex:100,background:"rgba(15,12,25,.8)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,.04)",padding:"0 28px",height:52,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:24}}>
        <span onClick={()=>{setPg("home");setQ("");setViewUID(null)}} style={{fontFamily:"'Outfit'",fontSize:18,fontWeight:900,cursor:"pointer",background:"linear-gradient(135deg,#67e8f9,#818cf8)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>gameboxed</span>
        <div style={{display:"flex",gap:2}}>{NAV.filter(n=>n.id!=="profile").map(n=><button key={n.id} onClick={()=>{setPg(n.id);setQ("");setViewUID(null)}} style={{padding:"6px 14px",borderRadius:20,border:"none",background:pg===n.id?"rgba(255,255,255,.06)":"transparent",color:pg===n.id?"#fff":"rgba(255,255,255,.3)",cursor:"pointer",fontSize:12,fontWeight:700}}>{n.l}</button>)}</div></div>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{position:"relative"}}><input placeholder="Search..." value={q} onChange={e=>{setQ(e.target.value);if(e.target.value){setPg("search");setViewUID(null)}}}
          style={{padding:"8px 14px 8px 32px",borderRadius:14,...glass,color:"#fff",fontSize:12,width:200,outline:"none"}}/>
          <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",fontSize:12,color:"rgba(255,255,255,.2)"}}>🔍</span></div>
        {user?<Av url={prof?.avatar_url} name={dn} size={30} onClick={()=>{setPg("profile");setViewUID(null)}} v={avV}/>
          :<button onClick={()=>setSa(true)} style={{padding:"7px 18px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#67e8f9,#818cf8)",color:"#0f0c19",fontSize:12,fontWeight:800,cursor:"pointer"}}>Sign In</button>}</div></nav>}

    {m&&<div style={{position:"sticky",top:0,zIndex:100,background:"rgba(15,12,25,.85)",backdropFilter:"blur(20px)",padding:"0 14px",height:48,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid rgba(255,255,255,.04)"}}>
      {qO?<div style={{flex:1,display:"flex",alignItems:"center",gap:6}}>
        <input autoFocus placeholder="Search..." value={q} onChange={e=>{setQ(e.target.value);if(e.target.value){setPg("search");setViewUID(null)}}}
          style={{flex:1,padding:"8px 14px",borderRadius:14,...glass,color:"#fff",fontSize:14,outline:"none"}}/>
        <span onClick={()=>{setQO(false);setQ("");setPg("home")}} style={{color:"#67e8f9",fontSize:12,fontWeight:700,cursor:"pointer"}}>✕</span></div>
      :<><span onClick={()=>{setPg("home");setViewUID(null)}} style={{fontFamily:"'Outfit'",fontSize:16,fontWeight:900,cursor:"pointer",background:"linear-gradient(135deg,#67e8f9,#818cf8)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>gameboxed</span>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span onClick={()=>{setQO(true);setPg("search");setViewUID(null)}} style={{fontSize:15,cursor:"pointer",color:"rgba(255,255,255,.3)"}}>🔍</span>
          {user?<Av url={prof?.avatar_url} name={dn} size={26} onClick={()=>{setPg("profile");setViewUID(null)}} v={avV}/>
            :<span onClick={()=>setSa(true)} style={{fontSize:12,background:"linear-gradient(135deg,#67e8f9,#818cf8)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontWeight:800,cursor:"pointer"}}>Sign In</span>}</div></>}</div>}

    <main style={{maxWidth:1200,margin:"0 auto",padding:m?"8px 12px 86px":"16px 28px 44px"}}>

      {/* SEARCH */}
      {pg==="search"&&<div style={{animation:"fadeIn .15s"}}>
        <div style={{display:"flex",gap:4,marginBottom:16}}>
          {[{k:"games",l:"Games",c:sr.length},{k:"people",l:"People",c:pSr.length},{k:"lists",l:"Lists",c:lSr.length}].map(t=>
            <button key={t.k} onClick={()=>setST(t.k)} style={{padding:"8px 16px",borderRadius:20,border:"none",background:sT===t.k?"rgba(255,255,255,.06)":"transparent",color:sT===t.k?"#fff":"rgba(255,255,255,.3)",fontSize:13,fontWeight:700,cursor:"pointer"}}>{t.l}{q&&!sng&&t.c>0?` ${t.c}`:""}</button>)}</div>
        {sng?<Loader/>:<>
          {sT==="games"&&(sr.length?<div style={{display:"grid",gridTemplateColumns:m?"repeat(3,1fr)":"repeat(auto-fill,minmax(140px,1fr))",gap:m?8:12}}>{sr.map((g,i)=><GC key={g.id} game={g} delay={i*12} onClick={setSel} mobile={m} ud={ud}/>)}</div>:q&&<p style={{textAlign:"center",padding:40,color:"rgba(255,255,255,.15)"}}>No games found</p>)}
          {sT==="people"&&(pSr.length?<div style={{display:"flex",flexDirection:"column",gap:8}}>{pSr.map(p=>
            <div key={p.id} onClick={()=>goUser(p.id)} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",borderRadius:16,...glass,cursor:"pointer",transition:"border .2s"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(103,232,249,.15)"} onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(255,255,255,.06)"}>
              <Av url={p.avatar_url} name={p.display_name} size={44} v={avV}/><div style={{flex:1}}><div style={{fontSize:15,fontWeight:700}}>{p.display_name}</div>{p.username&&<div style={{fontSize:12,color:"rgba(255,255,255,.25)"}}>@{p.username}</div>}{p.bio&&<div style={{fontSize:11,color:"rgba(255,255,255,.3)",marginTop:2}}>{p.bio.slice(0,60)}</div>}</div>
              <span style={{color:"#67e8f9",fontSize:12}}>View →</span></div>)}</div>:q&&<p style={{textAlign:"center",padding:40,color:"rgba(255,255,255,.15)"}}>No people</p>)}
          {sT==="lists"&&(lSr.length?<div style={{display:"flex",flexDirection:"column",gap:8}}>{lSr.map(l=><div key={l.id} style={{padding:"14px 16px",borderRadius:16,...glass}}>
            <div style={{fontSize:15,fontWeight:700}}>📝 {l.title}</div><div style={{fontSize:11,color:"rgba(255,255,255,.25)",marginTop:4}}>{l.game_ids?.length||0} games · {l.profiles?.display_name}</div></div>)}</div>:q&&<p style={{textAlign:"center",padding:40,color:"rgba(255,255,255,.15)"}}>No lists</p>)}
        </>}</div>}

      {/* HOME — 3 column: news | games | activity */}
      {pg==="home"&&<div style={{animation:"fadeIn .2s"}}>
        {!user&&!ld&&<div style={{textAlign:"center",padding:m?"24px 0":"40px 0 36px",marginBottom:m?16:24}}>
          <h1 style={{fontFamily:"'Outfit'",fontSize:m?28:52,fontWeight:900,lineHeight:1.05,letterSpacing:"-.02em"}}>Track your<br/><span style={{background:"linear-gradient(135deg,#67e8f9,#818cf8,#c4b5fd)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>gaming journey</span></h1>
          <p style={{color:"rgba(255,255,255,.3)",fontSize:m?14:16,marginTop:12,maxWidth:400,margin:"12px auto 20px"}}>Rate, review, and share. Build your gaming identity.</p>
          <button onClick={()=>setSa(true)} style={{padding:"14px 36px",borderRadius:16,border:"none",background:"linear-gradient(135deg,#67e8f9,#818cf8)",color:"#0f0c19",fontSize:16,fontWeight:800,cursor:"pointer",boxShadow:"0 8px 32px rgba(103,232,249,.2)"}}>Get Started — Free</button></div>}

        {ld?<Loader/>:<div style={{display:m?"block":"grid",gridTemplateColumns:"220px 1fr 260px",gap:20}}>
          {/* LEFT: News */}
          {!m&&<aside>
            <div className="sec-title">📰 GAME NEWS</div>
            {news.map((n,i)=><div key={i} style={{...glass,borderRadius:12,overflow:"hidden",marginBottom:10,cursor:"pointer"}}
              onClick={()=>{const g=all.find(x=>x.id===n.id);if(g)setSel(g)}}>
              {n.img&&<img src={n.img} style={{width:"100%",height:80,objectFit:"cover"}}/>}
              <div style={{padding:"8px 10px"}}>
                <div style={{fontSize:12,fontWeight:700,lineHeight:1.3}}>{n.title}</div>
                <div style={{fontSize:9,color:"rgba(255,255,255,.25)",marginTop:3}}>{n.date} · {n.genre}</div>
                {n.mc&&<div style={{marginTop:3}}><span style={{fontSize:9,fontWeight:800,padding:"2px 6px",borderRadius:4,background:n.mc>=75?"rgba(110,231,183,.12)":"rgba(253,230,138,.12)",color:n.mc>=75?"#6ee7b7":"#fde68a"}}>MC {n.mc}</span></div>}
              </div></div>)}
          </aside>}

          {/* CENTER: Games */}
          <div>
            {pop[0]&&<div style={{marginBottom:m?16:24}}><GC game={pop[0]} onClick={setSel} mobile={m} ud={ud} big delay={0}/></div>}
            <div className="sec-title">POPULAR</div>{secGrid(pop.slice(1),5)}<div style={{height:20}}/>
            <div className="sec-title">NEW RELEASES</div>{secGrid(fresh,5)}<div style={{height:20}}/>
            {best[0]&&<div style={{marginBottom:24}}><GC game={best[0]} onClick={setSel} mobile={m} ud={ud} big delay={0}/></div>}
            <div className="sec-title">ALL-TIME BEST</div>{secGrid(best.slice(1),5)}<div style={{height:20}}/>
            <div className="sec-title">COMING SOON</div>
            <div style={{display:"grid",gridTemplateColumns:m?"repeat(4,1fr)":"repeat(6,1fr)",gap:m?8:10,marginBottom:24}}>{soon.slice(0,m?8:6).map((g,i)=><TC key={g.id} game={g} onClick={setSel} delay={i*15} m={m} ud={ud}/>)}</div>
            <div className="sec-title">ACTION</div>{secGrid(actG,5)}<div style={{height:20}}/>
            <div className="sec-title">RPG</div>{secGrid(rpg,5)}<div style={{height:20}}/>
            <div className="sec-title">INDIE</div>{secGrid(indie,5)}

            {/* Mobile news */}
            {m&&news.length>0&&<><div style={{height:20}}/><div className="sec-title">📰 GAME NEWS</div>
              <div className="hs" style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:8}}>
                {news.map((n,i)=><div key={i} style={{...glass,borderRadius:12,overflow:"hidden",minWidth:180,flexShrink:0,cursor:"pointer"}}
                  onClick={()=>{const g=all.find(x=>x.id===n.id);if(g)setSel(g)}}>
                  {n.img&&<img src={n.img} style={{width:"100%",height:80,objectFit:"cover"}}/>}
                  <div style={{padding:"8px 10px"}}><div style={{fontSize:12,fontWeight:700,lineHeight:1.3}}>{n.title}</div>
                    <div style={{fontSize:9,color:"rgba(255,255,255,.25)",marginTop:3}}>{n.date}</div></div></div>)}</div></>}
          </div>

          {/* RIGHT: Activity + Reviews */}
          {!m&&<aside>
            {rRev.length>0&&<div style={{marginBottom:24}}><div className="sec-title">💬 REVIEWS</div>
              {rRev.slice(0,5).map(r=><div key={r.id} style={{...glass,padding:"12px",borderRadius:14,marginBottom:8}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                  <Av url={r.profiles?.avatar_url} name={r.profiles?.display_name} size={20} onClick={()=>goUser(r.user_id)} v={avV}/>
                  <span style={{fontSize:11,fontWeight:700,flex:1,cursor:"pointer"}} onClick={()=>goUser(r.user_id)}>{r.profiles?.display_name}</span>
                  {r.rating>0&&<span style={{fontSize:9,color:"#fde68a"}}>★{r.rating}</span>}<span style={{fontSize:9,color:"rgba(255,255,255,.1)"}}>{tA(r.created_at)}</span></div>
                <div style={{fontSize:11,color:"#67e8f9",fontWeight:700,marginBottom:3}}>{r.game_title}</div>
                <p style={{fontSize:11,color:"rgba(255,255,255,.35)",lineHeight:1.4,margin:0,overflow:"hidden",textOverflow:"ellipsis",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{r.text}</p></div>)}</div>}
            <div className="sec-title">⚡ ACTIVITY</div>
            {feed.slice(0,10).map(a=><div key={a.id} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:"1px solid rgba(255,255,255,.03)",fontSize:11}}>
              <Av url={a.profiles?.avatar_url} name={a.profiles?.display_name} size={20} onClick={()=>goUser(a.user_id)} v={avV}/>
              <div style={{flex:1,minWidth:0}}><span style={{fontWeight:700,cursor:"pointer"}} onClick={()=>goUser(a.user_id)}>{a.profiles?.display_name}</span>
                <span style={{color:"rgba(255,255,255,.15)"}}> {a.action} </span>{a.game_title&&<span style={{color:"#67e8f9"}}>{a.game_title}</span>}</div>
              <span style={{fontSize:9,color:"rgba(255,255,255,.08)",flexShrink:0}}>{tA(a.created_at)}</span></div>)}
          </aside>}
        </div>}</div>}

      {/* FEED */}
      {pg==="feed"&&user&&<div style={{animation:"fadeIn .15s"}}>
        <h2 style={{fontFamily:"'Outfit'",fontSize:m?20:24,fontWeight:900,marginBottom:16}}>Activity</h2>
        {feed.length?feed.map(a=><div key={a.id} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderRadius:14,...glass,marginBottom:5}}>
          <Av url={a.profiles?.avatar_url} name={a.profiles?.display_name} size={28} onClick={()=>goUser(a.user_id)} v={avV}/>
          {a.game_img&&<img src={a.game_img} style={{width:32,height:18,borderRadius:4,objectFit:"cover"}}/>}
          <div style={{flex:1,fontSize:12}}><span style={{fontWeight:700,cursor:"pointer"}} onClick={()=>goUser(a.user_id)}>{a.profiles?.display_name}</span>
            <span style={{color:"rgba(255,255,255,.2)"}}> {a.action} </span>{a.game_title&&<span style={{color:"#67e8f9",fontWeight:700}}>{a.game_title}</span>}</div>
          <span style={{fontSize:10,color:"rgba(255,255,255,.1)"}}>{tA(a.created_at)}</span></div>)
        :<p style={{textAlign:"center",padding:40,color:"rgba(255,255,255,.15)"}}>No activity yet</p>}</div>}

      {/* EXPLORE */}
      {pg==="explore"&&<div style={{animation:"fadeIn .15s"}}>
        <h2 style={{fontFamily:"'Outfit'",fontSize:m?20:24,fontWeight:900,marginBottom:16}}>Explore</h2>
        {ld?<Loader/>:<>{[{t:"HIGHEST RATED",d:best},{t:"POPULAR",d:pop},{t:"NEW",d:fresh},{t:"ACTION",d:actG},{t:"RPG",d:rpg},{t:"INDIE",d:indie}].map(s=>
          <div key={s.t} style={{marginBottom:24}}><div className="sec-title">{s.t}</div>
            <div style={{display:"grid",gridTemplateColumns:m?"repeat(3,1fr)":"repeat(auto-fill,minmax(140px,1fr))",gap:m?8:12}}>{s.d.map((g,i)=><GC key={g.id} game={g} delay={i*12} onClick={setSel} mobile={m} ud={ud}/>)}</div></div>)}</>}</div>}

      {/* LIBRARY */}
      {pg==="library"&&user&&<div style={{animation:"fadeIn .15s"}}>
        <h2 style={{fontFamily:"'Outfit'",fontSize:m?20:24,fontWeight:900,marginBottom:16}}>Library</h2>
        {lib.length?<><div className="hs" style={{display:"flex",gap:5,marginBottom:14,overflowX:"auto"}}>
          {[["all","All"],["playing","Playing"],["completed","Completed"],["backlog","Backlog"],["wishlist","Wishlist"],["dropped","Dropped"]].map(([k,l])=>
            <button key={k} onClick={()=>setLf(k)} style={{padding:"6px 14px",borderRadius:20,fontSize:12,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",border:"none",background:lf===k?"rgba(103,232,249,.12)":"rgba(255,255,255,.04)",color:lf===k?"#67e8f9":"rgba(255,255,255,.25)"}}>{l} {k==="all"?lib.length:lib.filter(g=>ud[g.id]?.status===k).length}</button>)}</div>
          <div style={{display:"grid",gridTemplateColumns:m?"repeat(3,1fr)":"repeat(auto-fill,minmax(140px,1fr))",gap:m?8:12}}>{flib.map((g,i)=><GC key={g.id} game={g} delay={i*12} onClick={setSel} mobile={m} ud={ud}/>)}</div>
        </>:<p style={{textAlign:"center",padding:40,color:"rgba(255,255,255,.15)"}}>Search and add games</p>}</div>}

      {/* VIEW OTHER USER — full page */}
      {pg==="viewuser"&&viewUID&&<div style={{animation:"fadeIn .15s"}}>
        <button onClick={()=>{setPg("home");setViewUID(null)}} style={{display:"flex",alignItems:"center",gap:4,padding:"6px 12px",borderRadius:10,...glass,color:"rgba(255,255,255,.5)",fontSize:12,fontWeight:700,cursor:"pointer",marginBottom:12,border:"none"}}>← Back</button>
        <ProfilePage viewId={viewUID} me={user} m={m} ud={ud} goUser={goUser} avV={avV} allGames={all}/>
      </div>}

      {/* MY PROFILE — full page */}
      {pg==="profile"&&user&&<div style={{animation:"fadeIn .15s"}}>
        <ProfilePage viewId={user.id} me={user} m={m} ud={ud} goUser={goUser} avV={avV} onEdit={()=>setEp(true)} onSignOut={so} allGames={all}/>
        {/* Lists section */}
        <div style={{marginTop:24}}><div className="sec-title">📝 LISTS</div>
          {myL.map(l=><div key={l.id} style={{...glass,padding:"12px 14px",borderRadius:12,marginBottom:5,fontSize:14,fontWeight:700}}>📝 {l.title}</div>)}
          <div style={{display:"flex",gap:6,marginTop:8}}><input placeholder="New list..." value={nLN} onChange={e=>setNLN(e.target.value)} onKeyDown={e=>e.key==="Enter"&&hcl()}
            style={{flex:1,padding:"10px 14px",borderRadius:12,...glass,color:"#fff",fontSize:13,outline:"none"}}/>
            <button onClick={hcl} style={{padding:"10px 16px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#67e8f9,#818cf8)",color:"#0f0c19",fontSize:12,fontWeight:800,cursor:"pointer"}}>Create</button></div></div>
      </div>}

      {/* STATS */}
      {pg==="stats"&&user&&<div style={{animation:"fadeIn .15s"}}>
        <h2 style={{fontFamily:"'Outfit'",fontSize:m?20:24,fontWeight:900,marginBottom:16}}>Stats</h2>
        {lib.length?(()=>{const bs=s=>lib.filter(g=>ud[g.id]?.status===s).length;const rt=lib.filter(g=>ud[g.id]?.myRating);const av=rt.length?(rt.reduce((s,g)=>s+ud[g.id].myRating,0)/rt.length).toFixed(1):"—";
          return<><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:m?8:12,marginBottom:24}}>
            {[{l:"Games",v:lib.length,c:"#67e8f9"},{l:"Done",v:bs("completed"),c:"#6ee7b7"},{l:"Playing",v:bs("playing"),c:"#c4b5fd"},{l:"Avg ★",v:av,c:"#fde68a"}].map((s,i)=>
              <div key={i} style={{...glass,padding:m?12:16,borderRadius:16,textAlign:"center"}}>
                <div style={{fontSize:m?20:26,fontWeight:900,color:s.c}}>{s.v}</div><div style={{fontSize:10,color:"rgba(255,255,255,.25)",marginTop:2}}>{s.l}</div></div>)}</div>
            {Object.entries(SC).map(([k,c])=>{const cn=bs(k),mx=lib.length||1;
              return<div key={k} style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                <span style={{width:70,fontSize:12,color:"rgba(255,255,255,.3)",fontWeight:600,textAlign:"right"}}>{c.l}</span>
                <div style={{flex:1,height:20,background:"rgba(255,255,255,.03)",borderRadius:10,overflow:"hidden"}}>
                  <div style={{height:"100%",width:cn?(cn/mx*100)+"%":"0%",background:c.c,borderRadius:10,opacity:.4,transition:"width .6s"}}></div></div>
                <span style={{fontSize:11,color:"rgba(255,255,255,.2)",width:20}}>{cn}</span></div>})}</>
        })():<p style={{textAlign:"center",padding:40,color:"rgba(255,255,255,.15)"}}>Add games to see stats</p>}</div>}
    </main>

    {m&&<div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:90,background:"rgba(15,12,25,.92)",backdropFilter:"blur(16px)",borderTop:"1px solid rgba(255,255,255,.04)",display:"flex",paddingTop:5,paddingBottom:"max(env(safe-area-inset-bottom,12px),12px)"}}>
      {NAV.map(n=><div key={n.id} onClick={()=>{setPg(n.id);setQ("");setQO(false);setViewUID(null)}} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,cursor:"pointer",padding:"2px 0"}}>
        <span style={{fontSize:18,opacity:pg===n.id?1:.2}}>{n.i}</span>
        <span style={{fontSize:8,fontWeight:800,color:pg===n.id?"#67e8f9":"rgba(255,255,255,.15)"}}>{n.l}</span></div>)}</div>}

    {sel&&<GD game={sel} onClose={()=>setSel(null)} m={m} ud={ud} setUd={setUd} user={user} setSa={setSa} refresh={rf} goUser={goUser} avV={avV} myLists={myL} reloadLists={()=>user&&loadLists(user.id).then(setMyL)}/>}
  </div>}
