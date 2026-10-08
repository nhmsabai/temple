// ================= EVENTS PAGE =================
// Reuses CSV_URLS, fetchCsv, rowsToObjects, escapeHtml, LIVE_URL from site.js

(function initEventsPage() {
    const listEl      = document.getElementById('eventsList');
    const dateInput   = document.getElementById('dateFilter');
    const btnToday    = document.getElementById('btnToday');
    const btnUpcoming = document.getElementById('btnUpcoming');
    const btnAll      = document.getElementById('btnAll');
    const statusEl    = document.getElementById('filterStatus');

    if (!listEl) return;

    let allEvents = [];

    // ---------- Load events ----------
    async function load() {
        try {
            const rows = await fetchCsv('Events');
            allEvents = rowsToObjects(rows);
            applyFilter('all');
        } catch (err) {
            console.error(err);
            listEl.innerHTML = '<p class="events-empty">Could not load events. Please try again later.</p>';
        }
    }

    // ---------- Helpers ----------
    function isDaily(e) {
        const d = (e.Date || '').toLowerCase().trim();
        return d === '' || d === 'daily';
    }

    function eventDate(e) {
        return (e.Date || '').trim();
    }

    function todayStr() {
        return new Date().toISOString().slice(0, 10);
    }

    function formatDate(iso) {
        // "2026-10-15" -> "Wednesday, 15 October 2026"
        const d = new Date(iso + 'T00:00:00');
        if (isNaN(d)) return iso;
        return d.toLocaleDateString('en-GB', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
    }

    // ---------- Rendering ----------
    function renderGrouped(events, statusLabel) {
        statusEl.innerHTML = `Showing: <strong>${statusLabel}</strong>`;

        if (events.length === 0) {
            listEl.innerHTML = '<p class="events-empty">No events found for this filter.</p>';
            return;
        }

        // Group by date
        const groups = {};
        events.forEach(e => {
            const key = isDaily(e) ? 'daily' : eventDate(e);
            (groups[key] = groups[key] || []).push(e);
        });

        // Sort keys: daily first, then dated keys ascending
        const keys = Object.keys(groups).sort((a, b) => {
            if (a === 'daily') return -1;
            if (b === 'daily') return 1;
            return a.localeCompare(b);
        });

        let html = '';
        keys.forEach(key => {
            const heading = key === 'daily' ? 'Daily / Recurring' : formatDate(key);
            const items = groups[key].sort((a, b) =>
                (a.Time || '').localeCompare(b.Time || '')
            );

            html += `
                <div class="events-group">
                    <h2 class="events-group-title">${escapeHtml(heading)}</h2>
                    <ul class="events-items">
                        ${items.map(renderItem).join('')}
                    </ul>
                </div>
            `;
        });

        listEl.innerHTML = html;
    }

    function renderItem(e) {
        const live = (e.Note || '').toLowerCase().indexOf('live') !== -1;
        const liveTag = live
            ? ` <a class="live-tag" href="${LIVE_URL}" target="_blank" rel="noopener noreferrer">● LIVE</a>`
            : '';
        const note = e.Note && !live
            ? `<span class="event-note">${escapeHtml(e.Note)}</span>`
            : '';
        return `
            <li>
                <div class="event-time">${escapeHtml(e.Time || '')}</div>
                <div class="event-info">
                    <strong>${escapeHtml(e.Title || '')}${liveTag}</strong>
                    ${note}
                </div>
            </li>
        `;
    }

    // ---------- Filtering ----------
    function applyFilter(mode, dateValue) {
        const today = todayStr();

        if (mode === 'today') {
            const filtered = allEvents.filter(e => isDaily(e) || eventDate(e) === today);
            renderGrouped(filtered, "Today's events");
            return;
        }

        if (mode === 'upcoming') {
            const filtered = allEvents.filter(e => {
                if (isDaily(e)) return true;
                return eventDate(e) >= today;
            });
            renderGrouped(filtered, 'Upcoming events');
            return;
        }

        if (mode === 'date' && dateValue) {
            const filtered = allEvents.filter(e => isDaily(e) || eventDate(e) === dateValue);
            renderGrouped(filtered, formatDate(dateValue));
            return;
        }

        // default: all
        renderGrouped(allEvents, 'All events');
    }

    // ---------- Wire up controls ----------
    btnToday.addEventListener('click', () => {
        dateInput.value = '';
        applyFilter('today');
    });

    btnUpcoming.addEventListener('click', () => {
        dateInput.value = '';
        applyFilter('upcoming');
    });

    btnAll.addEventListener('click', () => {
        dateInput.value = '';
        applyFilter('all');
    });

    dateInput.addEventListener('change', () => {
        const val = dateInput.value;
        if (val) applyFilter('date', val);
    });

    // ---------- Go ----------
    load();
})();