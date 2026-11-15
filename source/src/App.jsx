import {useState,useEffect,useRef} from "react";
const KEY="memo_v1";
const VERBS="be|was/were|been|être;become|became|become|devenir;begin|began|begun|commencer;break|broke|broken|casser;bring|brought|brought|apporter;build|built|built|construire;buy|bought|bought|acheter;catch|caught|caught|attraper;choose|chose|chosen|choisir;come|came|come|venir;cost|cost|cost|coûter;cut|cut|cut|couper;do|did|done|faire;draw|drew|drawn|dessiner;drink|drank|drunk|boire;drive|drove|driven|conduire;eat|ate|eaten|manger;fall|fell|fallen|tomber;feel|felt|felt|ressentir;fight|fought|fought|se battre;find|found|found|trouver;fly|flew|flown|voler (dans les airs);forget|forgot|forgotten|oublier;get|got|got/gotten|obtenir;give|gave|given|donner;go|went|gone|aller;grow|grew|grown|grandir;have|had|had|avoir;hear|heard|heard|entendre;hide|hid|hidden|cacher;hold|held|held|tenir;keep|kept|kept|garder;know|knew|known|savoir, connaître;leave|left|left|partir, laisser;lend|lent|lent|prêter;let|let|let|laisser, permettre;lose|lost|lost|perdre;make|made|made|fabriquer, faire;mean|meant|meant|signifier;meet|met|met|rencontrer;pay|paid|paid|payer;put|put|put|mettre;read|read|read|lire;ride|rode|ridden|monter (vélo, cheval);ring|rang|rung|sonner;rise|rose|risen|se lever, monter;run|ran|run|courir;say|said|said|dire;see|saw|seen|voir;sell|sold|sold|vendre;send|sent|sent|envoyer;set|set|set|placer, régler;shake|shook|shaken|secouer;shine|shone|shone|briller;show|showed|shown|montrer;shut|shut|shut|fermer;sing|sang|sung|chanter;sit|sat|sat|s’asseoir;sleep|slept|slept|dormir;speak|spoke|spoken|parler;spend|spent|spent|dépenser, passer (temps);stand|stood|stood|se tenir debout;steal|stole|stolen|voler (dérober);swim|swam|swum|nager;take|took|taken|prendre;teach|taught|taught|enseigner;tell|told|told|dire, raconter;think|thought|thought|penser;throw|threw|thrown|lancer;understand|understood|understood|comprendre;wake|woke|woken|se réveiller;wear|wore|worn|porter (vêtement);win|won|won|gagner;write|wrote|written|écrire";
const mkVerbs=()=>VERBS.split(";").map((s,i)=>{const [a,b,c,f]=s.split("|");return {id:"v"+i,en:"to "+a,fr:f,forms:b+" · "+c,seen:0,ok:0,ko:0,wS:0,gS:0,last:0,created:0}});
const blank={cards:[],verbs:[],log:{},n:0,synced:0};
const load=()=>{let x=blank;try{x={...blank,...JSON.parse(localStorage.getItem(KEY)||"{}")}}catch{}return x.verbs.length?x:{...x,verbs:mkVerbs()}};
const dstr=d=>new Date(d.getTime()-d.getTimezoneOffset()*6e4).toISOString().slice(0,10);
const norm=s=>s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();
const art=s=>s.replace(/^(to|the|a|an|le|la|les|un|une|l) /,"");
function variants(s){s=s.replace(/\(selon[^)]*\)/gi,"");const m=s.match(/\(([^) ]{1,4})\)/),o=[s.replace(/\([^)]*\)/g," ")];if(m)o.push(s.replace(/\(([^) ]{1,4})\)/,"$1"));return o.map(x=>art(norm(x))).filter(Boolean)}
const hash=s=>{let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))|0;return h};
let ACQ=3;
const BASE={new:8,fail:10,learn:5,acq:1.5},SC={new:"bg-blue",fail:"bg-ko",learn:"bg-mid",acq:"bg-ok"},RING={g:"border-ok",y:"border-mid",r:"border-ko"};
const stt=(c,v)=>!c.last?"new":(v?(c.wS||0)>=ACQ:(c.wS||0)>=ACQ&&(c.gS||0)>=ACQ)?"acq":((c.wS||0)>0||(c.gS||0)>0)?"learn":"fail";
const wt=(c,v)=>{const t=stt(c,v);if(t==="new")return BASE.new;const s=(c.wS||0)+(c.gS||0),iv=t==="acq"?Math.min(30,3+Math.max(0,s-(v?ACQ:ACQ*2))*3):t==="fail"?.01:[.01,.2,1,2,3][Math.min(s,4)];return BASE[t]*((Date.now()-c.last)/864e5>=iv?1:.15)};
const PAL=["bg-acc2 text-acc","bg-blue text-on","bg-ok/40 text-on","bg-mid/50 text-on","bg-ko/30 text-on"];
const pc=k=>PAL[Math.abs(hash(k))%PAL.length];
const catOf=c=>c.cat?.trim()||(/^to /i.test(c.en)?"Verbes":c.en.trim().split(/\s+/).length>=3?"Expressions":"Mots");
const pool=(x,deck,cat,rev)=>{const v=deck==="verbs",a=v?x.verbs:x.cards.filter(c=>c.en.trim()&&c.fr.trim()&&(cat==="Tout"||catOf(c)===cat));return rev?a.filter(c=>{const t=stt(c,v);return t==="fail"||t==="learn"}):a};
const fresh={done:0,g:0,y:0,r:0,miss:[],over:false};
function pick(cs,last,v){const p=cs.length>1?cs.filter(c=>c.id!==last):cs;let r=Math.random()*p.reduce((a,c)=>a+wt(c,v),0);for(const c of p){r-=wt(c,v);if(r<=0)return c}return p[0]}
function streak(log){let n=0;const d=new Date();if(!log[dstr(d)])d.setDate(d.getDate()-1);while(log[dstr(d)]){n++;d.setDate(d.getDate()-1)}return n}
function parse(t){const o=[];let cat="";t.split("\n").forEach(l=>{l=l.replace(/^\s*[•*·]\s*/,"").trim();if(!l)return;
  if(l.startsWith("#")&&!l.includes("=")){cat=l.replace(/^#+\s*/,"").trim();return}
  let tag="";const m0=l.match(/\s#([\p{L}\d_-]+)\s*$/u);if(m0){tag=m0[1].replace(/_/g," ");l=l.slice(0,m0.index).trim()}
  let a,b;const k=l.indexOf("=");if(k>=0){a=l.slice(0,k);b=l.slice(k+1)}else{const m=l.match(/\s+[-–—]\s+/);if(!m)return;a=l.slice(0,m.index);b=l.slice(m.index+m[0].length)}
  a=a.trim();b=b.trim();if(a&&b)o.push([a,b,tag||cat])});return o}
function applyRes(x,deck,id,kind,res){const k=dstr(new Date()),ok=res==="g";
  return {...x,[deck]:x[deck].map(c=>c.id!==id?c:{...c,last:Date.now(),wS:kind==="w"?(ok?(c.wS||0)+1:0):(c.wS||0),gS:kind==="g"?(res==="g"?(c.gS||0)+1:res==="r"?0:(c.gS||0)):(c.gS||0),ok:c.ok+(ok?1:0),ko:c.ko+(res==="r"?1:0)}),
    log:{...x.log,[k]:{n:(x.log[k]?.n||0)+1,ok:(x.log[k]?.ok||0)+(ok?1:0)}}}}
const Ic=({p})=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{p}</svg>;
const btn="w-full rounded-2xl py-3.5 font-bold transition active:scale-[.98]";
const Seg=({opts,val,on})=><div className="flex overflow-hidden rounded-md border border-line text-[13px] font-bold">{opts.map(([v,l])=><button key={String(v)} onClick={()=>on(v)} className={"flex-1 px-3 py-2 transition "+(val===v?"bg-acc2 text-acc":"bg-card text-mute")}>{l}</button>)}</div>;
const Bar=({items,v})=>{const t=k=>items.filter(c=>stt(c,v)===k).length,n=t("new"),a=t("acq"),p=items.length-n-a,T=items.length||1;
  return <div className="mb-3 shrink-0"><div className="flex h-2 overflow-hidden rounded-full bg-line"><i className="bg-ok transition-all duration-500" style={{width:a/T*100+"%"}}/><i className="bg-mid transition-all duration-500" style={{width:p/T*100+"%"}}/><i className="bg-blue transition-all duration-500" style={{width:n/T*100+"%"}}/></div>
  <p className="mt-1 text-[11px] text-mute">{n} nouvelles · {p} en cours · {a} acquises</p></div>};

export default function App(){
  const [d,setD]=useState(load),[view,setView]=useState("play"),[cur,setCur]=useState(null),[cat,setCat]=useState("Tout"),[msg,setMsg]=useState(""),[manual,setManual]=useState(false),[txt,setTxt]=useState(""),[dr,setDr]=useState({x:0,y:0,on:false}),[lf,setLf]=useState("en"),[open,setOpen]=useState({}),[rev,setRev]=useState(false),[prev,setPrev]=useState(null),[sess,setSess]=useState(fresh),[ne,setNe]=useState(""),[nf,setNf]=useState(""),[nc,setNc]=useState(""),[q,setQ]=useState(""),[modal,setModal]=useState(false),[added,setAdded]=useState(0),[showSet,setShowSet]=useState(false);
  const st=useRef(null),enRef=useRef(null),frRef=useRef(null);
  ACQ=d.acq||3;
  useEffect(()=>{try{localStorage.setItem(KEY,JSON.stringify(d))}catch{}},[d]);
  const say=t=>{setMsg(t);setTimeout(()=>setMsg(""),2800)};
  const deck=view==="verbs"?"verbs":"cards",goal=d.goal??10;
  const cats=Object.entries(d.cards.reduce((a,c)=>{const k=catOf(c);a[k]=(a[k]||0)+1;return a},{})).sort((a,b)=>b[1]-a[1]).map(x=>x[0]);
  const start=(x,dk)=>{const it=pool(x,dk,cat,rev);if(!it.length){setD(x);return setCur(null)}
    const c=pick(it,cur?.id,dk==="verbs"),n=x.n+1;setD({...x,n,[dk]:x[dk].map(k=>k.id===c.id?{...k,seen:k.seen+1}:k)});
    setCur({deck:dk,id:c.id,dir:dk==="verbs"||!x.dir||x.dir==="mix"?(Math.random()<.5?"en-fr":"fr-en"):x.dir,mode:dk==="verbs"||x.mode==="write"?"write":x.mode==="guess"?"guess":n%2?"write":"guess",flipped:false,res:null,raw:"",raws:["","",""],ok3:null,skip:false})};
  const draw=()=>{if(goal&&sess.done>=goal)return setSess({...sess,over:true});start(d,deck)};
  useEffect(()=>{if(view!=="play"&&view!=="verbs")return;const it=pool(d,deck,cat,rev);if(!it.length)return;
    if(!cur||cur.deck!==deck){if(cur)setSess(fresh);start(d,deck)}else if(!cur.res&&!it.some(c=>c.id===cur.id))start(d,deck)},[view,cat,rev,d.cards.length,cur]);
  useEffect(()=>{if(cat!=="Tout"&&d.cards.length&&!cats.includes(cat))setCat("Tout")},[d.cards]);
  const card=cur&&d[cur.deck].find(c=>c.id===cur.id);
  const snap=()=>setPrev({d,cur,sess});
  const bump=(s,res)=>({...s,done:s.done+1,g:s.g+(res==="g"?1:0),y:s.y+(res==="y"?1:0),r:s.r+(res==="r"?1:0),miss:res==="r"?[...s.miss,card.en]:s.miss});
  const finish=(res,skip,ok3)=>{if(cur.res)return;snap();setD(x=>applyRes(x,cur.deck,cur.id,"w",res));setSess(s=>bump(s,res));setCur({...cur,flipped:true,res,skip:!!skip,ok3})};
  const undo=()=>{if(!prev)return;setD(prev.d);setCur({...prev.cur});setSess(prev.sess);setPrev(null)};
  const newSess=()=>{setSess(fresh);setPrev(null);start(d,deck)};
  const UB=prev&&prev.cur.deck===deck?<button className="mt-3 w-full py-2 text-sm font-bold text-mute" onClick={undo}>Annuler la dernière réponse</button>:null;
  const judge=res=>{snap();const nd=applyRes(d,cur.deck,cur.id,"g",res),s=bump(sess,res);
    if(goal&&s.done>=goal){setD(nd);return setSess({...s,over:true})}setSess(s);start(nd,cur.deck)};
  const check=()=>{const v=art(norm(cur.raw));if(!v)return;const a=cur.dir==="en-fr"?card.fr:card.en;
    finish(a.split(/\s*\/\s*/).some(x=>variants(x).includes(v))?"g":"r")};
  const fields=()=>{const f=card.forms.split(" · ");return cur.dir==="en-fr"?[["Prétérit",f[0],0],["Participe passé",f[1],0],["Traduction",card.fr,1]]:[["Infinitif (anglais)",card.en,0],["Prétérit",f[0],0],["Participe passé",f[1],0]]};
  const checkV=()=>{if(cur.raws.every(r=>!r.trim()))return;const ok3=fields().map(([,e,fr],i)=>{const v=art(norm(cur.raws[i]));return !!v&&e.split(fr?/\s*[,\/;]\s*/:/\s*\/\s*/).some(x=>variants(x).includes(v))});finish(ok3.every(Boolean)?"g":"r",false,ok3)};
  const down=e=>{if(!cur||cur.res)return;st.current={x:e.clientX,y:e.clientY,m:false};e.currentTarget.setPointerCapture?.(e.pointerId)};
  const move=e=>{const s=st.current;if(!s)return;const dx=e.clientX-s.x,dy=e.clientY-s.y;if(Math.abs(dx)+Math.abs(dy)>8)s.m=true;if(s.m)setDr({x:dx,y:Math.min(0,dy),on:true})};
  const up=()=>{const s=st.current;st.current=null;if(!s)return;
    if(!s.m){setCur(c=>({...c,flipped:!c.flipped}));return setDr({x:0,y:0,on:false})}
    const res=dr.x>90?"g":dr.x<-90?"r":dr.y<-90?"y":null;if(!res)return setDr({x:0,y:0,on:false});
    setDr({x:res==="g"?520:res==="r"?-520:0,y:res==="y"?-520:0,on:false});setTimeout(()=>{judge(res);setDr({x:0,y:0,on:false})},200)};
  const addWord=()=>{const en=ne.trim(),fr=nf.trim();if(!en||!fr)return;const ex=d.cards.find(c=>norm(c.en)===norm(en));setPrev(null);
    if(ex)setD({...d,cards:d.cards.map(c=>c===ex?{...c,en,fr,cat:nc.trim()||c.cat}:c)});
    else setD({...d,cards:[{id:Date.now()+Math.random(),en,fr,cat:nc.trim(),seen:0,ok:0,ko:0,wS:0,gS:0,last:0,created:Date.now()},...d.cards]});
    setAdded(a=>a+1);setNe("");setNf("");enRef.current?.focus()};
  const edit=(id,f,v)=>{setPrev(null);setD(x=>({...x,cards:x.cards.map(c=>c.id===id?{...c,[f]:v}:c)}))};
  const del=id=>{if(window.confirm("Supprimer ce mot ?")){setPrev(null);setD(x=>({...x,cards:x.cards.filter(c=>c.id!==id)}))}};
  const setS=(k,v)=>setD({...d,[k]:v});
  const exp=()=>{const b=Date.now();navigator.clipboard.writeText(JSON.stringify({v:1,...d,bak:b})).then(()=>{setD({...d,bak:b});say("Sauvegarde copiée : colle-la dans une note.")}).catch(()=>say("Copie impossible."))};
  const rest=()=>navigator.clipboard.readText().then(t=>{const o=JSON.parse(t);if(!Array.isArray(o.cards))throw 0;if(!window.confirm(`Remplacer toutes les données par cette sauvegarde (${o.cards.length} mots) ?`))return;
    setPrev(null);setCur(null);setSess(fresh);setD({...blank,...o,verbs:o.verbs?.length?o.verbs:mkVerbs()});say("Sauvegarde restaurée.")}).catch(()=>say("Le presse-papiers ne contient pas de sauvegarde."));
  const resetProg=()=>{if(!window.confirm("Remettre toute ta progression à zéro ? Les mots sont conservés."))return;const z=c=>({...c,seen:0,ok:0,ko:0,wS:0,gS:0,last:0});
    setPrev(null);setCur(null);setSess(fresh);setD({...d,cards:d.cards.map(z),verbs:d.verbs.map(z),log:{},n:0});say("Progression remise à zéro.")};
  const clearAll=()=>{if(!window.confirm("Supprimer TOUS tes mots et ta progression ?")||!window.confirm("Dernière confirmation : c’est définitif."))return;
    setPrev(null);setCur(null);setSess(fresh);setD({...blank,verbs:mkVerbs(),goal:d.goal,dir:d.dir,mode:d.mode,acq:d.acq});say("Toutes les données ont été effacées.")};
  const revN=pool(d,deck,"Tout",true).length;
  const revPill=<button key="rev" onClick={()=>setRev(!rev)} className={"shrink-0 rounded-full border px-3 py-1 text-xs font-bold transition "+(rev?"border-ko bg-ko/40 text-ink":"border-line text-mute")}>À revoir · {revN}</button>;
  const GP=<div className="flex gap-2">{[5,10,20,0].map(g=><button key={g} onClick={()=>setD({...d,goal:g})} className={"rounded-full px-4 py-2 text-sm font-bold transition "+(goal===g?"bg-acc text-white":"bg-acc2 text-acc")}>{g||"Libre"}</button>)}</div>;
  const pills=[revPill,...["Tout",...cats].map((c,i)=><button key={c} onClick={()=>setCat(c)} className={"shrink-0 rounded-full px-3 py-1 text-xs font-bold transition "+(c==="Tout"?"border border-line bg-card text-ink":pc(c))+(cat===c?" ring-2 ring-inset ring-acc":"")}>{c}</button>)];
  const Play=()=>{
    const items=pool(d,deck,cat,rev),isV=deck==="verbs";
    const top=<><div className="mb-2 flex shrink-0 items-center justify-between"><span className="text-[13px] font-extrabold text-acc">ClocloWords</span>
      {goal>0&&<span className="text-xs font-bold text-mute">{Math.min(sess.done,goal)}/{goal}</span>}<span aria-label="Série de jours" className="grid h-9 w-9 place-items-center rounded-full border-2 border-acc text-xs font-extrabold text-acc">{streak(d.log)}j</span></div>
      <Bar items={items} v={isV}/>
      <div className="mb-2 flex shrink-0 gap-1.5 overflow-x-auto">{isV?revPill:pills}</div></>;
    if(!items.length)return <div className="flex flex-1 flex-col">{top}<div className="rise my-auto px-2 text-center text-mute">{rev?<><p className="mb-2 text-xl font-bold text-ink">Rien à revoir</p><p className="mb-6">Tous tes mots sont acquis ou pas encore vus.</p><button className={btn+" bg-acc text-white"} onClick={()=>setRev(false)}>Voir toutes les cartes</button></>:<><p className="mb-2 text-xl font-bold text-ink">Aucune carte</p><p className="mb-6">Ajoute tes premiers mots dans l’onglet Ma note.</p><button className={btn+" bg-acc text-white"} onClick={()=>setView("note")}>Ajouter des mots</button></>}</div></div>;
    if(sess.over&&cur&&cur.deck===deck){const miss=[...new Set(sess.miss)].slice(0,8);
      return <div className="flex flex-1 flex-col">{top}<div className="rise flex flex-1 flex-col justify-center pb-4">
        <div className="mb-4 rounded-[28px] bg-card p-6 text-center shadow-soft"><small className="mb-2 block text-xs font-extrabold uppercase tracking-widest text-acc">Séance terminée</small>
          <b className="block text-4xl">{sess.g}/{sess.done}</b><span className="text-mute">réponses justes</span>
          <div className="mt-4 grid grid-cols-3 gap-2 text-sm font-bold"><span className="rounded-2xl bg-ok/40 py-2">{sess.g} bon{sess.g>1?"s":""}</span><span className="rounded-2xl bg-mid/50 py-2">{sess.y} à revoir</span><span className="rounded-2xl bg-ko/40 py-2">{sess.r} raté{sess.r>1?"s":""}</span></div>
          {miss.length>0&&<p className="mt-4 text-sm text-mute">À retravailler : <b className="text-ink">{miss.join(", ")}</b></p>}</div>
        <p className="mb-2 text-center text-xs font-bold text-mute">Prochaine séance</p><div className="mb-3 flex justify-center">{GP}</div>
        <button className={btn+" bg-acc text-white"} onClick={newSess}>Nouvelle séance</button>{UB}</div></div>}
    if(!cur||!card||cur.deck!==deck)return <div className="flex flex-1 flex-col">{top}</div>;
    if(isV){const fs=fields(),en=cur.dir==="en-fr";
      return <div className="flex flex-1 flex-col">{top}<div key={cur.id} className="rise flex flex-1 flex-col justify-center pb-4">
        <div className="mb-4 rounded-[28px] bg-card p-6 text-center shadow-soft"><small className="mb-2 block text-xs font-extrabold uppercase tracking-widest text-acc">{en?"Verbe irrégulier":"Traduction"}</small><b className="break-words text-3xl">{en?card.en:card.fr}</b></div>
        {fs.map(([lab,exp],i)=><div key={lab} className="mb-2.5"><label className="mb-1 block text-xs font-bold text-mute">{lab}</label>
          <input autoFocus={i===0} disabled={!!cur.res} value={cur.raws[i]} onChange={e=>{const r=[...cur.raws];r[i]=e.target.value;setCur({...cur,raws:r})}} onKeyDown={e=>e.key==="Enter"&&i===2&&checkV()} autoCapitalize="off" autoCorrect="off" spellCheck={false}
            className={"w-full rounded-2xl border-2 bg-card px-4 py-3 outline-none focus:border-acc "+(cur.res?(cur.ok3?.[i]?"border-ok":"border-ko"):"border-line")}/>
          {cur.res&&!cur.ok3?.[i]&&<p className="mt-1 text-sm font-semibold text-ko">{exp}</p>}</div>)}
        {cur.res?<div className="rise mt-2"><p className={"mb-3 text-center text-xl font-extrabold "+(cur.res==="g"?"text-ok":cur.skip?"text-mute":"text-ko")}>{cur.res==="g"?"Tout juste !":cur.skip?"Passé":"Pas tout à fait"}</p><button className={btn+" bg-acc text-white"} onClick={draw}>{goal&&sess.done>=goal?"Voir le bilan":"Verbe suivant"}</button></div>
          :<div className="mt-2"><button className={btn+" bg-acc text-white"} onClick={checkV}>Valider</button><button className="mt-2 w-full py-2 text-sm font-bold text-mute" onClick={()=>finish("r",true,[false,false,false])}>Je ne sais pas</button></div>}
        {UB}
      </div></div>}
    const en=cur.dir==="en-fr",w=cur.mode==="write",q=en?card.en:card.fr,a=en?card.fr:card.en;
    const tone=dr.x>40?"g":dr.x<-40?"r":dr.y<-40?"y":cur.res,ring=RING[tone]||"border-transparent";
    const face="flex flex-col items-center justify-center rounded-[28px] border-[3px] bg-card p-6 text-center shadow-soft "+ring;
    const lab="mb-3 text-xs font-extrabold uppercase tracking-widest text-acc";
    const ptr=w?{}:{onPointerDown:down,onPointerMove:move,onPointerUp:up,onPointerCancel:up};
    return <div className="flex flex-1 flex-col">{top}
      <div key={cur.id} className="rise flex flex-1 flex-col justify-center pb-4">
        <div className="scene h-[min(50vh,360px)] select-none" style={{touchAction:w?"auto":"none"}} {...ptr}>
          <div className="h-full" style={{transform:`translate(${dr.x}px,${dr.y}px) rotate(${dr.x/20}deg)`,transition:dr.on?"none":"transform .2s ease"}}>
            <div className={"flip h-full "+(cur.flipped?"on":"")}>
              <div className={"face "+face}><small className={lab}>{en?"English":"Français"}</small><b className="break-words text-3xl leading-tight">{q}</b>{!w&&!cur.flipped&&<em className="mt-4 text-sm not-italic text-mute">Touche pour retourner</em>}</div>
              <div className={"face back "+face}><small className={lab}>{en?"Français":"English"}</small><b className="break-words text-3xl leading-tight">{a}</b></div></div></div></div>
        {cur.res?<div className="rise mt-4">
            {w&&<p className={"mb-3 text-center text-xl font-extrabold "+(cur.res==="g"?"text-ok":cur.skip?"text-mute":"text-ko")}>{cur.res==="g"?"Juste !":cur.skip?"Passé":"Faux"}{cur.res==="r"&&!cur.skip&&<small className="block text-[13px] font-semibold text-mute">Tu as écrit : {cur.raw}</small>}</p>}
            <button className={btn+" bg-acc text-white"} onClick={draw}>{goal&&sess.done>=goal?"Voir le bilan":"Carte suivante"}</button></div>
          :w?<div className="mt-4"><input autoFocus value={cur.raw} onChange={e=>setCur({...cur,raw:e.target.value})} onKeyDown={e=>e.key==="Enter"&&check()} autoCapitalize="off" autoCorrect="off" spellCheck={false} placeholder="Ta réponse…" className="mb-2.5 w-full rounded-2xl border-2 border-line bg-card px-4 py-3.5 outline-none focus:border-acc"/>
            <button className={btn+" bg-acc text-white"} onClick={check}>Valider</button>
            <button className="mt-2 w-full py-2 text-sm font-bold text-mute" onClick={()=>finish("r",true)}>Je ne sais pas</button></div>
          :<div className="mt-4"><div className="flex items-center justify-between text-sm font-bold text-ink">
            <button onClick={()=>judge("r")} className="rounded-full bg-ko/40 px-4 py-2">← Pas bon</button>
            <button onClick={()=>judge("y")} className="rounded-full bg-mid/50 px-4 py-2">↑ À revoir</button>
            <button onClick={()=>judge("g")} className="rounded-full bg-ok/40 px-4 py-2">Bon →</button></div>
            <p className="mt-2 text-center text-xs text-mute">Touche la carte pour la retourner, glisse-la pour la classer.</p></div>}
        {UB}
      </div></div>};

  const List=()=>{const it=pool(d,"cards",cat,rev);
    return <div className="rise"><div className="mb-3 flex items-center justify-between"><h1 className="text-[26px] font-bold">Mes mots</h1>
      <div className="flex rounded-full bg-card p-1 text-xs font-bold shadow-soft">{[["en","Anglais"],["fr","Français"]].map(([k,l])=><button key={k} onClick={()=>{setLf(k);setOpen({})}} className={"rounded-full px-3 py-1.5 transition "+(lf===k?"bg-acc text-white":"text-mute")}>{l}</button>)}</div></div>
      <div className="mb-3 flex shrink-0 gap-1.5 overflow-x-auto">{pills}</div>
      <p className="mb-2 text-xs text-mute">{it.length} mot{it.length>1?"s":""} · touche une carte pour voir la traduction</p>
      <div className="grid grid-cols-2 gap-2.5">{it.map(c=>{const o=open[c.id];return <button key={c.id} onClick={()=>setOpen({...open,[c.id]:!o})} className="scene block h-24 w-full"><div className={"flip h-full "+(o?"on":"")}>
        <div className="face flex items-center justify-center rounded-2xl bg-card p-3 text-center text-[15px] font-bold shadow-soft">{lf==="en"?c.en:c.fr}<i className={"absolute right-2.5 top-2.5 h-2 w-2 rounded-full "+SC[stt(c)]}/></div>
        <div className="face back flex items-center justify-center rounded-2xl bg-acc2 p-3 text-center text-[15px] font-bold text-acc">{lf==="en"?c.fr:c.en}</div></div></button>})}</div></div>};

  const Stats=()=>{
    const cs=d.cards,N=cs.length||1,tot=cs.reduce((a,c)=>a+c.seen,0);
    const k=["new","fail","learn","acq"].map(t=>cs.filter(c=>stt(c)===t).length);
    const days=[...Array(7)].map((_,i)=>{const x=new Date();x.setDate(x.getDate()-6+i);const l=d.log[dstr(x)]||{n:0,ok:0};return {...l,l:x.toLocaleDateString("fr-FR",{weekday:"narrow"})}});
    const wn=days.reduce((a,x)=>a+x.n,0),wok=days.reduce((a,x)=>a+x.ok,0),mx=Math.max(1,...days.map(x=>x.n));
    const nw=cs.filter(c=>c.created>Date.now()-6048e5).length,hard=[...cs].sort((a,b)=>b.ko-a.ko)[0];
    const top=[...cs].sort((a,b)=>b.seen-a.seen).slice(0,8),tm=Math.max(1,...top.map(c=>c.seen));
    const rows=[["Nouvelles","bg-blue",k[0]],["Pas acquises","bg-ko",k[1]],["En cours","bg-mid",k[2]],["Acquises","bg-ok",k[3]]];
    const box="mb-3.5 rounded-3xl bg-card p-4 shadow-soft";
    return <div className="rise"><h1 className="mb-3.5 text-[26px] font-bold">Statistiques</h1>
      <div className="mb-3.5 grid grid-cols-2 gap-2.5">{[[cs.length,"mots"],[streak(d.log)+" j","d’affilée"],[tot,"tirages au total"],[(wn?Math.round(wok/wn*100):0)+" %","réussite sur 7 jours"]].map(([a,b])=><div key={b} className="rounded-3xl bg-card p-4 shadow-soft"><b className="block text-3xl">{a}</b><span className="text-[13px] text-mute">{b}</span></div>)}</div>
      <div className={box}><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold">Progression</h2><span className="rounded-full bg-acc2 px-3.5 py-1 text-sm font-extrabold text-acc">{(k[3]/N*100).toFixed(1).replace(".",",")} %</span></div>
        {rows.map(([n,c,v])=><div key={n} className="my-2 flex items-center gap-3"><span className={"rounded-full px-4 py-2.5 text-[15px] font-bold text-on transition-all duration-500 "+c} style={{width:Math.max(46,v/N*100)+"%"}}>{n}</span><b>{v}</b></div>)}<p className="mt-3 text-xs text-mute">Un mot est acquis après {ACQ} bonnes réponses écrites et {ACQ} bonnes réponses devinées d’affilée. Pour les verbes : {ACQ} réussites complètes d’affilée.</p></div>
      <div className={box}><h2 className="mb-3 text-[15px] font-bold text-mute">Bilan de la semaine</h2>
        <div className="flex h-28 items-end gap-2">{days.map((x,i)=><div key={i} className="flex h-full flex-1 flex-col items-center justify-end text-[11px] text-mute">{x.n||""}<span className="block w-full rounded-t-xl rounded-b bg-acc/80 transition-all duration-500" style={{height:Math.max(4,x.n/mx*80)+"%"}}/>{x.l}</div>)}</div>
        <p className="mt-3.5"><b>{wn}</b> tirages · <b>{nw}</b> nouveau{nw>1?"x":""} mot{nw>1?"s":""}{hard&&hard.ko>0&&<><br/>Le plus coriace : <b>{hard.en}</b> ({hard.ko} ratés)</>}</p></div>
      <div className={box}><h2 className="mb-3 text-[15px] font-bold text-mute">Tirages par mot</h2>{top.length?top.map(c=><div key={c.id} className="my-2 flex items-center gap-2.5 text-sm"><span className="w-[40%] truncate">{c.en}</span><span className="h-2.5 flex-1 overflow-hidden rounded-full bg-line"><i className={"block h-full rounded-full "+SC[stt(c)]} style={{width:c.seen/tm*100+"%"}}/></span><span className="w-6 text-right text-mute">{c.seen}</span></div>):<p className="text-mute">Pas encore de tirages.</p>}</div></div>};

  const gear=[<path key="g1" d="M4 7h8M16 7h4M4 17h4M12 17h8"/>,<circle key="g2" cx="14" cy="7" r="2"/>,<circle key="g3" cx="10" cy="17" r="2"/>];
  const af={autoCapitalize:"off",autoCorrect:"off",spellCheck:false};
  const mi="mb-2 w-full rounded-md border border-line bg-card px-3 py-2.5 text-[15px] outline-none focus:border-acc",bt="w-full rounded-md py-3 font-bold transition active:scale-[.98]";
  const Modal=()=>{const dupNew=!!norm(ne)&&d.cards.some(c=>norm(c.en)===norm(ne));
    return <div className="fixed inset-0 z-20 flex items-start justify-center bg-ink/30 px-4 pt-[10vh]" onClick={()=>setModal(false)}>
      <div className="w-full max-w-md rounded-xl bg-card p-4 shadow-soft" onClick={e=>e.stopPropagation()}>
        <div className="mb-3 flex items-center"><h2 className="flex-1 text-base font-bold">Ajouter des mots</h2>{added>0&&<span className="mr-3 text-xs font-bold text-ok">{added} ajouté{added>1?"s":""}</span>}<button onClick={()=>setModal(false)} className="text-sm font-bold text-acc">Fermer</button></div>
        <input autoFocus ref={enRef} value={ne} onChange={e=>setNe(e.target.value)} onKeyDown={e=>e.key==="Enter"&&frRef.current?.focus()} placeholder="Anglais" className={mi} {...af}/>
        <input ref={frRef} value={nf} onChange={e=>setNf(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addWord()} placeholder="Français" className={mi} {...af}/>
        <input list="cats" value={nc} onChange={e=>setNc(e.target.value)} placeholder="Catégorie (facultatif, gardée d’un ajout à l’autre)" className={mi}/>
        {dupNew&&<p className="mb-2 text-xs font-semibold text-ko">Ce mot existe déjà : valider mettra sa traduction à jour.</p>}
        <button className={bt+" bg-acc text-white"} onClick={addWord}>{dupNew?"Mettre à jour":"Ajouter"}</button></div></div>};
  const Settings=()=>{const row="border-b border-line px-4 py-3",sec="px-4 pb-1 pt-5 text-[11px] font-bold uppercase tracking-wider text-mute",act="flex w-full items-center justify-between border-b border-line px-4 py-3 text-left text-sm font-semibold";
    const bak=d.bak?new Date(d.bak).toLocaleString("fr-FR",{day:"numeric",month:"long",hour:"2-digit",minute:"2-digit"}):"jamais";
    return <div className="rise">
      <div className="sticky top-0 z-10 flex items-center bg-bg px-4 pb-2 pt-3"><button onClick={()=>setShowSet(false)} className="w-20 text-left text-sm font-bold text-acc">‹ Ma note</button><h1 className="flex-1 text-center text-lg font-bold">Réglages</h1><span className="w-20"/></div>
      <p className={sec}>Séances</p>
      <div className={row+" border-t"}><p className="mb-2 text-sm font-semibold">Longueur d’une séance</p><Seg opts={[[5,"5"],[10,"10"],[20,"20"],[0,"Libre"]]} val={goal} on={g=>setS("goal",g)}/><p className="mt-1.5 text-xs text-mute">Nombre de cartes avant le bilan. « Libre » : sans limite.</p></div>
      <p className={sec}>Cartes</p>
      <div className={row+" border-t"}><p className="mb-2 text-sm font-semibold">Sens</p><Seg opts={[["mix","Mixte"],["en-fr","EN → FR"],["fr-en","FR → EN"]]} val={d.dir||"mix"} on={v=>setS("dir",v)}/></div>
      <div className={row}><p className="mb-2 text-sm font-semibold">Type de carte</p><Seg opts={[["mix","Alternées"],["write","Écrire"],["guess","Deviner"]]} val={d.mode||"mix"} on={v=>setS("mode",v)}/></div>
      <div className={row}><p className="mb-2 text-sm font-semibold">Réussites pour acquérir un mot</p><Seg opts={[[2,"2"],[3,"3"],[5,"5"]]} val={d.acq||3} on={v=>setS("acq",v)}/><p className="mt-1.5 text-xs text-mute">Bonnes réponses écrites et devinées d’affilée.</p></div>
      <p className={sec}>Données</p>
      <p className="border-t border-line px-4 py-3 text-xs text-mute">Tes mots et ta progression sont enregistrés sur ce téléphone. Copie une sauvegarde, colle-la dans une note, puis restaure-la en la copiant depuis la note.</p>
      <button className={act+" border-t"} onClick={exp}>Copier la sauvegarde<span className="text-xs font-normal text-mute">Dernière : {bak}</span></button>
      <button className={act} onClick={rest}>Restaurer depuis le presse-papiers</button>
      <button className={act} onClick={resetProg}>Remettre la progression à zéro</button>
      <button className={act+" text-ko"} onClick={clearAll}>Tout effacer</button></div>};
  const Note=()=>{if(showSet)return Settings();
    const cnt={};d.cards.forEach(c=>{const k=norm(c.en);cnt[k]=(cnt[k]||0)+1});
    const dups=Object.values(cnt).filter(n=>n>1).length,qq=norm(q);
    const rows=[...d.cards].sort((a,b)=>b.created-a.created).filter(c=>!qq||norm(c.en).includes(qq)||norm(c.fr).includes(qq)||norm(catOf(c)).includes(qq));
    const g="grid grid-cols-[1fr_1fr_5.5rem_1.75rem] items-center gap-1 px-3",cell="w-full min-w-0 bg-transparent py-2 text-[15px] outline-none focus:bg-acc2/50";
    return <div className="rise">
      <div className="sticky top-0 z-10 bg-bg">
        <div className="flex items-center gap-3 px-3 pb-2 pt-3"><button aria-label="Ajouter des mots" onClick={()=>{setAdded(0);setModal(true)}} className="grid h-9 w-9 place-items-center rounded-md bg-acc text-2xl font-bold leading-none text-white">+</button>
          <div className="flex-1"><h1 className="text-xl font-bold leading-tight">Ma note</h1><p className="text-xs text-mute">{d.cards.length} mot{d.cards.length>1?"s":""}</p></div>
          <button aria-label="Réglages" onClick={()=>setShowSet(true)} className="grid h-9 w-9 place-items-center rounded-md bg-acc2 text-acc"><Ic p={gear}/></button></div>
        <div className="px-3 pb-2"><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Rechercher" className="w-full rounded-md border border-line bg-card px-3 py-2 text-sm outline-none focus:border-acc"/></div>
        {dups>0&&<p className="px-3 pb-1 text-xs font-semibold text-ko">{dups} doublon{dups>1?"s":""} en rouge : modifie ou supprime-les.</p>}
        <div className={g+" border-y border-line bg-acc2/60 py-1.5 text-[11px] font-bold uppercase tracking-wider text-mute"}><span>Anglais</span><span>Français</span><span>Catégorie</span><span/></div></div>
      {rows.map(c=>{const ct=catOf(c),dp=cnt[norm(c.en)]>1;return <div key={c.id} className={g+" border-b border-line py-0.5"}>
        <input value={c.en} onChange={e=>edit(c.id,"en",e.target.value)} className={cell+(dp?" text-ko":"")} {...af}/>
        <input value={c.fr} onChange={e=>edit(c.id,"fr",e.target.value)} className={cell} {...af}/>
        <input list="cats" value={c.cat||""} placeholder={ct} onChange={e=>edit(c.id,"cat",e.target.value)} className={"w-full min-w-0 rounded-md px-2 py-1 text-xs font-semibold outline-none placeholder:text-current "+pc(ct)}/>
        <button aria-label="Supprimer" onClick={()=>del(c.id)} className="text-center text-mute">✕</button></div>})}
      {!rows.length&&<p className="px-4 py-8 text-center text-sm text-mute">{d.cards.length?"Aucun résultat.":"Touche + pour ajouter ton premier mot."}</p>}</div>};

  const tabs=[["play","Jouer",<rect key="a" x="3" y="6" width="14" height="14" rx="3"/>,<path key="b" d="M8 3h10a3 3 0 0 1 3 3v10"/>],["list","Liste",<rect key="l1" x="3" y="3" width="7" height="7" rx="2"/>,<rect key="l2" x="14" y="3" width="7" height="7" rx="2"/>,<rect key="l3" x="3" y="14" width="7" height="7" rx="2"/>,<rect key="l4" x="14" y="14" width="7" height="7" rx="2"/>],["verbs","Verbes",<path key="e" d="M4 6h16M4 12h16M4 18h10"/>],["stats","Stats",<path key="c" d="M5 20V10M12 20V4M19 20v-7"/>],["note","Ma note",<rect key="n1" x="3" y="3" width="18" height="18" rx="4"/>,<path key="n2" d="M12 8v8M8 12h8"/>]];
  return <div className="flex h-full flex-col">
    {msg&&<div className="rise fixed left-1/2 top-[calc(env(safe-area-inset-top,0px)+12px)] z-30 -translate-x-1/2 rounded-full bg-acc px-4 py-2.5 text-center text-sm font-bold text-white">{msg}</div>}
    <main className={"mx-auto flex w-full max-w-xl flex-1 flex-col overflow-y-auto pb-3 "+(view==="note"?"px-0 pt-0":"px-5 pt-4")}>{view==="play"||view==="verbs"?Play():view==="list"?List():view==="stats"?Stats():Note()}</main>
    {view==="note"&&modal&&Modal()}<datalist id="cats">{cats.map(c=><option key={c} value={c}/>)}</datalist>
    <nav className="flex gap-1.5 border-t border-line bg-card px-3 py-2">{tabs.map(([v,l,...p])=><button key={v} onClick={()=>{setView(v);if(v==="note")setShowSet(false)}} className={"flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-1.5 text-xs font-semibold transition "+(view===v?"bg-acc2 text-acc":"text-mute")}><Ic p={p}/>{l}</button>)}</nav></div>;
}
