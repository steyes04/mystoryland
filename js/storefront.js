/* ── MyStoryLand · Storefront JS ─────────────────────────────────── */

/* ── Supabase config ─── */
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_KEY = 'YOUR_ANON_KEY';

async function sbFetch(path, opts = {}) {
  const res = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...opts.headers
    },
    ...opts
  });
  return res.json();
}

/* ── State ─── */
let state = {
  selectedBook: null,
  step: 1,
  childName: '',
  childAge: '',
  childGender: 'girl',
  previewPage: 0
};

const stories = [
  { art: '👑', text: 'Once upon a time, in a kingdom where the stars danced at sunrise, a brave little princess named {name} woke to find a magical golden crown at the foot of her bed...' },
  { art: '🌅', text: '{name} stepped outside and gasped — the whole village was sparkling with light, and a tiny fox sat waiting with a rolled-up scroll tied with ribbon.' },
  { art: '🗝️', text: 'The scroll read: "Only the child with the kindest heart can unlock the Crystal Tower." {name} held the ancient key tightly and whispered, "I can do this."' },
  { art: '🐉', text: 'At the mountain\'s edge stood a dragon — but it wasn\'t scary at all. It bowed its great head and said, "I\'ve been waiting for you, {name}."' },
  { art: '🌟', text: 'Together they soared above the clouds. {name} laughed as the stars reached out to give her a high five, one by one.' },
  { art: '🏰', text: 'Back home, the whole kingdom cheered. And that night as {name} fell asleep, she knew — every great adventure starts with believing in yourself. The End.' }
];

/* ── Book catalog (loaded from localStorage/admin edits) ─── */
function getBooks() {
  const stored = localStorage.getItem('msl_books');
  if (stored) return JSON.parse(stored);
  return [
    { id: 1, title: 'Princess Dawn',  emoji: '👑', color: '#FFE8F5', age: '3–7',  price: 179, badge: 'Best seller', active: true },
    { id: 2, title: 'Space Hero',     emoji: '🚀', color: '#E6F1FB', age: '4–9',  price: 149, badge: '',            active: true },
    { id: 3, title: 'Dragon Quest',   emoji: '🐉', color: '#FEF3DC', age: '5–10', price: 149, badge: '',            active: true },
    { id: 4, title: 'Mermaid Tale',   emoji: '🧜', color: '#DFF7F4', age: '3–7',  price: 149, badge: '',            active: true },
    { id: 5, title: 'Desert Prince',  emoji: '🌙', color: '#EDE7F8', age: '4–9',  price: 179, badge: 'UAE exclusive', active: true },
  ];
}

/* ── Render books grid ─── */
function renderBooks() {
  const books = getBooks().filter(b => b.active);
  const grid = document.getElementById('books-grid');
  if (!grid) return;
  grid.innerHTML = books.map(b => `
    <a class="book-card" onclick="openOrder(${b.id}); return false;" href="#">
      <div class="book-cover" style="background:${b.color}">
        <span style="font-size:64px">${b.emoji}</span>
        ${b.badge ? `<span class="book-badge">${b.badge}</span>` : ''}
      </div>
      <div class="book-info">
        <div class="book-title">${b.title}</div>
        <div class="book-age">Ages ${b.age}</div>
        <div class="book-price">AED ${b.price}</div>
      </div>
      <span class="book-cta">Create this book →</span>
    </a>
  `).join('');
}

/* ── Modal helpers ─── */
function openOrder(bookId) {
  const book = getBooks().find(b => b.id === bookId);
  state.selectedBook = book;
  state.step = 1;
  updateModalSummary();
  goToStep(1);
  document.getElementById('order-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('order-modal').classList.remove('open');
  document.body.style.overflow = '';
}

function goToStep(n) {
  state.step = n;
  document.querySelectorAll('.step-page').forEach(p => p.classList.remove('active'));
  document.getElementById('step-' + n).classList.add('active');
  // Update step bar
  [1,2,3,4].forEach(i => {
    const el = document.getElementById('ms-' + i);
    el.classList.remove('active','done');
    if (i < n) el.classList.add('done');
    else if (i === n) el.classList.add('active');
  });
  [1,2,3].forEach(i => {
    const line = document.getElementById('msl-' + i);
    line.classList.toggle('done', i < n);
  });
}

function updateModalSummary() {
  const b = state.selectedBook;
  if (!b) return;
  const shipping = 25;
  document.getElementById('sum-book').textContent = b.title;
  document.getElementById('sum-price').textContent = 'AED ' + b.price;
  document.getElementById('sum-shipping').textContent = 'AED ' + shipping;
  document.getElementById('sum-total').textContent = 'AED ' + (b.price + shipping);
}

/* ── Step 1 → 2: Validate personalize form ─── */
function nextToPreview() {
  const name = document.getElementById('child-name').value.trim();
  const age  = document.getElementById('child-age').value.trim();
  if (!name) { alert('Please enter your child\'s name.'); return; }
  if (!age)  { alert('Please enter your child\'s age.'); return; }
  state.childName   = name;
  state.childAge    = age;
  state.childGender = document.getElementById('child-gender').value;
  renderPreview(0);
  goToStep(2);
}

/* ── Step 2: Preview ─── */
function renderPreview(pageIdx) {
  state.previewPage = pageIdx;
  const s = stories[pageIdx];
  const name = state.childName || 'your child';
  document.getElementById('prev-art').textContent = s.art;
  document.getElementById('prev-story').innerHTML = s.text.replace(/{name}/g, `<span class="pg-hero-name">${name}</span>`);
  document.querySelectorAll('.pg-thumb').forEach((t, i) => t.classList.toggle('sel', i === pageIdx));
}

/* ── Step 2 → 3: Checkout ─── */
function nextToCheckout() {
  const b = state.selectedBook;
  document.getElementById('co-book').textContent = b.title;
  document.getElementById('co-child').textContent = state.childName + ', age ' + state.childAge;
  document.getElementById('co-book-price').textContent = 'AED ' + b.price;
  document.getElementById('co-total').textContent = 'AED ' + (b.price + 25);
  goToStep(3);
}

/* ── Step 3 → Place order ─── */
async function placeOrder() {
  const name  = document.getElementById('buyer-name').value.trim();
  const phone = document.getElementById('buyer-phone').value.trim();
  const addr  = document.getElementById('buyer-addr').value.trim();
  const city  = document.getElementById('buyer-city').value;
  if (!name || !phone || !addr) { alert('Please fill in all delivery details.'); return; }

  const ref = 'MSL-' + Math.floor(100000 + Math.random() * 900000);
  const b = state.selectedBook;

  const order = {
    ref, customer_name: name, phone, address: addr, emirate: city,
    child_name: state.childName, child_age: parseInt(state.childAge),
    child_gender: state.childGender, book_theme: b.title,
    amount: b.price + 25, status: 'pending',
    created_at: new Date().toISOString()
  };

  // Save to localStorage as fallback + Supabase
  const local = JSON.parse(localStorage.getItem('msl_orders') || '[]');
  local.unshift(order);
  localStorage.setItem('msl_orders', JSON.stringify(local));

  try {
    await sbFetch('orders', { method: 'POST', body: JSON.stringify(order) });
  } catch (e) { /* Supabase not yet configured — localStorage used */ }

  // Show success
  document.getElementById('success-ref').textContent = ref;
  document.getElementById('success-book').textContent = b.title;
  document.getElementById('success-child').textContent = state.childName + ', age ' + state.childAge;
  document.getElementById('success-total').textContent = 'AED ' + (b.price + 25);
  goToStep(4);
}

/* ── Photo upload fake ─── */
function fakeUpload(zone) {
  zone.innerHTML = `<div class="icon">✅</div><p>Photo uploaded!</p><small>Tap to change</small>`;
  zone.style.background = 'var(--teal-l)';
  zone.style.borderColor = 'var(--teal)';
}

/* ── Init ─── */
document.addEventListener('DOMContentLoaded', () => {
  renderBooks();

  // Close modal on overlay click
  document.getElementById('order-modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });

  // Smooth scroll for nav links
  document.querySelectorAll('[data-scroll]').forEach(link => {
    link.addEventListener('click', () => {
      const target = document.getElementById(link.dataset.scroll);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });
});
