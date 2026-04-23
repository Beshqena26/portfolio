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

// Cursor glow (desktop only)
var glow = document.getElementById('cursorGlow');
if (glow && window.innerWidth > 1024) {
  document.addEventListener('mousemove', function(e) {
    glow.style.left = e.clientX + 'px';
    glow.style.top = e.clientY + 'px';
  });
} else if (glow) {
  glow.style.display = 'none';
}

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

// Smooth scroll for desktop nav
document.querySelectorAll('.nav-menu a[href^="#"]').forEach(function(a) {
  a.addEventListener('click', function(e) {
    e.preventDefault();
    var t = document.querySelector(this.getAttribute('href'));
    if (t) t.scrollIntoView({ behavior: 'smooth' });
  });
});
