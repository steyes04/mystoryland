// ATC site interactions
document.addEventListener('DOMContentLoaded', function () {

  // ---- Header: swap to dark logo/text once scrolled past the hero ----
  var header = document.querySelector('.site-header');
  var heroEl = document.querySelector('.hero');
  if (header) {
    var toggleHeader = function () {
      var threshold = heroEl ? Math.max(heroEl.offsetHeight - 110, 60) : 80;
      if (window.scrollY > threshold) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    };
    toggleHeader();
    window.addEventListener('scroll', toggleHeader, { passive: true });
    window.addEventListener('resize', toggleHeader);
  }

  // ---- Mobile nav toggle ----
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      links.classList.toggle('open');
      var expanded = links.classList.contains('open');
      toggle.setAttribute('aria-expanded', expanded);
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { links.classList.remove('open'); });
    });
  }

  // ---- Footer year ----
  var yearEl = document.getElementById('year');
  if (yearEl) { yearEl.textContent = new Date().getFullYear(); }

  // ---- Project filter (projects.html) ----
  var filterBtns = document.querySelectorAll('.filter-btn');
  var cards = document.querySelectorAll('.project-card[data-category]');
  if (filterBtns.length && cards.length) {
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filterBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var cat = btn.getAttribute('data-filter');
        cards.forEach(function (card) {
          var match = (cat === 'all' || card.getAttribute('data-category') === cat);
          card.closest('.project-grid-item').style.display = match ? '' : 'none';
        });
      });
    });
  }

  // ---- Contact form (no backend wired yet — visual confirmation only) ----
  var form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      var original = btn.textContent;
      btn.textContent = 'Message Sent ✓';
      btn.disabled = true;
      form.reset();
      setTimeout(function () {
        btn.textContent = original;
        btn.disabled = false;
      }, 3200);
    });
  }
});
