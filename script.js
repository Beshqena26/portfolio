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
if (glow && dot && window.innerWidth > 1024) {
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
  document.body.style.cursor = 'auto';
}

// Particles
var particlesEl = document.getElementById('particles');
if (particlesEl && window.innerWidth > 768) {
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

function openMenu() {
  overlay.classList.add('open');
  backdrop.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeMenu() {
  overlay.classList.remove('open');
  backdrop.classList.remove('open');
  document.body.style.overflow = '';
}

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

// Testimonials show more
var testBtn = document.getElementById('testMoreBtn');
var testGrid = document.getElementById('testGrid');
if (testBtn && testGrid) {
  testBtn.addEventListener('click', function() {
    testGrid.classList.toggle('expanded');
    testBtn.textContent = testGrid.classList.contains('expanded') ? 'Show Less' : 'Show More';
  });
}

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
  btn.addEventListener('click', function() {
    var item = this.parentElement;
    var wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(function(i) { i.classList.remove('open'); });
    if (!wasOpen) item.classList.add('open');
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
