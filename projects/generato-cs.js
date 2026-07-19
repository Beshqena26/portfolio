// =============================================================
// CASE STUDY JS — Enhanced with richer interactions
// =============================================================

// =============================================================
// CURSOR
// =============================================================
const cursorEl = document.getElementById('cursor');
const cursorText = document.getElementById('cursor-text');
let cx = 0, cy = 0, tx = 0, ty = 0;

if (window.matchMedia('(pointer:fine)').matches) {
    document.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });

    document.querySelectorAll('a, button, [data-cursor]').forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursorEl.classList.add('hovering');
            const label = el.getAttribute('data-cursor');
            if (label) cursorText.textContent = label;
        });
        el.addEventListener('mouseleave', () => {
            cursorEl.classList.remove('hovering');
            cursorText.textContent = '';
        });
    });
}

// =============================================================
// NAVIGATION — Enhanced with scroll progress & hide on scroll
// =============================================================
const nav = document.getElementById('nav');
const burger = document.getElementById('nav-burger');
const drawer = document.getElementById('drawer');

let lastScrollY = 0;
let navHidden = false;

window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    nav.classList.toggle('scrolled', scrollY > 60);

    // Hide/show nav on scroll direction
    if (scrollY > 300) {
        if (scrollY > lastScrollY + 5 && !navHidden) {
            nav.style.transform = 'translateY(-100%)';
            navHidden = true;
        } else if (scrollY < lastScrollY - 5 && navHidden) {
            nav.style.transform = 'translateY(0)';
            navHidden = false;
        }
    } else {
        nav.style.transform = 'translateY(0)';
        navHidden = false;
    }
    lastScrollY = scrollY;
}, { passive: true });

nav.style.transition = 'background .4s, backdrop-filter .4s, border-color .4s, transform .35s cubic-bezier(.16,1,.3,1)';

burger.addEventListener('click', () => {
    burger.classList.toggle('active');
    drawer.classList.toggle('open');
    document.body.style.overflow = drawer.classList.contains('open') ? 'hidden' : '';
});

document.querySelectorAll('.drawer-link').forEach(link => {
    link.addEventListener('click', () => {
        burger.classList.remove('active');
        drawer.classList.remove('open');
        document.body.style.overflow = '';
    });
});

// =============================================================
// ANIMATION LOOP (cursor)
// =============================================================
(function csAnimLoop() {
    cx += (tx - cx) * 0.15;
    cy += (ty - cy) * 0.15;
    cursorEl.style.transform = `translate3d(${cx}px,${cy}px,0)`;
    requestAnimationFrame(csAnimLoop);
})();

// =============================================================
// SCROLL REVEAL — Enhanced with section visibility
// =============================================================
const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal-el').forEach(el => revealObserver.observe(el));

// Section-level reveals
const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            sectionObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.05, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('.cs-section').forEach(s => sectionObserver.observe(s));

// Stagger list items, questions, and result cards
const staggerObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            staggerObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.2 });

document.querySelectorAll('.cs-list, .cs-questions, .cs-results').forEach(el => staggerObserver.observe(el));

// =============================================================
// SPLIT TEXT REVEAL
// =============================================================
const splitTexts = document.querySelectorAll('.split-text');
splitTexts.forEach(el => {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                el.classList.add('in-view');
                observer.unobserve(el);
            }
        });
    }, { threshold: 0.2 });
    observer.observe(el);
});

// =============================================================
// MAGNETIC BUTTONS
// =============================================================
(function initMagneticButtons() {
    if (!window.matchMedia('(pointer:fine)').matches) return;

    document.querySelectorAll('.btn-primary, .btn-ghost, .nav-cta, .soc-btn').forEach(btn => {
        btn.addEventListener('mousemove', e => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
            btn.style.transition = 'transform .4s cubic-bezier(.16,1,.3,1)';
            setTimeout(() => { btn.style.transition = ''; }, 400);
        });
    });
})();

// =============================================================
// HEADING PARALLAX — Enhanced with subtle rotation
// =============================================================
(function initHeadingParallax() {
    if (!window.matchMedia('(pointer:fine)').matches) return;
    const headings = document.querySelectorAll('.cs-heading-lg, .cs-heading-xl, .cs-title');
    if (!headings.length) return;

    let hpTicking = false;
    window.addEventListener('scroll', () => {
        if (!hpTicking) {
            hpTicking = true;
            requestAnimationFrame(() => {
                const wh = window.innerHeight;
                headings.forEach(h => {
                    const rect = h.getBoundingClientRect();
                    if (rect.top < wh && rect.bottom > 0) {
                        const progress = (wh - rect.top) / (wh + rect.height);
                        const y = (progress - 0.5) * -15;
                        const rotate = (progress - 0.5) * -0.3;
                        h.style.transform = `translateY(${y}px) rotate(${rotate}deg)`;
                    }
                });
                hpTicking = false;
            });
        }
    }, { passive: true });
})();

// =============================================================
// RESULT CARD COUNTER ANIMATION — Enhanced with easing
// =============================================================
(function initResultCounters() {
    const cards = document.querySelectorAll('.cs-result-val, .cs-outcome-val');
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const text = el.textContent.trim();
                const isPercent = text.includes('%');
                const isPlus = text.includes('+');
                const isMinus = text.includes('-');
                const isX = text.includes('x');

                let prefix = '';
                let suffix = '';
                if (isPlus) prefix = '+';
                if (isMinus) prefix = '-';
                if (isPercent) suffix = '%';
                if (isX) suffix = 'x';

                const numStr = text.replace(/[^0-9.]/g, '');
                const target = parseFloat(numStr);
                if (isNaN(target)) return;

                const isDecimal = numStr.includes('.');
                const duration = 1200;
                const startTime = performance.now();

                function easeOutExpo(t) {
                    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
                }

                function animate(now) {
                    const elapsed = now - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    const current = easeOutExpo(progress) * target;
                    el.textContent = prefix + (isDecimal ? current.toFixed(1) : Math.floor(current)) + suffix;

                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    } else {
                        el.textContent = prefix + (isDecimal ? target.toFixed(1) : target) + suffix;
                        const stat = el.closest('.cs-outcome-stat');
                        if (stat) stat.classList.add('counted');
                    }
                }
                requestAnimationFrame(animate);
                observer.unobserve(el);
            }
        });
    }, { threshold: 0.5 });

    cards.forEach(c => observer.observe(c));
})();

// =============================================================
// PROGRESS BAR — reading progress with glow
// =============================================================
(function initReadingProgress() {
    const bar = document.createElement('div');
    bar.className = 'cs-progress';
    bar.style.cssText = `
        position:fixed; top:0; left:0; height:2px; z-index:10001;
        background:linear-gradient(90deg, var(--accent), var(--accent-2));
        width:0; transition:width .15s;
        box-shadow:0 0 12px rgba(200,255,0,.4);
    `;
    document.body.appendChild(bar);

    let progTicking = false;
    window.addEventListener('scroll', () => {
        if (!progTicking) {
            progTicking = true;
            requestAnimationFrame(() => {
                const docHeight = document.documentElement.scrollHeight - window.innerHeight;
                const progress = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
                bar.style.width = progress + '%';
                progTicking = false;
            });
        }
    }, { passive: true });
})();

// =============================================================
// SCROLL-TO-TOP FAB
// =============================================================
(function initScrollTopFab() {
    const fab = document.createElement('button');
    fab.className = 'scroll-top-fab';
    fab.setAttribute('aria-label', 'Scroll to top');
    fab.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>';
    document.body.appendChild(fab);

    fab.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('scroll', () => {
        fab.classList.toggle('visible', window.scrollY > 600);
    }, { passive: true });
})();

// =============================================================
// HOVER GLOW — Glass elements
// =============================================================
(function initHoverGlow() {
    if (!window.matchMedia('(pointer:fine)').matches) return;

    document.querySelectorAll('.hover-glow').forEach(el => {
        el.addEventListener('mousemove', e => {
            const rect = el.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width * 100);
            const y = ((e.clientY - rect.top) / rect.height * 100);
            el.style.setProperty('--mouse-x', x + '%');
            el.style.setProperty('--mouse-y', y + '%');
        });
    });
})();

// =============================================================
// PARALLAX ON SPLIT VISUALS
// =============================================================
(function initVisualParallax() {
    if (!window.matchMedia('(pointer:fine)').matches) return;

    const visuals = document.querySelectorAll('.cs-split-visual, .cs-hero-mockup');
    let vpTicking = false;

    window.addEventListener('scroll', () => {
        if (!vpTicking) {
            vpTicking = true;
            requestAnimationFrame(() => {
                const wh = window.innerHeight;
                visuals.forEach(v => {
                    const rect = v.getBoundingClientRect();
                    if (rect.top < wh && rect.bottom > 0) {
                        const progress = (wh - rect.top) / (wh + rect.height);
                        const y = (progress - 0.5) * -12;
                        v.style.transform = `translateY(${y}px)`;
                    }
                });
                vpTicking = false;
            });
        }
    }, { passive: true });
})();
