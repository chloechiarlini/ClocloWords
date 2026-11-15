import {useState,useEffect,useRef} from "react";
const KEY="memo_v1";
const VERBS="be|was/were|been|être;become|became|become|devenir;begin|began|begun|commencer;break|broke|broken|casser;bring|brought|brought|apporter;build|built|built|construire;buy|bought|bought|acheter;catch|caught|caught|attraper;choose|chose|chosen|choisir;come|came|come|venir;cost|cost|cost|coûter;cut|cut|cut|couper;do|did|done|faire;draw|drew|drawn|dessiner;drink|drank|drunk|boire;drive|drove|driven|conduire;eat|ate|eaten|manger;fall|fell|fallen|tomber;feel|felt|felt|ressentir;fight|fought|fought|se battre;find|found|found|trouver;fly|flew|flown|voler (dans les airs);forget|forgot|forgotten|oublier;get|got|got/gotten|obtenir;give|gave|given|donner;go|went|gone|aller;grow|grew|grown|grandir;have|had|had|avoir;hear|heard|heard|entendre;hide|hid|hidden|cacher;hold|held|held|tenir;keep|kept|kept|garder;know|knew|known|savoir, connaître;leave|left|left|partir, laisser;lend|lent|lent|prêter;let|let|let|laisser, permettre;lose|lost|lost|perdre;make|made|made|fabriquer, faire;mean|meant|meant|signifier;meet|met|met|rencontrer;pay|paid|paid|payer;put|put|put|mettre;read|read|read|lire;ride|rode|ridden|monter (vélo, cheval);ring|rang|rung|sonner;rise|rose|risen|se lever, monter;run|ran|run|courir;say|said|said|dire;see|saw|seen|voir;sell|sold|sold|vendre;send|sent|sent|envoyer;set|set|set|placer, régler;shake|shook|shaken|secouer;shine|shone|shone|briller;show|showed|shown|montrer;shut|shut|shut|fermer;sing|sang|sung|chanter;sit|sat|sat|s’asseoir;sleep|slept|slept|dormir;speak|spoke|spoken|parler;spend|spent|spent|dépenser, passer (temps);stand|stood|stood|se tenir debout;steal|stole|stolen|voler (dérober);swim|swam|swum|nager;take|took|taken|prendre;teach|taught|taught|enseigner;tell|told|told|dire, raconter;think|thought|thought|penser;throw|threw|thrown|lancer;understand|understood|understood|comprendre;wake|woke|woken|se réveiller;wear|wore|worn|porter (vêtement);win|won|won|gagner;write|wrote|written|écrire";
const mkVerbs=()=>VERBS.split(";").map((s,i)=>{const [a,b,c,f]=s.split("|");return {id:"v"+i,en:"to "+a,fr:f,forms:b+" · "+c,lv:0,seen:0,ok:0,ko:0,created:0}});
const blank={cards:[],verbs:[],log:{},n:0,synced:0};
const load=()=>{let x=blank;try{x={...blank,...JSON.parse(localStorage.getItem(KEY)||"{}")}}catch{}return x.verbs.length?x:{...x,verbs:mkVerbs()}};
const dstr=d=>new Date(d.getTime()-d.getTimezoneOffset()*6e4).toISOString().slice(0,10);
const norm=s=>s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();
const art=s=>s.replace(/^(to|the|a|an|le|la|les|un|une|l) /,"");
function variants(s){s=s.replace(/\(selon[^)]*\)/gi,"");const m=s.match(/\(([^) ]{1,4})\)/),o=[s.replace(/\([^)]*\)/g," ")];if(m)o.push(s.replace(/\(([^) ]{1,4})\)/,"$1"));return o.map(x=>art(norm(x))).filter(Boolean)}
const hash=s=>{let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))|0;return h};
const W=[8,5,3,2,1.2],COL=["bg-ko","bg-ko","bg-mid","bg-mid","bg-ok"],RING={g:"border-ok",y:"border-mid",r:"border-ko"};
const PAL=["bg-acc2 text-acc","bg-blue text-on","bg-ok/40 text-on","bg-mid/50 text-on"];
const catOf=c=>c.cat||(/^to /i.test(c.en)?"Verbes":c.en.trim().split(/\s+/).length>=3?"Expressions":"Mots");
const pool=(x,deck,cat)=>deck==="verbs"?x.verbs:x.cards.filter(c=>cat==="Tout"||catOf(c)===cat);
function pick(cs,last){const p=cs.length>1?cs.filter(c=>c.id!==last):cs;let r=Math.random()*p.reduce((a,c)=>a+W[c.lv],0);for(const c of p){r-=W[c.lv];if(r<=0)return c}return p[0]}
function streak(log){let n=0;const d=new Date();if(!log[dstr(d)])d.setDate(d.getDate()-1);while(log[dstr(d)]){n++;d.setDate(d.getDate()-1)}return n}
function parse(t){const o=[];let cat="";t.split("\n").forEach(l=>{l=l.replace(/^\s*[•*·]\s*/,"").trim();if(!l)return;
  if(l.startsWith("#")&&!l.includes("=")){cat=l.replace(/^#+\s*/,"").trim();return}
  let tag="";const m0=l.match(/\s#([\p{L}\d_-]+)\s*$/u);if(m0){tag=m0[1].replace(/_/g," ");l=l.slice(0,m0.index).trim()}
  let a,b;const k=l.indexOf("=");if(k>=0){a=l.slice(0,k);b=l.slice(k+1)}else{const m=l.match(/\s+[-–—]\s+/);if(!m)return;a=l.slice(0,m.index);b=l.slice(m.index+m[0].length)}
  a=a.trim();b=b.trim();if(a&&b)o.push([a,b,tag||cat])});return o}
function applyRes(x,deck,id,res,w){const k=dstr(new Date()),ok=res==="g";
  return {...x,[deck]:x[deck].map(c=>c.id!==id?c:{...c,lv:res==="g"?Math.min(4,c.lv+1):res==="r"?(w?Math.max(0,c.lv-1):0):c.lv,ok:c.ok+(ok?1:0),ko:c.ko+(res==="r"?1:0)}),
    log:{...x.log,[k]:{n:(x.log[k]?.n||0)+1,ok:(x.log[k]?.ok||0)+(ok?1:0)}}}}
const Ic=({p})=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{p}</svg>;
const btn="w-full rounded-2xl py-3.5 font-bold transition active:scale-[.98]";
const Bar=({items})=>{const n=items.filter(c=>!c.seen).length,a=items.filter(c=>c.seen&&c.lv>=3).length,p=items.length-n-a,T=items.length||1;
  return <div className="mb-3"><div className="flex h-2 overflow-hidden rounded-full bg-line"><i className="bg-ok transition-all duration-500" style={{width:a/T*100+"%"}}/><i className="bg-mid transition-all duration-500" style={{width:p/T*100+"%"}}/><i className="bg-blue transition-all duration-500" style={{width:n/T*100+"%"}}/></div>
  <p className="mt-1 text-[11px] text-mute">{n} nouvelles · {p} en cours · {a} acquises</p></div>};

export default function App(){
  const [d,setD]=useState(load),[view,setView]=useState("play"),[cur,setCur]=useState(null),[cat,setCat]=useState("Tout"),[msg,setMsg]=useState(""),[manual,setManual]=useState(false),[txt,setTxt]=useState(""),[dr,setDr]=useState({x:0,y:0,on:false});
  const st=useRef(null);
  useEffect(()=>{try{localStorage.setItem(KEY,JSON.stringify(d))}catch{}},[d]);
  const say=t=>{setMsg(t);setTimeout(()=>setMsg(""),2800)};
  const deck=view==="verbs"?"verbs":"cards";
  const cats=Object.entries(d.cards.reduce((a,c)=>{const k=catOf(c);a[k]=(a[k]||0)+1;return a},{})).sort((a,b)=>b[1]-a[1]).map(x=>x[0]);
  const start=(x,dk)=>{const it=pool(x,dk,cat);if(!it.length){setD(x);return setCur(null)}
    const c=pick(it,cur?.id),n=x.n+1;setD({...x,n,[dk]:x[dk].map(k=>k.id===c.id?{...k,seen:k.seen+1}:k)});
    setCur({deck:dk,id:c.id,dir:dk==="verbs"||Math.random()<.5?"en-fr":"fr-en",mode:dk==="verbs"||n%2===0?"guess":"write",flipped:false,res:null,raw:"",skip:false})};
  const draw=()=>start(d,deck);
  useEffect(()=>{if(view!=="play"&&view!=="verbs")return;const it=pool(d,deck,cat);if(it.length&&(!cur||cur.deck!==deck||!it.some(c=>c.id===cur.id)))start(d,deck)},[view,cat,d.cards.length,cur]);
  useEffect(()=>{if(cat!=="Tout"&&d.cards.length&&!cats.includes(cat))setCat("Tout")},[d.cards]);
  const card=cur&&d[cur.deck].find(c=>c.id===cur.id);
  const finish=(res,raw,skip)=>{if(cur.res)return;setD(x=>applyRes(x,cur.deck,cur.id,res,!skip));setCur({...cur,flipped:true,res,skip:!!skip})};
  const judge=res=>start(applyRes(d,cur.deck,cur.id,res,false),cur.deck);
  const check=()=>{const v=art(norm(cur.raw));if(!v)return;const a=cur.dir==="en-fr"?card.fr:card.en;
    finish(a.split(/\s*\/\s*/).some(x=>variants(x).includes(v))?"g":"r",cur.raw)};
  const down=e=>{if(!cur||cur.res)return;st.current={x:e.clientX,y:e.clientY,m:false};e.currentTarget.setPointerCapture?.(e.pointerId)};
  const move=e=>{const s=st.current;if(!s)return;const dx=e.clientX-s.x,dy=e.clientY-s.y;if(Math.abs(dx)+Math.abs(dy)>8)s.m=true;if(s.m)setDr({x:dx,y:Math.min(0,dy),on:true})};
  const up=()=>{const s=st.current;st.current=null;if(!s)return;
    if(!s.m){setCur(c=>({...c,flipped:!c.flipped}));return setDr({x:0,y:0,on:false})}
    const res=dr.x>90?"g":dr.x<-90?"r":dr.y<-90?"y":null;if(!res)return setDr({x:0,y:0,on:false});
    setDr({x:res==="g"?520:res==="r"?-520:0,y:res==="y"?-520:0,on:false});setTimeout(()=>{judge(res);setDr({x:0,y:0,on:false})},200)};
  const sync=(text,quiet)=>{const seen=new Set(),inc=[];
    parse(text).forEach(([en,fr,c])=>{const k=norm(en);if(!k||seen.has(k))return;seen.add(k);inc.push([k,en,fr,c])});
    if(!inc.length)return say("Aucun mot trouvé dans ce texte.");
    const old=d.cards,matched=old.filter(c=>seen.has(norm(c.en))).length;
    if(old.length&&matched<old.length*.5)return say("Cette liste ne ressemble pas à ta note, rien n’a été modifié.");
    let add=0,upd=0,del=0,cards=old.map(c=>({...c}));
    inc.forEach(([k,en,fr,c])=>{const x=cards.find(y=>norm(y.en)===k);
      if(x){if(x.fr!==fr||x.en!==en||(x.cat||"")!==c){Object.assign(x,{en,fr,cat:c});upd++}}
      else{cards.push({id:Date.now()+Math.random(),en,fr,cat:c,lv:0,seen:0,ok:0,ko:0,created:Date.now()});add++}});
    const before=cards.length;cards=cards.filter(c=>seen.has(norm(c.en)));del=before-cards.length;
    setD({...d,cards,synced:Date.now(),lastHash:hash(text)});
    const parts=[add&&`${add} ajouté${add>1?"s":""}`,upd&&`${upd} modifié${upd>1?"s":""}`,del&&`${del} supprimé${del>1?"s":""}`].filter(Boolean);
    if(parts.length||!quiet)say(parts.join(", ")||"Tout est déjà à jour.")};
  const paste=()=>navigator.clipboard.readText().then(x=>{if(!x.includes("="))return say("Le presse-papiers ne contient pas ta note.");sync(x)}).catch(()=>{setView("note");setManual(true);say("Colle ta note dans la zone.")});
  const sr=useRef();sr.current=sync;const lh=useRef();lh.current=d.lastHash;
  useEffect(()=>{let armed=true;
    const tap=()=>{if(!armed||!navigator.clipboard?.readText)return;armed=false;
      navigator.clipboard.readText().then(x=>{if(x.split("\n").filter(l=>/\S\s=\s\S/.test(l)).length>=2&&hash(x)!==lh.current)sr.current(x,true)}).catch(()=>{})};
    const vis=()=>{if(!document.hidden)armed=true};
    addEventListener("pointerdown",tap);document.addEventListener("visibilitychange",vis);
    return()=>{removeEventListener("pointerdown",tap);document.removeEventListener("visibilitychange",vis)}},[]);

  const Play=()=>{
    const items=pool(d,deck,cat),isV=deck==="verbs";
    const top=<><div className="mb-2 flex items-center justify-between"><span className="text-[13px] font-extrabold text-acc">ClocloWords</span>
      <span aria-label="Série de jours" className="grid h-9 w-9 place-items-center rounded-full border-2 border-acc text-xs font-extrabold text-acc">{streak(d.log)}j</span></div>
      <Bar items={items}/>
      {!isV&&<div className="mb-2 flex gap-2 overflow-x-auto pb-1">{["Tout",...cats].map((c,i)=><button key={c} onClick={()=>setCat(c)} className={"shrink-0 rounded-full px-4 py-2 text-sm font-bold transition "+(cat===c?"bg-ink text-bg":PAL[i%PAL.length])}>{c}</button>)}</div>}</>;
    if(!items.length)return <div className="flex flex-1 flex-col">{top}<div className="rise my-auto px-2 text-center text-mute"><p className="mb-2 text-xl font-bold text-ink">Aucune carte</p><p className="mb-6">Lance ton raccourci, puis synchronise ta note.</p><button className={btn+" bg-acc text-white"} onClick={paste}>Synchroniser ma note</button></div></div>;
    if(!cur||!card||cur.deck!==deck)return <div className="flex flex-1 flex-col">{top}</div>;
    const en=cur.dir==="en-fr",w=cur.mode==="write",q=en?card.en:card.fr,a=isV?card.forms:en?card.fr:card.en;
    const tone=dr.x>40?"g":dr.x<-40?"r":dr.y<-40?"y":cur.res,ring=RING[tone]||"border-transparent";
    const face="flex flex-col items-center justify-center rounded-[28px] border-[3px] bg-card p-6 text-center shadow-soft "+ring;
    const lab="mb-3 text-xs font-extrabold uppercase tracking-widest text-acc";
    const ptr=w?{}:{onPointerDown:down,onPointerMove:move,onPointerUp:up,onPointerCancel:up};
    return <div className="flex flex-1 flex-col">{top}
      <div key={cur.id} className="rise flex flex-1 flex-col justify-center pb-4">
        <div className="scene h-[min(50vh,360px)] select-none" style={{touchAction:w?"auto":"none"}} {...ptr}>
          <div className="h-full" style={{transform:`translate(${dr.x}px,${dr.y}px) rotate(${dr.x/20}deg)`,transition:dr.on?"none":"transform .2s ease"}}>
            <div className={"flip h-full "+(cur.flipped?"on":"")}>
              <div className={"face "+face}><small className={lab}>{isV?"Verbe irrégulier":en?"English":"Français"}</small><b className="break-words text-3xl leading-tight">{q}</b>
                {isV&&<span className="mt-2 text-mute">{card.fr}</span>}{!w&&!cur.flipped&&<em className="mt-4 text-sm not-italic text-mute">Touche pour retourner</em>}</div>
              <div className={"face back "+face}><small className={lab}>{isV?"Prétérit · participe passé":en?"Français":"English"}</small><b className="break-words text-3xl leading-tight">{a}</b></div></div></div></div>
        {cur.res?<div className="rise mt-4">
            {w&&<p className={"mb-3 text-center text-xl font-extrabold "+(cur.res==="g"?"text-ok":cur.skip?"text-mute":"text-ko")}>{cur.res==="g"?"Juste !":cur.skip?"Passé":"Faux"}{cur.res==="r"&&!cur.skip&&<small className="block text-[13px] font-semibold text-mute">Tu as écrit : {cur.raw}</small>}</p>}
            <button className={btn+" bg-acc text-white"} onClick={draw}>Carte suivante</button></div>
          :w?<div className="mt-4"><input autoFocus value={cur.raw} onChange={e=>setCur({...cur,raw:e.target.value})} onKeyDown={e=>e.key==="Enter"&&check()} autoCapitalize="off" autoCorrect="off" spellCheck={false} placeholder="Ta réponse…" className="mb-2.5 w-full rounded-2xl border-2 border-line bg-card px-4 py-3.5 outline-none focus:border-acc"/>
            <button className={btn+" bg-acc text-white"} onClick={check}>Valider</button>
            <button className="mt-2 w-full py-2 text-sm font-bold text-mute" onClick={()=>finish("r","",true)}>Je ne sais pas</button></div>
          :<div className="mt-4"><div className="flex items-center justify-between text-sm font-bold text-ink">
            <button onClick={()=>judge("r")} className="rounded-full bg-ko/40 px-4 py-2">← Pas bon</button>
            <button onClick={()=>judge("y")} className="rounded-full bg-mid/50 px-4 py-2">↑ À revoir</button>
            <button onClick={()=>judge("g")} className="rounded-full bg-ok/40 px-4 py-2">Bon →</button></div>
            <p className="mt-2 text-center text-xs text-mute">Touche la carte pour la retourner, glisse-la pour la classer.</p></div>}
      </div></div>};

  const Stats=()=>{
    const cs=d.cards,N=cs.length||1,tot=cs.reduce((a,c)=>a+c.seen,0);
    const k=[cs.filter(c=>!c.seen).length,cs.filter(c=>c.seen&&c.lv<=1).length,cs.filter(c=>c.lv===2||c.lv===3).length,cs.filter(c=>c.lv===4).length];
    const days=[...Array(7)].map((_,i)=>{const x=new Date();x.setDate(x.getDate()-6+i);const l=d.log[dstr(x)]||{n:0,ok:0};return {...l,l:x.toLocaleDateString("fr-FR",{weekday:"narrow"})}});
    const wn=days.reduce((a,x)=>a+x.n,0),wok=days.reduce((a,x)=>a+x.ok,0),mx=Math.max(1,...days.map(x=>x.n));
    const nw=cs.filter(c=>c.created>Date.now()-6048e5).length,hard=[...cs].sort((a,b)=>b.ko-a.ko)[0];
    const top=[...cs].sort((a,b)=>b.seen-a.seen).slice(0,8),tm=Math.max(1,...top.map(c=>c.seen));
    const rows=[["Nouvelles","bg-acc2",k[0]],["En apprentissage","bg-mid",k[1]],["Presque acquises","bg-blue",k[2]],["Maîtrisées","bg-ok",k[3]]];
    const box="mb-3.5 rounded-3xl bg-card p-4 shadow-soft";
    return <div className="rise"><h1 className="mb-3.5 text-[26px] font-bold">Statistiques</h1>
      <div className="mb-3.5 grid grid-cols-2 gap-2.5">{[[cs.length,"mots"],[streak(d.log)+" j","d’affilée"],[tot,"tirages au total"],[(wn?Math.round(wok/wn*100):0)+" %","réussite sur 7 jours"]].map(([a,b])=><div key={b} className="rounded-3xl bg-card p-4 shadow-soft"><b className="block text-3xl">{a}</b><span className="text-[13px] text-mute">{b}</span></div>)}</div>
      <div className={box}><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold">Progression</h2><span className="rounded-full bg-acc2 px-3.5 py-1 text-sm font-extrabold text-acc">{(k[3]/N*100).toFixed(1).replace(".",",")} %</span></div>
        {rows.map(([n,c,v])=><div key={n} className="my-2 flex items-center gap-3"><span className={"rounded-full px-4 py-2.5 text-[15px] font-bold text-on transition-all duration-500 "+c} style={{width:Math.max(46,v/N*100)+"%"}}>{n}</span><b>{v}</b></div>)}</div>
      <div className={box}><h2 className="mb-3 text-[15px] font-bold text-mute">Bilan de la semaine</h2>
        <div className="flex h-28 items-end gap-2">{days.map((x,i)=><div key={i} className="flex h-full flex-1 flex-col items-center justify-end text-[11px] text-mute">{x.n||""}<span className="block w-full rounded-t-xl rounded-b bg-acc/80 transition-all duration-500" style={{height:Math.max(4,x.n/mx*80)+"%"}}/>{x.l}</div>)}</div>
        <p className="mt-3.5"><b>{wn}</b> tirages · <b>{nw}</b> nouveau{nw>1?"x":""} mot{nw>1?"s":""}{hard&&hard.ko>0&&<><br/>Le plus coriace : <b>{hard.en}</b> ({hard.ko} ratés)</>}</p></div>
      <div className={box}><h2 className="mb-3 text-[15px] font-bold text-mute">Tirages par mot</h2>{top.length?top.map(c=><div key={c.id} className="my-2 flex items-center gap-2.5 text-sm"><span className="w-[40%] truncate">{c.en}</span><span className="h-2.5 flex-1 overflow-hidden rounded-full bg-line"><i className={"block h-full rounded-full "+COL[c.lv]} style={{width:c.seen/tm*100+"%"}}/></span><span className="w-6 text-right text-mute">{c.seen}</span></div>):<p className="text-mute">Pas encore de tirages.</p>}</div></div>};

  const Note=()=>{const when=d.synced?new Date(d.synced).toLocaleString("fr-FR",{day:"numeric",month:"long",hour:"2-digit",minute:"2-digit"}):"jamais";
    return <div className="rise"><h1 className="mb-3.5 text-[26px] font-bold">Ma note</h1>
      <div className="mb-3.5 rounded-3xl bg-card p-4 shadow-soft"><p className="mb-3.5 text-sm text-mute">Les mots viennent de ta note Apple. Lance ton raccourci : il copie la note. Reviens ici et touche le bouton. La note fait foi : un mot retiré ou modifié dans la note l’est aussi ici.</p>
        <button className={btn+" bg-acc text-white"} onClick={paste}>Synchroniser depuis le presse-papiers</button>
        <p className="mt-3 text-sm text-mute">{d.cards.length} mot{d.cards.length>1?"s":""} · dernière synchro : {when}</p></div>
      <div className="mb-3.5 rounded-3xl bg-card p-4 text-sm text-mute shadow-soft"><h2 className="mb-2 text-[15px] font-bold">Classer par catégorie</h2>
        <p>Ajoute <b className="text-ink">#transport</b> à la fin d’une ligne, ou une ligne <b className="text-ink"># Transport</b> avant un groupe de mots. Sans rien, les mots sont rangés automatiquement : Verbes (to …), Expressions (3 mots ou plus) et Mots.</p></div>
      {manual&&<div className="mb-3.5 rounded-3xl bg-card p-4 shadow-soft"><h2 className="mb-2 text-[15px] font-bold text-mute">Collage manuel</h2>
        <textarea value={txt} onChange={e=>setTxt(e.target.value)} placeholder="empty = vide" className="mb-2.5 h-32 w-full rounded-2xl border-2 border-line bg-card p-3 outline-none focus:border-acc"/>
        <button className={btn+" bg-acc2 text-acc"} onClick={()=>sync(txt)}>Importer le texte</button></div>}</div>};

  const tabs=[["play","Jouer",<rect key="a" x="3" y="6" width="14" height="14" rx="3"/>,<path key="b" d="M8 3h10a3 3 0 0 1 3 3v10"/>],["verbs","Verbes",<path key="e" d="M4 6h16M4 12h16M4 18h10"/>],["stats","Stats",<path key="c" d="M5 20V10M12 20V4M19 20v-7"/>],["note","Ma note",<path key="d" d="M12 4v11M7 11l5 5 5-5M5 20h14"/>]];
  return <div className="flex h-full flex-col">
    {msg&&<div className="rise fixed left-1/2 top-[calc(env(safe-area-inset-top,0px)+12px)] z-10 -translate-x-1/2 rounded-full bg-acc px-4 py-2.5 text-center text-sm font-bold text-white">{msg}</div>}
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col overflow-y-auto px-5 pb-3 pt-4">{view==="play"||view==="verbs"?Play():view==="stats"?Stats():Note()}</main>
    <nav className="flex gap-1.5 border-t border-line bg-card px-3 py-2">{tabs.map(([v,l,...p])=><button key={v} onClick={()=>setView(v)} className={"flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-1.5 text-xs font-semibold transition "+(view===v?"bg-acc2 text-acc":"text-mute")}><Ic p={p}/>{l}</button>)}</nav></div>;
}
