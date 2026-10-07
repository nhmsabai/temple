// Auto-update footer year
document.querySelectorAll('#year').forEach(el => {
    el.textContent = new Date().getFullYear();
});

// ================= HERO SLIDER =================

// 👇 Just edit this list — add/remove filenames here and it all updates
const HERO_IMAGES = [
    "images/hero1.jpg",
    "images/hero2.jpg",
    "images/hero3.jpg",
];

const AUTO_MS = 5000;   // autoplay speed per slide (ms)

(function initHeroSlider() {
    const slider     = document.getElementById('heroSlider');
    const slidesWrap = document.getElementById('heroSlides');
    const dotsWrap   = document.getElementById('heroDots');
    const prevBtn    = document.getElementById('heroPrev');
    const nextBtn    = document.getElementById('heroNext');

    if (!slider || !slidesWrap || !dotsWrap) return;

    // Build slides
    HERO_IMAGES.forEach((src, i) => {
        const img = document.createElement('img');
        img.src = src;
        img.alt = `Slide ${i + 1}`;
        img.className = 'hero-slide' + (i === 0 ? ' active' : '');
        slidesWrap.appendChild(img);
    });

    // Build dots
    HERO_IMAGES.forEach((_, i) => {
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
})();