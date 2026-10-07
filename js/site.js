// ================= CONFIG =================
// Paste your published Google Sheets CSV URLs here (one per tab):
const CSV_URLS = {
    Ticker: "https://docs.google.com/spreadsheets/d/e/2PACX-1vR4RLa5_gQbhvTIXkbBOPkmO2X-DL7xZxC6gVbC16ZwRyz-H7X4C2Y8Zd5kyGn-rmBKnHD0M3YI2jg1/pub?gid=0&single=true&output=csv",
    Events: "https://docs.google.com/spreadsheets/d/e/2PACX-1vR4RLa5_gQbhvTIXkbBOPkmO2X-DL7xZxC6gVbC16ZwRyz-H7X4C2Y8Zd5kyGn-rmBKnHD0M3YI2jg1/pub?gid=278950065&single=true&output=csv",
    Heroes: "https://docs.google.com/spreadsheets/d/e/2PACX-1vR4RLa5_gQbhvTIXkbBOPkmO2X-DL7xZxC6gVbC16ZwRyz-H7X4C2Y8Zd5kyGn-rmBKnHD0M3YI2jg1/pub?gid=868312725&single=true&output=csv",
};

// Where the "LIVE" tag links to
const LIVE_URL = "https://www.facebook.com/p/Norway-Hindu-Maha-Sabai-100069966486728/";  // ← change to your actual live page URL

const AUTO_MS = 5000;   // hero slider autoplay speed (ms)

// ================= FETCH + PARSE =================
async function fetchCsv(sheet) {
    const url = CSV_URLS[sheet];
    if (!url || url.indexOf("PASTE_") === 0) {
        throw new Error(`Missing CSV URL for ${sheet}`);
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${sheet}: ${res.status}`);
    const text = await res.text();
    return parseCsv(text);
}

// Simple CSV parser that handles quoted fields with commas
function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        const next = text[i + 1];

        if (inQuotes) {
            if (c === '"' && next === '"') { field += '"'; i++; }
            else if (c === '"') { inQuotes = false; }
            else { field += c; }
        } else {
            if (c === '"') inQuotes = true;
            else if (c === ',') { row.push(field); field = ""; }
            else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ""; }
            else if (c === '\r') { /* skip */ }
            else { field += c; }
        }
    }
    if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
    return rows;
}

// Convert rows to objects using the first row as headers
function rowsToObjects(rows) {
    if (rows.length === 0) return [];
    const headers = rows[0].map(h => h.trim());
    return rows.slice(1)
        .filter(r => r.some(cell => cell && cell.trim() !== ""))
        .map(r => {
            const obj = {};
            headers.forEach((h, i) => obj[h] = (r[i] || "").trim());
            return obj;
        });
}

// ================= FOOTER YEAR =================
document.querySelectorAll('#year').forEach(el => {
    el.textContent = new Date().getFullYear();
});

// ================= TICKER =================
async function loadTicker() {
    const track = document.querySelector('.ticker-track');
    if (!track) return;

    try {
        const rows = await fetchCsv('Ticker');
        const items = rowsToObjects(rows).map(r => r.Message).filter(Boolean);
        if (items.length === 0) return;

        // Duplicate for seamless loop
        const doubled = items.concat(items);
        track.innerHTML = doubled.map(m => `<span>${escapeHtml(m)}</span>`).join('');
    } catch (err) {
        console.warn('Ticker load failed:', err);
    }
}

// ================= EVENTS =================
async function loadEvents() {
    const list = document.querySelector('.event-list');
    if (!list) return;

    try {
        const rows = await fetchCsv('Events');
        const events = rowsToObjects(rows);

        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const todayEvents = events.filter(e => {
            const d = (e.Date || '').toLowerCase();
            return d === '' || d === 'daily' || d === today;
        });

        if (todayEvents.length === 0) {
            list.innerHTML = '<li class="empty">No events scheduled today.</li>';
            return;
        }

        todayEvents.sort((a, b) => (a.Time || '').localeCompare(b.Time || ''));

list.innerHTML = todayEvents.map(e => {
    const live = (e.Note || '').toLowerCase().indexOf('live') !== -1;
    const liveTag = live
    ? ` <a class="live-tag" href="${LIVE_URL}" target="_blank" rel="noopener noreferrer">● LIVE</a>`
    : '';
    return `
        <li>
            <div class="event-time">${escapeHtml(e.Time || '')}</div>
            <div class="event-info">
                <strong>${escapeHtml(e.Title || '')}${liveTag}</strong>
            </div>
        </li>`;
}).join('');
    } catch (err) {
        console.warn('Events load failed:', err);
        list.innerHTML = '<li class="empty">Events unavailable.</li>';
    }
}

// ================= HERO SLIDER =================
async function loadHeroImages() {
    try {
        const rows = await fetchCsv('Heroes');
        const images = rowsToObjects(rows).map(r => r["Image URL"]).filter(Boolean);
        return images.length > 0 ? images : null;
    } catch (err) {
        console.warn('Heroes load failed:', err);
        return null;
    }
}

function initHeroSlider(images) {
    const slider     = document.getElementById('heroSlider');
    const slidesWrap = document.getElementById('heroSlides');
    const dotsWrap   = document.getElementById('heroDots');
    const prevBtn    = document.getElementById('heroPrev');
    const nextBtn    = document.getElementById('heroNext');

    if (!slider || !slidesWrap || !dotsWrap || !images || images.length === 0) return;

    // Build slides
    images.forEach((src, i) => {
        const img = document.createElement('img');
        img.src = src;
        img.alt = `Slide ${i + 1}`;
        img.className = 'hero-slide' + (i === 0 ? ' active' : '');
        slidesWrap.appendChild(img);
    });

    // Build dots
    images.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'hero-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', `Slide ${i + 1}`);
        dot.dataset.index = i;
        dotsWrap.appendChild(dot);
    });

    const slides = slidesWrap.querySelectorAll('.hero-slide');
    const dots   = dotsWrap.querySelectorAll('.hero-dot');
    const total  = slides.length;
    let current  = 0;
    let timer    = null;

    function show(index) {
        index = (index + total) % total;
        current = index;
        slides.forEach((s, i) => s.classList.toggle('active', i === current));
        dots.forEach((d, i) => d.classList.toggle('active', i === current));
    }

    function next() { show(current + 1); }
    function prev() { show(current - 1); }

    function startAuto() {
        stopAuto();
        timer = setInterval(next, AUTO_MS);
    }
    function stopAuto() {
        if (timer) { clearInterval(timer); timer = null; }
    }

    nextBtn.addEventListener('click', () => { next(); startAuto(); });
    prevBtn.addEventListener('click', () => { prev(); startAuto(); });

    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            show(parseInt(dot.dataset.index, 10));
            startAuto();
        });
    });

    slider.addEventListener('mouseenter', stopAuto);
    slider.addEventListener('mouseleave', startAuto);

    let startX = 0;
    slider.addEventListener('touchstart', e => {
        startX = e.changedTouches[0].screenX;
        stopAuto();
    }, { passive: true });
    slider.addEventListener('touchend', e => {
        const delta = e.changedTouches[0].screenX - startX;
        if (Math.abs(delta) > 40) delta < 0 ? next() : prev();
        startAuto();
    }, { passive: true });

    startAuto();
}

// ================= HTML ESCAPE =================
function escapeHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ================= BOOT =================
(async function boot() {
    await Promise.all([
        loadTicker(),
        loadEvents(),
        loadHeroImages().then(initHeroSlider)
    ]);
})();