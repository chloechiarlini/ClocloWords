import {useState,useEffect} from "react";
const KEY="memo_v1",blank={cards:[],log:{},n:0,synced:0};
const load=()=>{try{return {...blank,...JSON.parse(localStorage.getItem(KEY)||"{}")}}catch{return blank}};
const dstr=d=>new Date(d.getTime()-d.getTimezoneOffset()*6e4).toISOString().slice(0,10);
const norm=s=>s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();
const art=s=>s.replace(/^(to|the|a|an|le|la|les|un|une|l) /,"");
function variants(s){s=s.replace(/\(selon[^)]*\)/gi,"");const m=s.match(/\(([^) ]{1,4})\)/),o=[s.replace(/\([^)]*\)/g," ")];if(m)o.push(s.replace(/\(([^) ]{1,4})\)/,"$1"));return o.map(x=>art(norm(x))).filter(Boolean)}
const W=[8,5,3,2,1.2],COL=["bg-ko","bg-ko","bg-mid","bg-mid","bg-ok"],RING={g:"border-ok",y:"border-mid",r:"border-ko"};
function pick(cs,last){const p=cs.length>1?cs.filter(c=>c.id!==last):cs;let r=Math.random()*p.reduce((a,c)=>a+W[c.lv],0);for(const c of p){r-=W[c.lv];if(r<=0)return c}return p[0]}
function streak(log){let n=0;const d=new Date();if(!log[dstr(d)])d.setDate(d.getDate()-1);while(log[dstr(d)]){n++;d.setDate(d.getDate()-1)}return n}
function parse(t){const o=[];t.split("\n").forEach(l=>{l=l.replace(/^\s*[•*·]\s*/,"").trim();let i=l.indexOf("="),a,b;if(i>=0){a=l.slice(0,i);b=l.slice(i+1)}else{const m=l.match(/\s+[-–—]\s+/);if(!m)return;a=l.slice(0,m.index);b=l.slice(m.index+m[0].length)}a=a.trim();b=b.trim();if(a&&b)o.push([a,b])});return o}
const Ic=({p})=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{p}</svg>;
const btn="w-full rounded-2xl py-3.5 font-bold transition active:scale-[.98]";

export default function App(){
  const [d,setD]=useState(load),[view,setView]=useState("play"),[cur,setCur]=useState(null),[msg,setMsg]=useState(""),[manual,setManual]=useState(false),[txt,setTxt]=useState("");
  useEffect(()=>{try{localStorage.setItem(KEY,JSON.stringify(d))}catch{}},[d]);
  const say=t=>{setMsg(t);setTimeout(()=>setMsg(""),2600)};
  const draw=()=>{if(!d.cards.length)return setCur(null);const c=pick(d.cards,cur?.id),n=d.n+1;
    setD(x=>({...x,n,cards:x.cards.map(k=>k.id===c.id?{...k,seen:k.seen+1}:k)}));
    setCur({id:c.id,dir:Math.random()<.5?"en-fr":"fr-en",mode:n%2?"write":"guess",flipped:false,res:null,raw:""})};
  useEffect(()=>{if(view==="play"&&!cur&&d.cards.length)draw()},[view,d.cards.length]);
  const card=cur&&d.cards.find(c=>c.id===cur.id);
  const finish=(res,raw)=>{if(cur.res)return;const w=raw!==undefined,ok=res==="g",k=dstr(new Date());
    setD(x=>({...x,cards:x.cards.map(c=>c.id!==cur.id?c:{...c,lv:res==="g"?Math.min(4,c.lv+1):res==="r"?(w?Math.max(0,c.lv-1):0):c.lv,ok:c.ok+(ok?1:0),ko:c.ko+(res==="r"?1:0)}),
      log:{...x.log,[k]:{n:(x.log[k]?.n||0)+1,ok:(x.log[k]?.ok||0)+(ok?1:0)}}}));
    setCur({...cur,flipped:true,res})};
  const check=()=>{const v=art(norm(cur.raw));if(!v)return;const a=cur.dir==="en-fr"?card.fr:card.en;
    finish(a.split(/\s*\/\s*/).some(x=>variants(x).includes(v))?"g":"r",cur.raw)};
  const sync=text=>{let add=0,upd=0;const cards=[...d.cards];
    parse(text).forEach(([en,fr])=>{const i=cards.findIndex(c=>norm(c.en)===norm(en));
      if(i>=0){if(cards[i].fr!==fr||cards[i].en!==en){cards[i]={...cards[i],en,fr};upd++}}
      else{cards.push({id:Date.now()+Math.random(),en,fr,lv:0,seen:0,ok:0,ko:0,created:Date.now()});add++}});
    setD({...d,cards,synced:Date.now()});if(add)setCur(null);
    say(add||upd?`${add} nouveau${add>1?"x":""}, ${upd} mis à jour`:"Tout est déjà à jour.")};
  const paste=()=>navigator.clipboard.readText().then(x=>{if(!x.includes("="))return say("Le presse-papiers ne contient pas ta note.");sync(x)}).catch(()=>{setView("note");setManual(true);say("Colle ta note dans la zone.")});

  const Play=()=>{
    if(!d.cards.length)return <div className="rise px-4 py-16 text-center text-mute"><p className="mb-2 text-xl font-bold text-ink">Aucune carte pour l’instant</p><p className="mb-6">Lance ton raccourci pour copier ta note, puis reviens ici.</p><button className={btn+" bg-acc text-white"} onClick={paste}>Synchroniser ma note</button></div>;
    if(!cur||!card)return null;
    const en=cur.dir==="en-fr",q=en?card.en:card.fr,a=en?card.fr:card.en,w=cur.mode==="write";
    return <div className="rise" key={cur.id}>
      <div className="mb-4 flex flex-wrap gap-2 text-[13px] font-bold">
        <span className="rounded-full bg-acc2 px-3 py-1 text-acc">{w?"À écrire":"À deviner"}</span>
        <span className="rounded-full bg-card px-3 py-1 text-mute shadow-soft">{en?"Anglais → Français":"Français → Anglais"}</span>
        <span className="rounded-full bg-card px-3 py-1 text-mute shadow-soft">Série {streak(d.log)} j</span>
        <button onClick={paste} className="rounded-full bg-acc2 px-3 py-1 text-acc">Synchroniser</button></div>
      <div className="scene mb-4 h-64" onClick={()=>!w&&!cur.flipped&&setCur({...cur,flipped:true})}>
        <div className={"flip h-full "+(cur.flipped?"on":"")}>
          <div className="face flex flex-col items-center justify-center rounded-[28px] border-[3px] border-transparent bg-card p-6 text-center shadow-soft">
            <small className="mb-3 text-xs font-extrabold uppercase tracking-widest text-acc">{en?"English":"Français"}</small>
            <b className="break-words text-3xl leading-tight">{q}</b>{!w&&<em className="mt-4 text-sm not-italic text-mute">Touche pour retourner</em>}</div>
          <div className={"face back flex flex-col items-center justify-center rounded-[28px] border-[3px] bg-card p-6 text-center shadow-soft "+(RING[cur.res]||"border-transparent")}>
            <small className="mb-3 text-xs font-extrabold uppercase tracking-widest text-acc">{en?"Français":"English"}</small>
            <b className="break-words text-3xl leading-tight">{a}</b></div></div></div>
      {cur.res?<div className="rise">
          {w&&<p className={"mb-3 text-center text-xl font-extrabold "+(cur.res==="g"?"text-ok":"text-ko")}>{cur.res==="g"?"Juste !":"Faux"}{cur.res==="r"&&<small className="block text-[13px] font-semibold text-mute">Tu as écrit : {cur.raw}</small>}</p>}
          <button className={btn+" bg-acc text-white"} onClick={draw}>Carte suivante</button></div>
        :w?<div><input autoFocus value={cur.raw} onChange={e=>setCur({...cur,raw:e.target.value})} onKeyDown={e=>e.key==="Enter"&&check()} autoCapitalize="off" autoCorrect="off" spellCheck={false} placeholder="Ta réponse…" className="mb-2.5 w-full rounded-2xl border-2 border-line bg-card px-4 py-3.5 outline-none focus:border-acc"/>
          <button className={btn+" bg-acc text-white"} onClick={check}>Valider</button></div>
        :cur.flipped&&<div className="rise flex gap-2">
          <button className={btn+" bg-ko text-on"} onClick={()=>finish("r")}>À revoir</button>
          <button className={btn+" bg-mid text-on"} onClick={()=>finish("y")}>Presque</button>
          <button className={btn+" bg-ok text-on"} onClick={()=>finish("g")}>Acquis</button></div>}
    </div>};

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
      <div className="mb-3.5 rounded-3xl bg-card p-4 shadow-soft"><p className="mb-3.5 text-sm text-mute">Les mots viennent de ta note Apple. Lance ton raccourci : il copie la note. Reviens ici et touche le bouton.</p>
        <button className={btn+" bg-acc text-white"} onClick={paste}>Synchroniser depuis le presse-papiers</button>
        <p className="mt-3 text-sm text-mute">{d.cards.length} mot{d.cards.length>1?"s":""} · dernière synchro : {when}</p></div>
      {manual&&<div className="mb-3.5 rounded-3xl bg-card p-4 shadow-soft"><h2 className="mb-2 text-[15px] font-bold text-mute">Collage manuel</h2>
        <textarea value={txt} onChange={e=>setTxt(e.target.value)} placeholder="empty = vide" className="mb-2.5 h-32 w-full rounded-2xl border-2 border-line bg-card p-3 outline-none focus:border-acc"/>
        <button className={btn+" bg-acc2 text-acc"} onClick={()=>sync(txt)}>Importer le texte</button></div>}</div>};

  const tabs=[["play","Jouer",<rect key="a" x="3" y="6" width="14" height="14" rx="3"/>,<path key="b" d="M8 3h10a3 3 0 0 1 3 3v10"/>],["stats","Stats",<path key="c" d="M5 20V10M12 20V4M19 20v-7"/>],["note","Ma note",<path key="d" d="M12 4v11M7 11l5 5 5-5M5 20h14"/>]];
  return <div className="flex h-full flex-col">
    {msg&&<div className="rise fixed left-1/2 top-[calc(env(safe-area-inset-top,0px)+12px)] z-10 -translate-x-1/2 rounded-full bg-acc px-4 py-2.5 text-sm font-bold text-white">{msg}</div>}
    <main className="mx-auto w-full max-w-xl flex-1 overflow-y-auto px-5 pb-3 pt-5">{view==="play"?Play():view==="stats"?Stats():Note()}</main>
    <nav className="flex gap-1.5 border-t border-line bg-card px-3 py-2">{tabs.map(([v,l,...p])=><button key={v} onClick={()=>setView(v)} className={"flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-1.5 text-xs font-semibold transition "+(view===v?"bg-acc2 text-acc":"text-mute")}><Ic p={p}/>{l}</button>)}</nav></div>;
}
