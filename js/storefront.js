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

/* ── Gemini (Nano Banana) config ───────────────────────────────────
   FREE TIER — for mockups/testing only. Daily quota is limited and
   fluctuates (Google has cut it from ~100/day to as low as ~20/day).
   Get a free key at https://aistudio.google.com/apikey (no card needed).
   ⚠️ Before going live with real customers, move this call to a backend
   /serverless function so the key isn't exposed in client-side JS.
─────────────────────────────────────────────────────────────────── */
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY'; // ← paste your free AI Studio key here
const GEMINI_MODEL = 'gemini-2.5-flash-image'; // free-tier "Nano Banana" model
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Sends the child's photo + a scene description to Gemini and returns
 * a base64 data URL of the generated illustration, or null on failure.
 */
async function generateIllustration(photoDataUrl, sceneDescription) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
    console.warn('Gemini API key not set — using placeholder art instead.');
    return { error: 'API key not set' };
  }

  // Strip the data URL prefix to get raw base64 + mime type
  const match = photoDataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) return { error: 'Invalid photo format' };
  const [, mimeType, base64Data] = match;

  const prompt = `Transform this child's photo into a soft, dreamy children's storybook watercolor illustration. ` +
    `Keep the child's facial features, hairstyle, and likeness clearly recognizable. ` +
    `Style: gentle watercolor textures, pastel magical colors, whimsical sparkles, soft glowing background. ` +
    `Scene: ${sceneDescription}. ` +
    `Full body or 3/4 view, picture-book illustration quality, warm and joyful mood.`;

  try {
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: base64Data } }
          ]
        }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE']
        }
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('Gemini API error:', res.status, err);
      return { error: err?.error?.message || `HTTP ${res.status}` };
    }

    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find(p => p.inlineData || p.inline_data);
    const inline = imagePart?.inlineData || imagePart?.inline_data;
    if (!inline) {
      console.error('Gemini returned no image part. Full response:', data);
      return { error: 'No image returned (model may have refused or only returned text)' };
    }

    return { url: `data:${inline.mimeType || inline.mime_type};base64,${inline.data}` };
  } catch (e) {
    console.error('Gemini request failed:', e);
    return { error: e.message || 'Network/CORS error' };
  }
}

/* ── State ─── */
let state = {
  selectedBook: null,
  step: 1,
  childName: '',
  childAge: '',
  childGender: 'girl',
  previewPage: 0,
  photoDataUrl: null,
  generatedPages: {} // cache: pageIdx -> generated image data URL
};

const stories = [
  { art: '👑', scene: 'sitting on a cloud at sunrise with a golden crown floating beside them, magical sparkles all around', text: 'Once upon a time, in a kingdom where the stars danced at sunrise, a brave little hero named {name} woke to find a magical golden crown at the foot of their bed...' },
  { art: '🌅', scene: 'standing in a sparkling village at dawn, looking at a tiny fox holding a rolled-up scroll', text: '{name} stepped outside and gasped — the whole village was sparkling with light, and a tiny fox sat waiting with a rolled-up scroll tied with ribbon.' },
  { art: '🗝️', scene: 'holding a glowing ancient key in front of a crystal tower, determined and brave expression', text: 'The scroll read: "Only the child with the kindest heart can unlock the Crystal Tower." {name} held the ancient key tightly and whispered, "I can do this."' },
  { art: '🐉', scene: 'standing beside a friendly, colorful dragon at the edge of a mountain, both smiling', text: 'At the mountain\'s edge stood a dragon — but it wasn\'t scary at all. It bowed its great head and said, "I\'ve been waiting for you, {name}."' },
  { art: '🌟', scene: 'soaring through clouds and stars on the dragon\'s back, laughing joyfully, stars twinkling around', text: 'Together they soared above the clouds. {name} laughed as the stars reached out to give them a high five, one by one.' },
  { art: '🏰', scene: 'standing proudly in front of a cheering kingdom and castle at golden sunset, arms raised in triumph', text: 'Back home, the whole kingdom cheered. And that night as {name} fell asleep, they knew — every great adventure starts with believing in yourself. The End.' }
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
  // Reset photo
  state.photoDataUrl = null;
  const drop = document.getElementById('photo-drop');
  if (drop) {
    drop.innerHTML = `<div class="icon">📷</div><p>Tap to upload a clear face photo</p><small>JPG or PNG · max 10MB</small>`;
    drop.style.background = '';
    drop.style.borderColor = '';
    drop.style.borderStyle = '';
  }
  const input = document.getElementById('photo-file-input');
  if (input) input.value = '';
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
  state.generatedPages = {}; // reset cache for a fresh personalization
  goToStep(2);
  renderPreview(0);
}

/* ── Step 2: Preview (with real AI illustration generation) ─── */
async function renderPreview(pageIdx, thumbEl) {
  state.previewPage = pageIdx;
  const s = stories[pageIdx];
  const name = state.childName || 'your child';

  // Update story text + selected thumbnail immediately
  document.getElementById('prev-story').innerHTML = s.text.replace(/{name}/g, `<span class="pg-hero-name">${name}</span>`);
  document.querySelectorAll('.pg-thumb').forEach((t, i) => t.classList.toggle('sel', i === pageIdx));

  const artEl = document.getElementById('prev-art');
  const mainEl = document.getElementById('preview-main') || artEl.closest('.pg-main');

  // Already generated this page? Show cached image instantly.
  if (state.generatedPages[pageIdx]) {
    showGeneratedImage(state.generatedPages[pageIdx]);
    return;
  }

  // No photo uploaded — fall back to emoji placeholder, no API call needed.
  if (!state.photoDataUrl) {
    artEl.outerHTML = `<div style="font-size:56px;margin-bottom:12px" id="prev-art">${s.art}</div>`;
    return;
  }

  // Show loading state while we call the AI
  artEl.outerHTML = `
    <div id="prev-art" style="display:flex;flex-direction:column;align-items:center;gap:10px;margin-bottom:8px">
      <div class="ai-spinner"></div>
      <small style="color:var(--text-3);font-weight:600">✨ Illustrating ${name}'s page...</small>
    </div>`;

  const requestedPage = pageIdx; // guard against race if user taps another thumb mid-generation
  const result = await generateIllustration(state.photoDataUrl, s.scene);

  if (state.previewPage !== requestedPage) return; // user moved on already

  if (result && result.url) {
    state.generatedPages[pageIdx] = result.url;
    showGeneratedImage(result.url);
  } else {
    // Generation failed or quota hit — fall back gracefully to emoji
    document.getElementById('prev-art').outerHTML = `<div style="font-size:56px;margin-bottom:12px" id="prev-art">${s.art}</div>`;
    showToastMsg('AI generation failed: ' + (result?.error || 'unknown error') + '. Showing placeholder.');
  }
}

function showGeneratedImage(dataUrl) {
  const artEl = document.getElementById('prev-art');
  artEl.outerHTML = `
    <img id="prev-art" src="${dataUrl}" alt="Storybook illustration"
      style="width:100%;max-width:240px;border-radius:14px;margin-bottom:12px;box-shadow:0 6px 20px rgba(124,92,191,.18)">`;
}

function showToastMsg(msg) {
  let t = document.getElementById('msl-toast-mini');
  if (!t) {
    t = document.createElement('div');
    t.id = 'msl-toast-mini';
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--text);color:#fff;padding:10px 18px;border-radius:50px;font-size:13px;font-weight:600;z-index:999;opacity:0;transition:opacity .25s;max-width:90vw;text-align:center';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  setTimeout(() => { t.style.opacity = '0'; }, 3200);
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
    photo_url: state.photoDataUrl ? '[uploaded]' : '',
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

/* ── Photo upload (real file picker) ─── */
function fakeUpload(zone) {
  // Create a hidden file input and trigger it
  let input = document.getElementById('photo-file-input');
  if (!input) {
    input = document.createElement('input');
    input.type = 'file';
    input.id = 'photo-file-input';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.style.display = 'none';
    document.body.appendChild(input);

    input.addEventListener('change', () => {
      const file = input.files[0];
      if (!file) return;

      // Validate size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Photo is too large. Please use an image under 10MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        state.photoDataUrl = dataUrl;

        const dropZone = document.getElementById('photo-drop');
        dropZone.innerHTML = `
          <img src="${dataUrl}" alt="Child photo" style="
            width: 80px; height: 80px; border-radius: 50%;
            object-fit: cover; border: 3px solid var(--purple);
            margin-bottom: 8px; display: block; margin: 0 auto 8px;
          ">
          <p style="color:var(--teal);font-weight:700">Photo uploaded!</p>
          <small style="color:var(--text-3)">${file.name} · ${(file.size/1024).toFixed(0)}KB · Tap to change</small>
        `;
        dropZone.style.background = 'var(--teal-l)';
        dropZone.style.borderColor = 'var(--teal)';
        dropZone.style.borderStyle = 'solid';
      };
      reader.readAsDataURL(file);
    });
  }
  input.value = ''; // reset so same file can be re-selected
  input.click();
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
