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
const removeGameFromList=async(listId,gameId)=>{const{data:list}=await supabase.from("lists").select("game_ids").eq("id",listId).single();const ids=(list?.game_ids||[]).filter(id=>id!==gameId);await supabase.from("lists").update({game_ids:ids}).eq("id",listId)};
const deleteList=async(listId)=>{await supabase.from("lists").delete().eq("id",listId)};
const renameList=async(listId,title)=>{await supabase.from("lists").update({title}).eq("id",listId)};
/* Favorites */
const loadFavs=async uid=>{const{data}=await supabase.from("favorites").select("*").eq("user_id",uid).order("position");return data||[]};
const addFav=async(uid,game)=>{const{data:existing}=await supabase.from("favorites").select("*").eq("user_id",uid);if((existing||[]).length>=4)return false;await supabase.from("favorites").insert({user_id:uid,game_id:game.id,game_title:game.t||game.title,game_img:game.img,position:(existing||[]).length});return true};
const removeFav=async(uid,gameId)=>{await supabase.from("favorites").delete().eq("user_id",uid).eq("game_id",gameId)};
const getUserFavs=async uid=>{const{data}=await supabase.from("favorites").select("*").eq("user_id",uid).order("position");return data||[]};
const postAct=async(uid,act,g,extra)=>{await supabase.from("activities").insert({user_id:uid,action:act,game_id:g?.id,game_title:g?.title||g?.t,game_img:g?.img,rating:g?.rating,extra_text:extra?.text,target_user_id:extra?.targetUserId,target_user_name:extra?.targetUserName})};
const _enrichActs=async data=>{if(!data?.length)return[];const uids=[...new Set(data.map(a=>a.user_id))];const{data:profs}=await supabase.from("profiles").select("id,display_name,username,avatar_url").in("id",uids);const pm={};(profs||[]).forEach(p=>pm[p.id]=p);return data.map(a=>({...a,profiles:pm[a.user_id]||null}))};
const loadFeed=async uid=>{const{data:fo}=await supabase.from("follows").select("following_id").eq("follower_id",uid);const ids=[uid,...(fo||[]).map(f=>f.following_id)];const{data}=await supabase.from("activities").select("*").in("user_id",ids).order("created_at",{ascending:false}).limit(40);return _enrichActs(data)};
const loadAllFeed=async()=>{const{data}=await supabase.from("activities").select("*").order("created_at",{ascending:false}).limit(40);return _enrichActs(data)};
const loadGR=async gid=>{const{data}=await supabase.from("reviews").select("*").eq("game_id",gid).order("created_at",{ascending:false}).limit(20);
  if(!data?.length)return[];const uids=[...new Set(data.map(r=>r.user_id))];const{data:profs}=await supabase.from("profiles").select("id,display_name,username,avatar_url").in("id",uids);
  const pm={};(profs||[]).forEach(p=>pm[p.id]=p);return data.map(r=>({...r,profiles:pm[r.user_id]||null}))};
const postRev=async(uid,g,r,t)=>{await supabase.from("reviews").insert({user_id:uid,game_id:g.id,game_title:g.t||g.title,game_img:g.img,rating:r,text:t});await postAct(uid,"reviewed",{id:g.id,title:g.t||g.title,img:g.img})};
const loadRR=async()=>{const{data}=await supabase.from("reviews").select("*").order("created_at",{ascending:false}).limit(10);
  if(!data?.length)return[];const uids=[...new Set(data.map(r=>r.user_id))];const{data:profs}=await supabase.from("profiles").select("id,display_name,username,avatar_url").in("id",uids);
  const pm={};(profs||[]).forEach(p=>pm[p.id]=p);return data.map(r=>({...r,profiles:pm[r.user_id]||null}))};
const followU=async(a,b)=>await supabase.from("follows").insert({follower_id:a,following_id:b});
const unfollowU=async(a,b)=>await supabase.from("follows").delete().eq("follower_id",a).eq("following_id",b);
const chkF=async(a,b)=>{const{data}=await supabase.from("follows").select("id").eq("follower_id",a).eq("following_id",b).single();return!!data};
const getFC=async u=>{const{count:a}=await supabase.from("follows").select("*",{count:"exact",head:true}).eq("following_id",u);const{count:b}=await supabase.from("follows").select("*",{count:"exact",head:true}).eq("follower_id",u);return{followers:a||0,following:b||0}};
const getUG=async u=>{const{data}=await supabase.from("user_games").select("*").eq("user_id",u).order("updated_at",{ascending:false});return data||[]};
const getFollowersList=async u=>{const{data}=await supabase.from("follows").select("follower_id").eq("following_id",u);if(!data?.length)return[];const{data:p}=await supabase.from("profiles").select("*").in("id",data.map(r=>r.follower_id));return p||[]};
const getFollowingList=async u=>{const{data}=await supabase.from("follows").select("following_id").eq("follower_id",u);if(!data?.length)return[];const{data:p}=await supabase.from("profiles").select("*").in("id",data.map(r=>r.following_id));return p||[]};
const getUserActs=async u=>{const{data}=await supabase.from("activities").select("*").eq("user_id",u).order("created_at",{ascending:false}).limit(50);return data||[]};
const getUserRevs=async u=>{const{data}=await supabase.from("reviews").select("*").eq("user_id",u).order("created_at",{ascending:false}).limit(20);return data||[]};
const deleteRev=async id=>{await supabase.from("reviews").delete().eq("id",id)};
const updateRev=async(id,fields)=>{await supabase.from("reviews").update(fields).eq("id",id)};

/* Diary */
const loadDiary=async uid=>{const{data}=await supabase.from("diary").select("*").eq("user_id",uid).order("played_on",{ascending:false}).limit(50);return data||[]};
const addDiary=async(uid,entry)=>supabase.from("diary").insert({user_id:uid,...entry});
const deleteDiary=async id=>supabase.from("diary").delete().eq("id",id);

/* Review Likes */
const likeRev=async(uid,revId)=>{await supabase.from("review_likes").insert({user_id:uid,review_id:revId});await supabase.rpc("increment_likes",{rev_id:revId}).catch(()=>{})};
const unlikeRev=async(uid,revId)=>{await supabase.from("review_likes").delete().eq("user_id",uid).eq("review_id",revId)};
const getRevLikes=async revId=>{const{count}=await supabase.from("review_likes").select("*",{count:"exact",head:true}).eq("review_id",revId);return count||0};
const didLike=async(uid,revId)=>{const{data}=await supabase.from("review_likes").select("id").eq("user_id",uid).eq("review_id",revId).single();return!!data};

/* Review Comments */
const loadComments=async revId=>{const{data}=await supabase.from("review_comments").select("*").eq("review_id",revId).order("created_at",{ascending:true}).limit(30);
  if(!data?.length)return[];const uids=[...new Set(data.map(c=>c.user_id))];const{data:profs}=await supabase.from("profiles").select("id,display_name,username,avatar_url").in("id",uids);
  const pm={};(profs||[]).forEach(p=>pm[p.id]=p);return data.map(c=>({...c,profiles:pm[c.user_id]||null}))};
const postComment=async(uid,revId,text)=>supabase.from("review_comments").insert({user_id:uid,review_id:revId,text});
const deleteComment=async id=>supabase.from("review_comments").delete().eq("id",id);

/* Notifications */
const loadNotifs=async uid=>{const{data}=await supabase.from("notifications").select("*").eq("user_id",uid).order("created_at",{ascending:false}).limit(30);
  if(!data?.length)return[];
  // Get sender profiles
  const senderIds=[...new Set(data.filter(n=>n.from_user_id).map(n=>n.from_user_id))];
  const{data:senders}=senderIds.length?await supabase.from("profiles").select("id,display_name,avatar_url").in("id",senderIds):{data:[]};
  const sm={};(senders||[]).forEach(s=>sm[s.id]=s);
  return data.map(n=>({...n,from:sm[n.from_user_id]||null}))};
const unreadCount=async uid=>{const{count}=await supabase.from("notifications").select("*",{count:"exact",head:true}).eq("user_id",uid).eq("read",false);return count||0};
const markRead=async uid=>supabase.from("notifications").update({read:true}).eq("user_id",uid).eq("read",false);
const sendNotif=async(toUid,fromUid,type,msg,extra)=>supabase.from("notifications").insert({user_id:toUid,from_user_id:fromUid,type,message:msg,game_title:extra?.game,review_id:extra?.revId});

/* Banner */
const upBanner=async(uid,file)=>{const p=`${uid}/banner.${file.name.split(".").pop()}`;try{await supabase.storage.from("avatars").remove([p])}catch{};const{error}=await supabase.storage.from("avatars").upload(p,file,{cacheControl:"no-cache",upsert:true});if(error)throw error;await supabase.from("profiles").update({banner_url:p}).eq("id",uid);return p};
const bannerUrl=(url,v)=>url?`${SU}/storage/v1/object/public/avatars/${url}?v=${v||1}`:null;

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

/* Steam API */
const steamAPI=async(params)=>{const r=await fetch(`/api/steam?${new URLSearchParams(params)}`);return r.json()};
const resolveSteamId=async(input)=>{
  if(/^\d{17}$/.test(input))return input;
  const d=await steamAPI({action:"resolve",vanity:input});
  return d.success===1?d.steamid:null;
};
const getSteamGames=async(steamid)=>steamAPI({action:"games",steamid});
const getSteamProfile=async(steamid)=>steamAPI({action:"profile",steamid});
const getSteamRecent=async(steamid)=>steamAPI({action:"recent",steamid});
const getSteamAchievements=async(steamid,appid)=>steamAPI({action:"achievements",steamid,appid});
const importSteamGames=async(uid,steamid)=>{
  const{games}=await getSteamGames(steamid);
  for(const g of games.slice(0,50)){
    const sr=await fetch(`${AP}/games?key=${AK}&search=${encodeURIComponent(g.name)}&page_size=1&search_precise=true`);
    const sd=await sr.json();const match=sd.results?.[0];
    if(match){
      const{data:ex}=await supabase.from("user_games").select("id").eq("user_id",uid).eq("game_id",match.id).single();
      if(!ex){await supabase.from("user_games").insert({user_id:uid,game_id:match.id,game_title:match.name,game_img:match.background_image,status:g.playtime>120?"completed":g.playtime>30?"playing":"backlog",my_rating:null,steam_playtime:g.playtime,steam_appid:g.appid})}
      else{await supabase.from("user_games").update({steam_playtime:g.playtime,steam_appid:g.appid}).eq("id",ex.id)}
    }
  }
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
const actIcon=a=>{const m={"rated":"⭐","reviewed":"✍️","completed":"🏆","started":"🎮","started playing":"🎮","added to wishlist":"🕐","added to backlog":"📋","added to list":"📝","followed":"👥","favorited":"💛","dropped":"❌","logged":"📖"};return m[a]||"📌"};
const actLabel=a=>{const m={"rated":"rated","reviewed":"reviewed","completed":"completed","started":"started playing","started playing":"started playing","added to wishlist":"wishlisted","added to backlog":"added to backlog","added to list":"added to list","followed":"followed","favorited":"added to favorites","dropped":"dropped","logged":"logged"};return m[a]||a};

const Stars=({rating=0,size=14,interactive,onRate,show})=>{const[h,setH]=useState(0);const a=h||rating;
  const c=(s,e)=>{if(!interactive||!onRate)return;const r=e.currentTarget.getBoundingClientRect();onRate(e.clientX-r.left<r.width/2?s-.5:s)};
  return<div style={{display:"flex",gap:1,alignItems:"center"}}>{[1,2,3,4,5].map(s=>{const f=s<=Math.floor(a),hf=!f&&s-.5<=a&&s>a-.5;
    return<span key={s} onClick={e=>c(s,e)} onMouseEnter={()=>interactive&&setH(s)} onMouseLeave={()=>interactive&&setH(0)}
      style={{fontSize:size,cursor:interactive?"pointer":"default",position:"relative",lineHeight:1,color:f||hf?"#fde68a":"rgba(255,255,255,.08)",transition:"all .12s",transform:interactive&&s<=Math.ceil(h)?"scale(1.15)":"scale(1)"}}>
      {hf?<><span style={{position:"absolute",overflow:"hidden",width:"50%"}}>★</span><span style={{color:"rgba(255,255,255,.08)"}}>★</span></>:"★"}</span>})}
    {(interactive||show)&&a>0&&<span style={{fontSize:size*.7,color:"#fde68a",fontWeight:700,marginLeft:3}}>{a}</span>}</div>};

const Loader=()=><div style={{display:"flex",justifyContent:"center",padding:32}}><div style={{width:24,height:24,border:"2.5px solid rgba(255,255,255,.05)",borderTopColor:"#67e8f9",borderRadius:"50%",animation:"spin .7s linear infinite"}}/></div>;
const Av=({url,name,size=32,onClick,v})=>{const s=avUrl(url,v);return<div onClick={onClick} style={{width:size,height:size,borderRadius:size*.3,background:s?"rgba(255,255,255,.05)":"linear-gradient(135deg,#67e8f9,#818cf8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.38,fontWeight:800,cursor:onClick?"pointer":"default",overflow:"hidden",flexShrink:0,color:"#fff"}}>{s?<img src={s} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:(name||"?").charAt(0).toUpperCase()}</div>};

/* IGDB Cover Cache — proper portrait covers for ALL platforms */
const coverCache={};
const getIGDBCover=async(name)=>{if(!name)return null;const k=name.toLowerCase();if(coverCache[k]!==undefined)return coverCache[k];
  try{const r=await fetch(`/api/igdb?action=cover&name=${encodeURIComponent(name)}`);const d=await r.json();coverCache[k]=d.cover||null;return coverCache[k]}catch{coverCache[k]=null;return null}};
const useCover=(name,rawgImg)=>{const[src,setSrc]=useState(()=>{if(name&&coverCache[name.toLowerCase()])return coverCache[name.toLowerCase()];return null});const[loading,setLoading]=useState(true);
  useEffect(()=>{let c=true;
    if(name){const k=name.toLowerCase();
      if(coverCache[k]){setSrc(coverCache[k]);setLoading(false)}
      else if(coverCache[k]===null){setSrc(rawgImg);setLoading(false)}
      else{setLoading(true);setSrc(null);getIGDBCover(name).then(u=>{if(c){setSrc(u||rawgImg);setLoading(false)}})}}
    else{setSrc(rawgImg);setLoading(false)}
    return()=>{c=false}},[name,rawgImg]);return[src,loading]};

/* Platform icons */
const PlatIcon=({name,size=14})=>{const icons={PC:"🖥️",PS:"🎮",Xbox:"🟢",Switch:"🔴"};
  return<span style={{fontSize:size}} title={name}>{icons[name]||"🎮"}</span>};

/* Favorite Card with cover */
const FavCard=({fav,onClick,m})=>{const[cover,loading]=useCover(fav.game_title,fav.game_img);
  return<div onClick={onClick} style={{width:m?75:130,cursor:"pointer"}}>
    <div style={{borderRadius:m?8:10,overflow:"hidden",aspectRatio:"2/3",boxShadow:"0 4px 20px rgba(0,0,0,.4)",border:"2px solid rgba(253,230,138,.1)",transition:"transform .2s"}}
      onMouseEnter={e=>{if(!m)e.currentTarget.style.transform="scale(1.03)"}} onMouseLeave={e=>{if(!m)e.currentTarget.style.transform="scale(1)"}}>
      {loading?<div style={{width:"100%",height:"100%",background:"#1e1b2e",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{width:14,height:14,border:"2px solid rgba(255,255,255,.05)",borderTopColor:"#67e8f9",borderRadius:"50%",animation:"spin .7s linear infinite"}}/></div>
      :cover?<img src={cover} style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"top"}}/>:<div style={{width:"100%",height:"100%",background:"#1e1b2e"}}/>}</div>
    <div style={{fontSize:m?9:11,fontWeight:600,marginTop:5,lineHeight:1.3,color:"rgba(255,255,255,.5)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{fav.game_title}</div>
  </div>};

const GC=({game:g,onClick,delay=0,mobile:m,ud,big})=>{const[hov,setHov]=useState(false);const[vis,setVis]=useState(false);const[err,setErr]=useState(false);
  const[cover,loading]=useCover(big?null:g.t,g.img);
  useEffect(()=>{const t=setTimeout(()=>setVis(true),delay);return()=>clearTimeout(t)},[delay]);const u=ud?.[g.id];const imgSrc=big?g.img:cover;
  return<div onClick={()=>onClick?.(g)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
    style={{borderRadius:big?20:14,overflow:"hidden",cursor:"pointer",position:"relative",aspectRatio:big?"16/9":"2/3",
      opacity:vis?1:0,transform:vis?(hov&&!m?"translateY(-4px) scale(1.01)":"none"):"translateY(10px)",transition:"all .3s cubic-bezier(.4,0,.2,1)",
      boxShadow:hov?"0 20px 50px rgba(0,0,0,.5)":"0 4px 20px rgba(0,0,0,.2)"}}>
    {loading&&!big?<div style={{width:"100%",height:"100%",background:"linear-gradient(145deg,#1e1b2e,#2d2640)",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{width:14,height:14,border:"2px solid rgba(255,255,255,.05)",borderTopColor:"#67e8f9",borderRadius:"50%",animation:"spin .7s linear infinite"}}/></div>
    :!err&&imgSrc?<img src={imgSrc} alt={g.t} onError={()=>setErr(true)} loading="lazy"
      style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:big?"center":"top",transition:"transform .5s",transform:hov&&!m?"scale(1.05)":"scale(1)"}}/>
    :<div style={{width:"100%",height:"100%",background:"linear-gradient(145deg,#1e1b2e,#2d2640)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:big?40:24,color:"rgba(255,255,255,.05)"}}>🎮</div>}
    <div style={{position:"absolute",inset:0,background:big?"linear-gradient(to top,rgba(15,12,25,.95) 0%,rgba(15,12,25,.3) 40%,transparent 70%)":"linear-gradient(to top,rgba(15,12,25,.92) 0%,transparent 55%)"}}/>
    {g.r&&<div style={{position:"absolute",top:big?12:8,right:big?12:8,display:"flex",alignItems:"center",gap:3,padding:"4px 8px",borderRadius:20,...glass,background:"rgba(15,12,25,.6)"}}>
      <span style={{color:"#fde68a",fontSize:big?12:9,fontWeight:900}}>★</span><span style={{color:"#fff",fontSize:big?12:9,fontWeight:800}}>{g.r}</span></div>}
    {u?.status&&<div style={{position:"absolute",top:big?12:8,left:big?12:8,padding:"3px 10px",borderRadius:20,background:SC[u.status]?.c,fontSize:big?10:7,fontWeight:900,color:"#0f0c19"}}>{SC[u.status]?.l}</div>}
    <div style={{position:"absolute",bottom:0,left:0,right:0,padding:big?"20px 24px":"10px 12px"}}>
      {big&&<div style={{display:"inline-block",padding:"3px 10px",borderRadius:20,background:"linear-gradient(135deg,#67e8f9,#818cf8)",fontSize:9,fontWeight:800,color:"#0f0c19",marginBottom:6}}>TRENDING</div>}
      <h3 style={{fontSize:big?22:13,fontWeight:big?900:700,margin:0,lineHeight:1.2,color:"#fff"}}>{g.t}</h3>
      <div style={{fontSize:big?12:8,color:"rgba(255,255,255,.4)",marginTop:big?6:3}}>{g.y}{big&&g.genre?" · "+g.genre:""}</div>
      {!big&&g.pf?.length>0&&<div style={{display:"flex",gap:2,marginTop:2}}>{g.pf.slice(0,3).map((p,i)=><span key={i} style={{fontSize:6,fontWeight:800,padding:"1px 3px",borderRadius:3,background:"rgba(255,255,255,.06)",color:p.c}}>{p.n}</span>)}</div>}
    </div></div>};

const TC=({game:g,onClick,delay=0,m,ud})=>{const[vis,setVis]=useState(false);
  useEffect(()=>{const t=setTimeout(()=>setVis(true),delay);return()=>clearTimeout(t)},[delay]);
  return<div onClick={()=>onClick?.(g)} style={{opacity:vis?1:0,transform:vis?"none":"translateY(6px)",transition:"all .2s",cursor:"pointer",textAlign:"center"}}>
    <div style={{borderRadius:10,overflow:"hidden",aspectRatio:"1",marginBottom:4,position:"relative",boxShadow:"0 4px 12px rgba(0,0,0,.2)"}}>
      {g.img?<img src={g.img} style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"top"}}/>:<div style={{width:"100%",height:"100%",background:"#1e1b2e"}}/>}
      <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(15,12,25,.7) 0%,transparent 50%)"}}/>
    </div><div style={{fontSize:9,fontWeight:600,lineHeight:1.2,color:"rgba(255,255,255,.5)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.t}</div></div>};

/* Validation */
const validPw=p=>{if(p.length<8)return"Password must be at least 8 characters";if(!/[A-Z]/.test(p))return"Must include an uppercase letter";if(!/[a-z]/.test(p))return"Must include a lowercase letter";if(!/[0-9]/.test(p))return"Must include a number";return null};
const checkUnique=async(field,value,myId)=>{if(!value?.trim())return false;const{data}=await supabase.from("profiles").select("id").ilike(field,value.trim()).neq("id",myId||"00000000-0000-0000-0000-000000000000").limit(1);return data?.length>0};

/* Auth */
const Auth=({onClose,onAuth})=>{const[mode,setMode]=useState("login");const[email,setEmail]=useState("");const[pw,setPw]=useState("");const[name,setName]=useState("");const[err,setErr]=useState("");const[ld,setLd]=useState(false);const[sent,setSent]=useState(false);
  const go=async()=>{setErr("");
    if(mode==="signup"){
      if(!name.trim()){setErr("Name is required");return}
      const pwErr=validPw(pw);if(pwErr){setErr(pwErr);return}
      // Check unique name
      const nameTaken=await checkUnique("display_name",name);
      if(nameTaken){setErr("This name is already taken");return}
    }
    setLd(true);try{if(mode==="signup"){const{error:e}=await supabase.auth.signUp({email,password:pw,options:{data:{display_name:name}}});if(e)throw e;setSent(true)}else{const{data,error:e}=await supabase.auth.signInWithPassword({email,password:pw});if(e)throw e;onAuth(data.user);onClose()}}catch(e){setErr(e.message)}setLd(false)};
  const inp={width:"100%",padding:"14px 16px",borderRadius:12,border:"1px solid rgba(255,255,255,.08)",background:"rgba(255,255,255,.04)",color:"#fff",fontSize:14,outline:"none",marginBottom:12};
  return<div onClick={onClose} style={{position:"fixed",inset:0,zIndex:2000,background:"rgba(15,12,25,.95)",backdropFilter:"blur(24px)",display:"flex",alignItems:"center",justifyContent:"center",animation:"fadeIn .15s",padding:16}}>
    <div onClick={e=>e.stopPropagation()} style={{...glass,borderRadius:24,width:"100%",maxWidth:400,padding:"40px 32px",background:"rgba(30,27,46,.8)",animation:"slideUp .25s ease"}}>
      {sent?<div style={{textAlign:"center"}}><div style={{fontSize:48,marginBottom:16}}>✉️</div><h2 style={{fontSize:22,fontWeight:800}}>Check your inbox</h2><p style={{color:"rgba(255,255,255,.5)",fontSize:14,marginTop:8}}>Link sent to <span style={{color:"#67e8f9"}}>{email}</span></p>
        <button onClick={onClose} style={{marginTop:24,padding:"12px 28px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#67e8f9,#818cf8)",color:"#0f0c19",fontSize:14,fontWeight:800,cursor:"pointer"}}>Got it</button></div>
      :<><h2 style={{fontFamily:"'Outfit'",fontSize:28,fontWeight:900,marginBottom:4}}>{mode==="login"?"Welcome back":"Join GameBoxd"}</h2>
        <p style={{color:"rgba(255,255,255,.35)",fontSize:14,marginBottom:28}}>{mode==="login"?"Sign in to continue":"Create your account"}</p>
        {err&&<div style={{padding:"12px",borderRadius:10,background:"rgba(253,164,175,.08)",border:"1px solid rgba(253,164,175,.15)",color:"#fda4af",fontSize:13,marginBottom:14}}>{err}</div>}
        {mode==="signup"&&<input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} style={inp}/>}
        <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={inp}/>
        <input type="password" placeholder={mode==="signup"?"Password (8+ chars, A-z, 0-9)":"Password"} value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()} style={inp}/>
        {mode==="signup"&&pw&&<div style={{fontSize:10,marginTop:-8,marginBottom:10,display:"flex",gap:8,flexWrap:"wrap"}}>
          <span style={{color:pw.length>=8?"#6ee7b7":"rgba(255,255,255,.2)"}}>✓ 8+ chars</span>
          <span style={{color:/[A-Z]/.test(pw)?"#6ee7b7":"rgba(255,255,255,.2)"}}>✓ Uppercase</span>
          <span style={{color:/[a-z]/.test(pw)?"#6ee7b7":"rgba(255,255,255,.2)"}}>✓ Lowercase</span>
          <span style={{color:/[0-9]/.test(pw)?"#6ee7b7":"rgba(255,255,255,.2)"}}>✓ Number</span></div>}
        <button onClick={go} disabled={ld} style={{width:"100%",padding:"14px",borderRadius:12,border:"none",marginTop:8,background:ld?"rgba(255,255,255,.05)":"linear-gradient(135deg,#67e8f9,#818cf8)",color:ld?"rgba(255,255,255,.2)":"#0f0c19",fontSize:15,fontWeight:800,cursor:ld?"default":"pointer"}}>{ld?"...":mode==="login"?"Sign In":"Create Account"}</button>
        <p style={{textAlign:"center",marginTop:18,fontSize:13,color:"rgba(255,255,255,.3)"}}>{mode==="login"?"New? ":"Already joined? "}<span onClick={()=>{setMode(mode==="login"?"signup":"login");setErr("")}} style={{color:"#67e8f9",cursor:"pointer",fontWeight:700}}>{mode==="login"?"Create account":"Sign in"}</span></p></>}</div></div>};

/* Edit Profile */
const EP=({prof,onClose,userId,onDone})=>{const[n,setN]=useState(prof?.display_name||"");const[u,setU]=useState(prof?.username||"");const[b,setB]=useState(prof?.bio||"");const[ld,setLd]=useState(false);const[upl,setUpl]=useState(false);const[avP,setAvP]=useState(null);const fr=useRef();
  const[showSec,setShowSec]=useState(false);const[newEmail,setNewEmail]=useState("");const[newPw,setNewPw]=useState("");const[secMsg,setSecMsg]=useState("");const[secLd,setSecLd]=useState(false);
  const[svErr,setSvErr]=useState("");
  const sv=async()=>{setSvErr("");
    if(!n.trim()){setSvErr("Name is required");return}
    const cleanU=u.toLowerCase().replace(/[^a-z0-9_]/g,"");
    if(cleanU&&cleanU.length<3){setSvErr("Username must be at least 3 characters");return}
    // Check unique name
    const nameTaken=await checkUnique("display_name",n,userId);
    if(nameTaken){setSvErr("This name is already taken");return}
    // Check unique username
    if(cleanU){const userTaken=await checkUnique("username",cleanU,userId);
      if(userTaken){setSvErr("This username is already taken");return}}
    setLd(true);await saveProf(userId,{display_name:n.trim(),username:cleanU,bio:b});setLd(false);await onDone();onClose()};
  const hf=async e=>{const f=e.target.files[0];if(!f)return;setUpl(true);setAvP(URL.createObjectURL(f));try{await upAv(userId,f);await onDone()}catch(er){alert("Upload failed: "+er.message)}setUpl(false)};
  const changeEmail=async()=>{if(!newEmail.trim())return;setSecLd(true);setSecMsg("");const{error}=await supabase.auth.updateUser({email:newEmail.trim()});setSecLd(false);if(error)setSecMsg("❌ "+error.message);else setSecMsg("✅ Check your new email for confirmation link")};
  const changePw=async()=>{const pwErr=validPw(newPw);if(pwErr){setSecMsg("❌ "+pwErr);return}setSecLd(true);setSecMsg("");const{error}=await supabase.auth.updateUser({password:newPw});setSecLd(false);if(error)setSecMsg("❌ "+error.message);else{setSecMsg("✅ Password updated!");setNewPw("")}};
  const inp={width:"100%",padding:"12px 14px",borderRadius:12,border:"1px solid rgba(255,255,255,.08)",background:"rgba(255,255,255,.04)",color:"#fff",fontSize:14,outline:"none",marginBottom:14};
  return<div onClick={onClose} style={{position:"fixed",inset:0,zIndex:2000,background:"rgba(15,12,25,.95)",backdropFilter:"blur(20px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
    <div onClick={e=>e.stopPropagation()} style={{...glass,borderRadius:24,width:"100%",maxWidth:400,padding:"32px 28px",background:"rgba(30,27,46,.8)",maxHeight:"90vh",overflow:"auto"}}>
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
      {svErr&&<div style={{padding:"10px 12px",borderRadius:10,background:"rgba(253,164,175,.08)",border:"1px solid rgba(253,164,175,.15)",color:"#fda4af",fontSize:12,fontWeight:600,marginBottom:8}}>{svErr}</div>}
      <div style={{display:"flex",gap:10,marginTop:4}}>
        <button onClick={onClose} style={{flex:1,padding:"13px",borderRadius:12,...glass,color:"rgba(255,255,255,.5)",fontSize:14,fontWeight:700,cursor:"pointer"}}>Cancel</button>
        <button onClick={sv} disabled={ld} style={{flex:1,padding:"13px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#67e8f9,#818cf8)",color:"#0f0c19",fontSize:14,fontWeight:800,cursor:"pointer"}}>{ld?"...":"Save"}</button></div>

      {/* Security Settings */}
      <div style={{marginTop:20,borderTop:"1px solid rgba(255,255,255,.06)",paddingTop:16}}>
        <button onClick={()=>setShowSec(!showSec)} style={{width:"100%",padding:"10px 14px",borderRadius:12,...glass,border:"none",color:"rgba(255,255,255,.4)",fontSize:12,fontWeight:700,cursor:"pointer",textAlign:"left"}}>🔒 {showSec?"Hide":"Change Email & Password"}</button>
        {showSec&&<div style={{marginTop:12}}>
          <label style={{fontSize:10,color:"rgba(255,255,255,.3)",fontWeight:700,letterSpacing:".1em",display:"block",marginBottom:4}}>NEW EMAIL</label>
          <div style={{display:"flex",gap:6,marginBottom:12}}>
            <input value={newEmail} onChange={e=>setNewEmail(e.target.value)} placeholder="newemail@example.com" style={{...inp,marginBottom:0,flex:1}}/>
            <button onClick={changeEmail} disabled={secLd||!newEmail.trim()} style={{padding:"10px 14px",borderRadius:12,border:"none",background:newEmail.trim()?"#67e8f9":"rgba(255,255,255,.04)",color:newEmail.trim()?"#0f0c19":"rgba(255,255,255,.15)",fontSize:12,fontWeight:800,cursor:newEmail.trim()?"pointer":"default",flexShrink:0}}>Update</button></div>
          <label style={{fontSize:10,color:"rgba(255,255,255,.3)",fontWeight:700,letterSpacing:".1em",display:"block",marginBottom:4}}>NEW PASSWORD</label>
          <div style={{display:"flex",gap:6,marginBottom:4}}>
            <input type="password" value={newPw} onChange={e=>setNewPw(e.target.value)} placeholder="Min 8 chars, A-z, 0-9" style={{...inp,marginBottom:0,flex:1}}/>
            <button onClick={changePw} disabled={secLd||!newPw} style={{padding:"10px 14px",borderRadius:12,border:"none",background:newPw&&!validPw(newPw)?"#67e8f9":"rgba(255,255,255,.04)",color:newPw&&!validPw(newPw)?"#0f0c19":"rgba(255,255,255,.15)",fontSize:12,fontWeight:800,cursor:newPw&&!validPw(newPw)?"pointer":"default",flexShrink:0}}>Update</button></div>
          {newPw&&<div style={{fontSize:10,marginBottom:8,display:"flex",gap:6,flexWrap:"wrap"}}>
            <span style={{color:newPw.length>=8?"#6ee7b7":"rgba(255,255,255,.2)"}}>✓ 8+ chars</span>
            <span style={{color:/[A-Z]/.test(newPw)?"#6ee7b7":"rgba(255,255,255,.2)"}}>✓ Uppercase</span>
            <span style={{color:/[a-z]/.test(newPw)?"#6ee7b7":"rgba(255,255,255,.2)"}}>✓ Lowercase</span>
            <span style={{color:/[0-9]/.test(newPw)?"#6ee7b7":"rgba(255,255,255,.2)"}}>✓ Number</span></div>}
          {secMsg&&<div style={{padding:"8px 12px",borderRadius:8,background:secMsg.startsWith("✅")?"rgba(110,231,183,.1)":"rgba(253,164,175,.1)",color:secMsg.startsWith("✅")?"#6ee7b7":"#fda4af",fontSize:12,fontWeight:600}}>{secMsg}</div>}
        </div>}
      </div>
    </div></div>};

/* Steam Link Modal */
const SteamModal=({onClose,userId,onDone})=>{const[input,setInput]=useState("");const[ld,setLd]=useState(false);const[step,setStep]=useState("input");const[steamProf,setSteamProf]=useState(null);const[games,setGames]=useState([]);const[progress,setProgress]=useState(0);const[total,setTotal]=useState(0);
  const lookup=async()=>{setLd(true);try{const sid=await resolveSteamId(input.trim());if(!sid){alert("Steam ID not found");setLd(false);return}
    const[prof,gd]=await Promise.all([getSteamProfile(sid),getSteamGames(sid)]);
    setSteamProf({...prof,steamid:sid});setGames(gd.games||[]);setStep("confirm");setLd(false)}catch(e){alert("Error: "+e.message);setLd(false)}};
  const doImport=async()=>{setStep("importing");
    const allGamesToImport=games.filter(g=>g.playtime>0);
    setTotal(allGamesToImport.length);
    const sid=steamProf.steamid;await saveProf(userId,{steam_id:sid});
    let imported=0;
    for(let i=0;i<allGamesToImport.length;i++){setProgress(i+1);const g=allGamesToImport[i];
      try{const sr=await fetch(`${AP}/games?key=${AK}&search=${encodeURIComponent(g.name)}&page_size=1&search_precise=true`);const sd=await sr.json();const match=sd.results?.[0];
        if(match){const{data:ex}=await supabase.from("user_games").select("id").eq("user_id",userId).eq("game_id",match.id).single();
          if(!ex){await supabase.from("user_games").insert({user_id:userId,game_id:match.id,game_title:match.name,game_img:match.background_image,status:g.playtime>120?"completed":g.playtime>30?"playing":"backlog",my_rating:null,steam_appid:g.appid,steam_playtime:g.playtime});imported++}
          else{await supabase.from("user_games").update({steam_appid:g.appid,steam_playtime:g.playtime}).eq("id",ex.id)}
        }}catch{}}
    setStep("done");await onDone()};
  const inp={width:"100%",padding:"14px 16px",borderRadius:12,border:"1px solid rgba(255,255,255,.08)",background:"rgba(255,255,255,.04)",color:"#fff",fontSize:14,outline:"none"};
  return<div onClick={onClose} style={{position:"fixed",inset:0,zIndex:2000,background:"rgba(15,12,25,.95)",backdropFilter:"blur(24px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
    <div onClick={e=>e.stopPropagation()} style={{...glass,borderRadius:24,width:"100%",maxWidth:440,padding:"32px 28px",background:"rgba(30,27,46,.85)"}}>
      {step==="input"&&<><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
        <div style={{width:40,height:40,borderRadius:12,background:"linear-gradient(135deg,#171a21,#2a475e)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🎮</div>
        <div><h2 style={{fontSize:20,fontWeight:900}}>Link Steam</h2><p style={{color:"rgba(255,255,255,.3)",fontSize:12}}>Import your games automatically</p></div></div>
        <p style={{color:"rgba(255,255,255,.4)",fontSize:13,lineHeight:1.6,marginBottom:16}}>Enter your Steam username or Steam ID (17 digits). Your Steam profile must be set to <b style={{color:"#67e8f9"}}>public</b>.</p>
        <input value={input} onChange={e=>setInput(e.target.value)} placeholder="Steam username or ID" onKeyDown={e=>e.key==="Enter"&&lookup()} style={inp}/>
        <div style={{display:"flex",gap:8,marginTop:14}}>
          <button onClick={onClose} style={{flex:1,padding:"12px",borderRadius:12,...glass,color:"rgba(255,255,255,.5)",fontSize:13,fontWeight:700,cursor:"pointer"}}>Cancel</button>
          <button onClick={lookup} disabled={ld||!input.trim()} style={{flex:1,padding:"12px",borderRadius:12,border:"none",background:input.trim()?"linear-gradient(135deg,#67e8f9,#818cf8)":"rgba(255,255,255,.05)",color:input.trim()?"#0f0c19":"rgba(255,255,255,.15)",fontSize:13,fontWeight:800,cursor:input.trim()?"pointer":"default"}}>{ld?"Looking up...":"Find Account"}</button></div></>}

      {step==="confirm"&&steamProf&&<><div style={{textAlign:"center",marginBottom:20}}>
        <img src={steamProf.avatarfull} alt="" style={{width:64,height:64,borderRadius:16,marginBottom:8}}/>
        <h3 style={{fontSize:18,fontWeight:900}}>{steamProf.personaname}</h3>
        <p style={{color:"rgba(255,255,255,.3)",fontSize:12}}>Steam ID: {steamProf.steamid}</p></div>
        <div style={{...glass,padding:16,borderRadius:14,marginBottom:16}}>
          <div style={{fontSize:28,fontWeight:900,color:"#67e8f9",textAlign:"center"}}>{games.length}</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,.3)",textAlign:"center"}}>games found</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,.2)",textAlign:"center",marginTop:4}}>We'll import all games you've played</div></div>
        <div style={{maxHeight:150,overflow:"auto",marginBottom:14}} className="hs">
          {games.slice(0,10).map(g=><div key={g.appid} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:"1px solid rgba(255,255,255,.03)"}}>
            <img src={g.header} alt="" style={{width:80,height:30,borderRadius:4,objectFit:"cover"}}/>
            <span style={{fontSize:11,flex:1}}>{g.name}</span>
            <span style={{fontSize:10,color:"#67e8f9"}}>{Math.round(g.playtime/60)}h</span></div>)}
          {games.length>10&&<p style={{textAlign:"center",color:"rgba(255,255,255,.2)",fontSize:11,marginTop:6}}>+{games.length-10} more games</p>}</div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setStep("input")} style={{flex:1,padding:"12px",borderRadius:12,...glass,color:"rgba(255,255,255,.5)",fontSize:13,fontWeight:700,cursor:"pointer"}}>Back</button>
          <button onClick={doImport} style={{flex:1,padding:"12px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#67e8f9,#818cf8)",color:"#0f0c19",fontSize:13,fontWeight:800,cursor:"pointer"}}>Import Games</button></div></>}

      {step==="importing"&&<div style={{textAlign:"center",padding:"20px 0"}}>
        <div style={{width:48,height:48,border:"3px solid rgba(255,255,255,.05)",borderTopColor:"#67e8f9",borderRadius:"50%",animation:"spin .7s linear infinite",margin:"0 auto 16px"}}/>
        <h3 style={{fontSize:18,fontWeight:900,marginBottom:4}}>Importing games...</h3>
        <p style={{color:"rgba(255,255,255,.3)",fontSize:13}}>{progress} of {total} games</p>
        <div style={{width:"100%",height:6,background:"rgba(255,255,255,.03)",borderRadius:3,marginTop:12,overflow:"hidden"}}>
          <div style={{height:"100%",width:(progress/total*100)+"%",background:"linear-gradient(90deg,#67e8f9,#818cf8)",borderRadius:3,transition:"width .3s"}}/></div></div>}

      {step==="done"&&<div style={{textAlign:"center",padding:"20px 0"}}>
        <div style={{fontSize:48,marginBottom:12}}>🎉</div>
        <h3 style={{fontSize:20,fontWeight:900,marginBottom:4}}>Import Complete!</h3>
        <p style={{color:"rgba(255,255,255,.3)",fontSize:13,marginBottom:16}}>{progress} games imported to your library</p>
        <button onClick={onClose} style={{padding:"12px 28px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#67e8f9,#818cf8)",color:"#0f0c19",fontSize:14,fontWeight:800,cursor:"pointer"}}>Done</button></div>}
    </div></div>};
const FLM=({userId,type,onClose,m,goUser})=>{const[list,setList]=useState([]);const[ld,setLd]=useState(true);
  useEffect(()=>{(async()=>{setLd(true);setList(type==="followers"?await getFollowersList(userId):await getFollowingList(userId));setLd(false)})()},[userId,type]);
  return<div onClick={onClose} style={{position:"fixed",inset:0,zIndex:1800,background:"rgba(15,12,25,.95)",display:"flex",alignItems:m?"flex-end":"center",justifyContent:"center",padding:m?0:16}}>
    <div onClick={e=>e.stopPropagation()} style={{...glass,background:"rgba(30,27,46,.9)",width:"100%",maxWidth:m?"100%":400,maxHeight:m?"80vh":"70vh",borderRadius:m?"24px 24px 0 0":24,overflow:"auto"}}>
      {m&&<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px 0"}}>
        <button onClick={onClose} style={{padding:"6px 14px",borderRadius:8,background:"rgba(255,255,255,.06)",border:"none",color:"rgba(255,255,255,.5)",fontSize:12,fontWeight:700,cursor:"pointer"}}>← Back</button>
        <button onClick={onClose} style={{padding:"6px 10px",borderRadius:8,background:"rgba(255,255,255,.06)",border:"none",color:"rgba(255,255,255,.5)",fontSize:14,cursor:"pointer"}}>✕</button></div>}
      <div style={{padding:"20px 20px 24px"}}><h3 style={{fontSize:18,fontWeight:900,marginBottom:16}}>{type==="followers"?"Followers":"Following"}</h3>
        {ld?<Loader/>:list.length?list.map(p=><div key={p.id} onClick={()=>{onClose();goUser(p.id)}} style={{display:"flex",alignItems:"center",gap:12,padding:"10px",borderRadius:12,cursor:"pointer",marginBottom:4}}
          onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.04)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <Av url={p.avatar_url} name={p.display_name} size={38} v={Date.now()}/><div style={{flex:1}}><div style={{fontSize:14,fontWeight:700}}>{p.display_name}</div>{p.username&&<div style={{fontSize:11,color:"rgba(255,255,255,.3)"}}>@{p.username}</div>}</div></div>)
        :<p style={{textAlign:"center",padding:24,color:"rgba(255,255,255,.2)"}}>No {type} yet</p>}</div></div></div>};

/* Review Card with Likes + Comments */
const RevCard=({r,me,onClose,goUser,avV})=>{
  const[liked,setLiked]=useState(false);const[lc,setLc]=useState(0);const[cmts,setCmts]=useState([]);const[showCmts,setShowCmts]=useState(false);const[cText,setCText]=useState("");
  useEffect(()=>{getRevLikes(r.id).then(setLc);if(me)didLike(me.id,r.id).then(setLiked)},[r.id]);
  const togLike=async()=>{if(!me)return;if(liked){await unlikeRev(me.id,r.id);setLiked(false);setLc(c=>c-1)}else{await likeRev(me.id,r.id);setLiked(true);setLc(c=>c+1);if(me.id!==r.user_id)sendNotif(r.user_id,me.id,"like",`liked your review of ${r.game_title}`,{revId:r.id})}};
  const openCmts=async()=>{if(!showCmts)setCmts(await loadComments(r.id));setShowCmts(!showCmts)};
  const submitCmt=async()=>{if(!me||!cText.trim())return;await postComment(me.id,r.id,cText);setCText("");setCmts(await loadComments(r.id));if(me.id!==r.user_id)sendNotif(r.user_id,me.id,"comment",`commented on your review of ${r.game_title}`,{revId:r.id})};
  return<div style={{...glass,padding:14,borderRadius:14,marginBottom:8}}>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
      <Av url={r.profiles?.avatar_url} name={r.profiles?.display_name} size={28} onClick={()=>{onClose?.();goUser?.(r.user_id)}} v={avV}/>
      <span style={{fontSize:13,fontWeight:700,cursor:"pointer",flex:1}} onClick={()=>{onClose?.();goUser?.(r.user_id)}}>{r.profiles?.display_name}</span>
      {r.rating>0&&<Stars rating={parseFloat(r.rating)} size={10} show/>}<span style={{fontSize:10,color:"rgba(255,255,255,.15)"}}>{tA(r.created_at)}</span></div>
    <p style={{color:"rgba(255,255,255,.6)",fontSize:13,lineHeight:1.7,margin:"0 0 8px"}}>{r.text}</p>
    {/* Like + Comment bar */}
    <div style={{display:"flex",alignItems:"center",gap:12,paddingTop:6,borderTop:"1px solid rgba(255,255,255,.04)"}}>
      <button onClick={togLike} style={{display:"flex",alignItems:"center",gap:4,background:"none",border:"none",cursor:"pointer",fontSize:12,color:liked?"#fda4af":"rgba(255,255,255,.2)",transition:"all .15s"}}>
        <span style={{fontSize:14}}>{liked?"❤️":"🤍"}</span>{lc>0&&<span style={{fontWeight:700}}>{lc}</span>}</button>
      <button onClick={openCmts} style={{display:"flex",alignItems:"center",gap:4,background:"none",border:"none",cursor:"pointer",fontSize:12,color:"rgba(255,255,255,.2)"}}>
        <span style={{fontSize:14}}>💬</span>{cmts.length>0&&<span style={{fontWeight:700}}>{cmts.length}</span>}</button>
    </div>
    {/* Comments */}
    {showCmts&&<div style={{marginTop:8}}>
      {cmts.map(c=><div key={c.id} style={{display:"flex",gap:8,padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,.02)",fontSize:12}}>
        <Av url={c.profiles?.avatar_url} name={c.profiles?.display_name} size={20} v={avV}/>
        <div style={{flex:1}}><span style={{fontWeight:700,cursor:"pointer"}} onClick={()=>{onClose?.();goUser?.(c.user_id)}}>{c.profiles?.display_name}</span>
          <span style={{color:"rgba(255,255,255,.4)",marginLeft:4}}>{c.text}</span>
          <span style={{color:"rgba(255,255,255,.1)",marginLeft:6,fontSize:9}}>{tA(c.created_at)}</span>
          {me?.id===c.user_id&&<button onClick={async()=>{await deleteComment(c.id);setCmts(cmts.filter(x=>x.id!==c.id))}} style={{background:"none",border:"none",color:"#fda4af",fontSize:9,cursor:"pointer",marginLeft:4}}>delete</button>}</div></div>)}
      {me&&<div style={{display:"flex",gap:6,marginTop:6}}>
        <input value={cText} onChange={e=>setCText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submitCmt()} placeholder="Add a comment..." style={{flex:1,padding:"8px 10px",borderRadius:8,border:"1px solid rgba(255,255,255,.06)",background:"rgba(255,255,255,.03)",color:"#fff",fontSize:12,outline:"none"}}/>
        <button onClick={submitCmt} style={{padding:"8px 12px",borderRadius:8,border:"none",background:cText.trim()?"#67e8f9":"rgba(255,255,255,.04)",color:cText.trim()?"#0f0c19":"rgba(255,255,255,.15)",fontSize:11,fontWeight:800,cursor:cText.trim()?"pointer":"default"}}>Send</button></div>}
    </div>}
  </div>};

/* Game Detail */
const GD=({game:g,onClose,m,ud,setUd,user:me,setSa,refresh,goUser,avV,myLists,reloadLists,userProf})=>{
  const[det,setDet]=useState(null);const[ldg,setLdg]=useState(true);const d=ud[g.id]||{};
  const[mr,setMr]=useState(d.myRating||0);const[st,setSt]=useState(d.status||"");const[tab,setTab]=useState("about");
  const[rvs,setRvs]=useState([]);const[rt,setRt]=useState("");const[rr,setRr]=useState(0);const[posting,setPosting]=useState(false);const[showLists,setShowLists]=useState(false);const[addedList,setAddedList]=useState("");
  const[isFav,setIsFav]=useState(false);const[favLd,setFavLd]=useState(false);
  const[ach,setAch]=useState(null);// {total,achieved,pct}
  useEffect(()=>{setLdg(true);fgd(g.id).then(d=>{setDet(d);setLdg(false)});loadGR(g.id).then(setRvs);
    if(me){getUserFavs(me.id).then(fs=>setIsFav(fs.some(f=>f.game_id===g.id)));
      // Fetch Steam achievements if user has steam linked
      if(userProf?.steam_id){(async()=>{try{
        const r=await fetch(`/api/steam?action=games&steamid=${userProf.steam_id}`);const d=await r.json();
        const gameName=g.t?.toLowerCase().replace(/[™®:'\-–—]/g,"").replace(/\s+/g," ").trim();
        // Fuzzy match: strip symbols, compare
        const match=(d.games||[]).find(sg=>{
          const sn=sg.name?.toLowerCase().replace(/[™®:'\-–—]/g,"").replace(/\s+/g," ").trim();
          return sn===gameName || sn.includes(gameName) || gameName.includes(sn)
        });
        if(match){const ar=await fetch(`/api/steam?action=achievements&steamid=${userProf.steam_id}&appid=${match.appid}`);const ad=await ar.json();if(ad.total>0)setAch(ad)}
      }catch{}})()}}},[g.id]);
  const toggleFav=async()=>{if(!me){setSa(true);return}setFavLd(true);if(isFav){await removeFav(me.id,g.id);setIsFav(false)}else{const ok=await addFav(me.id,g);if(!ok)alert("Max 4 favorites!");else{setIsFav(true);await postAct(me.id,"favorited",{id:g.id,title:g.t,img:g.img})}}setFavLd(false)};
  const sv=async(f,v)=>{if(!me){setSa(true);return}const nd={...d,[f]:v,title:g.t,img:g.img};if(f==="myRating"){setMr(v);await postAct(me.id,"rated",{id:g.id,title:g.t,img:g.img,rating:v})}if(f==="status"){setSt(v);const actMap={completed:"completed",playing:"started playing",wishlist:"added to wishlist",backlog:"added to backlog",dropped:"dropped"};await postAct(me.id,actMap[v]||v,{id:g.id,title:g.t,img:g.img})}
    setUd({...ud,[g.id]:nd});await stc(me.id,g.id,nd);refresh?.()};
  const removeGame=async()=>{if(!me)return;await removeFromLib(me.id,g.id);const n={...ud};delete n[g.id];setUd(n);setSt("");setMr(0);refresh?.()};
  const handleAddToList=async(listId)=>{const list=myLists?.find(l=>l.id===listId);await addGameToList(listId,g.id);setAddedList(listId);reloadLists?.();await postAct(me.id,"added to list",{id:g.id,title:g.t,img:g.img},{text:list?.title||"list"});setTimeout(()=>setAddedList(""),2000)};
  const subRev=async()=>{if(!me||!rt.trim())return;setPosting(true);await postRev(me.id,g,rr,rt);setRt("");setRr(0);setRvs(await loadGR(g.id));setPosting(false);refresh?.()};

  return<div onClick={onClose} style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(15,12,25,.95)",backdropFilter:"blur(16px)",display:"flex",alignItems:m?"flex-end":"center",justifyContent:"center",animation:"fadeIn .12s",padding:m?0:16}}>
    <div onClick={e=>e.stopPropagation()} style={{background:"#16132a",width:"100%",maxWidth:m?"100%":660,maxHeight:m?"93vh":"88vh",borderRadius:m?"24px 24px 0 0":24,overflow:"auto",border:"1px solid rgba(255,255,255,.06)"}}>
      {/* Mobile: drag bar + close button */}
      {m&&<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px 0"}}>
        <button onClick={onClose} style={{padding:"6px 14px",borderRadius:8,background:"rgba(255,255,255,.06)",border:"none",color:"rgba(255,255,255,.5)",fontSize:12,fontWeight:700,cursor:"pointer"}}>← Back</button>
        <div style={{width:32,height:4,borderRadius:2,background:"rgba(255,255,255,.1)"}}/>
        <button onClick={onClose} style={{padding:"6px 10px",borderRadius:8,background:"rgba(255,255,255,.06)",border:"none",color:"rgba(255,255,255,.5)",fontSize:14,cursor:"pointer"}}>✕</button>
      </div>}
      <div style={{position:"relative",height:m?160:240,overflow:"hidden"}}><img src={g.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,#16132a 0%,transparent 100%)"}}/>
        {!m&&<button onClick={onClose} style={{position:"absolute",top:14,right:14,width:34,height:34,borderRadius:12,...glass,background:"rgba(15,12,25,.6)",border:"none",color:"#fff",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>}
        <div style={{position:"absolute",bottom:16,left:m?16:24}}><h2 style={{fontFamily:"'Outfit'",fontSize:m?24:32,fontWeight:900}}>{g.t}</h2>
          <div style={{display:"flex",alignItems:"center",gap:6,marginTop:3,flexWrap:"wrap"}}>
            <span style={{color:"rgba(255,255,255,.4)",fontSize:13}}>{g.y}{g.genre?" · "+g.genre:""}</span>
            {g.pf?.length>0&&<><span style={{color:"rgba(255,255,255,.1)"}}>·</span><div style={{display:"flex",gap:4}}>
              {g.pf.map((p,i)=><span key={i} style={{padding:"2px 8px",borderRadius:6,background:"rgba(255,255,255,.08)",fontSize:9,fontWeight:800,color:p.c,backdropFilter:"blur(8px)"}}>{p.n}</span>)}</div></>}
          </div></div></div>
      <div style={{padding:m?"14px 16px 36px":"20px 24px 28px"}}>
        {/* Favorite + Scores row */}
        <div style={{display:"flex",gap:10,marginBottom:14,alignItems:"center"}}>
          <button onClick={toggleFav} disabled={favLd} style={{padding:"10px 14px",borderRadius:14,...glass,border:isFav?"2px solid #fde68a":"1px solid rgba(255,255,255,.06)",color:isFav?"#fde68a":"rgba(255,255,255,.25)",fontSize:20,cursor:"pointer",flexShrink:0,background:isFav?"rgba(253,230,138,.08)":"rgba(255,255,255,.03)",transition:"all .15s"}} title={isFav?"Remove from favorites":"Add to favorites (max 4)"}>⭐</button>
          {g.r&&<div style={{...glass,padding:"10px 14px",borderRadius:14,flex:1,textAlign:"center"}}><div style={{fontSize:8,color:"rgba(255,255,255,.3)",fontWeight:700}}>COMMUNITY</div><div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:3,marginTop:3}}><span style={{color:"#fde68a",fontSize:16}}>★</span><span style={{fontSize:20,fontWeight:900}}>{g.r}</span></div></div>}
          {g.mc&&<div style={{...glass,padding:"10px 14px",borderRadius:14,flex:1,textAlign:"center"}}><div style={{fontSize:8,color:"rgba(255,255,255,.3)",fontWeight:700}}>METACRITIC</div><div style={{fontSize:20,fontWeight:900,marginTop:3,color:g.mc>=75?"#6ee7b7":"#fde68a"}}>{g.mc}</div></div>}
          <div style={{...glass,padding:"10px 14px",borderRadius:14,flex:1,textAlign:"center"}}><div style={{fontSize:8,color:"rgba(255,255,255,.3)",fontWeight:700}}>YOURS</div><div style={{fontSize:20,fontWeight:900,marginTop:3,color:"#67e8f9"}}>{mr||"—"}</div></div></div>
        {/* 🏆 Steam Achievements */}
        {ach&&<div style={{...glass,padding:"12px 16px",borderRadius:14,marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:16}}>🏆</span><span style={{fontSize:12,fontWeight:700,color:"#fde68a"}}>Steam Achievements</span></div>
            <span style={{fontSize:12,fontWeight:800,color:ach.pct===100?"#6ee7b7":"#67e8f9"}}>{ach.achieved}/{ach.total} ({ach.pct}%)</span></div>
          <div style={{width:"100%",height:8,background:"rgba(255,255,255,.04)",borderRadius:4,overflow:"hidden"}}>
            <div style={{height:"100%",width:ach.pct+"%",background:ach.pct===100?"linear-gradient(90deg,#6ee7b7,#fde68a)":"linear-gradient(90deg,#67e8f9,#818cf8)",borderRadius:4,transition:"width .6s ease"}}/>
          </div>
          {ach.pct===100&&<div style={{textAlign:"center",marginTop:6,fontSize:10,color:"#fde68a",fontWeight:700}}>🎉 100% Completed!</div>}
        </div>}
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
          {rvs.map(r=><RevCard key={r.id} r={r} me={me} onClose={onClose} goUser={goUser} avV={avV}/>)}
          {!rvs.length&&<p style={{textAlign:"center",padding:28,color:"rgba(255,255,255,.15)"}}>No reviews yet</p>}</div>}
        {tab==="media"&&g.ss?.length>1&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{g.ss.slice(1,7).map((s,i)=><img key={i} src={s} alt="" loading="lazy" style={{width:"100%",borderRadius:12,aspectRatio:"16/9",objectFit:"cover"}}/>)}</div>}
      </div></div></div>};

/* ═══ PROFILE PAGE — Letterboxd style with tabs ═══ */
const ProfilePage=({viewId,me,m,ud,goUser,avV,onEdit,onSignOut,onSteam,allGames,myLists,reloadLists,setSel,onBanner})=>{
  const[p,setP]=useState(null);const[fc,setFc]=useState({followers:0,following:0});const[gs,setGs]=useState([]);const[acts,setActs]=useState([]);const[revs,setRevs]=useState([]);const[isF,setIsF]=useState(false);const[ld,setLd]=useState(true);const[flM,setFlM]=useState(null);
  const[favs,setFavs]=useState([]);const[editListId,setEditListId]=useState(null);const[editListName,setEditListName]=useState("");const[nLN,setNLN]=useState("");
  const[tab,setTab]=useState("profile");const[editRevId,setEditRevId]=useState(null);const[editRevText,setEditRevText]=useState("");const[editRevRating,setEditRevRating]=useState(0);
  const[diary,setDiary]=useState([]);const[showDiaryForm,setShowDiaryForm]=useState(false);const[dGame,setDGame]=useState("");const[dNote,setDNote]=useState("");const[dDate,setDDate]=useState(new Date().toISOString().slice(0,10));const[dRating,setDRating]=useState(0);const[dHours,setDHours]=useState("");
  const[dResults,setDResults]=useState([]);const[dSelGame,setDSelGame]=useState(null);
  const isSelf=me?.id===viewId;const bannerRef=useRef();
  useEffect(()=>{(async()=>{setLd(true);const[pr,c,g,a,f,r,di]=await Promise.all([lp(viewId),getFC(viewId),getUG(viewId),getUserActs(viewId),getUserFavs(viewId),getUserRevs(viewId),loadDiary(viewId)]);setP(pr);setFc(c);setGs(g);setActs(a);setFavs(f);setRevs(r);setDiary(di);if(me&&!isSelf)setIsF(await chkF(me.id,viewId));setLd(false)})()},[viewId]);
  const tog=async()=>{if(!me)return;if(isF){await unfollowU(me.id,viewId);setIsF(false);setFc(x=>({...x,followers:x.followers-1}))}else{await followU(me.id,viewId);setIsF(true);setFc(x=>({...x,followers:x.followers+1}));await postAct(me.id,"followed",null,{targetUserId:viewId,targetUserName:p?.display_name});await sendNotif(viewId,me.id,"follow",`${me.user_metadata?.display_name||"Someone"} followed you`)}};
  const rmFav=async gid=>{await removeFav(viewId,gid);setFavs(favs.filter(f=>f.game_id!==gid))};
  const hcl=async()=>{if(!nLN.trim()||!me)return;await createList(me.id,nLN);setNLN("");reloadLists?.()};
  const doRenameList=async id=>{if(!editListName.trim())return;await renameList(id,editListName);setEditListId(null);reloadLists?.()};
  const doDeleteList=async id=>{await deleteList(id);reloadLists?.()};
  const doRemoveGameFromList=async(lid,gid)=>{await removeGameFromList(lid,gid);reloadLists?.()};
  const doDeleteRev=async id=>{await deleteRev(id);setRevs(revs.filter(r=>r.id!==id))};
  const doSaveRev=async id=>{await updateRev(id,{text:editRevText,rating:editRevRating});setRevs(revs.map(r=>r.id===id?{...r,text:editRevText,rating:editRevRating}:r));setEditRevId(null)};
  /* Diary helpers */
  const searchDiaryGame=async q=>{if(!q.trim())return setDResults([]);const g=await sga(q);setDResults(g.map(nm).slice(0,5))};
  const submitDiary=async()=>{if(!dSelGame||!me)return;await addDiary(me.id,{game_id:dSelGame.id,game_title:dSelGame.t,game_img:dSelGame.img,played_on:dDate,note:dNote,rating:dRating||null,hours_played:parseFloat(dHours)||0});
    await postAct(me.id,"logged",{id:dSelGame.id,title:dSelGame.t,img:dSelGame.img,rating:dRating||null});setDiary(await loadDiary(viewId));setShowDiaryForm(false);setDGame("");setDNote("");setDRating(0);setDHours("");setDSelGame(null)};
  const rmDiary=async id=>{await deleteDiary(id);setDiary(diary.filter(d=>d.id!==id))};
  const handleBanner=async e=>{const f=e.target.files[0];if(!f)return;try{await upBanner(me.id,f);const newP=await lp(me.id);setP(newP);onBanner?.()}catch(er){alert("Banner upload failed: "+er.message)}};
  const shareUrl=`https://gameboxed.vercel.app/?user=${viewId}`;
  if(ld)return<Loader/>;
  const tabs=[{id:"profile",l:"Profile"},{id:"games",l:`Games ${gs.length}`},{id:"diary",l:`Diary ${diary.length}`},{id:"reviews",l:`Reviews ${revs.length}`},{id:"lists",l:"Lists"},{id:"activity",l:"Activity"}];

  return<div style={{animation:"fadeIn .15s"}}>
    {/* Header — custom banner */}
    <div style={{position:"relative",marginBottom:m?-30:-40}}>
      <div style={{height:m?100:150,borderRadius:20,background:p?.banner_url?`url(${bannerUrl(p.banner_url,avV)}) center/cover`:"linear-gradient(135deg,rgba(103,232,249,.15),rgba(129,140,248,.15),rgba(196,181,253,.15))",overflow:"hidden"}}/>
      {isSelf&&<><input ref={bannerRef} type="file" accept="image/*" onChange={handleBanner} style={{display:"none"}}/>
        <button onClick={()=>bannerRef.current?.click()} style={{position:"absolute",bottom:m?10:12,right:m?10:12,padding:m?"8px 14px":"6px 12px",borderRadius:10,background:"rgba(0,0,0,.6)",border:"1px solid rgba(255,255,255,.15)",color:"#fff",fontSize:m?12:11,fontWeight:700,cursor:"pointer",backdropFilter:"blur(8px)",zIndex:5}}>📷 Banner</button></>}
    </div>
    <div style={{display:"flex",alignItems:m?"center":"flex-start",gap:m?14:20,marginBottom:16,flexDirection:m?"column":"row",position:"relative",padding:m?"0 12px":"0 20px"}}>
      <Av url={p?.avatar_url} name={p?.display_name} size={m?72:88} v={avV}/>
      <div style={{textAlign:m?"center":"left",flex:1}}>
        <h2 style={{fontFamily:"'Outfit'",fontSize:m?20:26,fontWeight:900}}>{p?.display_name||"User"}</h2>
        {p?.username&&<div style={{color:"rgba(255,255,255,.25)",fontSize:12}}>@{p.username}</div>}
        {p?.bio&&<p style={{color:"rgba(255,255,255,.35)",fontSize:13,lineHeight:1.5,marginTop:4}}>{p.bio}</p>}
        <div style={{display:"flex",gap:14,marginTop:8,justifyContent:m?"center":"flex-start"}}>
          <div><span style={{fontWeight:900}}>{gs.length}</span> <span style={{color:"rgba(255,255,255,.2)",fontSize:11}}>games</span></div>
          <div onClick={()=>setFlM("followers")} style={{cursor:"pointer"}}><span style={{fontWeight:900}}>{fc.followers}</span> <span style={{color:"#67e8f9",fontSize:11}}>followers</span></div>
          <div onClick={()=>setFlM("following")} style={{cursor:"pointer"}}><span style={{fontWeight:900}}>{fc.following}</span> <span style={{color:"#67e8f9",fontSize:11}}>following</span></div></div>
        <div style={{display:"flex",gap:5,marginTop:8,justifyContent:m?"center":"flex-start",flexWrap:"wrap"}}>
          {isSelf?<><button onClick={onEdit} style={{padding:"6px 14px",borderRadius:10,...glass,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>Edit Profile</button>
            <button onClick={onSteam} style={{padding:"6px 14px",borderRadius:10,...glass,color:"#67e8f9",fontSize:11,fontWeight:700,cursor:"pointer"}}>{p?.steam_id?"🎮 Linked":"🎮 Steam"}</button>
            <button onClick={()=>{navigator.clipboard?.writeText(shareUrl);alert("Profile link copied!")}} style={{padding:"6px 14px",borderRadius:10,...glass,color:"#c4b5fd",fontSize:11,fontWeight:700,cursor:"pointer"}}>🔗 Share</button>
            <button onClick={onSignOut} style={{padding:"6px 14px",borderRadius:10,...glass,color:"#fda4af",fontSize:11,fontWeight:700,cursor:"pointer"}}>Sign Out</button></>
          :me&&<><button onClick={tog} style={{padding:"8px 24px",borderRadius:10,border:isF?"1px solid rgba(255,255,255,.1)":"none",background:isF?"transparent":"linear-gradient(135deg,#67e8f9,#818cf8)",color:isF?"rgba(255,255,255,.4)":"#0f0c19",fontSize:12,fontWeight:800,cursor:"pointer"}}>{isF?"Following ✓":"Follow"}</button>
            <button onClick={()=>{navigator.clipboard?.writeText(shareUrl);alert("Profile link copied!")}} style={{padding:"6px 14px",borderRadius:10,...glass,color:"#c4b5fd",fontSize:11,fontWeight:700,cursor:"pointer"}}>🔗 Share</button></>}
        </div></div></div>

    {/* Tabs — Letterboxd style */}
    <div className="hs" style={{display:"flex",gap:0,borderBottom:"1px solid rgba(255,255,255,.06)",marginBottom:16,overflowX:"auto"}}>
      {tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:m?"8px 12px":"10px 18px",background:"none",border:"none",fontSize:m?11:13,fontWeight:700,cursor:"pointer",color:tab===t.id?"#67e8f9":"rgba(255,255,255,.2)",borderBottom:tab===t.id?"2px solid #67e8f9":"2px solid transparent",whiteSpace:"nowrap",transition:"all .15s"}}>{t.l}</button>)}</div>

    {/* ═ TAB: Profile ═ */}
    {tab==="profile"&&<div>
      {/* Favorites — Letterboxd style: 4 bigger posters, centered, no X, clickable */}
      {favs.length>0&&<div style={{marginBottom:28,textAlign:"center"}}><div className="sec-title" style={{justifyContent:"center"}}>⭐ FAVORITE GAMES</div>
        <div style={{display:"flex",gap:m?8:12,justifyContent:"center"}}>
          {favs.map(f=>{const gObj=allGames.find(x=>x.id===f.game_id)||{id:f.game_id,t:f.game_title,img:f.game_img,y:"",genre:"",r:null,pf:[]};
            return<FavCard key={f.game_id} fav={f} onClick={()=>setSel?.(gObj)} m={m}/>})}</div></div>}
      {isSelf&&favs.length===0&&<div style={{textAlign:"center",padding:"16px 0 20px",...glass,borderRadius:14,marginBottom:20}}>
        <div style={{fontSize:20,marginBottom:4}}>⭐</div><p style={{color:"rgba(255,255,255,.15)",fontSize:11}}>Open a game and click ⭐ to showcase up to 4 favorites</p></div>}

      {/* Recent activity preview */}
      {acts.length>0&&<div style={{marginBottom:20}}><div className="sec-title">RECENT ACTIVITY</div>
        {acts.slice(0,5).map(a=><div key={a.id} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 0",borderBottom:"1px solid rgba(255,255,255,.03)",fontSize:11}}>
          <span style={{fontSize:9,color:"rgba(255,255,255,.1)",width:22,textAlign:"right",flexShrink:0}}>{tA(a.created_at)}</span>
          <span style={{fontSize:12,flexShrink:0}}>{actIcon(a.action)}</span>
          {a.game_img&&<div style={{width:22,height:30,borderRadius:3,overflow:"hidden",flexShrink:0}}><img src={a.game_img} style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"top"}}/></div>}
          <div style={{flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}><span style={{fontWeight:600}}>{a.game_title||a.target_user_name||""}</span> <span style={{color:"rgba(255,255,255,.12)"}}>{actLabel(a.action)}</span></div>
          {a.rating?<Stars rating={parseFloat(a.rating)} size={7}/>:null}
        </div>)}</div>}

      {/* Recent reviews preview */}
      {revs.length>0&&<div><div className="sec-title">RECENT REVIEWS</div>
        {revs.slice(0,3).map(r=><div key={r.id} style={{...glass,padding:12,borderRadius:12,marginBottom:6}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
            {r.game_img&&<div style={{width:28,height:38,borderRadius:4,overflow:"hidden",flexShrink:0}}><img src={r.game_img} style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"top"}}/></div>}
            <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700}}>{r.game_title}</div>
              <div style={{display:"flex",alignItems:"center",gap:6,marginTop:2}}>{r.rating>0&&<Stars rating={parseFloat(r.rating)} size={9}/>}<span style={{fontSize:9,color:"rgba(255,255,255,.1)"}}>{tA(r.created_at)}</span></div></div></div>
          <p style={{color:"rgba(255,255,255,.45)",fontSize:12,lineHeight:1.6,margin:0}}>{r.text}</p></div>)}</div>}
    </div>}

    {/* ═ TAB: Games ═ */}
    {tab==="games"&&<div>
      {gs.length>0?<div style={{display:"grid",gridTemplateColumns:m?"repeat(4,1fr)":"repeat(auto-fill,minmax(70px,1fr))",gap:5}}>
        {gs.map(g=>{const found=allGames.find(x=>x.id===g.game_id);const gObj=found||{id:g.game_id,t:g.game_title,img:g.game_img,y:"",genre:"",r:null,pf:[]};
          return<div key={g.game_id} onClick={()=>setSel?.(gObj)} style={{borderRadius:5,overflow:"hidden",aspectRatio:"2/3",position:"relative",boxShadow:"0 1px 4px rgba(0,0,0,.2)",cursor:"pointer"}}>
          {g.game_img?<img src={g.game_img} style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"top"}}/>:<div style={{width:"100%",height:"100%",background:"#1e1b2e",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10}}>🎮</div>}
          {g.status&&<div style={{position:"absolute",bottom:0,left:0,right:0,height:3,background:SC[g.status]?.c||"#fff"}}/>}
          {g.my_rating&&<div style={{position:"absolute",top:2,right:2,padding:"1px 4px",borderRadius:3,background:"rgba(0,0,0,.7)",fontSize:7,color:"#fde68a",fontWeight:800}}>★{g.my_rating}</div>}
        </div>})}</div>
      :<p style={{textAlign:"center",padding:40,color:"rgba(255,255,255,.15)"}}>No games yet</p>}
    </div>}

    {/* ═ TAB: Diary ═ */}
    {tab==="diary"&&<div>
      {isSelf&&<button onClick={()=>setShowDiaryForm(!showDiaryForm)} style={{padding:"10px 18px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#67e8f9,#818cf8)",color:"#0f0c19",fontSize:13,fontWeight:800,cursor:"pointer",marginBottom:14,width:"100%"}}>+ Log a game</button>}
      {showDiaryForm&&<div style={{...glass,padding:16,borderRadius:16,marginBottom:16}}>
        <div style={{position:"relative",marginBottom:10}}>
          <input value={dGame} onChange={e=>{setDGame(e.target.value);searchDiaryGame(e.target.value)}} placeholder="Search for a game..." style={{width:"100%",padding:"10px 14px",borderRadius:10,border:"1px solid rgba(255,255,255,.08)",background:"rgba(255,255,255,.04)",color:"#fff",fontSize:13,outline:"none"}}/>
          {dResults.length>0&&!dSelGame&&<div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:10,...glass,borderRadius:10,background:"rgba(30,27,46,.95)",maxHeight:180,overflow:"auto",marginTop:4}}>
            {dResults.map(g=><div key={g.id} onClick={()=>{setDSelGame(g);setDGame(g.t);setDResults([])}} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",cursor:"pointer",borderBottom:"1px solid rgba(255,255,255,.03)"}}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.04)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              {g.img&&<img src={g.img} style={{width:24,height:32,borderRadius:3,objectFit:"cover"}}/>}<span style={{fontSize:12,fontWeight:600}}>{g.t}</span><span style={{fontSize:10,color:"rgba(255,255,255,.2)",marginLeft:"auto"}}>{g.y}</span></div>)}</div>}
        </div>
        {dSelGame&&<div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:8,background:"rgba(103,232,249,.06)",marginBottom:10}}>
          {dSelGame.img&&<img src={dSelGame.img} style={{width:24,height:32,borderRadius:3,objectFit:"cover"}}/>}<span style={{fontSize:12,fontWeight:700,flex:1}}>{dSelGame.t}</span>
          <button onClick={()=>{setDSelGame(null);setDGame("")}} style={{background:"none",border:"none",color:"#fda4af",fontSize:12,cursor:"pointer"}}>✕</button></div>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
          <div><label style={{fontSize:9,color:"rgba(255,255,255,.3)",fontWeight:700}}>DATE</label><input type="date" value={dDate} onChange={e=>setDDate(e.target.value)} style={{width:"100%",padding:"8px",borderRadius:8,border:"1px solid rgba(255,255,255,.08)",background:"rgba(255,255,255,.04)",color:"#fff",fontSize:12,outline:"none",colorScheme:"dark"}}/></div>
          <div><label style={{fontSize:9,color:"rgba(255,255,255,.3)",fontWeight:700}}>HOURS</label><input type="number" value={dHours} onChange={e=>setDHours(e.target.value)} placeholder="0" style={{width:"100%",padding:"8px",borderRadius:8,border:"1px solid rgba(255,255,255,.08)",background:"rgba(255,255,255,.04)",color:"#fff",fontSize:12,outline:"none"}}/></div></div>
        <div style={{marginBottom:10}}><label style={{fontSize:9,color:"rgba(255,255,255,.3)",fontWeight:700}}>RATING</label><div style={{marginTop:4}}><Stars rating={dRating} size={20} interactive onRate={setDRating}/></div></div>
        <textarea value={dNote} onChange={e=>setDNote(e.target.value)} rows={2} placeholder="How was your session?" style={{width:"100%",padding:"10px",borderRadius:8,border:"1px solid rgba(255,255,255,.06)",background:"rgba(255,255,255,.03)",color:"#fff",fontSize:13,outline:"none",resize:"none",fontFamily:"inherit",marginBottom:8}}/>
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>setShowDiaryForm(false)} style={{flex:1,padding:"10px",borderRadius:10,...glass,border:"none",color:"rgba(255,255,255,.4)",fontSize:12,fontWeight:700,cursor:"pointer"}}>Cancel</button>
          <button onClick={submitDiary} disabled={!dSelGame} style={{flex:1,padding:"10px",borderRadius:10,border:"none",background:dSelGame?"linear-gradient(135deg,#67e8f9,#818cf8)":"rgba(255,255,255,.04)",color:dSelGame?"#0f0c19":"rgba(255,255,255,.15)",fontSize:12,fontWeight:800,cursor:dSelGame?"pointer":"default"}}>Log Game</button></div>
      </div>}
      {diary.length>0?diary.map(d=><div key={d.id} style={{...glass,padding:"12px 16px",borderRadius:14,marginBottom:6,display:"flex",gap:12,alignItems:"center"}}>
        <div style={{textAlign:"center",flexShrink:0,width:44}}>
          <div style={{fontSize:18,fontWeight:900,color:"#67e8f9"}}>{new Date(d.played_on).getDate()}</div>
          <div style={{fontSize:9,color:"rgba(255,255,255,.2)",fontWeight:700}}>{new Date(d.played_on).toLocaleString("en",{month:"short"}).toUpperCase()}</div></div>
        {d.game_img&&<div style={{width:32,height:44,borderRadius:5,overflow:"hidden",flexShrink:0}}><img src={d.game_img} style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"top"}}/></div>}
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:700}}>{d.game_title}</div>
          <div style={{display:"flex",alignItems:"center",gap:6,marginTop:2}}>
            {d.rating&&<Stars rating={parseFloat(d.rating)} size={9}/>}
            {d.hours_played>0&&<span style={{fontSize:10,color:"rgba(255,255,255,.2)"}}>{d.hours_played}h</span>}</div>
          {d.note&&<p style={{fontSize:11,color:"rgba(255,255,255,.3)",margin:"3px 0 0",lineHeight:1.4}}>{d.note}</p>}</div>
        {isSelf&&<button onClick={()=>rmDiary(d.id)} style={{background:"none",border:"none",color:"rgba(255,255,255,.1)",fontSize:12,cursor:"pointer",flexShrink:0}}>🗑️</button>}
      </div>):<p style={{textAlign:"center",padding:40,color:"rgba(255,255,255,.15)"}}>{isSelf?"Log your first play session!":"No diary entries yet"}</p>}
    </div>}

    {/* ═ TAB: Reviews ═ */}
    {tab==="reviews"&&<div>
      {revs.length>0?revs.map(r=><div key={r.id}>
        {/* Game header for profile reviews */}
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4,marginTop:r===revs[0]?0:8}}>
          {r.game_img&&<div onClick={()=>{const found=allGames.find(x=>x.id===r.game_id);if(found)setSel?.(found);else setSel?.({id:r.game_id,t:r.game_title,img:r.game_img,y:"",genre:"",r:null,pf:[]})}} style={{width:32,height:42,borderRadius:5,overflow:"hidden",flexShrink:0,cursor:"pointer"}}><img src={r.game_img} style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"top"}}/></div>}
          <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700}}>{r.game_title}</div>
            <div style={{display:"flex",alignItems:"center",gap:6,marginTop:2}}>{r.rating>0&&<Stars rating={parseFloat(r.rating)} size={10} show/>}<span style={{fontSize:9,color:"rgba(255,255,255,.1)"}}>{tA(r.created_at)}</span></div></div>
          {isSelf&&editRevId!==r.id&&<div style={{display:"flex",gap:4}}>
            <button onClick={()=>{setEditRevId(r.id);setEditRevText(r.text);setEditRevRating(parseFloat(r.rating)||0)}} style={{padding:"4px 8px",borderRadius:6,...glass,border:"none",color:"rgba(255,255,255,.3)",fontSize:9,cursor:"pointer"}}>✏️</button>
            <button onClick={()=>doDeleteRev(r.id)} style={{padding:"4px 8px",borderRadius:6,...glass,border:"none",color:"#fda4af",fontSize:9,cursor:"pointer"}}>🗑️</button></div>}
        </div>
        {editRevId===r.id?<div style={{marginBottom:8}}>
          <Stars rating={editRevRating} size={18} interactive onRate={setEditRevRating}/>
          <textarea value={editRevText} onChange={e=>setEditRevText(e.target.value)} rows={3} style={{width:"100%",marginTop:8,padding:"10px",borderRadius:8,border:"1px solid rgba(255,255,255,.08)",background:"rgba(255,255,255,.04)",color:"#fff",fontSize:13,outline:"none",resize:"none",fontFamily:"inherit"}}/>
          <div style={{display:"flex",gap:6,marginTop:6}}>
            <button onClick={()=>doSaveRev(r.id)} style={{padding:"8px 16px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#67e8f9,#818cf8)",color:"#0f0c19",fontSize:12,fontWeight:800,cursor:"pointer"}}>Save</button>
            <button onClick={()=>setEditRevId(null)} style={{padding:"8px 16px",borderRadius:8,...glass,border:"none",color:"rgba(255,255,255,.4)",fontSize:12,fontWeight:700,cursor:"pointer"}}>Cancel</button></div></div>
        :<RevCard r={{...r,profiles:{display_name:p?.display_name,username:p?.username,avatar_url:p?.avatar_url}}} me={me} goUser={goUser} avV={avV}/>}
      </div>):<p style={{textAlign:"center",padding:40,color:"rgba(255,255,255,.15)"}}>No reviews yet</p>}
    </div>}

    {/* ═ TAB: Lists ═ */}
    {tab==="lists"&&<div>
      {(isSelf?myLists||[]:[]).map(l=><div key={l.id} style={{...glass,borderRadius:14,padding:"14px 16px",marginBottom:8}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:(l.game_ids?.length)?8:0}}>
          {editListId===l.id?<><input value={editListName} onChange={e=>setEditListName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doRenameList(l.id)} style={{flex:1,padding:"6px 10px",borderRadius:8,border:"1px solid rgba(255,255,255,.1)",background:"rgba(255,255,255,.04)",color:"#fff",fontSize:13,outline:"none"}}/>
            <button onClick={()=>doRenameList(l.id)} style={{padding:"4px 10px",borderRadius:6,border:"none",background:"#67e8f9",color:"#0f0c19",fontSize:10,fontWeight:800,cursor:"pointer"}}>Save</button>
            <button onClick={()=>setEditListId(null)} style={{padding:"4px 10px",borderRadius:6,...glass,color:"rgba(255,255,255,.4)",fontSize:10,fontWeight:700,cursor:"pointer",border:"none"}}>✕</button></>
          :<><span style={{fontSize:14,fontWeight:700,flex:1}}>📝 {l.title}</span><span style={{fontSize:10,color:"rgba(255,255,255,.15)"}}>{l.game_ids?.length||0} games</span>
            {isSelf&&<><button onClick={()=>{setEditListId(l.id);setEditListName(l.title)}} style={{padding:"3px 8px",borderRadius:6,...glass,border:"none",color:"rgba(255,255,255,.3)",fontSize:9,cursor:"pointer"}}>✏️</button>
            <button onClick={()=>doDeleteList(l.id)} style={{padding:"3px 8px",borderRadius:6,...glass,border:"none",color:"#fda4af",fontSize:9,cursor:"pointer"}}>🗑️</button></>}</>}
        </div>
        {l.game_ids?.length>0&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(40px,1fr))",gap:3}}>
          {l.game_ids.map(gid=>{const found=allGames.find(x=>x.id===gid);const gData=gs.find(x=>x.game_id===gid);const img=found?.img||gData?.game_img;
            return<div key={gid} style={{position:"relative"}}>
              <div onClick={()=>{if(found)setSel?.(found)}} style={{borderRadius:3,overflow:"hidden",aspectRatio:"2/3",cursor:found?"pointer":"default"}}>
                {img?<img src={img} style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"top"}}/>:<div style={{width:"100%",height:"100%",background:"#1e1b2e",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8}}>🎮</div>}</div>
              {isSelf&&<button onClick={()=>doRemoveGameFromList(l.id,gid)} style={{position:"absolute",top:-2,right:-2,width:12,height:12,borderRadius:6,background:"#fda4af",border:"none",color:"#0f0c19",fontSize:7,fontWeight:900,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>}
            </div>})}
        </div>}
      </div>)}
      {isSelf&&<div style={{display:"flex",gap:6,marginTop:8}}>
        <input placeholder="New list name..." value={nLN} onChange={e=>setNLN(e.target.value)} onKeyDown={e=>e.key==="Enter"&&hcl()}
          style={{flex:1,padding:"10px 14px",borderRadius:12,...glass,color:"#fff",fontSize:13,outline:"none"}}/>
        <button onClick={hcl} style={{padding:"10px 16px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#67e8f9,#818cf8)",color:"#0f0c19",fontSize:12,fontWeight:800,cursor:"pointer"}}>Create</button></div>}
      {!(isSelf?myLists||[]:[]).length&&!isSelf&&<p style={{textAlign:"center",padding:40,color:"rgba(255,255,255,.15)"}}>No public lists</p>}
    </div>}

    {/* ═ TAB: Activity ═ */}
    {tab==="activity"&&<div>
      {acts.length>0?acts.map(a=><div key={a.id} style={{...glass,borderRadius:12,padding:"10px 14px",marginBottom:5,display:"flex",gap:10,alignItems:"center"}}>
        <span style={{fontSize:10,color:"rgba(255,255,255,.1)",width:28,textAlign:"right",flexShrink:0}}>{tA(a.created_at)}</span>
        <span style={{fontSize:14,flexShrink:0}}>{actIcon(a.action)}</span>
        {a.game_img&&<div style={{width:30,height:40,borderRadius:4,overflow:"hidden",flexShrink:0}}><img src={a.game_img} style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"top"}}/></div>}
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:12,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.game_title||a.target_user_name||""}</div>
          <div style={{fontSize:10,color:"rgba(255,255,255,.2)"}}>{actLabel(a.action)}{a.extra_text?" · "+a.extra_text:""}</div>
        </div>
        {a.rating?<Stars rating={parseFloat(a.rating)} size={9}/>:null}
      </div>):<p style={{textAlign:"center",padding:40,color:"rgba(255,255,255,.15)"}}>No activity yet</p>}
    </div>}

    {flM&&<FLM userId={viewId} type={flM} onClose={()=>setFlM(null)} m={m} goUser={goUser}/>}
  </div>};

/* ═══ MAIN ═══ */
export default function App(){
  const m=useM();const[pg,setPg]=useState("home");const[sel,setSel]=useState(null);const[q,setQ]=useState("");const[qO,setQO]=useState(false);
  const[ud,setUd]=useState({});const[user,setUser]=useState(null);const[prof,setProf]=useState(null);const[avV,setAvV]=useState(Date.now());const[fc,setFc]=useState({followers:0,following:0});
  const[sa,setSa]=useState(false);const[ep,setEp]=useState(false);const[viewUID,setViewUID]=useState(null);const[flM,setFlM]=useState(null);const[steamModal,setSteamModal]=useState(false);
  const[notifs,setNotifs]=useState([]);const[nCount,setNCount]=useState(0);const[showNotifs,setShowNotifs]=useState(false);
  const[pop,setPop]=useState([]);const[best,setBest]=useState([]);const[fresh,setFresh]=useState([]);const[soon,setSoon]=useState([]);const[actG,setActG]=useState([]);const[rpg,setRpg]=useState([]);const[indie,setIndie]=useState([]);
  const[sr,setSr]=useState([]);const[pSr,setPSr]=useState([]);const[lSr,setLSr]=useState([]);
  const[ld,setLd]=useState(true);const[sng,setSng]=useState(false);const[lf,setLf]=useState("all");const[sT,setST]=useState("games");
  const[myL,setMyL]=useState([]);const[nLN,setNLN]=useState("");const[feed,setFeed]=useState([]);const[rRev,setRRev]=useState([]);const[news,setNews]=useState([]);
  const stt=useRef(null);
  const rf=()=>{if(user)loadFeed(user.id).then(setFeed);else loadAllFeed().then(setFeed);loadRR().then(setRRev)};
  const reloadProf=useCallback(async()=>{if(!user)return;const p=await lp(user.id);setProf(p);setAvV(Date.now());getFC(user.id).then(setFc)},[user]);
  const goUser=(id)=>{setViewUID(id);setPg("viewuser")};

  useEffect(()=>{supabase.auth.getSession().then(({data:{session}})=>{const u=session?.user||null;setUser(u);if(u){lcl(u.id).then(setUd);lp(u.id).then(setProf);loadLists(u.id).then(setMyL);loadFeed(u.id).then(setFeed);getFC(u.id).then(setFc);loadNotifs(u.id).then(setNotifs);unreadCount(u.id).then(setNCount)}else loadAllFeed().then(setFeed)});loadRR().then(setRRev);loadNews().then(setNews);
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
    {steamModal&&<SteamModal onClose={()=>setSteamModal(false)} userId={user?.id} onDone={async()=>{await lcl(user.id).then(setUd);await reloadProf()}}/>}

    {/* Nav */}
    {!m&&<nav style={{position:"sticky",top:0,zIndex:100,background:"rgba(15,12,25,.8)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,.04)",padding:"0 28px",height:52,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:24}}>
        <span onClick={()=>{setPg("home");setQ("");setViewUID(null)}} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
          <svg width="32" height="32" viewBox="0 0 44 44"><rect x="13" y="0" width="18" height="44" rx="4" fill="#67e8f9"/><rect x="0" y="13" width="44" height="18" rx="4" fill="#67e8f9"/><circle cx="22" cy="22" r="5" fill="#0f0c19" opacity=".25"/><polygon points="22,4 18,11 26,11" fill="#0f0c19" opacity=".2"/><polygon points="22,40 18,33 26,33" fill="#0f0c19" opacity=".2"/><polygon points="4,22 11,18 11,26" fill="#0f0c19" opacity=".2"/><polygon points="40,22 33,18 33,26" fill="#0f0c19" opacity=".2"/></svg>
          <span style={{fontFamily:"'Outfit'",fontSize:18,fontWeight:900,background:"linear-gradient(135deg,#67e8f9,#818cf8)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>GameBoxd</span></span>
        <div style={{display:"flex",gap:2}}>{NAV.filter(n=>n.id!=="profile").map(n=><button key={n.id} onClick={()=>{setPg(n.id);setQ("");setViewUID(null)}} style={{padding:"6px 14px",borderRadius:20,border:"none",background:pg===n.id?"rgba(255,255,255,.06)":"transparent",color:pg===n.id?"#fff":"rgba(255,255,255,.3)",cursor:"pointer",fontSize:12,fontWeight:700}}>{n.l}</button>)}</div></div>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{position:"relative"}}><input placeholder="Search..." value={q} onChange={e=>{setQ(e.target.value);if(e.target.value){setPg("search");setViewUID(null)}}}
          style={{padding:"8px 14px 8px 32px",borderRadius:14,...glass,color:"#fff",fontSize:12,width:200,outline:"none"}}/>
          <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",fontSize:12,color:"rgba(255,255,255,.2)"}}>🔍</span></div>
        {user&&<div style={{position:"relative"}}>
          <span onClick={()=>{setShowNotifs(!showNotifs);if(!showNotifs){markRead(user.id);setNCount(0)}}} style={{fontSize:18,cursor:"pointer",color:nCount?"#fde68a":"rgba(255,255,255,.3)"}}>🔔</span>
          {nCount>0&&<div style={{position:"absolute",top:-4,right:-6,width:16,height:16,borderRadius:8,background:"#f87171",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:900,color:"#fff"}}>{nCount}</div>}
          {showNotifs&&<div style={{position:"absolute",top:36,right:0,width:320,...glass,background:"rgba(30,27,46,.95)",borderRadius:16,padding:12,zIndex:200,maxHeight:400,overflow:"auto"}}>
            <h4 style={{fontSize:13,fontWeight:800,marginBottom:10}}>Notifications</h4>
            {notifs.length?notifs.slice(0,15).map(n=><div key={n.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,.03)",fontSize:11,opacity:n.read?.5:1}}>
              {n.from?.avatar_url?<Av url={n.from.avatar_url} name={n.from.display_name} size={24} v={avV}/>
              :<span style={{fontSize:14,flexShrink:0}}>{n.type==="follow"?"👥":n.type==="like"?"❤️":n.type==="comment"?"💬":"📌"}</span>}
              <div style={{flex:1,minWidth:0}}><span style={{fontWeight:700}}>{n.from?.display_name||""}</span> <span style={{color:"rgba(255,255,255,.4)"}}>{n.message||n.type}</span>{n.game_title&&<span style={{color:"#67e8f9"}}> {n.game_title}</span>}</div>
              <span style={{fontSize:9,color:"rgba(255,255,255,.1)",flexShrink:0}}>{tA(n.created_at)}</span></div>)
            :<p style={{color:"rgba(255,255,255,.15)",fontSize:12,textAlign:"center",padding:16}}>No notifications yet</p>}
          </div>}
        </div>}
        {user?<Av url={prof?.avatar_url} name={dn} size={30} onClick={()=>{setPg("profile");setViewUID(null)}} v={avV}/>
          :<button onClick={()=>setSa(true)} style={{padding:"7px 18px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#67e8f9,#818cf8)",color:"#0f0c19",fontSize:12,fontWeight:800,cursor:"pointer"}}>Sign In</button>}</div></nav>}

    {m&&<div style={{position:"sticky",top:0,zIndex:100,background:"rgba(15,12,25,.85)",backdropFilter:"blur(20px)",padding:"0 14px",height:48,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid rgba(255,255,255,.04)"}}>
      {qO?<div style={{flex:1,display:"flex",alignItems:"center",gap:6}}>
        <input autoFocus placeholder="Search..." value={q} onChange={e=>{setQ(e.target.value);if(e.target.value){setPg("search");setViewUID(null)}}}
          style={{flex:1,padding:"8px 14px",borderRadius:14,...glass,color:"#fff",fontSize:14,outline:"none"}}/>
        <span onClick={()=>{setQO(false);setQ("");setPg("home")}} style={{color:"#67e8f9",fontSize:12,fontWeight:700,cursor:"pointer"}}>✕</span></div>
      :<><span onClick={()=>{setPg("home");setViewUID(null)}} style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer"}}>
          <svg width="24" height="24" viewBox="0 0 44 44"><rect x="13" y="0" width="18" height="44" rx="4" fill="#67e8f9"/><rect x="0" y="13" width="44" height="18" rx="4" fill="#67e8f9"/><circle cx="22" cy="22" r="5" fill="#0f0c19" opacity=".25"/><polygon points="22,4 18,11 26,11" fill="#0f0c19" opacity=".2"/><polygon points="22,40 18,33 26,33" fill="#0f0c19" opacity=".2"/><polygon points="4,22 11,18 11,26" fill="#0f0c19" opacity=".2"/><polygon points="40,22 33,18 33,26" fill="#0f0c19" opacity=".2"/></svg>
          <span style={{fontFamily:"'Outfit'",fontSize:15,fontWeight:900,background:"linear-gradient(135deg,#67e8f9,#818cf8)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>GameBoxd</span></span>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span onClick={()=>{setQO(true);setPg("search");setViewUID(null)}} style={{fontSize:15,cursor:"pointer",color:"rgba(255,255,255,.3)"}}>🔍</span>
          {user&&<span onClick={()=>{setShowNotifs(!showNotifs);if(!showNotifs){markRead(user.id);setNCount(0)}}} style={{fontSize:15,cursor:"pointer",color:nCount?"#fde68a":"rgba(255,255,255,.3)",position:"relative"}}>🔔{nCount>0&&<span style={{position:"absolute",top:-4,right:-6,width:12,height:12,borderRadius:6,background:"#f87171",fontSize:7,fontWeight:900,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center"}}>{nCount}</span>}</span>}
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
              {n.img&&<img src={n.img} style={{width:"100%",height:80,objectFit:"cover",objectPosition:"top"}}/>}
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
                  {n.img&&<img src={n.img} style={{width:"100%",height:80,objectFit:"cover",objectPosition:"top"}}/>}
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
            {feed.slice(0,10).map(a=><div key={a.id} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,.03)",fontSize:11}}>
              <Av url={a.profiles?.avatar_url} name={a.profiles?.display_name} size={18} onClick={()=>goUser(a.user_id)} v={avV}/>
              <div style={{flex:1,minWidth:0}}>
                <span style={{fontWeight:700,cursor:"pointer"}} onClick={()=>goUser(a.user_id)}>{a.profiles?.display_name}</span>
                <span style={{marginLeft:3,fontSize:10}}>{actIcon(a.action)}</span>
                <span style={{color:"rgba(255,255,255,.15)"}}> {actLabel(a.action)} </span>
                {a.game_title&&<span style={{color:"#67e8f9"}}>{a.game_title}</span>}
                {a.action==="followed"&&a.target_user_name&&<span style={{color:"#67e8f9"}}>{a.target_user_name}</span>}
                {a.extra_text&&<span style={{color:"rgba(255,255,255,.12)"}}> "{a.extra_text}"</span>}
              </div>
              <span style={{fontSize:9,color:"rgba(255,255,255,.08)",flexShrink:0}}>{tA(a.created_at)}</span></div>)}
          </aside>}
        </div>}</div>}

      {/* FEED */}
      {pg==="feed"&&user&&<div style={{animation:"fadeIn .15s"}}>
        <h2 style={{fontFamily:"'Outfit'",fontSize:m?20:24,fontWeight:900,marginBottom:16}}>Activity</h2>
        {feed.length?feed.map(a=><div key={a.id} style={{...glass,borderRadius:14,padding:m?"12px":"14px 16px",marginBottom:6,display:"flex",gap:m?10:14,alignItems:"flex-start"}}>
          <Av url={a.profiles?.avatar_url} name={a.profiles?.display_name} size={m?32:36} onClick={()=>goUser(a.user_id)} v={avV}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4,flexWrap:"wrap"}}>
              <span style={{fontWeight:800,fontSize:13,cursor:"pointer"}} onClick={()=>goUser(a.user_id)}>{a.profiles?.display_name}</span>
              <span style={{fontSize:14}}>{actIcon(a.action)}</span>
              <span style={{fontSize:12,color:"rgba(255,255,255,.3)"}}>{actLabel(a.action)}</span>
              <span style={{fontSize:10,color:"rgba(255,255,255,.1)",marginLeft:"auto",flexShrink:0}}>{tA(a.created_at)}</span>
            </div>
            {/* Game card for game-related actions */}
            {a.game_title&&<div style={{display:"flex",gap:10,alignItems:"center",padding:"8px 10px",borderRadius:10,background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.04)",cursor:"pointer"}}
              onClick={()=>{const found=all.find(x=>x.id===a.game_id);if(found)setSel(found);else if(a.game_id)setSel({id:a.game_id,t:a.game_title,img:a.game_img,y:"",genre:"",r:null,pf:[]})}}>
              {a.game_img&&<div style={{width:36,height:48,borderRadius:6,overflow:"hidden",flexShrink:0}}><img src={a.game_img} style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"top"}}/></div>}
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.game_title}</div>
                <div style={{display:"flex",alignItems:"center",gap:6,marginTop:2}}>
                  {a.action==="rated"&&a.rating&&<Stars rating={parseFloat(a.rating)} size={10} show/>}
                  {a.extra_text&&<span style={{fontSize:10,color:"rgba(255,255,255,.2)"}}>in "{a.extra_text}"</span>}
                </div>
              </div>
            </div>}
            {/* Follow action */}
            {a.action==="followed"&&a.target_user_name&&<div onClick={()=>a.target_user_id&&goUser(a.target_user_id)} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:10,background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.04)",cursor:"pointer"}}>
              <div style={{width:28,height:28,borderRadius:8,background:"linear-gradient(135deg,#67e8f9,#818cf8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#0f0c19"}}>{(a.target_user_name||"?").charAt(0)}</div>
              <span style={{fontSize:13,fontWeight:600}}>{a.target_user_name}</span>
            </div>}
          </div>
        </div>)
        :<p style={{textAlign:"center",padding:40,color:"rgba(255,255,255,.15)"}}>No activity yet — follow people to see their updates here</p>}</div>}

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
        <ProfilePage viewId={viewUID} me={user} m={m} ud={ud} goUser={goUser} avV={avV} allGames={all} myLists={myL} reloadLists={()=>user&&loadLists(user.id).then(setMyL)} setSel={setSel}/>
      </div>}

      {/* MY PROFILE — full page */}
      {pg==="profile"&&user&&<div style={{animation:"fadeIn .15s"}}>
        <ProfilePage viewId={user.id} me={user} m={m} ud={ud} goUser={goUser} avV={avV} onEdit={()=>setEp(true)} onSignOut={so} onSteam={()=>setSteamModal(true)} allGames={all} myLists={myL} reloadLists={()=>loadLists(user.id).then(setMyL)} setSel={setSel} onBanner={reloadProf}/>
      </div>}

      {/* STATS */}
      {pg==="stats"&&user&&<div style={{animation:"fadeIn .15s"}}>
        <h2 style={{fontFamily:"'Outfit'",fontSize:m?20:24,fontWeight:900,marginBottom:16}}>Stats</h2>
        {lib.length?(()=>{const bs=s=>lib.filter(g=>ud[g.id]?.status===s).length;const rt=lib.filter(g=>ud[g.id]?.myRating);const av=rt.length?(rt.reduce((s,g)=>s+ud[g.id].myRating,0)/rt.length).toFixed(1):"—";
          // Genre breakdown from all games
          const genres={};all.forEach(g=>{if(ud[g.id]?.status&&g.genre){g.genre.split(", ").forEach(gn=>{genres[gn]=(genres[gn]||0)+1})}});
          const topGenres=Object.entries(genres).sort((a,b)=>b[1]-a[1]).slice(0,6);
          // Rating distribution
          const rDist=[0,0,0,0,0,0,0,0,0,0];rt.forEach(g=>{const r=ud[g.id]?.myRating;if(r){const idx=Math.min(Math.floor((r-0.5)/0.5),9);rDist[idx]++}});
          const maxRD=Math.max(...rDist,1);
          // Monthly activity (last 6 months)
          const months={};for(let i=0;i<6;i++){const d=new Date();d.setMonth(d.getMonth()-i);const k=d.toISOString().slice(0,7);months[k]=0}
          lib.forEach(g=>{const k=ud[g.id]?.updated_at?.slice?.(0,7)||new Date().toISOString().slice(0,7);if(months[k]!==undefined)months[k]++});
          const monthArr=Object.entries(months).reverse();const maxM=Math.max(...monthArr.map(x=>x[1]),1);

          return<><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:m?8:12,marginBottom:24}}>
            {[{l:"Games",v:lib.length,c:"#67e8f9"},{l:"Done",v:bs("completed"),c:"#6ee7b7"},{l:"Playing",v:bs("playing"),c:"#c4b5fd"},{l:"Avg ★",v:av,c:"#fde68a"}].map((s,i)=>
              <div key={i} style={{...glass,padding:m?12:16,borderRadius:16,textAlign:"center"}}>
                <div style={{fontSize:m?20:26,fontWeight:900,color:s.c}}>{s.v}</div><div style={{fontSize:10,color:"rgba(255,255,255,.25)",marginTop:2}}>{s.l}</div></div>)}</div>

            {/* Status bars */}
            <div style={{marginBottom:24}}>
              <div className="sec-title">STATUS BREAKDOWN</div>
              {Object.entries(SC).map(([k,c])=>{const cn=bs(k),mx=lib.length||1;
                return<div key={k} style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                  <span style={{width:70,fontSize:12,color:"rgba(255,255,255,.3)",fontWeight:600,textAlign:"right"}}>{c.l}</span>
                  <div style={{flex:1,height:20,background:"rgba(255,255,255,.03)",borderRadius:10,overflow:"hidden"}}>
                    <div style={{height:"100%",width:cn?(cn/mx*100)+"%":"0%",background:c.c,borderRadius:10,opacity:.4,transition:"width .6s"}}></div></div>
                  <span style={{fontSize:11,color:"rgba(255,255,255,.2)",width:20}}>{cn}</span></div>})}</div>

            {/* Rating Distribution */}
            {rt.length>0&&<div style={{marginBottom:24}}>
              <div className="sec-title">RATING DISTRIBUTION</div>
              <div style={{display:"flex",alignItems:"flex-end",gap:m?3:4,height:80}}>
                {rDist.map((c,i)=><div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                  <span style={{fontSize:8,color:"rgba(255,255,255,.2)"}}>{c||""}</span>
                  <div style={{width:"100%",height:c?(c/maxRD*60)+8:4,background:c?"linear-gradient(to top,#67e8f9,#818cf8)":"rgba(255,255,255,.03)",borderRadius:4,opacity:c?.5:.2,transition:"height .4s"}}/>
                  <span style={{fontSize:7,color:"rgba(255,255,255,.15)"}}>{(i*0.5+0.5).toFixed(1)}</span></div>)}</div></div>}

            {/* Genre Breakdown */}
            {topGenres.length>0&&<div style={{marginBottom:24}}>
              <div className="sec-title">TOP GENRES</div>
              <div style={{display:"grid",gridTemplateColumns:m?"repeat(2,1fr)":"repeat(3,1fr)",gap:8}}>
                {topGenres.map(([name,count],i)=>{const colors=["#67e8f9","#818cf8","#c4b5fd","#6ee7b7","#fde68a","#fda4af"];
                  return<div key={name} style={{...glass,padding:"12px 14px",borderRadius:12,display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:32,height:32,borderRadius:8,background:colors[i%6]+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:colors[i%6]}}>{count}</div>
                    <div><div style={{fontSize:12,fontWeight:700}}>{name}</div><div style={{fontSize:9,color:"rgba(255,255,255,.15)"}}>{Math.round(count/lib.length*100)}% of library</div></div></div>})}</div></div>}

            {/* Monthly Activity */}
            {monthArr.length>0&&<div>
              <div className="sec-title">MONTHLY ACTIVITY</div>
              <div style={{display:"flex",alignItems:"flex-end",gap:m?6:10,height:80}}>
                {monthArr.map(([month,count])=><div key={month} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                  <span style={{fontSize:8,color:"rgba(255,255,255,.2)"}}>{count||""}</span>
                  <div style={{width:"100%",height:count?(count/maxM*60)+6:4,background:count?"linear-gradient(to top,#6ee7b7,#67e8f9)":"rgba(255,255,255,.03)",borderRadius:4,opacity:count?.5:.2,transition:"height .4s"}}/>
                  <span style={{fontSize:7,color:"rgba(255,255,255,.15)"}}>{new Date(month+"-01").toLocaleString("en",{month:"short"})}</span></div>)}</div></div>}
          </>
        })():<p style={{textAlign:"center",padding:40,color:"rgba(255,255,255,.15)"}}>Add games to see stats</p>}</div>}
    </main>

    {m&&<div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:90,background:"rgba(15,12,25,.92)",backdropFilter:"blur(16px)",borderTop:"1px solid rgba(255,255,255,.04)",display:"flex",paddingTop:5,paddingBottom:"max(env(safe-area-inset-bottom,12px),12px)"}}>
      {NAV.map(n=><div key={n.id} onClick={()=>{setPg(n.id);setQ("");setQO(false);setViewUID(null)}} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,cursor:"pointer",padding:"2px 0"}}>
        <span style={{fontSize:18,opacity:pg===n.id?1:.2}}>{n.i}</span>
        <span style={{fontSize:8,fontWeight:800,color:pg===n.id?"#67e8f9":"rgba(255,255,255,.15)"}}>{n.l}</span></div>)}</div>}

    {/* Mobile notification panel */}
    {m&&showNotifs&&<div onClick={()=>setShowNotifs(false)} style={{position:"fixed",inset:0,zIndex:1900,background:"rgba(15,12,25,.95)",backdropFilter:"blur(16px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#16132a",width:"100%",maxHeight:"80vh",borderRadius:"24px 24px 0 0",overflow:"auto",border:"1px solid rgba(255,255,255,.06)",padding:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <h3 style={{fontSize:18,fontWeight:900}}>Notifications</h3>
          <button onClick={()=>setShowNotifs(false)} style={{background:"rgba(255,255,255,.06)",border:"none",color:"rgba(255,255,255,.5)",fontSize:14,cursor:"pointer",padding:"6px 10px",borderRadius:8}}>✕</button></div>
        {notifs.length?notifs.slice(0,20).map(n=><div key={n.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,.03)",opacity:n.read?.5:1}}>
          {n.from?.avatar_url?<Av url={n.from.avatar_url} name={n.from.display_name} size={28} v={avV}/>
          :<span style={{fontSize:18,flexShrink:0}}>{n.type==="follow"?"👥":n.type==="like"?"❤️":n.type==="comment"?"💬":"📌"}</span>}
          <div style={{flex:1}}><span style={{fontWeight:700,fontSize:13}}>{n.from?.display_name||""}</span> <span style={{color:"rgba(255,255,255,.4)",fontSize:12}}>{n.message||n.type}</span>{n.game_title&&<div style={{color:"#67e8f9",fontSize:11,marginTop:2}}>{n.game_title}</div>}</div>
          <span style={{fontSize:10,color:"rgba(255,255,255,.1)",flexShrink:0}}>{tA(n.created_at)}</span></div>)
        :<p style={{color:"rgba(255,255,255,.15)",fontSize:13,textAlign:"center",padding:30}}>No notifications yet</p>}
      </div></div>}

    {sel&&<GD game={sel} onClose={()=>setSel(null)} m={m} ud={ud} setUd={setUd} user={user} setSa={setSa} refresh={rf} goUser={goUser} avV={avV} myLists={myL} reloadLists={()=>user&&loadLists(user.id).then(setMyL)} userProf={prof}/>}
  </div>}
