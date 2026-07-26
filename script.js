const STORAGE_KEY = 'portfolio_content_v1';
const THEME_KEY = 'portfolio_theme';

function esc(str){
  const d = document.createElement('div');
  d.innerText = str == null ? '' : str;
  return d.innerHTML;
}
function safeUrl(u){
  if(!u) return '';
  try{
    const parsed = new URL(u, window.location.href);
    if(['http:','https:','mailto:','tel:'].includes(parsed.protocol)) return u;
  }catch(e){}
  return '';
}

async function loadContent(){
  // Live admin edits (saved in this browser) always take priority so
  // the admin can preview instantly. Otherwise load the published content.json.
  const local = localStorage.getItem(STORAGE_KEY);
  if(local){
    try{ return JSON.parse(local); }catch(e){}
  }
  const res = await fetch('content.json', {cache:'no-store'});
  if(!res.ok) throw new Error('content.json not found');
  return await res.json();
}

function applyTheme(theme){
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
  const icon = document.getElementById('themeIcon');
  if(!icon) return;
  icon.innerHTML = theme === 'dark'
    ? '<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path>'
    : '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
}

function initTheme(){
  const saved = localStorage.getItem(THEME_KEY) || 'dark';
  applyTheme(saved);
  const btn = document.getElementById('themeToggle');
  btn && btn.addEventListener('click', ()=>{
    const cur = document.documentElement.getAttribute('data-theme');
    applyTheme(cur === 'dark' ? 'light' : 'dark');
  });
}

function linkChip(label, url){
  const safe = safeUrl(url);
  if(!safe) return '';
  return `<a class="pill" href="${esc(safe)}" target="_blank" rel="noopener">${esc(label)} ↗</a>`;
}

function render(data){
  document.title = `${data.meta.name} — ${data.meta.tagline}`;

  const nameParts = esc(data.meta.name).split(' ');
  document.getElementById('heroName').innerHTML = `${nameParts[0]}<br><span>${nameParts.slice(1).join(' ')}</span>`;
  document.getElementById('heroSub').textContent = data.meta.subtitle;
  const heroBadge = document.getElementById('heroBadge');
  if(heroBadge) heroBadge.textContent = (data.meta.tagline || '').toUpperCase();

  const photoEl = document.getElementById('heroPhoto');
  if(photoEl){
    if(data.meta.photo){
      photoEl.src = data.meta.photo;
      photoEl.closest('.photo-frame').style.display = '';
    } else {
      photoEl.closest('.photo-frame').style.display = 'none';
    }
  }

  const contactPills = [];
  if(data.meta.email) contactPills.push(`<a class="contact-pill contact-pill-primary" href="mailto:${esc(data.meta.email)}">✉ ${esc(data.meta.email)}</a>`);
  if(safeUrl(data.meta.links && data.meta.links.github)) contactPills.push(`<a class="contact-pill" href="${esc(safeUrl(data.meta.links.github))}" target="_blank" rel="noopener">GitHub</a>`);
  if(safeUrl(data.meta.links && data.meta.links.linkedin)) contactPills.push(`<a class="contact-pill" href="${esc(safeUrl(data.meta.links.linkedin))}" target="_blank" rel="noopener">LinkedIn</a>`);
  if(safeUrl(data.meta.links && data.meta.links.leetcode)) contactPills.push(`<a class="contact-pill" href="${esc(safeUrl(data.meta.links.leetcode))}" target="_blank" rel="noopener">LeetCode</a>`);
  const heroContactRow = document.getElementById('heroContactRow');
  if(heroContactRow) heroContactRow.innerHTML = contactPills.join('');

  const bottomBits = [];
  if(data.meta.location) bottomBits.push(`<div class="bottom-meta-item"><span class="label">Current location</span><span class="value">📍 ${esc(data.meta.location)}</span></div>`);
  if(data.meta.phone) bottomBits.push(`<div class="bottom-meta-item"><span class="label">Contact number</span><span class="value">📞 ${esc(data.meta.phone)}</span></div>`);
  const bottomMeta = document.getElementById('bottomMeta');
  if(bottomMeta) bottomMeta.innerHTML = bottomBits.join('');

  const locTag = document.getElementById('locationTag');
  if(locTag){
    const short = (data.meta.location || '').split(',')[0];
    locTag.textContent = short ? short.toUpperCase() : '';
  }

  document.getElementById('aboutText').textContent = data.about;

  // skills
  const skillsGrid = document.getElementById('skillsGrid');
  skillsGrid.innerHTML = Object.entries(data.skills || {}).map(([cat, items])=>`
    <div class="skill-card">
      <h3>${esc(cat)}</h3>
      <div class="tag-row">${items.map(i=>`<span class="tag">${esc(i)}</span>`).join('')}</div>
    </div>`).join('');

  // experience
  const exp = document.getElementById('expTimeline');
  exp.innerHTML = (data.experience || []).map(e=>`
    <div class="tl-item">
      <div class="tl-head">
        <div><span class="tl-role">${esc(e.role)}</span><br><span class="tl-company">${esc(e.company)}</span></div>
        <span class="tl-period">${esc(e.period)}</span>
      </div>
      <ul class="tl-points">${(e.points||[]).map(p=>`<li>${esc(p)}</li>`).join('')}</ul>
      ${safeUrl(e.link) ? `<a class="tl-link" href="${esc(safeUrl(e.link))}" target="_blank" rel="noopener">view more ↗</a>` : ''}
    </div>`).join('');

  // projects
  const proj = document.getElementById('projectsGrid');
  proj.innerHTML = (data.projects || []).map(p=>`
    <div class="project-card">
      <div class="project-top">
        <span class="project-title">${esc(p.title)}</span>
        ${p.badge ? `<span class="pill">${esc(p.badge)}</span>` : ''}
      </div>
      <p class="project-desc">${esc(p.description)}</p>
      <div class="tag-row" style="margin-bottom:14px;">${(p.tags||[]).map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div>
      <div class="project-links">
        ${safeUrl(p.link) ? `<a href="${esc(safeUrl(p.link))}" target="_blank" rel="noopener">Live ↗</a>` : ''}
        ${safeUrl(p.github) ? `<a href="${esc(safeUrl(p.github))}" target="_blank" rel="noopener">Code ↗</a>` : ''}
      </div>
    </div>`).join('');

  // education
  // ---- Stat strip (derived from existing data) ----
  const stripEl = document.getElementById('statStrip');
  if(stripEl){
    const internCount = (data.experience || []).length;
    const certCount = (data.certifications || []).length;
    const projCount = (data.projects || []).length;
    const crExtra = (data.extras || []).find(x => /class representative/i.test(x.text || ''));
    const crPeriodMatch = crExtra ? crExtra.text.match(/\(([^)]+)\)/) : null;
    const crPeriod = crPeriodMatch ? crPeriodMatch[1].split('\u2013')[0].trim() : '\u2014';

    const eduEntryForCgpa = (data.education || [])[0];
    const cgpaMatchStrip = eduEntryForCgpa && eduEntryForCgpa.detail ? eduEntryForCgpa.detail.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/) : null;
    const cgpaValStrip = cgpaMatchStrip ? cgpaMatchStrip[1] : '—';
    const cgpaMaxStrip = cgpaMatchStrip ? cgpaMatchStrip[2] : '';

    const units = [
      { tag: 'roles shipped', value: String(internCount) },
      { tag: 'projects built', value: String(projCount) },
      { tag: 'certifications', value: String(certCount), suffix: '+' },
      { tag: 'cgpa', value: cgpaValStrip, suffix: cgpaMaxStrip ? `/${cgpaMaxStrip}` : '' },
      { tag: 'leadership since', value: crPeriod }
    ];

    stripEl.innerHTML = units.map(u => `
      <div class="stat-unit">
        <span class="stat-tag">${esc(u.tag)}</span>
        <div class="stat-value">${esc(u.value)}${u.suffix ? `<span>${esc(u.suffix)}</span>` : ''}</div>
      </div>`).join('');
  }

  // training rendering removed — merged into education terminal

  // certifications
  document.getElementById('certGrid').innerHTML = (data.certifications || []).map(c=>`
    <div class="cert-item">
      ${safeUrl(c.link) ? `<a href="${esc(safeUrl(c.link))}" target="_blank" rel="noopener">${esc(c.title)} ↗</a>` : `<span>${esc(c.title)}</span>`}
    </div>`).join('');

  // publications
  const pubGrid = document.getElementById('publicationsGrid');
  if(pubGrid){
    pubGrid.innerHTML = (data.publications || []).map(p => `
      <div class="pub-card">
        <div class="pub-title">${esc(p.title)}</div>
        <div class="pub-footer">
          ${p.status === 'published' && safeUrl(p.link)
            ? `<a class="pub-btn" href="${esc(safeUrl(p.link))}" target="_blank" rel="noopener">View ↗</a>`
            : `<span class="pub-status">In progress</span>`}
        </div>
      </div>`).join('');
  }

  // extras
  document.getElementById('extrasList').innerHTML = (data.extras || []).map(x=>`
    <li><span>✦</span><span>${esc(x.text)} ${safeUrl(x.link) ? `— <a href="${esc(safeUrl(x.link))}" target="_blank" rel="noopener">link ↗</a>` : ''}</span></li>`).join('');

  document.getElementById('langChips').innerHTML = (data.languages||[]).map(l=>`<span class="pill">${esc(l)}</span>`).join('');
  document.getElementById('interestChips').innerHTML = (data.interests||[]).map(l=>`<span class="pill">${esc(l)}</span>`).join('');

  // contact links (fixed + custom)
  const fixed = data.meta.links || {};
  const contactBits = [
    linkChip('GitHub', fixed.github),
    linkChip('LinkedIn', fixed.linkedin),
    linkChip('LeetCode', fixed.leetcode),
    fixed && data.meta.email ? `<a class="pill" href="mailto:${esc(data.meta.email)}">Email ↗</a>` : '',
    data.meta.resumeLink ? linkChip('Resume', data.meta.resumeLink) : ''
  ];
  (data.customLinks || []).forEach(cl=>{
    if(cl.label && safeUrl(cl.url)) contactBits.push(linkChip(cl.label, cl.url));
  });
  document.getElementById('contactLinks').innerHTML = contactBits.filter(Boolean).join('');

  document.getElementById('year').textContent = new Date().getFullYear();
}

function initReveal(){
  const items = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } });
  }, {threshold:.12});
  items.forEach(i=>io.observe(i));
}

document.body.classList.add('splash-active');

(async function init(){
  initTheme();
  try{
    const data = await loadContent();
    render(data);
  }catch(err){
    document.getElementById('heroName').textContent = 'Content failed to load';
    document.getElementById('heroSub').textContent = 'Make sure content.json is in the same folder and the site is served over http(s), not opened directly as a file.';
    console.error(err);
  }
  initReveal();

  const splash = document.getElementById('splashScreen');
  if(splash){
    setTimeout(()=>{
      splash.classList.add('splash-hide');
      document.body.classList.remove('splash-active');
      setTimeout(()=> splash.remove(), 700);
    }, 1750);
  }
})();
