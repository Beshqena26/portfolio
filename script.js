// Scroll animations
var obs = new IntersectionObserver(function(entries) {
  entries.forEach(function(e) {
    if (e.isIntersecting) { e.target.classList.add('show'); obs.unobserve(e.target); }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.anim').forEach(function(el) { obs.observe(el); });

// Nav scroll
window.addEventListener('scroll', function() {
  document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 50);
});

// Custom cursor (desktop only)
var glow = document.getElementById('cursorGlow');
var dot = document.getElementById('cursorDot');
var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (glow && dot && window.innerWidth > 1024 && !reduceMotion) {
  document.body.classList.add('has-cursor');
  var mx = 0, my = 0, gx = 0, gy = 0;

  document.addEventListener('mousemove', function(e) {
    mx = e.clientX;
    my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top = my + 'px';
  });

  // Smooth follow for outer ring
  function followCursor() {
    gx += (mx - gx) * 0.15;
    gy += (my - gy) * 0.15;
    glow.style.left = gx + 'px';
    glow.style.top = gy + 'px';
    requestAnimationFrame(followCursor);
  }
  followCursor();

  // Hover effect on interactive elements
  document.querySelectorAll('a, button, .work-row, .srv-card, .test-card, .tl-card').forEach(function(el) {
    el.addEventListener('mouseenter', function() {
      glow.classList.add('hovering');
      dot.classList.add('hovering');
    });
    el.addEventListener('mouseleave', function() {
      glow.classList.remove('hovering');
      dot.classList.remove('hovering');
    });
  });
} else {
  // Hide custom cursor on mobile
  if (glow) glow.style.display = 'none';
  if (dot) dot.style.display = 'none';
}

// Particles
var particlesEl = document.getElementById('particles');
if (particlesEl && window.innerWidth > 768 && !reduceMotion) {
  for (var i = 0; i < 40; i++) {
    var p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.top = Math.random() * 100 + '%';
    p.style.width = (Math.random() * 2 + 1) + 'px';
    p.style.height = p.style.width;
    p.style.opacity = (Math.random() * 0.15 + 0.05).toFixed(2);
    p.style.animationDuration = (Math.random() * 15 + 10) + 's';
    p.style.animationDelay = (Math.random() * 10) + 's';
    particlesEl.appendChild(p);
  }
} else if (particlesEl) {
  particlesEl.style.display = 'none';
}

// Mobile drawer menu
var burger = document.getElementById('burger');
var overlay = document.getElementById('mobileMenu');
var backdrop = document.getElementById('menuBackdrop');
var closeBtn = document.getElementById('menuClose');

if (burger && overlay && backdrop && closeBtn) {
  var openMenu = function() {
    overlay.classList.add('open');
    backdrop.classList.add('open');
    burger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };
  var closeMenu = function() {
    overlay.classList.remove('open');
    backdrop.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  burger.addEventListener('click', openMenu);
  closeBtn.addEventListener('click', closeMenu);
  backdrop.addEventListener('click', closeMenu);

  overlay.querySelectorAll('a').forEach(function(a) {
    a.addEventListener('click', function(e) {
      closeMenu();
      var hash = this.getAttribute('href');
      var target = document.querySelector(hash);
      if (target) {
        e.preventDefault();
        setTimeout(function() { target.scrollIntoView({ behavior: 'smooth' }); }, 150);
      }
    });
  });
}

// Review form (star rating + submit to email)
(function () {
  var form = document.getElementById('reviewForm');
  if (!form) return;
  var stars = document.querySelectorAll('#reviewStars button');
  var label = document.getElementById('rateLabel');
  var note = document.getElementById('reviewNote');
  var rating = 0;
  var words = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];
  function paint(n) { stars.forEach(function (s, i) { s.classList.toggle('on', i < n); }); }
  stars.forEach(function (s) {
    s.addEventListener('mouseenter', function () { paint(+s.dataset.v); });
    s.addEventListener('mouseleave', function () { paint(rating); });
    s.addEventListener('click', function () { rating = +s.dataset.v; paint(rating); label.textContent = words[rating] + ' — ' + rating + '/5'; });
  });
  var grid = document.getElementById('testGrid');
  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
  function starHtml(n) { var o = ''; for (var i = 0; i < 5; i++) o += (i < n ? '★' : '☆'); return o; }
  function card(r) {
    var el = document.createElement('div');
    el.className = 'test-card anim show';
    var avatar = r.img
      ? '<img src="' + esc(r.img) + '" alt="' + esc(r.name) + '">'
      : '<div class="test-avatar-init" style="background:linear-gradient(135deg,#ff6b35,#ffb088)">' + esc((r.name || '?').trim().charAt(0).toUpperCase()) + '</div>';
    el.innerHTML = '<div class="test-stars">' + starHtml(r.rating) + '</div>' +
      '<p>"' + esc(r.message) + '"</p>' +
      '<div class="test-author">' + avatar +
      '<div><strong>' + esc(r.name) + '</strong><span>' + esc(r.role || 'Client') + '</span></div></div>';
    return el;
  }
  // load all testimonials (cache-busted so approvals/edits show immediately)
  if (grid) {
    fetch('/api/reviews?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (d) {
      (d.reviews || []).forEach(function (r) { grid.appendChild(card(r)); });
    }).catch(function () {});
  }

  function emailFallback(name, role, msg) {
    var body = 'Rating: ' + rating + '/5\nName: ' + name + (role ? '\nRole: ' + role : '') + '\n\n' + msg + '\n\n— Sent from jikurishvili.com';
    window.location.href = 'mailto:jikurishvilib26@gmail.com?subject=' + encodeURIComponent('Testimonial (' + rating + '/5) from ' + name) + '&body=' + encodeURIComponent(body);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = document.getElementById('revName').value.trim();
    var role = document.getElementById('revRole').value.trim();
    var msg = document.getElementById('revMsg').value.trim();
    var hp = document.getElementById('revHp').value;
    if (!rating) { note.className = 'review-note err'; note.textContent = 'Please pick a star rating first.'; return; }
    if (!name || !msg) { note.className = 'review-note err'; note.textContent = 'Please add your name and a short message.'; return; }
    var btn = form.querySelector('.review-submit');
    btn.disabled = true; note.className = 'review-note'; note.textContent = 'Posting…';
    fetch('/api/reviews', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: rating, name: name, role: role, message: msg, hp: hp })
    }).then(function (r) { return r.status === 200 ? r.json() : Promise.reject(r.status); })
      .then(function () {
        note.className = 'review-note ok'; note.textContent = 'Thanks! Your review was sent — it’ll appear here once approved ❤';
        form.reset(); rating = 0; paint(0); label.textContent = 'Tap to rate';
      })
      .catch(function (code) {
        // store not connected (501) or error -> email fallback
        note.className = 'review-note ok'; note.textContent = 'Thanks! Opening your email to send it — just hit send.';
        emailFallback(name, role, msg);
      })
      .finally(function () { btn.disabled = false; });
  });
})();

// Theme toggle
var themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
  var saved = localStorage.getItem('theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);
  themeToggle.addEventListener('click', function() {
    var current = document.documentElement.getAttribute('data-theme');
    var next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });
}

// FAQ accordion
document.querySelectorAll('.faq-q').forEach(function(btn) {
  btn.setAttribute('aria-expanded', 'false');
  btn.addEventListener('click', function() {
    var item = this.parentElement;
    var wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(function(i) {
      i.classList.remove('open');
      i.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
      i.querySelector('.faq-a').style.maxHeight = '';
    });
    if (!wasOpen) {
      item.classList.add('open');
      this.setAttribute('aria-expanded', 'true');
      var answer = item.querySelector('.faq-a');
      answer.style.maxHeight = answer.scrollHeight + 'px';
    }
  });
});

// Smooth scroll for desktop nav
document.querySelectorAll('.nav-menu a[href^="#"]').forEach(function(a) {
  a.addEventListener('click', function(e) {
    e.preventDefault();
    var t = document.querySelector(this.getAttribute('href'));
    if (t) t.scrollIntoView({ behavior: 'smooth' });
  });
});

// ===== Cal.com booking popup =====
// Cal.com link (username page — shows all event types).

(function () {
  var CAL_LINK = "beka-jikurishvili-j9shuw";
  var books = document.querySelectorAll('[data-book]');
  if (!books.length) return;
  (function (C, A, L) {
    var p = function (a, ar) { a.q.push(ar); };
    var d = C.document;
    C.Cal = C.Cal || function () {
      var cal = C.Cal, ar = arguments;
      if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; }
      if (ar[0] === L) {
        var api = function () { p(api, arguments); };
        var namespace = ar[1];
        api.q = api.q || [];
        if (typeof namespace === "string") { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ["initNamespace", namespace]); }
        else p(cal, ar);
        return;
      }
      p(cal, ar);
    };
  })(window, "https://app.cal.com/embed/embed.js", "init");
  Cal("init", "book", { origin: "https://cal.com" });
  Cal.ns.book("ui", { theme: "dark", cssVarsPerTheme: { dark: { "cal-brand": "#ff6b35" } }, hideEventTypeDetails: false, layout: "month_view" });
  // Note pre-fill: tell Beka which page the booking came from
  var p = location.pathname, src = 'the portfolio homepage';
  if (/multipay/.test(p)) src = 'the Multipay case study';
  else if (/generato/.test(p)) src = 'the Generato case study';
  else if (/nemora/.test(p)) src = 'the Nemora case study';
  else if (/hvpn/.test(p)) src = 'the H-VPN case study';
  else if (/chkari/.test(p)) src = 'the Chkari case study';
  var note = 'Booked from ' + src + '.';
  books.forEach(function (b) {
    b.setAttribute('data-cal-link', CAL_LINK);
    b.setAttribute('data-cal-namespace', 'book');
    b.setAttribute('data-cal-config', JSON.stringify({ layout: 'month_view', notes: note }));
  });
})();

// ===== lightweight page-view tracking (once per session per page) =====
(function () {
  var p = location.pathname, page = 'home';
  if (/multipay/.test(p)) page = 'multipay';
  else if (/generato/.test(p)) page = 'generato';
  else if (/nemora/.test(p)) page = 'nemora';
  else if (/hvpn/.test(p)) page = 'hvpn';
  else if (/chkari/.test(p)) page = 'chkari';
  else if (/resume/.test(p)) page = 'resume';
  else if (p !== '/' && !/index/.test(p)) return; // skip admin etc.
  try {
    var k = 'tracked_' + page;
    if (sessionStorage.getItem(k)) return;
    sessionStorage.setItem(k, '1');
  } catch (e) {}
  fetch('/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true, body: JSON.stringify({ action: 'track', page: page }) }).catch(function () {});
})();
