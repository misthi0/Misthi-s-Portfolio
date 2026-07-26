const STORAGE_KEY = 'portfolio_content_v1';
const PW_KEY = 'portfolio_admin_pw';
const THEME_KEY = 'portfolio_theme';

let content = null;

/* ---------------- theme (shared behavior with public site) ---------------- */
function applyTheme(theme){
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
}
(function initTheme(){
  applyTheme(localStorage.getItem(THEME_KEY) || 'dark');
  document.getElementById('themeToggle').addEventListener('click', ()=>{
    const cur = document.documentElement.getAttribute('data-theme');
    applyTheme(cur === 'dark' ? 'light' : 'dark');
  });
})();

/* ---------------- login gate ---------------- */
const USER_KEY = 'portfolio_admin_user';
function getPw(){ return localStorage.getItem(PW_KEY) || 'admin123'; }
function getUser(){ return localStorage.getItem(USER_KEY) || 'admin'; }

document.getElementById('loginBtn').addEventListener('click', doLogin);
document.getElementById('pwInput').addEventListener('keydown', e=>{ if(e.key === 'Enter') doLogin(); });
document.getElementById('userInput').addEventListener('keydown', e=>{ if(e.key === 'Enter') doLogin(); });

function doLogin(){
  const userVal = document.getElementById('userInput').value.trim();
  const pwVal = document.getElementById('pwInput').value;
  if(userVal === getUser() && pwVal === getPw()){
    document.getElementById('loginGate').style.display = 'none';
    document.getElementById('editorWrap').style.display = 'block';
    boot();
  } else {
    document.getElementById('loginError').textContent = 'Incorrect login ID or password.';
  }
}

document.getElementById('changePwBtn').addEventListener('click', ()=>{
  const uVal = document.getElementById('newUser').value.trim();
  const pVal = document.getElementById('newPw').value.trim();
  if(uVal.length < 2){ alert('Choose a login ID with at least 2 characters.'); return; }
  if(pVal.length < 4){ alert('Choose a password with at least 4 characters.'); return; }
  localStorage.setItem(USER_KEY, uVal);
  localStorage.setItem(PW_KEY, pVal);
  document.getElementById('newUser').value = '';
  document.getElementById('newPw').value = '';
  flashStatus('Login ID and password updated for this browser.');
});

/* ---------------- load / save ---------------- */
async function boot(){
  const local = localStorage.getItem(STORAGE_KEY);
  if(local){
    content = JSON.parse(local);
  } else {
    const res = await fetch('content.json', {cache:'no-store'});
    content = await res.json();
  }
  buildTabs();
  renderAll();
}

let hasUnpublishedChanges = false;
let previewShown = false;
let previewRefreshTimer;
function saveDraft(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
  hasUnpublishedChanges = true;
  const ts = new Date().toLocaleTimeString();
  flashStatus('Saved to this browser · ' + ts);
  const lbl = document.getElementById('lastSavedLabel');
  if(lbl) lbl.textContent = 'Last saved to browser at ' + ts + ' — not yet published';

  clearTimeout(previewRefreshTimer);
  previewRefreshTimer = setTimeout(()=>{
    if(previewShown){
      const frame = document.getElementById('previewFrame');
      if(frame) frame.src = 'index.html?t=' + Date.now();
    }
  }, 600);
}

window.addEventListener('beforeunload', (e)=>{
  if(hasUnpublishedChanges){
    e.preventDefault();
    e.returnValue = '';
  }
});
let flashTimer;
function flashStatus(msg){
  const el = document.getElementById('saveStatus');
  el.textContent = msg;
  clearTimeout(flashTimer);
  flashTimer = setTimeout(()=>{ el.textContent = ''; }, 4000);
}

document.getElementById('saveBtn').addEventListener('click', ()=>{
  saveDraft();
  flashStatus('✓ Changes saved — refresh the live preview to see them.');
});

document.getElementById('previewBtn').addEventListener('click', ()=>{
  window.open('index.html', '_blank');
});

let mobilePreview = false;
const previewToggleBtn = document.getElementById('previewToggleBtn');
const previewWidthBtn = document.getElementById('previewWidthBtn');

if(previewToggleBtn){
  previewToggleBtn.addEventListener('click', ()=>{
    previewShown = !previewShown;
    const wrap = document.getElementById('previewFrameWrap');
    wrap.style.display = previewShown ? 'block' : 'none';
    previewToggleBtn.textContent = previewShown ? 'Hide preview ▴' : 'Show preview ▾';
    if(previewWidthBtn) previewWidthBtn.style.display = previewShown ? 'inline-flex' : 'none';
    if(previewShown) refreshPreviewFrame();
  });
}

if(previewWidthBtn){
  previewWidthBtn.addEventListener('click', ()=>{
    mobilePreview = !mobilePreview;
    const frame = document.getElementById('previewFrame');
    if(frame){
      frame.style.width = mobilePreview ? '375px' : '100%';
      frame.style.margin = mobilePreview ? '0 auto' : '0';
      frame.style.display = 'block';
    }
    previewWidthBtn.textContent = mobilePreview ? '🖥 Desktop width' : '📱 Mobile width';
  });
}

function refreshPreviewFrame(){
  const frame = document.getElementById('previewFrame');
  if(frame) frame.src = 'index.html?t=' + Date.now();
}

document.getElementById('resetBtn').addEventListener('click', async ()=>{
  if(!confirm('Discard local edits and reload the published content.json?')) return;
  localStorage.removeItem(STORAGE_KEY);
  const res = await fetch('content.json', {cache:'no-store'});
  content = await res.json();
  renderAll();
  flashStatus('Reverted to published content.json');
});

document.getElementById('publishBtn').addEventListener('click', ()=>{
  const blob = new Blob([JSON.stringify(content, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'content.json';
  a.click();
  URL.revokeObjectURL(url);
  hasUnpublishedChanges = false;
  const lbl = document.getElementById('lastSavedLabel');
  if(lbl) lbl.textContent = 'Published at ' + new Date().toLocaleTimeString();
  flashStatus('Downloaded content.json — replace it in your hosted folder to go live for everyone.');
});

document.getElementById('importBtn').addEventListener('click', ()=> document.getElementById('importFile').click());
document.getElementById('importFile').addEventListener('change', (e)=>{
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    try{
      content = JSON.parse(reader.result);
      saveDraft();
      renderAll();
      flashStatus('Imported ' + file.name);
    }catch(err){ alert('That file is not valid JSON.'); }
  };
  reader.readAsText(file);
});

/* ---------------- tabs ---------------- */
const TABS = [
  {id:'profile', label:'Profile'},
  {id:'skills', label:'Skills'},
  {id:'experience', label:'Experience'},
  {id:'projects', label:'Projects'},
  {id:'education', label:'Education'},
  {id:'training', label:'Training'},
  {id:'certifications', label:'Certifications'},
  {id:'publications', label:'Publications'},
  {id:'extras', label:'Extras'},
  {id:'links', label:'Links & tags'},
];

function buildTabs(){
  const tabsEl = document.getElementById('adminTabs');
  tabsEl.innerHTML = TABS.map((t,i)=>`<button class="admin-tab ${i===0?'active':''}" data-tab="${t.id}">${t.label}</button>`).join('');
  const panelsEl = document.getElementById('adminPanels');
  panelsEl.innerHTML = TABS.map((t,i)=>`<div class="admin-panel ${i===0?'active':''}" id="panel-${t.id}"></div>`).join('');
  tabsEl.querySelectorAll('.admin-tab').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      tabsEl.querySelectorAll('.admin-tab').forEach(b=>b.classList.remove('active'));
      panelsEl.querySelectorAll('.admin-panel').forEach(p=>p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('panel-' + btn.dataset.tab).classList.add('active');
    });
  });
}

function renderAll(){
  renderProfile();
  renderSkills();
  renderListSection('experience', document.getElementById('panel-experience'), [
    {key:'company', label:'Company', type:'text'},
    {key:'role', label:'Role / Title', type:'text'},
    {key:'period', label:'Period', type:'text'},
    {key:'link', label:'Link (optional)', type:'text'},
    {key:'points', label:'Bullet points (one per line)', type:'list'},
  ], ()=>({id:uid(), company:'New company', role:'Role', period:'', link:'', points:[]}));

  renderListSection('projects', document.getElementById('panel-projects'), [
    {key:'title', label:'Project title', type:'text'},
    {key:'badge', label:'Badge (e.g. year or hackathon)', type:'text'},
    {key:'description', label:'Description', type:'textarea'},
    {key:'tags', label:'Tech tags (comma separated)', type:'tags'},
    {key:'link', label:'Live link', type:'text'},
    {key:'github', label:'Code / GitHub link', type:'text'},
  ], ()=>({id:uid(), title:'New project', badge:'', description:'', tags:[], link:'', github:''}));

  renderListSection('education', document.getElementById('panel-education'), [
    {key:'school', label:'School / Institute', type:'text'},
    {key:'degree', label:'Degree', type:'text'},
    {key:'period', label:'Period', type:'text'},
    {key:'detail', label:'Details (CGPA, coursework...)', type:'textarea'},
    {key:'link', label:'Link (optional)', type:'text'},
  ], ()=>({id:uid(), school:'New institute', degree:'', period:'', detail:'', link:''}));

  renderListSection('training', document.getElementById('panel-training'), [
    {key:'org', label:'Organization / Program', type:'text'},
    {key:'period', label:'Period', type:'text'},
    {key:'link', label:'Link (optional)', type:'text'},
    {key:'points', label:'Bullet points (one per line)', type:'list'},
  ], ()=>({id:uid(), org:'New program', period:'', link:'', points:[]}));

  renderListSection('certifications', document.getElementById('panel-certifications'), [
    {key:'title', label:'Certification title', type:'text'},
    {key:'link', label:'Link (optional)', type:'text'},
  ], ()=>({id:uid(), title:'New certification', link:''}));

  renderListSection('publications', document.getElementById('panel-publications'), [
    {key:'title', label:'Paper / publication title', type:'textarea'},
    {key:'status', label:'Status', type:'select', options:[['published','Published'],['in_progress','In progress']]},
    {key:'link', label:'Link (only used if status is Published)', type:'text'},
  ], ()=>({id:uid(), title:'New publication', status:'in_progress', link:''}));

  renderListSection('extras', document.getElementById('panel-extras'), [
    {key:'text', label:'Description', type:'textarea'},
    {key:'link', label:'Link (optional)', type:'text'},
  ], ()=>({id:uid(), text:'New achievement', link:''}));

  renderLinksTab();
}

function uid(){ return 'id' + Math.random().toString(36).slice(2,9); }

/* ---------------- profile tab ---------------- */
function renderProfile(){
  const panel = document.getElementById('panel-profile');
  const m = content.meta;
  panel.innerHTML = `
    <div class="admin-card">
      <div class="admin-row">
        <div class="admin-field"><label>Full name</label><input class="admin-input" data-bind="meta.name" value="${escAttr(m.name)}"></div>
        <div class="admin-field"><label>Tagline</label><input class="admin-input" data-bind="meta.tagline" value="${escAttr(m.tagline)}"></div>
      </div>
      <div class="admin-field"><label>Subtitle (hero paragraph)</label><textarea class="admin-textarea" data-bind="meta.subtitle">${escHtml(m.subtitle)}</textarea></div>
      <div class="admin-field"><label>About (about section paragraph)</label><textarea class="admin-textarea" data-bind="about" style="min-height:110px;">${escHtml(content.about)}</textarea></div>
      <div class="admin-row">
        <div class="admin-field"><label>Location</label><input class="admin-input" data-bind="meta.location" value="${escAttr(m.location)}"></div>
        <div class="admin-field"><label>Email</label><input class="admin-input" data-bind="meta.email" value="${escAttr(m.email)}"></div>
      </div>
      <div class="admin-field">
        <label>Profile photo</label>
        <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
          <img id="photoPreview" src="${escAttr(m.photo||'')}" style="width:72px;height:72px;object-fit:cover;border-radius:10px;border:1px solid var(--border);background:var(--surface-2);">
          <div>
            <input type="file" id="photoUpload" accept="image/*" style="display:none;">
            <button class="btn" id="photoUploadBtn" type="button">Choose new photo</button>
            <div class="taglist-hint">Pick any image from your computer — it's embedded directly, no separate file needed.</div>
          </div>
        </div>
      </div>
      <div class="admin-row">
        <div class="admin-field"><label>Phone</label><input class="admin-input" data-bind="meta.phone" value="${escAttr(m.phone)}"></div>
        <div class="admin-field"><label>Resume link</label><input class="admin-input" data-bind="meta.resumeLink" value="${escAttr(m.resumeLink)}"></div>
      </div>
      <div class="admin-row">
        <div class="admin-field"><label>GitHub URL</label><input class="admin-input" data-bind="meta.links.github" value="${escAttr(m.links.github)}"></div>
        <div class="admin-field"><label>LinkedIn URL</label><input class="admin-input" data-bind="meta.links.linkedin" value="${escAttr(m.links.linkedin)}"></div>
      </div>
      <div class="admin-row">
        <div class="admin-field"><label>Portfolio URL</label><input class="admin-input" data-bind="meta.links.portfolio" value="${escAttr(m.links.portfolio)}"></div>
        <div class="admin-field"><label>LeetCode URL</label><input class="admin-input" data-bind="meta.links.leetcode" value="${escAttr(m.links.leetcode)}"></div>
      </div>
    </div>`;
  panel.querySelectorAll('[data-bind]').forEach(el=>{
    el.addEventListener('input', ()=>{
      setPath(content, el.dataset.bind, el.value);
      saveDraft();
    });
  });

  const uploadBtn = document.getElementById('photoUploadBtn');
  const uploadInput = document.getElementById('photoUpload');
  if(uploadBtn && uploadInput){
    uploadBtn.addEventListener('click', ()=> uploadInput.click());
    uploadInput.addEventListener('change', (e)=>{
      const file = e.target.files[0];
      if(!file) return;
      if(file.size > 2 * 1024 * 1024){
        alert('Please choose an image under 2MB for best performance.');
        return;
      }
      const reader = new FileReader();
      reader.onload = ()=>{
        content.meta.photo = reader.result;
        document.getElementById('photoPreview').src = reader.result;
        saveDraft();
        flashStatus('Photo updated — click Save changes to lock it in.');
      };
      reader.readAsDataURL(file);
    });
  }
}

/* ---------------- skills tab (object of category -> tag array) ---------------- */
function renderSkills(){
  const panel = document.getElementById('panel-skills');
  const cats = Object.keys(content.skills);
  panel.innerHTML = cats.map(cat=>`
    <div class="item-card">
      <div class="item-card-head">
        <input class="admin-input" style="max-width:280px;font-family:var(--font-mono);font-size:.82rem;" data-cat-rename="${escAttr(cat)}" value="${escAttr(cat)}">
        <button class="item-remove" data-cat-remove="${escAttr(cat)}">remove category</button>
      </div>
      <div class="admin-field">
        <label>Skills (comma separated)</label>
        <input class="admin-input" data-cat-tags="${escAttr(cat)}" value="${escAttr(content.skills[cat].join(', '))}">
      </div>
    </div>`).join('') + `<button class="add-item-btn" id="addSkillCat">+ add skill category</button>`;

  panel.querySelectorAll('[data-cat-tags]').forEach(el=>{
    el.addEventListener('input', ()=>{
      const cat = el.dataset.catTags;
      content.skills[cat] = el.value.split(',').map(s=>s.trim()).filter(Boolean);
      saveDraft();
    });
  });
  panel.querySelectorAll('[data-cat-rename]').forEach(el=>{
    el.addEventListener('change', ()=>{
      const oldName = el.dataset.catRename;
      const newName = el.value.trim();
      if(!newName || newName === oldName) return;
      const ordered = {};
      Object.keys(content.skills).forEach(k=>{
        ordered[k === oldName ? newName : k] = content.skills[k];
      });
      content.skills = ordered;
      saveDraft(); renderSkills();
    });
  });
  panel.querySelectorAll('[data-cat-remove]').forEach(el=>{
    el.addEventListener('click', ()=>{
      delete content.skills[el.dataset.catRemove];
      saveDraft(); renderSkills();
    });
  });
  document.getElementById('addSkillCat').addEventListener('click', ()=>{
    let name = 'New category', i = 1;
    while(content.skills[name]) name = 'New category ' + (++i);
    content.skills[name] = [];
    saveDraft(); renderSkills();
  });
}

/* ---------------- generic array-of-objects section ---------------- */
function renderListSection(key, panel, fields, makeDefault){
  const items = content[key];
  panel.innerHTML = items.map((item, idx)=>`
    <div class="item-card" data-idx="${idx}">
      <div class="item-card-head">
        <span class="item-title">#${idx+1} ${escHtml(item[fields[0].key] || '')}</span>
        <div style="display:flex;gap:6px;align-items:center;">
          <button class="item-remove" data-move-up="${idx}" ${idx===0?'disabled style="opacity:.3;cursor:default;"':''} title="Move up">↑</button>
          <button class="item-remove" data-move-down="${idx}" ${idx===items.length-1?'disabled style="opacity:.3;cursor:default;"':''} title="Move down">↓</button>
          <button class="item-remove" data-duplicate="${idx}" title="Duplicate">⧉ duplicate</button>
          <button class="item-remove" data-remove="${idx}">remove</button>
        </div>
      </div>
      ${fields.map(f=>fieldHtml(key, idx, f, item)).join('')}
    </div>`).join('') + `<button class="add-item-btn" data-add="1">+ add ${key.slice(0,-1) === key ? key : key.replace(/s$/,'')}</button>`;

  panel.querySelectorAll('input,textarea,select').forEach(el=>{
    const evt = el.tagName === 'SELECT' ? 'change' : 'input';
    el.addEventListener(evt, ()=>{
      const idx = Number(el.dataset.idx);
      const fkey = el.dataset.field;
      const ftype = el.dataset.type;
      let val = el.value;
      if(ftype === 'list') val = val.split('\n').map(s=>s.trim()).filter(Boolean);
      if(ftype === 'tags') val = val.split(',').map(s=>s.trim()).filter(Boolean);
      content[key][idx][fkey] = val;
      saveDraft();
      if(fkey === fields[0].key){
        const headEl = panel.querySelector(`.item-card[data-idx="${idx}"] .item-title`);
        if(headEl) headEl.textContent = `#${idx+1} ${val}`;
      }
    });
  });
  panel.querySelectorAll('[data-remove]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const idx = Number(btn.dataset.remove);
      if(!confirm('Remove this entry?')) return;
      content[key].splice(idx,1);
      saveDraft();
      renderListSection(key, panel, fields, makeDefault);
    });
  });
  panel.querySelectorAll('[data-move-up]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const idx = Number(btn.dataset.moveUp);
      if(idx <= 0) return;
      [content[key][idx-1], content[key][idx]] = [content[key][idx], content[key][idx-1]];
      saveDraft();
      renderListSection(key, panel, fields, makeDefault);
    });
  });
  panel.querySelectorAll('[data-move-down]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const idx = Number(btn.dataset.moveDown);
      if(idx >= content[key].length-1) return;
      [content[key][idx+1], content[key][idx]] = [content[key][idx], content[key][idx+1]];
      saveDraft();
      renderListSection(key, panel, fields, makeDefault);
    });
  });
  panel.querySelectorAll('[data-duplicate]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const idx = Number(btn.dataset.duplicate);
      const copy = JSON.parse(JSON.stringify(content[key][idx]));
      copy.id = uid();
      content[key].splice(idx+1, 0, copy);
      saveDraft();
      renderListSection(key, panel, fields, makeDefault);
    });
  });
  panel.querySelector('[data-add]').addEventListener('click', ()=>{
    content[key].push(makeDefault());
    saveDraft();
    renderListSection(key, panel, fields, makeDefault);
  });
}

function fieldHtml(key, idx, f, item){
  const val = item[f.key];
  if(f.type === 'textarea'){
    return `<div class="admin-field"><label>${f.label}</label><textarea class="admin-textarea" data-idx="${idx}" data-field="${f.key}" data-type="${f.type}">${escHtml(val||'')}</textarea></div>`;
  }
  if(f.type === 'list'){
    return `<div class="admin-field"><label>${f.label}</label><textarea class="admin-textarea" data-idx="${idx}" data-field="${f.key}" data-type="${f.type}">${escHtml((val||[]).join('\n'))}</textarea><div class="taglist-hint">One item per line.</div></div>`;
  }
  if(f.type === 'tags'){
    return `<div class="admin-field"><label>${f.label}</label><input class="admin-input" data-idx="${idx}" data-field="${f.key}" data-type="${f.type}" value="${escAttr((val||[]).join(', '))}"></div>`;
  }
  if(f.type === 'select'){
    const opts = (f.options||[]).map(([ov, ol])=>`<option value="${escAttr(ov)}" ${val===ov?'selected':''}>${escHtml(ol)}</option>`).join('');
    return `<div class="admin-field"><label>${f.label}</label><select class="admin-input" data-idx="${idx}" data-field="${f.key}" data-type="${f.type}">${opts}</select></div>`;
  }
  return `<div class="admin-field"><label>${f.label}</label><input class="admin-input" data-idx="${idx}" data-field="${f.key}" data-type="${f.type}" value="${escAttr(val||'')}"></div>`;
}

/* ---------------- links & tags tab ---------------- */
function renderLinksTab(){
  const panel = document.getElementById('panel-links');
  panel.innerHTML = `
    <div class="admin-card">
      <h3 style="font-family:var(--font-display);margin-bottom:14px;">Custom links</h3>
      <p class="muted" style="font-size:.85rem;margin-bottom:16px;">Attach any extra link you want shown on the contact section — a blog, a demo video, a Devpost, anything.</p>
      <div id="customLinksList"></div>
      <button class="add-item-btn" id="addCustomLink" style="margin-top:12px;">+ add link</button>
    </div>
    <div class="admin-card" style="margin-top:20px;">
      <div class="admin-field"><label>Languages (comma separated)</label>
        <input class="admin-input" id="langInput" value="${escAttr((content.languages||[]).join(', '))}"></div>
      <div class="admin-field"><label>Interests (comma separated)</label>
        <input class="admin-input" id="interestInput" value="${escAttr((content.interests||[]).join(', '))}"></div>
    </div>`;

  function renderCustomLinks(){
    const list = document.getElementById('customLinksList');
    list.innerHTML = (content.customLinks||[]).map((cl, idx)=>`
      <div class="item-card" style="margin-bottom:12px;">
        <div class="item-card-head">
          <span class="item-title">#${idx+1}</span>
          <button class="item-remove" data-cl-remove="${idx}">remove</button>
        </div>
        <div class="admin-row">
          <div class="admin-field"><label>Label</label><input class="admin-input" data-cl="label" data-idx="${idx}" value="${escAttr(cl.label)}"></div>
          <div class="admin-field"><label>URL</label><input class="admin-input" data-cl="url" data-idx="${idx}" value="${escAttr(cl.url)}"></div>
        </div>
      </div>`).join('');
    list.querySelectorAll('[data-cl]').forEach(el=>{
      el.addEventListener('input', ()=>{
        content.customLinks[Number(el.dataset.idx)][el.dataset.cl] = el.value;
        saveDraft();
      });
    });
    list.querySelectorAll('[data-cl-remove]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        content.customLinks.splice(Number(btn.dataset.clRemove),1);
        saveDraft(); renderCustomLinks();
      });
    });
  }
  renderCustomLinks();
  document.getElementById('addCustomLink').addEventListener('click', ()=>{
    content.customLinks = content.customLinks || [];
    content.customLinks.push({id:uid(), label:'New link', url:''});
    saveDraft(); renderCustomLinks();
  });
  document.getElementById('langInput').addEventListener('input', (e)=>{
    content.languages = e.target.value.split(',').map(s=>s.trim()).filter(Boolean);
    saveDraft();
  });
  document.getElementById('interestInput').addEventListener('input', (e)=>{
    content.interests = e.target.value.split(',').map(s=>s.trim()).filter(Boolean);
    saveDraft();
  });
}

/* ---------------- helpers ---------------- */
function setPath(obj, path, value){
  const parts = path.split('.');
  let cur = obj;
  for(let i=0;i<parts.length-1;i++) cur = cur[parts[i]];
  cur[parts[parts.length-1]] = value;
}
function escAttr(s){ return (s==null?'':String(s)).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'); }
function escHtml(s){ return (s==null?'':String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
