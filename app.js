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
    <div class="nav-links">${links.map(([k,u,l])=>`<a class="${page===k?"active":""}" href="${u}">${l}</a>`).join("")}</div>
    <div class="nav-social"><a data-youtube target="_blank" rel="noreferrer">▶</a><a data-tiktok target="_blank" rel="noreferrer">♪</a></div>
  </nav></header>`
}
function footer(){
  return `<footer class="site-footer"><div class="shell footer-grid">
    <div class="footer-brand"><img src="/assets/logo.jpeg" alt=""><div><h4>${esc(SITE.name)}</h4><p>Year-round Cowboys talk.<br>News. Breakdowns. Reactions.<br>Hosted by ${esc(SITE.host)}.</p></div></div>
    <div><h4>Explore</h4><div class="footer-links"><a href="/">Home</a><a href="/news.html">News</a><a href="/episodes.html">Episodes</a><a href="/about.html">About</a></div></div>
    <div><h4>Follow</h4><div class="footer-links"><a data-youtube target="_blank" rel="noreferrer">YouTube</a><a data-tiktok target="_blank" rel="noreferrer">TikTok</a></div></div>
    <div><h4>Contact</h4><p>${SITE.contactEmail?`<a href="mailto:${esc(SITE.contactEmail)}">${esc(SITE.contactEmail)}</a>`:"Add the business email in content/site.json"}</p></div>
  </div><div class="shell footer-bottom"><span>© ${new Date().getFullYear()} ${esc(SITE.name)}.</span><span>${esc(SITE.disclaimer)}</span></div></footer>`
}
function applyLinks(){
  document.querySelectorAll("[data-youtube]").forEach(a=>a.href=SITE.youtube);
  document.querySelectorAll("[data-tiktok]").forEach(a=>a.href=SITE.tiktok);
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
async function loadGame(){
  const el=document.querySelector("#next-game"); if(!el)return;
  const data=await getJSON("/api/cowboys",null);
  if(!data||!data.nextGame){return}
  const g=data.nextGame;
  el.innerHTML=`<div class="game-team"><span class="mini-star">★</span><div><strong>Dallas Cowboys</strong><small>${esc(g.homeAway==="home"?"Home":"Away")}</small></div></div>
  <div class="game-center-copy"><span>${esc(g.status||"NEXT GAME")}</span><strong>${esc(g.dateLabel||"")}</strong><small>${esc(g.timeLabel||"")}</small></div>
  <div class="game-team align-right"><div><strong>${esc(g.opponent||"Opponent")}</strong><small>${esc(g.venue||"")}</small></div><span class="mini-star">☆</span></div>`;
}
function setupPoll(){
  const p=document.querySelector("#fan-poll"); if(!p)return;
  const saved=localStorage.getItem("cp365_vote");
  p.querySelectorAll("button").forEach(b=>{
    if(saved===b.dataset.vote)b.classList.add("voted");
    b.addEventListener("click",()=>{localStorage.setItem("cp365_vote",b.dataset.vote);p.querySelectorAll("button").forEach(x=>x.classList.remove("voted"));b.classList.add("voted");b.textContent=b.dataset.vote+" ✓";});
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

  loadLatestEpisode(); loadTicker(); loadTake(); loadGame(); setupFilters(); setupPoll(); setupContact(); applyLinks();
}
boot();