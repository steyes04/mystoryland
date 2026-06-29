/* ── MyStoryLand · Admin JS ──────────────────────────────────────── */

const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_KEY = 'YOUR_ANON_KEY';
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';

async function sbFetch(path, opts = {}) {
  try {
    const res = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        ...opts.headers
      }, ...opts
    });
    return await res.json();
  } catch { return null; }
}

/* ── Default data ─── */
const defaultBooks = [
  { id: 1, title: 'Princess Dawn', emoji: '👑', color: '#FFE8F5', age: '3–7',  price: 179, badge: 'Best seller', active: true,  orders: 68 },
  { id: 2, title: 'Space Hero',    emoji: '🚀', color: '#E6F1FB', age: '4–9',  price: 149, badge: '',            active: true,  orders: 54 },
  { id: 3, title: 'Dragon Quest',  emoji: '🐉', color: '#FEF3DC', age: '5–10', price: 149, badge: '',            active: true,  orders: 49 },
  { id: 4, title: 'Mermaid Tale',  emoji: '🧜', color: '#DFF7F4', age: '3–7',  price: 149, badge: '',            active: true,  orders: 62 },
  { id: 5, title: 'Desert Prince', emoji: '🌙', color: '#EDE7F8', age: '4–9',  price: 179, badge: 'UAE exclusive', active: true, orders: 31 },
  { id: 6, title: 'Jungle Safari', emoji: '🦁', color: '#E3F9ED', age: '2–6',  price: 149, badge: '',            active: false, orders: 0 },
];

const defaultOrders = [
  { ref:'MSL-100042', customer_name:'Fatima Al Rashid', phone:'+971501234567', address:'Villa 12, Jumeirah', emirate:'Dubai',     child_name:'Hana',   child_age:6, child_gender:'girl', book_theme:'Princess Dawn', amount:204, status:'shipped',    created_at:'2024-06-27T10:24:00Z' },
  { ref:'MSL-100043', customer_name:'Sarah Mohammed',   phone:'+971502345678', address:'Flat 3, Corniche', emirate:'Abu Dhabi',  child_name:'Amayra', child_age:5, child_gender:'girl', book_theme:'Space Hero',    amount:174, status:'generating', created_at:'2024-06-29T09:10:00Z' },
  { ref:'MSL-100044', customer_name:'Nour Khalil',      phone:'+971503456789', address:'House 7, Al Taawun', emirate:'Sharjah',  child_name:'Lina',   child_age:4, child_gender:'girl', book_theme:'Mermaid Tale',  amount:174, status:'printing',   created_at:'2024-06-28T14:00:00Z' },
  { ref:'MSL-100045', customer_name:'Amira Hassan',     phone:'+971504567890', address:'Tower B, Dubai Marina', emirate:'Dubai', child_name:'Zara',   child_age:3, child_gender:'girl', book_theme:'Jungle Safari', amount:174, status:'pending',    created_at:'2024-06-29T11:00:00Z' },
  { ref:'MSL-100046', customer_name:'Layla Rahman',     phone:'+971505678901', address:'Villa 9, Al Rashidiya', emirate:'Ajman', child_name:'Sara',   child_age:7, child_gender:'girl', book_theme:'Dragon Quest',  amount:174, status:'shipped',    created_at:'2024-06-26T16:00:00Z' },
  { ref:'MSL-100047', customer_name:'Dana Youssef',     phone:'+971506789012', address:'Unit 5, JLT', emirate:'Dubai',          child_name:'Omar',   child_age:8, child_gender:'boy',  book_theme:'Dragon Quest',  amount:174, status:'delivered',  created_at:'2024-06-25T12:00:00Z' },
];

/* ── State ─── */
let books = JSON.parse(localStorage.getItem('msl_books') || JSON.stringify(defaultBooks));
let orders = JSON.parse(localStorage.getItem('msl_orders') || JSON.stringify(defaultOrders));
let filterStatus = 'all';
let searchVal = '';
let editingBook = null;
let viewingOrder = null;

function saveBooks() { localStorage.setItem('msl_books', JSON.stringify(books)); }
function saveOrders() { localStorage.setItem('msl_orders', JSON.stringify(orders)); }

/* ── Login ─── */
function doLogin() {
  const u = document.getElementById('login-user').value.trim();
  const p = document.getElementById('login-pass').value;
  if (u === ADMIN_USER && p === ADMIN_PASS) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').classList.add('visible');
    loadDashboard();
  } else {
    document.getElementById('login-err').style.display = 'block';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login-pass').addEventListener('keydown', e => {
    if (e.key === 'Enter') doLogin();
  });
});

/* ── Nav ─── */
function showPage(id, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('pg-' + id).classList.add('active');
  if (el) el.classList.add('active');
  if (id === 'dashboard') loadDashboard();
  if (id === 'orders') renderOrders();
  if (id === 'books') renderBooksCatalog();
  if (id === 'customers') renderCustomers();
  if (id === 'revenue') renderRevenue();
}

/* ── Dashboard ─── */
function loadDashboard() {
  const totalOrders = orders.length;
  const revenue = orders.reduce((s, o) => s + o.amount, 0);
  const shipped = orders.filter(o => o.status === 'shipped' || o.status === 'delivered').length;
  const generating = orders.filter(o => o.status === 'generating').length;

  document.getElementById('d-orders').textContent = totalOrders;
  document.getElementById('d-revenue').textContent = 'AED ' + revenue.toLocaleString();
  document.getElementById('d-shipped').textContent = shipped;
  document.getElementById('d-gen').textContent = generating;

  // Recent orders
  const recent = orders.slice(0, 5);
  document.getElementById('d-recent').innerHTML = recent.map(o => `
    <tr>
      <td style="font-weight:700;color:var(--purple)">${o.ref}</td>
      <td>${o.customer_name}</td>
      <td>${o.book_theme}</td>
      <td>${o.child_name}, ${o.child_age}</td>
      <td>${statusBadge(o.status)}</td>
      <td style="font-weight:700">AED ${o.amount}</td>
    </tr>
  `).join('');
}

/* ── Orders ─── */
const statusLabel = { pending:'Pending', generating:'Generating', printing:'Printing', shipped:'Shipped', delivered:'Delivered', cancelled:'Cancelled' };
const statusBadgeClass = { pending:'badge-muted', generating:'badge-accent', printing:'badge-warning', shipped:'badge-teal', delivered:'badge-success', cancelled:'badge-danger' };

function statusBadge(s) {
  return `<span class="badge ${statusBadgeClass[s] || 'badge-muted'}">${statusLabel[s] || s}</span>`;
}

function renderOrders() {
  const filtered = orders.filter(o => {
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    const q = searchVal.toLowerCase();
    const matchSearch = !q || o.customer_name.toLowerCase().includes(q) || o.ref.toLowerCase().includes(q) || o.child_name.toLowerCase().includes(q) || o.book_theme.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  document.getElementById('orders-body').innerHTML = filtered.map(o => `
    <tr>
      <td style="font-weight:700;color:var(--purple)">${o.ref}</td>
      <td style="font-weight:600">${o.customer_name}</td>
      <td>${o.book_theme}</td>
      <td>${o.child_name}, age ${o.child_age}</td>
      <td>${statusBadge(o.status)}</td>
      <td style="font-weight:700">AED ${o.amount}</td>
      <td style="color:var(--text-3);font-size:12px">${new Date(o.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</td>
      <td>
        <div class="row-btns">
          <button class="btn btn-secondary btn-sm" onclick="viewOrder('${o.ref}')">View</button>
          <button class="btn btn-primary btn-sm" onclick="editOrderStatus('${o.ref}')">Status</button>
        </div>
      </td>
    </tr>
  `).join('');
  document.getElementById('orders-count').textContent = filtered.length + ' orders';
}

function setFilter(s, el) {
  filterStatus = s;
  document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  renderOrders();
}

function searchOrders(val) {
  searchVal = val;
  renderOrders();
}

function viewOrder(ref) {
  const o = orders.find(x => x.ref === ref);
  if (!o) return;
  viewingOrder = o;
  document.getElementById('view-title').textContent = 'Order ' + o.ref;
  document.getElementById('view-body').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
      <div><div class="field-lbl">Customer</div><div class="field-val">${o.customer_name}</div></div>
      <div><div class="field-lbl">Phone</div><div class="field-val">${o.phone}</div></div>
      <div><div class="field-lbl">Book</div><div class="field-val">${o.book_theme}</div></div>
      <div><div class="field-lbl">Child</div><div class="field-val">${o.child_name}, age ${o.child_age} (${o.child_gender})</div></div>
      <div><div class="field-lbl">Emirate</div><div class="field-val">${o.emirate}</div></div>
      <div><div class="field-lbl">Amount</div><div class="field-val" style="font-weight:800;color:var(--purple)">AED ${o.amount}</div></div>
    </div>
    <div style="margin-bottom:14px"><div class="field-lbl">Delivery address</div><div class="field-val">${o.address}</div></div>
    <div style="margin-bottom:16px"><div class="field-lbl">Status</div><div style="margin-top:4px">${statusBadge(o.status)}</div></div>
    <div class="field-lbl" style="margin-bottom:10px">Update status</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      ${['pending','generating','printing','shipped','delivered','cancelled'].map(s =>
        `<button class="btn btn-sm ${s === o.status ? 'btn-primary' : 'btn-secondary'}" onclick="updateStatus('${o.ref}','${s}',this)">${statusLabel[s]}</button>`
      ).join('')}
    </div>
    <hr style="border:none;border-top:1px solid var(--border);margin:18px 0">
    <div style="font-size:13px;font-weight:700;margin-bottom:12px">Order timeline</div>
    <ul class="timeline">
      ${buildTimeline(o)}
    </ul>
  `;
  openModal('view-order-modal');
}

function buildTimeline(o) {
  const steps = ['pending','generating','printing','shipped','delivered'];
  const idx = steps.indexOf(o.status);
  return steps.map((s, i) => `
    <li class="tl">
      <div class="tl-dot ${i < idx ? 'done' : i === idx ? 'active' : ''}"></div>
      <div>
        <div class="tl-text">${statusLabel[s]}</div>
        <div class="tl-time">${i <= idx ? 'Completed' : 'Pending'}</div>
      </div>
    </li>
  `).join('');
}

function updateStatus(ref, newStatus, btn) {
  const o = orders.find(x => x.ref === ref);
  if (!o) return;
  o.status = newStatus;
  saveOrders();
  // Update buttons UI
  btn.closest('div').querySelectorAll('button').forEach(b => b.classList.replace('btn-primary','btn-secondary'));
  btn.classList.replace('btn-secondary','btn-primary');
  // Refresh tables
  renderOrders();
  loadDashboard();
}

function editOrderStatus(ref) {
  viewOrder(ref);
}

/* ── Book catalog ─── */
function renderBooksCatalog() {
  document.getElementById('books-body').innerHTML = books.map(b => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:38px;height:38px;border-radius:10px;background:${b.color};display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">${b.emoji}</div>
          <div>
            <div style="font-weight:700">${b.title}</div>
            ${b.badge ? `<div style="font-size:11px;color:var(--purple)">${b.badge}</div>` : ''}
          </div>
        </div>
      </td>
      <td>Ages ${b.age}</td>
      <td style="font-weight:800;color:var(--purple)">AED ${b.price}</td>
      <td>${b.orders || 0}</td>
      <td><span class="badge ${b.active ? 'badge-success' : 'badge-muted'}">${b.active ? 'Active' : 'Draft'}</span></td>
      <td>
        <div class="row-btns">
          <button class="btn btn-secondary btn-sm" onclick="editBook(${b.id})"><i class="ti ti-edit"></i> Edit</button>
          <button class="btn ${b.active ? 'btn-danger' : 'btn-success'} btn-sm" onclick="toggleBook(${b.id})">
            ${b.active ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function editBook(id) {
  const b = books.find(x => x.id === id) || { id: 0, title:'', emoji:'📖', color:'#EDE7F8', age:'3–7', price: 149, badge:'', active: true };
  editingBook = b;
  document.getElementById('edit-book-title').textContent = id ? 'Edit book theme' : 'Add book theme';
  document.getElementById('eb-title').value  = b.title;
  document.getElementById('eb-emoji').value  = b.emoji;
  document.getElementById('eb-age').value    = b.age;
  document.getElementById('eb-price').value  = b.price;
  document.getElementById('eb-badge').value  = b.badge;
  document.getElementById('eb-color').value  = b.color;
  document.getElementById('eb-active').checked = b.active;
  openModal('edit-book-modal');
}

function addBook() {
  editBook(0);
  editingBook = { id: Date.now(), title:'', emoji:'📖', color:'#EDE7F8', age:'3–7', price: 149, badge:'', active: true, orders: 0 };
}

function saveBook() {
  const b = editingBook;
  b.title  = document.getElementById('eb-title').value.trim();
  b.emoji  = document.getElementById('eb-emoji').value.trim() || '📖';
  b.age    = document.getElementById('eb-age').value.trim();
  b.price  = parseInt(document.getElementById('eb-price').value) || 149;
  b.badge  = document.getElementById('eb-badge').value.trim();
  b.color  = document.getElementById('eb-color').value;
  b.active = document.getElementById('eb-active').checked;
  if (!b.title) { alert('Please enter a title.'); return; }

  const idx = books.findIndex(x => x.id === b.id);
  if (idx >= 0) books[idx] = b;
  else books.push(b);

  saveBooks();
  renderBooksCatalog();
  closeModal('edit-book-modal');
  showToast('Book saved!');
}

function toggleBook(id) {
  const b = books.find(x => x.id === id);
  if (!b) return;
  b.active = !b.active;
  saveBooks();
  renderBooksCatalog();
  showToast(b.active ? 'Book activated' : 'Book deactivated');
}

/* ── Customers ─── */
function renderCustomers() {
  const customers = {};
  orders.forEach(o => {
    if (!customers[o.customer_name]) {
      customers[o.customer_name] = { name: o.customer_name, phone: o.phone, emirate: o.emirate, orders: 0, spent: 0, last: o.created_at };
    }
    customers[o.customer_name].orders++;
    customers[o.customer_name].spent += o.amount;
    if (o.created_at > customers[o.customer_name].last) customers[o.customer_name].last = o.created_at;
  });

  document.getElementById('customers-body').innerHTML = Object.values(customers).map(c => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:34px;height:34px;border-radius:50%;background:var(--purple-l);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:var(--purple)">${c.name.split(' ').map(n=>n[0]).join('').slice(0,2)}</div>
          <span style="font-weight:600">${c.name}</span>
        </div>
      </td>
      <td style="color:var(--text-3)">${c.phone}</td>
      <td>${c.emirate}</td>
      <td style="font-weight:700">${c.orders}</td>
      <td style="font-weight:800;color:var(--purple)">AED ${c.spent}</td>
      <td style="color:var(--text-3);font-size:12px">${new Date(c.last).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</td>
    </tr>
  `).join('');
}

/* ── Revenue ─── */
function renderRevenue() {
  const monthlyData = [5200, 6100, 7400, 9800, 13180, 14280];
  const labels = ['Jan','Feb','Mar','Apr','May','Jun'];
  const max = Math.max(...monthlyData);

  document.getElementById('rev-chart').innerHTML = monthlyData.map((v, i) => `
    <div class="bar-col">
      <div class="bar-val">AED ${(v/1000).toFixed(1)}k</div>
      <div class="bar" style="height:${Math.round((v/max)*130)}px" title="${labels[i]}: AED ${v.toLocaleString()}"></div>
      <div class="bar-label">${labels[i]}</div>
    </div>
  `).join('');

  const total = orders.reduce((s,o) => s+o.amount, 0);
  document.getElementById('rev-total').textContent = 'AED ' + total.toLocaleString();
  document.getElementById('rev-avg').textContent = 'AED ' + Math.round(total / (orders.length || 1));
  document.getElementById('rev-books').textContent = orders.length;
}

/* ── Settings ─── */
function saveSettings() {
  showToast('Settings saved!');
}

/* ── Modal helpers ─── */
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

/* ── Toast ─── */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.opacity = '1'; t.style.transform = 'translateY(0)';
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(12px)'; }, 2000);
}
