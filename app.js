const FALLBACK_EPISODES = [
  {title:"All In. All Season. | Cowboys Offseason Moves & Expectations",url:"https://youtube.com/@thecowboysplaybook365",thumbnail:"",published:"Latest episode",description:"The latest Cowboys conversation from The Cowboys Playbook 365.",category:"news"},
  {title:"Clutch Time: What Dallas Needs From Its Offense",url:"https://youtube.com/@thecowboysplaybook365",thumbnail:"",published:"CP365",description:"Quarterback play, protection, weapons and the standard for this offense.",category:"breakdown"},
  {title:"Defend The Star: Keys To The Cowboys Defense",url:"https://youtube.com/@thecowboysplaybook365",thumbnail:"",published:"CP365",description:"Personnel, pressure and the matchups that shape Dallas on defense.",category:"breakdown"},
  {title:"Draft Recap: Every Pick, Every Take",url:"https://youtube.com/@thecowboysplaybook365",thumbnail:"",published:"CP365",description:"A CP365 look at the Cowboys draft and what comes next.",category:"draft"}
];

const FALLBACK_NEWS = [
  {title:"Cowboys News Hub is ready for live headlines",source:"CP365",url:"#",published:"Live feed",category:"news",description:"When deployed on Vercel, this section pulls fresh Dallas Cowboys headlines automatically."},
  {title:"Roster moves, injuries and game-day stories stay in one feed",source:"CP365",url:"#",published:"Auto-updating",category:"roster",description:"The backend categorizes incoming headlines so fans can filter the feed."},
  {title:"Tyler's Take adds the CP365 voice to the news",source:"CP365",url:"#",published:"Original",category:"reaction",description:"Keep the automated feed, then add Tyler's own reaction in one small content file."}
];

let SITE = {
  name:"The Cowboys Playbook 365", host:"Tyler Young",
  youtube:"https://youtube.com/@thecowboysplaybook365",
  tiktok:"https://www.tiktok.com/@thecowboysplaybook365",
  contactEmail:"",
  disclaimer:"Independent fan media. Not affiliated with or endorsed by the Dallas Cowboys or the NFL."
};
let episodes = [];
let newsItems = [];

async function getJSON(url, fallback){
  try{
    const r = await fetch(url,{headers:{Accept:"application/json"}});
    if(!r.ok) throw new Error("request failed");
    return await r.json();
  }catch(e){ return fallback; }
}
function esc(s=""){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]))}
function dateLabel(v){
  if(!v) return "";
  const d=new Date(v); if(Number.isNaN(d.getTime())) return v;
  return d.toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"});
}
function header(){
  const page=document.body.dataset.page||"home";
  const links=[["home","/","Home"],["episodes","/episodes.html","Episodes"],["news","/news.html","News"],["about","/about.html","About"],["watch","/watch.html","Watch"],["social","/social.html","Social"],["contact","/contact.html","Contact"]];
  return `<header class="site-header"><nav class="nav shell" id="nav">
    <a class="brand" href="/"><img src="/assets/logo.jpeg" alt=""><span class="brand-copy"><strong>THE COWBOYS PLAYBOOK 365</strong><small>HOSTED BY ${esc(SITE.host)}</small></span></a>
    <button class="mobile-menu" id="mobile-menu" aria-label="Open menu">☰</button>
    <div class="nav-links">${links.map(([k,u,l])=>`<a class="${page===k?"active":""}" href="${u}">${l}</a>`).join("")}<button class="filter search-toggle mobile-search" id="mobile-search-toggle">⌕ Search</button></div>
    <div class="nav-social"><button class="search-toggle" id="search-toggle" aria-label="Search" title="Search ( / )">⌕</button><button class="sound-toggle" id="sound-toggle" aria-label="Toggle site music" title="Toggle site music">🔇</button><a data-youtube target="_blank" rel="noreferrer">▶</a><a data-tiktok target="_blank" rel="noreferrer">♪</a></div>
  </nav></header>`
}
function footer(){
  return `<footer class="site-footer"><div class="shell footer-grid">
    <div class="footer-brand"><img src="/assets/logo.jpeg" alt=""><div><h4>${esc(SITE.name)}</h4><p>Year-round Cowboys talk.<br>News. Breakdowns. Reactions.<br>Hosted by ${esc(SITE.host)}.</p></div></div>
    <div><h4>Explore</h4><div class="footer-links"><a href="/">Home</a><a href="/news.html">News</a><a href="/episodes.html">Episodes</a><a href="/about.html">About</a></div></div>
    <div><h4>Follow</h4><div class="footer-links"><a data-youtube target="_blank" rel="noreferrer">YouTube</a><a data-tiktok target="_blank" rel="noreferrer">TikTok</a></div></div>
    <div><h4>Contact</h4><p>${SITE.contactEmail?`<a href="mailto:${esc(SITE.contactEmail)}">${esc(SITE.contactEmail)}</a>`:"Add the business email in content/site.json"}</p></div>
    ${SITE.sponsor?`<div><h4>Sponsor</h4><div class="footer-links"><a href="${esc(SITE.sponsor.url)}" target="_blank" rel="noreferrer">${esc(SITE.sponsor.name)} →</a><small style="color:#7f8b9a;font-size:10px">Proudly presented by our sponsor</small></div></div>`:""}
  </div><div class="shell footer-bottom"><span>© ${new Date().getFullYear()} ${esc(SITE.name)}.</span><span>${esc(SITE.disclaimer)}</span></div></footer>`
}
function applyLinks(){
  document.querySelectorAll("[data-youtube]").forEach(a=>a.href=SITE.youtube);
  document.querySelectorAll("[data-tiktok]").forEach(a=>a.href=SITE.tiktok);
}
const SITE_AUDIO = new Audio("/assets/cowboys-playbook-365.mp3");
SITE_AUDIO.loop = true;
SITE_AUDIO.volume = 0.5;
function soundOn(){ return localStorage.getItem("cp365_sound") === "on"; }
function soundOff(){ return localStorage.getItem("cp365_sound") === "off"; }
function setSoundUI(on){
  const t = document.querySelector("#sound-toggle");
  if(t){ t.textContent = on ? "🔊" : "🔇"; t.classList.toggle("on", on); }
  const b = document.querySelector("#sound-banner");
  if(b) b.style.display = on ? "none" : "";
}
function startSiteSound(){
  SITE_AUDIO.play().then(()=>{
    setSoundUI(true);
  }).catch(()=>{
    // Autoplay blocked — show the "enable sound" banner instead.
    if(!soundOff()){
      let b = document.querySelector("#sound-banner");
      if(!b){
        b = document.createElement("button");
        b.id = "sound-banner";
        b.className = "sound-banner";
        b.innerHTML = "🔊 <span>Turn on the show music</span>";
        b.addEventListener("click", ()=>{
          SITE_AUDIO.play().then(()=>{ localStorage.setItem("cp365_sound","on"); setSoundUI(true); }).catch(()=>{});
        });
        document.body.appendChild(b);
      }
      b.style.display = "";
    }
  });
}
function setupSiteSound(){
  const t = document.querySelector("#sound-toggle");
  if(t) t.addEventListener("click", ()=>{
    if(SITE_AUDIO.paused){
      SITE_AUDIO.play().then(()=>{ localStorage.setItem("cp365_sound","on"); setSoundUI(true); }).catch(()=>{});
    } else {
      SITE_AUDIO.pause();
      localStorage.setItem("cp365_sound","off");
      setSoundUI(false);
    }
  });
  if(soundOff()){ setSoundUI(false); return; }
  // Attempt autoplay immediately on page load.
  startSiteSound();
  // Browsers that block autoplay: start on the visitor's first tap/click/keypress.
  if(SITE_AUDIO.paused){
    const tryOnce = () => {
      if(SITE_AUDIO.paused) startSiteSound();
      window.removeEventListener("pointerdown", tryOnce);
      window.removeEventListener("keydown", tryOnce);
    };
    window.addEventListener("pointerdown", tryOnce, { once:true });
    window.addEventListener("keydown", tryOnce, { once:true });
  }
}
function episodeCard(e){
  const img=e.thumbnail?`<img loading="lazy" src="${esc(e.thumbnail)}" alt="">`:`<div style="height:100%;display:grid;place-items:center;font-weight:1000;font-size:30px;color:#a9c9f5">CP365</div>`;
  return `<article class="episode-card" data-category="${esc(e.category||"all")}">
    <a class="episode-thumb" href="${esc(e.url||SITE.youtube)}" target="_blank" rel="noreferrer">${img}</a>
    <div class="episode-body"><div class="meta">${esc(dateLabel(e.published))}</div><h3>${esc(e.title)}</h3><p>${esc(e.description||"Watch the latest Cowboys conversation from CP365.")}</p><a class="text-link" href="${esc(e.url||SITE.youtube)}" target="_blank" rel="noreferrer">Watch episode →</a></div>
  </article>`;
}
function newsCard(n){
  return `<article class="news-card" data-category="${esc(n.category||"news")}">
    <span class="category">${esc((n.category||"news").replace("-"," "))}</span>
    <h3><a href="${esc(n.url||"#")}" ${n.url&&n.url!=="#"?`target="_blank" rel="noreferrer"`:""}>${esc(n.title)}</a></h3>
    <p>${esc(n.description||"Open the original source for the full story.")}</p>
    <footer><span>${esc(n.source||"News")}</span><span>${esc(dateLabel(n.published))}</span></footer>
  </article>`;
}
function categorizeTitle(t=""){
  const x=t.toLowerCase();
  if(/injur|questionable|out |practice|hamstring|ankle|knee|concussion/.test(x))return"injury";
  if(/sign|release|waiv|trade|roster|contract|cut|activate/.test(x))return"roster";
  if(/draft|prospect|pick|combine/.test(x))return"draft";
  if(/game|week |vs\.|matchup|score|preview|recap/.test(x))return"game";
  return"news";
}
function setupFilters(){
  document.querySelectorAll("#news-filters [data-news-filter]").forEach(b=>b.addEventListener("click",()=>{
    document.querySelectorAll("#news-filters .filter").forEach(x=>x.classList.remove("active")); b.classList.add("active");
    const f=b.dataset.newsFilter; document.querySelectorAll("#news-page-grid .news-card").forEach(c=>c.style.display=(f==="all"||c.dataset.category===f)?"":"none");
  }));
  document.querySelectorAll("#episode-filters [data-filter]").forEach(b=>b.addEventListener("click",()=>{
    document.querySelectorAll("#episode-filters .filter").forEach(x=>x.classList.remove("active")); b.classList.add("active");
    const f=b.dataset.filter; document.querySelectorAll("#episodes-page-grid .episode-card").forEach(c=>c.style.display=(f==="all"||c.dataset.category===f)?"":"none");
  }));
}
async function loadLatestEpisode(){
  const el=document.querySelector("#latest-episode"); if(!el) return;
  const e=episodes[0]||FALLBACK_EPISODES[0];
  el.className="feature-panel";
  el.innerHTML=`<a class="feature-media" href="${esc(e.url)}" target="_blank" rel="noreferrer">${e.thumbnail?`<img src="${esc(e.thumbnail)}" alt="">`:""}<span class="play-badge">▶</span></a>
    <div class="feature-copy"><div class="eyebrow">Newest Upload</div><h3>${esc(e.title)}</h3><div class="meta"><span>${esc(dateLabel(e.published))}</span><span>YouTube</span></div><p>${esc(e.description||"The newest episode from The Cowboys Playbook 365.")}</p><div class="cta-row"><a class="btn btn-primary" href="${esc(e.url)}" target="_blank" rel="noreferrer">▶ Watch Episode</a></div></div>`;
}
function loadTicker(){
  const t=document.querySelector("#ticker-track"); if(!t) return;
  const s=newsItems.slice(0,5).map(n=>n.title).join("   ★   ")+"   ★   ";
  t.textContent=s+s;
}
async function loadTake(){
  const el=document.querySelector("#tylers-take"); if(!el) return;
  const data=await getJSON("/content/tylers-take.json",null); if(!data)return;
  el.querySelector("h3").textContent=data.title; el.querySelector("p").textContent=data.body; const a=el.querySelector("a"); a.textContent=(data.cta||"Watch the latest breakdown")+" →";
}
function loadSponsor(){
  const card=document.querySelector("#sponsor-card"); if(!card)return;
  const s=SITE.sponsor;
  if(!s){document.querySelector("#sponsor")?.remove();return}
  card.href=s.url||"#";
  if(s.name)document.querySelector("#sponsor-name").textContent=s.name;
  if(s.tagline)document.querySelector("#sponsor-tagline").textContent=s.tagline;
  if(s.blurb)document.querySelector("#sponsor-blurb").textContent=s.blurb;
  if(s.cta)document.querySelector("#sponsor-cta").textContent=s.cta;
  if(s.logo)document.querySelector("#sponsor-logo").src=s.logo;
}
let gameRefreshTimer = null;
async function loadGame(){
  const el=document.querySelector("#next-game"); if(!el)return;
  const data=await getJSON("/api/cowboys",null);
  if(!data)return;
  const g = data.liveGame || data.nextGame;
  if(!g){return}
  const isLive = !!data.liveGame;
  const isFinal = /final/i.test(g.status||"");
  if(isLive){
    el.className="game-card live";
    el.innerHTML=`<div class="game-team"><span class="mini-star">★</span><div><strong>Dallas</strong><small class="game-score">${esc(g.dalScore)}</small></div></div>
    <div class="game-center-copy"><span class="live-badge"><span class="live-dot"></span> LIVE</span><strong>${esc(g.shortDetail||"In Progress")}</strong><small>${esc(g.opponent||"")}</small></div>
    <div class="game-team align-right"><div><strong>${esc(g.oppAbbr||g.opponent)}</strong><small class="game-score">${esc(g.oppScore)}</small></div><span class="mini-star">☆</span></div>`;
    // Refresh every 60s while live
    if(gameRefreshTimer) clearInterval(gameRefreshTimer);
    gameRefreshTimer = setInterval(loadGame, 60000);
    return;
  }
  if(gameRefreshTimer){ clearInterval(gameRefreshTimer); gameRefreshTimer=null; }
  el.className="game-card";
  const statusLabel = isFinal ? "FINAL" : (g.status||"NEXT GAME");
  const showScore = isFinal && g.dalScore !== "" && g.oppScore !== "";
  if(showScore){
    el.innerHTML=`<div class="game-team"><span class="mini-star">★</span><div><strong>Dallas</strong><small class="game-score">${esc(g.dalScore)}</small></div></div>
    <div class="game-center-copy"><span>${esc(statusLabel)}</span><strong>${esc(g.dateLabel||"")}</strong><small>${esc(g.venue||"")}</small></div>
    <div class="game-team align-right"><div><strong>${esc(g.oppAbbr||g.opponent)}</strong><small class="game-score">${esc(g.oppScore)}</small></div><span class="mini-star">☆</span></div>`;
    return;
  }
  el.innerHTML=`<div class="game-team"><span class="mini-star">★</span><div><strong>Dallas Cowboys</strong><small>${esc(g.homeAway==="home"?"Home":"Away")}</small></div></div>
  <div class="game-center-copy"><span>${esc(statusLabel)}</span><strong>${esc(g.dateLabel||"")}</strong><small>${esc(g.timeLabel||"")}</small></div>
  <div class="game-team align-right"><div><strong>${esc(g.opponent||"Opponent")}</strong><small>${esc(g.venue||"")}</small></div><span class="mini-star">☆</span></div>`;
}
function setupSearch(){
  let overlay = document.querySelector("#search-overlay");
  if(!overlay){
    overlay = document.createElement("div");
    overlay.id = "search-overlay";
    overlay.className = "search-overlay";
    overlay.innerHTML = `
      <div class="search-box">
        <div class="search-top">
          <input id="search-input" type="search" placeholder="Search episodes, news & pages…" autocomplete="off">
          <button class="search-close" id="search-close" aria-label="Close search">✕</button>
        </div>
        <div id="search-results" class="search-results"></div>
      </div>`;
    document.body.appendChild(overlay);
  }
  const input = overlay.querySelector("#search-input");
  const results = overlay.querySelector("#search-results");
  const pages = [["Home","/"],["News","/news.html"],["Episodes","/episodes.html"],["Watch","/watch.html"],["About","/about.html"],["Social","/social.html"],["Contact","/contact.html"]];
  function open(){ overlay.classList.add("open"); setTimeout(()=>input.focus(),60); }
  function close(){ overlay.classList.remove("open"); input.value=""; results.innerHTML=""; }
  overlay.addEventListener("click", e=>{ if(e.target===overlay) close(); });
  overlay.querySelector("#search-close").addEventListener("click", close);
  const st = document.querySelector("#search-toggle");
  if(st) st.addEventListener("click", ()=> overlay.classList.contains("open")?close():open());
  const mst = document.querySelector("#mobile-search-toggle");
  if(mst) mst.addEventListener("click", ()=>{ document.querySelector("#nav")?.classList.remove("open"); overlay.classList.contains("open")?close():open(); });
  document.addEventListener("keydown", e=>{
    if(e.key==="Escape" && overlay.classList.contains("open")) close();
    if(e.key==="/" && !overlay.classList.contains("open") && !/input|textarea/i.test(document.activeElement.tagName)){ e.preventDefault(); open(); }
  });
  function runSearch(q){
    q = q.trim().toLowerCase();
    if(!q){ results.innerHTML = `<div class="search-hint">Type to search episodes, news and pages. Press <b>/</b> anytime.</div>`; return; }
    const ep = episodes.filter(e=>e.title.toLowerCase().includes(q)).slice(0,6).map(e=>({type:"Episode",title:e.title,url:e.url||SITE.youtube,thumb:e.thumbnail,ext:true}));
    const nw = newsItems.filter(n=>n.title.toLowerCase().includes(q)).slice(0,6).map(n=>({type:"News",title:n.title,url:n.url,src:n.source,ext:n.url&&n.url!=="#"}));
    const pg = pages.filter(p=>p[0].toLowerCase().includes(q)).map(p=>({type:"Page",title:p[0],url:p[1]}));
    const all = [...ep,...nw,...pg];
    results.innerHTML = all.length ? all.map(r=>`
      <a class="search-item ${r.type.toLowerCase()}" href="${esc(r.url)}" ${r.ext?'target="_blank" rel="noreferrer"':""}>
        ${r.thumb?`<img src="${esc(r.thumb)}" alt="">`:`<span class="search-type-ic">${r.type==="Episode"?"▶":r.type==="News"?"▤":"§"}</span>`}
        <div><span class="search-type">${r.type}${r.src?` · ${esc(r.src)}`:""}</span><strong>${esc(r.title)}</strong></div>
      </a>`).join("") : `<div class="search-hint">No matches for “${esc(q)}”.</div>`;
  }
  input.addEventListener("input", ()=>runSearch(input.value));
  runSearch("");
}
function setupPoll(){
  const p=document.querySelector("#fan-poll"); if(!p)return;
  const saved=localStorage.getItem("cp365_vote");
  p.querySelectorAll("button").forEach(b=>{
    if(saved===b.dataset.vote)b.classList.add("voted");
    b.addEventListener("click",()=>{localStorage.setItem("cp365_vote",b.dataset.vote);p.querySelectorAll("button").forEach(x=>x.classList.remove("voted"));b.classList.add("voted");b.textContent=b.dataset.vote+" ✓";});
  });
}
function setupSignup(){
  const form=document.querySelector("#signup-form"); if(!form)return;
  const note=document.querySelector("#signup-note");
  form.addEventListener("submit",e=>{
    e.preventDefault();
    const email=form.email.value.trim();
    if(!email) return;
    if(SITE.contactEmail){
      const subject=encodeURIComponent("New Daily Take subscriber");
      const body=encodeURIComponent(`A fan just signed up for the Daily Take:\n\nEmail: ${email}\n\n(Add them to the CP365 email list.)`);
      window.location.href=`mailto:${SITE.contactEmail}?subject=${subject}&body=${body}`;
    }
    localStorage.setItem("cp365_signup",email);
    form.style.display="none";
    note.textContent=`You're in, ${email.split("@")[0]}! Check your inbox to confirm. 🤠`;
    note.classList.add("done");
  });
}
function setupContact(){
  const form=document.querySelector("#contact-form"); if(!form)return;
  const email=document.querySelector("#business-email");
  if(SITE.contactEmail){email.textContent=SITE.contactEmail;email.href=`mailto:${SITE.contactEmail}`;}
  form.addEventListener("submit",e=>{
    e.preventDefault();
    if(!SITE.contactEmail){document.querySelector("#contact-note").textContent="Add the business email in content/site.json first.";return}
    const f=new FormData(form);
    const subject=encodeURIComponent(f.get("subject"));
    const body=encodeURIComponent(`Name: ${f.get("name")}\nEmail: ${f.get("email")}\n\n${f.get("message")}`);
    window.location.href=`mailto:${SITE.contactEmail}?subject=${subject}&body=${body}`;
  });
}
async function boot(){
  SITE=await getJSON("/content/site.json",SITE);
  document.querySelector("#site-header").innerHTML=header(); document.querySelector("#site-footer").innerHTML=footer(); applyLinks();
  document.querySelector("#mobile-menu")?.addEventListener("click",()=>document.querySelector("#nav").classList.toggle("open"));

  const epResp=await getJSON("/api/youtube",{items:FALLBACK_EPISODES});
  episodes=(epResp.items||FALLBACK_EPISODES).map((e,i)=>({...e,category:e.category||(["news","reaction","breakdown","draft"][i%4])}));
  const newsResp=await getJSON("/api/news",{items:FALLBACK_NEWS});
  newsItems=(newsResp.items||FALLBACK_NEWS).map(n=>({...n,category:n.category||categorizeTitle(n.title)}));

  const ng=document.querySelector("#news-grid"); if(ng)ng.innerHTML=newsItems.slice(0,6).map(newsCard).join("");
  const npg=document.querySelector("#news-page-grid"); if(npg)npg.innerHTML=newsItems.map(newsCard).join("");
  const eg=document.querySelector("#episode-grid"); if(eg)eg.innerHTML=episodes.slice(0,6).map(episodeCard).join("");
  const epg=document.querySelector("#episodes-page-grid"); if(epg)epg.innerHTML=episodes.map(episodeCard).join("");
  const wg=document.querySelector("#watch-grid"); if(wg)wg.innerHTML=episodes.slice(1,9).map(episodeCard).join("");
  const wf=document.querySelector("#watch-feature"); if(wf&&episodes[0]){
    const vid=episodes[0].videoId; wf.innerHTML=vid?`<iframe src="https://www.youtube.com/embed/${esc(vid)}" title="${esc(episodes[0].title)}" allowfullscreen loading="lazy"></iframe>`:`<div class="subscribe-panel"><div><h2>${esc(episodes[0].title)}</h2><p>Open the newest episode on YouTube.</p></div><a class="btn btn-primary" href="${esc(episodes[0].url)}" target="_blank" rel="noreferrer">▶ Watch</a></div>`;
  }

  loadLatestEpisode(); loadTicker(); loadTake(); loadGame(); loadSponsor(); setupFilters(); setupPoll(); setupContact(); setupSignup(); setupSearch(); setupSiteSound(); applyLinks();
}
boot();