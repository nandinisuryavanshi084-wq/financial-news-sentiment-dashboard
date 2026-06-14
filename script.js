const FEED_URL = 'https://nandinisuryavanshi.app.n8n.cloud/webhook/get-news';
let allArticles = [];
let currentFilter = 'all';

// Load news feed on page load
async function loadFeed() {
  const container = document.getElementById('news-container');
  try {
    const res = await fetch(FEED_URL);
    if (!res.ok) throw new Error('Network error');
    const data = await res.json();
    allArticles = Array.isArray(data) ? data : [data];
    updateStats();
    renderNews('all');
  } catch(e) {
    container.innerHTML = `<div class="error-box">⚠️ Could not load live feed. Make sure your n8n workflow is active.</div>`;
  }
}

// Update sentiment stats
function updateStats() {
  const total = allArticles.length;
  const pos = allArticles.filter(a=>(a.Sentiment||'').toLowerCase()==='positive').length;
  const neg = allArticles.filter(a=>(a.Sentiment||'').toLowerCase()==='negative').length;
  const neu = allArticles.filter(a=>(a.Sentiment||'').toLowerCase()==='neutral').length;
  document.getElementById('total-count').textContent = total;
  const pPos = total ? Math.round(pos/total*100) : 0;
  const pNeg = total ? Math.round(neg/total*100) : 0;
  const pNeu = total ? Math.round(neu/total*100) : 0;
  setTimeout(()=>{
    document.getElementById('pos-bar').style.width = pPos+'%';
    document.getElementById('neg-bar').style.width = pNeg+'%';
    document.getElementById('neu-bar').style.width = pNeu+'%';
  },200);
  document.getElementById('pos-pct').textContent = pPos+'%';
  document.getElementById('neg-pct').textContent = pNeg+'%';
  document.getElementById('neu-pct').textContent = pNeu+'%';
}

// Render news cards
function renderNews(filter) {
  const container = document.getElementById('news-container');
  const filtered = filter==='all' ? allArticles : allArticles.filter(a=>(a.Sentiment||'').toLowerCase()===filter.toLowerCase());
  if(!filtered.length){
    container.innerHTML=`<div style="color:var(--gray);padding:32px 0;font-size:14px">No ${filter} articles found.</div>`;
    return;
  }
  container.innerHTML = filtered.map((a,i)=>{
    const s = a.Sentiment||'Neutral';
    const cls = s.toLowerCase()==='positive'?'pos':s.toLowerCase()==='negative'?'neg':'neu';
    const icon = s.toLowerCase()==='positive'?'▲ POS':s.toLowerCase()==='negative'?'▼ NEG':'● NEU';
    const conf = parseFloat(a.Confidance||a.Confidence||0);
    return `<a class="news-card" href="${a.Link||'#'}" target="_blank" rel="noopener" style="animation-delay:${i*.03}s">
      <div class="badge ${cls}">${icon}</div>
      <div class="news-body">
        <div class="news-title">${a.Title||'Untitled'}</div>
        <div class="news-meta">
          <span class="co-tag">${a.Company||'General'}</span>
          <span>${(a.Reason||'').slice(0,80)}${(a.Reason||'').length>80?'...':''}</span>
        </div>
      </div>
      <div class="conf-col">
        <div class="conf-num">${Math.round(conf*100)}%</div>
        <div class="conf-bar"><div class="conf-fill" style="width:${conf*100}%"></div></div>
      </div>
    </a>`;
  }).join('');
}

// Filter news
function filterNews(filter, btn){
  currentFilter = filter;
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
  renderNews(filter);
}

// Quick search buttons
function quickSearch(name){
  document.getElementById('company-input').value = name;
  analyzeCompany();
}

// Company search
function analyzeCompany() {
  const input = document.getElementById('company-input');
  const company = input.value.trim();
  if(!company) return;

  const resultArea = document.getElementById('result-area');
  const resultCard = document.getElementById('result-card');
  resultArea.style.display = 'block';
  resultCard.innerHTML = '<div class="loading"><div class="spinner"></div>Analyzing ' + company + '...</div>';

  const matches = allArticles.filter(a =>
    (a.Title||'').toLowerCase().includes(company.toLowerCase()) ||
    (a.Company||'').toLowerCase().includes(company.toLowerCase())
  );

  if(matches.length > 0) {
    const top = matches[0];
    const s = top.Sentiment||'Neutral';
    const emoji = s.toLowerCase()==='positive'?'🟢':s.toLowerCase()==='negative'?'🔴':'⚪';
    const color = s.toLowerCase()==='positive'?'var(--green)':s.toLowerCase()==='negative'?'var(--red)':'var(--gray)';
    const conf = parseFloat(top.Confidance||top.Confidence||0);
    resultCard.innerHTML = `
      <div class="result-company">Company — ${company}</div>
      <div class="result-headline">${top.Title}</div>
      <div class="result-grid">
        <div class="result-item">
          <div class="result-item-label">Impact</div>
          <div class="result-item-val" style="color:${color}">${emoji} ${s}</div>
        </div>
        <div class="result-item">
          <div class="result-item-label">Confidence</div>
          <div class="result-item-val" style="color:var(--accent)">${Math.round(conf*100)}%</div>
        </div>
        <div class="result-item">
          <div class="result-item-label">Articles Found</div>
          <div class="result-item-val">${matches.length}</div>
        </div>
      </div>
      <div class="result-reason">
        <div class="result-reason-label">AI Analysis</div>
        <div class="result-reason-text">${top.Reason||'No reason provided.'}</div>
      </div>
    `;
  } else {
    resultCard.innerHTML = `
      <div class="result-company">Company — ${company}</div>
      <div class="result-reason">
        <div class="result-reason-label">Result</div>
        <div class="result-reason-text" style="color:var(--gray)">No articles found for <strong style="color:var(--text)">${company}</strong> in today's feed. Try another company!</div>
      </div>
    `;
  }
}

// Add enter key support
document.addEventListener('DOMContentLoaded', function(){
  document.getElementById('company-input').addEventListener('keydown', function(e){
    if(e.key === 'Enter') analyzeCompany();
  });
  loadFeed();
});