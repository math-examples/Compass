const FORCE_NO_CACHE = new URLSearchParams(window.location.search).has('nocache');
let cacheEnabled = !FORCE_NO_CACHE;

let links = [];
let searchMode = 'auto';
let currentTheme = 'silver';
let customBg = '';

// --- Refined Apple-style mesh gradients + Pro Titanium ---
const themes = {
    silver: { bg: 'radial-gradient(at 0% 0%, #f5f7fa 0px, transparent 60%), radial-gradient(at 100% 100%, #e0e0e6 0px, transparent 60%) #f5f5f7', tint: '245, 245, 247' },
    indigo: { bg: 'radial-gradient(at 20% 30%, #5E5CE6 0px, transparent 60%), radial-gradient(at 80% 80%, #0A84FF 0px, transparent 60%) #1a1a2e', tint: '94, 92, 230' },
    sky:   { bg: 'radial-gradient(at 10% 20%, #5AC8FA 0px, transparent 60%), radial-gradient(at 90% 80%, #007AFF 0px, transparent 60%) #e0f7ff', tint: '0, 122, 255' },
    mono:  { bg: 'radial-gradient(at 0% 0%, #2c2c2e 0px, transparent 60%), radial-gradient(at 100% 100%, #000 0px, transparent 60%) #000', tint: '44, 44, 46' },
    sunset:{ bg: 'radial-gradient(at 0% 100%, #FF9500 0px, transparent 60%), radial-gradient(at 100% 0%, #FF3B30 0px, transparent 60%) #fff5f0', tint: '255, 149, 0' },
    forest:{ bg: 'radial-gradient(at 30% 70%, #34C759 0px, transparent 60%), radial-gradient(at 70% 30%, #30D158 0px, transparent 60%) #e8f5e9', tint: '52, 199, 89' },
    pro:   { bg: 'radial-gradient(at 15% 15%, #8e8e93 0px, transparent 50%), radial-gradient(at 85% 85%, #3a3a3c 0px, transparent 50%), linear-gradient(135deg, #2c2c2e 0%, #1c1c1e 50%, #000 100%)', tint: '142, 142, 147' }
};

// --- Cache Functions ---
function saveToCache() {
    if (!cacheEnabled || FORCE_NO_CACHE) return;
    const data = { links, theme: currentTheme, bgImage: customBg, searchMode, version: 1 };
    localStorage.setItem('webDirectoryData', JSON.stringify(data));
}

function loadFromCache() {
    if (!cacheEnabled || FORCE_NO_CACHE) return false;
    try {
        const raw = localStorage.getItem('webDirectoryData');
        if (!raw) return false;
        const data = JSON.parse(raw);
        if (data.links) links = data.links;
        if (data.theme) currentTheme = data.theme;
        if (data.bgImage !== undefined) customBg = data.bgImage;
        if (data.searchMode) searchMode = data.searchMode;
        return true;
    } catch { return false; }
}

function clearCache() {
    if (confirm('Clear all locally cached data?')) {
        localStorage.removeItem('webDirectoryData');
        cacheEnabled = false;
        document.getElementById('cacheToggle').checked = false;
        updatePrivacyNote();
        alert('Cache cleared. Refresh to start fresh.');
    }
}

function toggleCache() {
    cacheEnabled = document.getElementById('cacheToggle').checked;
    if (cacheEnabled) saveToCache();
    else localStorage.removeItem('webDirectoryData');
    updatePrivacyNote();
}

function updatePrivacyNote() {
    const note = document.getElementById('privacyNote');
    if (cacheEnabled && !FORCE_NO_CACHE) {
        note.innerHTML = '💾 Data saved locally in your browser.<br>Disable cache in Settings for zero storage.';
    } else {
        note.innerHTML = '🔒 Zero storage. Zero cache. Zero tracking.<br>Data lives only in this session — export to save.';
    }
}

// --- Theme ---
function applyTheme() {
    document.querySelectorAll('.theme-swatch').forEach(s => s.classList.remove('active'));
    const active = document.querySelector(`[data-theme="${currentTheme}"]`);
    if (active) active.classList.add('active');
    
    const themeObj = themes[currentTheme] || themes.silver;
    
    if (customBg) { 
        document.body.style.background = `url(${customBg})`; 
        document.body.classList.add('bg-image'); 
    } else {
        document.body.classList.remove('bg-image');
        document.body.style.background = themeObj.bg;
    }
    
    // Dynamic vibrancy: set CSS variable for tint
    document.documentElement.style.setProperty('--theme-tint', themeObj.tint);
}

// Theme swatch clicks
document.querySelectorAll('.theme-swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
        currentTheme = swatch.dataset.theme;
        customBg = '';
        document.getElementById('bgImageUrl').value = '';
        applyTheme();
        saveToCache();
    });
});

function setCustomBg() { 
    const u = document.getElementById('bgImageUrl').value.trim(); 
    if (u) { customBg = u; applyTheme(); saveToCache(); } 
}

// --- Search ---
function doSearch(e) {
    e.preventDefault();
    const q = document.getElementById('searchInput').value.trim();
    if (!q) return;
    if (q.includes('.') && !q.includes(' ')) { window.open(q.startsWith('http') ? q : 'https://' + q, '_blank'); }
    else {
        const engines = {
            google: 'https://google.com/search?q=',
            bing: 'https://cn.bing.com/search?q=',
            baidu: 'https://www.baidu.com/s?wd='
        };
        const base = engines[searchMode] || (searchMode === 'auto' ? 'https://cn.bing.com/search?q=' : engines[searchMode]);
        window.open(base + encodeURIComponent(q), '_blank');
    }
    document.getElementById('searchInput').value = '';
}

// --- Render ---
const colors = ['#ff3b30','#ff9500','#4cd964','#5ac8fa','#007aff','#5856d6','#ff2d55','#a2845e'];
function getDomain(u) { try { return new URL(u).hostname.replace('www.','') } catch { return u } }
function fallback(img, l) {
    img.style.display = 'none';
    const d = document.createElement('div'); d.className = 'fallback-icon';
    d.style.background = colors[Math.abs(l.charCodeAt(0)) % colors.length]; d.textContent = l.toUpperCase();
    img.parentElement.appendChild(d);
}

function render() {
    const app = document.getElementById('app');
    app.innerHTML = '';
    if (!links.length) {
        app.innerHTML = `<div class="empty-state">
            <div class="pulse">+</div>
            No links yet.<br>Tap <b>Import</b> to load your saved links,<br>or use the + button in a group to add new ones.<br><br><small>⚠️ Nothing is saved automatically.<br>Export to keep your changes.</small>
        </div>`;
        return;
    }
    const groupOrder = []; const groups = {};
    links.forEach((l, i) => {
        if (!groups[l.group]) { groups[l.group] = []; }
        groups[l.group].push({ ...l, i });
        const idx = groupOrder.indexOf(l.group);
        if (idx !== -1) groupOrder.splice(idx, 1);
        groupOrder.push(l.group);
    });
    groupOrder.forEach(g => {
        const grp = document.createElement('div'); grp.className = 'group';
        grp.innerHTML = `<div class="group-header"><h2>${g}</h2><div><button onclick="renameGroup('${g}')">&#9998;</button><button onclick="deleteGroup('${g}')">&#128465;</button></div></div>`;
        const grid = document.createElement('div'); grid.className = 'grid';
        groups[g].forEach(l => {
            const dom = getDomain(l.url).charAt(0);
            const a = document.createElement('a'); a.className = 'link-card'; a.href = l.url; a.target = '_blank';
            a.innerHTML = `<button class="delete-btn" onclick="del(event,${l.i})">&times;</button>
                <div class="icon-wrapper"><img src="https://www.google.com/s2/favicons?domain=${getDomain(l.url)}&sz=128" onerror="fallback(this,'${dom}')"></div>
                <span class="link-title">${l.title || getDomain(l.url)}</span>`;
            grid.appendChild(a);
        });
        const add = document.createElement('div'); add.className = 'link-card add-card'; add.onclick = () => { document.getElementById('linkGroup').value = g; openModal('addModal'); };
        add.innerHTML = `<div class="add-icon">+</div><span class="link-title">Add</span>`;
        grid.appendChild(add);
        grp.appendChild(grid); app.appendChild(grp);
    });
}

function del(e, i) { e.preventDefault(); e.stopPropagation(); if (confirm('Delete?')) { links.splice(i, 1); render(); saveToCache(); } }
function renameGroup(old) { const n = prompt('Rename:', old); if (n && n !== old) { links.forEach(l => { if (l.group === old) l.group = n }); render(); saveToCache(); } }
function deleteGroup(g) { if (confirm(`Delete "${g}"?`)) { links = links.filter(l => l.group !== g); render(); saveToCache(); } }

// --- Add ---
function addLink() {
    const url = document.getElementById('linkUrl').value.trim();
    const title = document.getElementById('linkTitle').value.trim();
    const group = document.getElementById('linkGroup').value.trim() || 'General';
    if (!url) return;
    links.push({ url: url.startsWith('http') ? url : 'https://' + url, title, group });
    render(); saveToCache();
    ['linkUrl', 'linkTitle', 'linkGroup'].forEach(id => document.getElementById(id).value = '');
    closeModal('addModal');
    setTimeout(() => { window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); }, 100);
}

// --- Export ---
function exportAll() { 
    if (!links.length && !confirm('No links to export. Export empty file anyway?')) return;
    const data = { links, theme: currentTheme, bgImage: customBg, searchMode, version: 1 };
    const b = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); 
    const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'compass.json'; a.click(); 
}

// --- Import ---
function importAll(e) {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
        try {
            const data = JSON.parse(r.result);
            let importedLinks = [];
            if (Array.isArray(data)) importedLinks = data;
            else if (data && Array.isArray(data.links)) {
                importedLinks = data.links;
                if (data.theme) currentTheme = data.theme;
                if (data.bgImage !== undefined) { customBg = data.bgImage; document.getElementById('bgImageUrl').value = customBg; }
                if (data.searchMode) searchMode = data.searchMode;
                applyTheme();
                document.querySelectorAll('input[name="sm"]').forEach(radio => radio.checked = (radio.value === searchMode));
            } else throw new Error('Invalid');
            const existingUrls = new Set(links.map(l => l.url));
            const newLinks = importedLinks.filter(l => !existingUrls.has(l.url));
            if (newLinks.length === 0) alert('All links already exist.');
            else {
                links = [...links, ...newLinks]; render(); saveToCache();
                setTimeout(() => { window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); }, 100);
                alert(`Imported ${newLinks.length}. Skipped ${importedLinks.length - newLinks.length} duplicates.`);
            }
        } catch { alert('Invalid file'); }
    };
    r.readAsText(f); e.target.value = '';
}

// --- Modal ---
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
window.onclick = e => { if (e.target.classList.contains('modal-overlay')) e.target.style.display = 'none'; }

// --- Search Mode ---
document.querySelectorAll('input[name="sm"]').forEach(r => {
    r.addEventListener('change', function () { if (this.checked) { searchMode = this.value; saveToCache(); } });
});

// --- Auto-load ---
window.addEventListener('load', () => {
    document.getElementById('cacheToggle').checked = cacheEnabled;
    updatePrivacyNote();
    const loadedFromCache = loadFromCache();
    applyTheme(); render();
    document.querySelectorAll('input[name="sm"]').forEach(radio => radio.checked = (radio.value === searchMode));
    
    if (!loadedFromCache || links.length === 0) {
        fetch('./compass.json', { cache: 'no-cache' })
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(loadDefaultData).catch(() => {
                fetch('./compass2.json', { cache: 'no-cache' })
                    .then(r => r.ok ? r.json() : Promise.reject())
                    .then(loadDefaultData).catch(() => {});
            });
    } else { setTimeout(() => { window.scrollTo({ top: document.body.scrollHeight, behavior: 'auto' }); }, 150); }

    function loadDefaultData(data) {
        let importedLinks = [];
        if (Array.isArray(data)) importedLinks = data;
        else if (data && Array.isArray(data.links)) {
            importedLinks = data.links;
            if (data.theme) currentTheme = data.theme;
            if (data.bgImage !== undefined) { customBg = data.bgImage; document.getElementById('bgImageUrl').value = customBg; }
            if (data.searchMode) searchMode = data.searchMode;
            applyTheme();
            document.querySelectorAll('input[name="sm"]').forEach(radio => radio.checked = (radio.value === searchMode));
        }
        const existingUrls = new Set(links.map(l => l.url));
        const newLinks = importedLinks.filter(l => !existingUrls.has(l.url));
        if (newLinks.length > 0) { links = [...links, ...newLinks]; render(); saveToCache(); setTimeout(() => { window.scrollTo({ top: document.body.scrollHeight, behavior: 'auto' }); }, 150); }
    }
});