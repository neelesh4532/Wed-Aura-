
/* ===== Modal / Login on open ===== */
function showLoginModal(){
  const root = document.getElementById('modalRoot');
  root.innerHTML = `
    <div class="modal-back" id="modalBack">
      <div class="modal">
        <h3 style="margin-top:0">Welcome to WedAura</h3>
        <p style="color:#374151; font-size:14px">Enter your name and email to continue (demo).</p>
        <input id="modalName" placeholder="Your name" />
        <input id="modalEmail" placeholder="Email (optional)" />
        <div style="text-align:right;">
          <button id="skipLogin" style="margin-right:8px; padding:8px 10px; border-radius:6px; border:1px solid #e6e7eb; background:#fff">Skip</button>
          <button id="saveLogin" style="padding:8px 10px; border-radius:6px; background:#374151; color:#fff; border:none">Save</button>
        </div>
      </div>
    </div>`;
  root.style.display = 'block';
  document.getElementById('saveLogin').onclick = ()=> {
    const n = document.getElementById('modalName').value.trim();
    const e = document.getElementById('modalEmail').value.trim();
    if(n) localStorage.setItem('wedaura_user', JSON.stringify({name:n,email:e}));
    root.style.display='none';
    applyUser();
  };
  document.getElementById('skipLogin').onclick = ()=> { root.style.display='none'; applyUser(); };
}

// show on first load if no user
if(!localStorage.getItem('wedaura_user')) {
  setTimeout(showLoginModal, 300);
} else {
  applyUser();
}
function applyUser(){
  const u = JSON.parse(localStorage.getItem('wedaura_user') || 'null');
  const welcome = document.getElementById('welcomeName');
  if(u && u.name) welcome.textContent = `Hi, ${u.name}`; else welcome.textContent = '';
}

/* ===== Animated hero cycle ===== */
const words = [
  {key:'Marriage', color:'#F8F7F6', emoji:'🙏', desc: 'Hindu wedding • Ganesh blessing' },
  {key:'Corporate', color:'#F3F4F6', emoji:'🏢', desc: 'Corporate events & conferences' },
  {key:'Birthday', color:'#FBF8FF', emoji:'🎂', desc: 'Birthdays & parties' },
  {key:'Cultural', color:'#F8FAFC', emoji:'🕌', desc: 'Religious & cultural ceremonies' }
];
let idx = 0;
const cycleText = document.getElementById('cycleText');
const frame = document.getElementById('frame');

function showFrame(i){
  const w = words[i];
  cycleText.textContent = ' ' + w.key;
  frame.innerHTML = `
    <div style="background:${w.color}; padding:12px; border-radius:8px;">
      <div style="display:flex; gap:12px; align-items:center;">
        <div style="font-size:32px">${w.emoji}</div>
        <div>
          <div style="font-weight:700">${w.key}</div>
          <div style="color:#6b7280; font-size:13px;">${w.desc}</div>
        </div>
      </div>
    </div>`;
}
showFrame(0);
setInterval(()=> { idx = (idx + 1) % words.length; showFrame(idx); }, 2200);

/* ===== Seeded venues (client-side) ===== */
const venues = [
  {id:1,name:'Royal Palace',city:'Lucknow',capacity:200,price:150000,contact:'9876543210',lat:26.8467,lng:80.9462,rating:4.6},
  {id:2,name:'Lotus Lawn', city:'Lucknow',capacity:150,price:90000,contact:'9123456780',lat:26.8450,lng:80.9480,rating:4.2},
  {id:3,name:'Sunset Banquet', city:'Lucknow',capacity:300,price:220000,contact:'9988776655',lat:26.8480,lng:80.9400,rating:4.4},
  {id:4,name:'Green Meadow', city:'Noida', capacity:250,price:180000,contact:'9012345678',lat:28.5355,lng:77.3910,rating:4.5}
];

/* ===== Persisted state keys ===== */
const KEY_FILTERS = 'wedaura_filters';
const KEY_ORDERS = 'wedaura_orders';
const KEY_CARDS = 'wedaura_cards';

/* ===== Leaflet map ===== */
let map;
function initMap(){
  if(!map){
    map = L.map('map').setView([26.8467,80.9462], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
  }
}
initMap();
let markers = [];

/* ===== Load filters from storage and render ===== */
function loadFiltersFromStorage(){
  const f = JSON.parse(localStorage.getItem(KEY_FILTERS) || 'null');
  if(f){
    document.getElementById('city').value = f.city || '';
    document.getElementById('capacity').value = f.capacity || '';
    document.getElementById('minBudget').value = f.minBudget || '';
    document.getElementById('maxBudget').value = f.maxBudget || '';
  }
}
loadFiltersFromStorage();

function renderVenues(list){
  const out = document.getElementById('venuesList');
  out.innerHTML = '';
  markers.forEach(m => map.removeLayer(m)); markers = [];

  list.forEach(v => {
    const el = document.createElement('div');
    el.className = 'venue-card';
    const left = document.createElement('div');
    left.innerHTML = `<div style="font-weight:700">${v.name}</div>
                      <div class="meta">${v.city} • ${v.capacity} guests • ₹${v.price}</div>
                      <div class="meta">Rating: ${v.rating} • Contact: ${v.contact}</div>`;
    const right = document.createElement('div');
    const btn = document.createElement('button');
    btn.className = 'btn small';
    btn.textContent = 'View';
    btn.onclick = ()=> focusVenue(v.id);
    right.appendChild(btn);
    el.appendChild(left);
    el.appendChild(right);
    out.appendChild(el);

    const m = L.marker([v.lat, v.lng]).addTo(map).bindPopup(`<b>${v.name}</b><br>${v.capacity} guests<br>₹${v.price}`);
    markers.push(m);
  });
}
function focusVenue(id){
  const v = venues.find(x=>x.id===id);
  if(v){ map.setView([v.lat,v.lng],14); }
}

function getFilters(){
  const city = document.getElementById('city').value.trim().toLowerCase();
  const capacity = parseInt(document.getElementById('capacity').value || '0',10);
  const minBudget = parseInt(document.getElementById('minBudget').value || '0',10);
  const maxBudget = parseInt(document.getElementById('maxBudget').value || '0',10);
  return {city,capacity,minBudget,maxBudget};
}

function applyFilters(){
  const f = getFilters();
  localStorage.setItem(KEY_FILTERS, JSON.stringify(f));
  let res = venues.filter(v => {
    if(f.city && v.city.toLowerCase() !== f.city) return false;
    if(f.capacity && v.capacity < f.capacity) return false;
    if(f.minBudget && v.price < f.minBudget) return false;
    if(f.maxBudget && f.maxBudget>0 && v.price > f.maxBudget) return false;
    return true;
  });
  renderVenues(res);
  renderRecommendations(f);
}
document.getElementById('city').addEventListener('input', debounce(applyFilters,300));
document.getElementById('capacity').addEventListener('input', debounce(applyFilters,300));
document.getElementById('minBudget').addEventListener('input', debounce(applyFilters,300));
document.getElementById('maxBudget').addEventListener('input', debounce(applyFilters,300));
document.getElementById('saveFilters').addEventListener('click', ()=> { applyFilters(); alert('Filters saved for this browser'); });

applyFilters(); // initial render

/* ===== Card Designer templates + save ===== */
const templates = {
  t1: (data) => `<div style="font-family:Georgia,serif; width:700px; padding:40px; border:1px solid #eee; background:#fff;">
    <h1 style="text-align:center; color:#b85c5c">${escapeHtml(data.names)}</h1>
    <p style="text-align:center; color:#555">Request the pleasure of your company</p>
    <p style="text-align:center; font-weight:600">${escapeHtml(data.datetime)}</p>
    <p style="text-align:center; color:#777">${escapeHtml(data.venue)}</p>
  </div>`,
  t2: (data) => `<div style="font-family:Arial, sans-serif; width:700px; padding:36px; background:#f8fafc; border-radius:10px;">
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <div>
        <h2 style="margin:0">${escapeHtml(data.names)}</h2>
        <p style="margin:0; color:#6b7280">${escapeHtml(data.datetime)}</p>
      </div>
      <div style="font-size:12px; color:#94a3b8">${escapeHtml(data.venue)}</div>
    </div>
    <hr/>
    <p style="color:#374151">Join us to celebrate our wedding. RSVP: 9876543210</p>
  </div>`,
  t3: (data) => `<div style="width:700px; padding:30px; font-family:Times New Roman; background:#fff9f7; border:1px solid #fdecea;">
    <div style="display:flex; justify-content:space-between;">
      <div><h3 style="color:#9b4d4d; margin:0">${escapeHtml(data.names)}</h3><small>${escapeHtml(data.datetime)}</small></div>
      <div><img src="https://via.placeholder.com/80x80?text=Floral" alt="floral"/></div>
    </div>
    <p style="color:#6b6b6b">${escapeHtml(data.venue)} · RSVP: 9876543210</p>
  </div>`
};

document.getElementById('previewBtn').addEventListener('click', ()=> {
  const tpl = document.getElementById('templateSelect').value;
  const data = {
    names: document.getElementById('names').value,
    datetime: document.getElementById('datetime').value,
    venue: document.getElementById('venueName').value
  };
  document.getElementById('cardPreview').innerHTML = templates[tpl](data);
});

document.getElementById('saveCardBtn').addEventListener('click', ()=> {
  const tpl = document.getElementById('templateSelect').value;
  const data = {
    names: document.getElementById('names').value,
    datetime: document.getElementById('datetime').value,
    venue: document.getElementById('venueName').value,
    template: tpl,
    id: Date.now()
  };
  const existing = JSON.parse(localStorage.getItem(KEY_CARDS) || '[]');
  existing.unshift(data);
  localStorage.setItem(KEY_CARDS, JSON.stringify(existing));
  alert('Card saved locally');
  renderSavedCards();
});

document.getElementById('downloadBtn').addEventListener('click', ()=> {
  const preview = document.getElementById('cardPreview');
  if(!preview.innerHTML.trim()){ alert('Click Preview first'); return; }
  const w = window.open('', '_blank', 'width=900,height=700');
  w.document.write(`<html><head><title>Invite</title></head><body>${preview.innerHTML}</body></html>`);
  w.document.close();
  w.print();
});

function renderSavedCards(){
  const list = JSON.parse(localStorage.getItem(KEY_CARDS) || '[]');
  const cont = document.getElementById('savedCardsList');
  if(!cont) return;
  cont.innerHTML = '<div style="font-size:14px; color:#6b7280; margin-top:8px;">Saved Cards</div>';
  list.slice(0,4).forEach(c=>{
    const d = document.createElement('div');
    d.style.padding='8px';
    d.style.border='1px solid #f1f5f9';
    d.style.marginTop='6px';
    d.style.background='#fff';
    d.innerHTML = `<b>${escapeHtml(c.names)}</b><div style="font-size:13px;color:#6b7280">${escapeHtml(c.datetime)} • ${escapeHtml(c.venue)}</div>`;
    cont.appendChild(d);
  });
}
renderSavedCards();
/* app.js - WedAura prototype (Part 2 of 2)
   Continue in same file (paste immediately after Part 1)
*/

/* ===== CSV parse + cost calc + persist orders ===== */
const csvInput = document.getElementById('csvInput');
const csvPreview = document.getElementById('csvPreview');
let parsedOrders = [];

document.getElementById('parseCsv').addEventListener('click', ()=> {
  const text = csvInput.value.trim();
  if(!text){ alert('Paste CSV rows'); return; }
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  parsedOrders = [];
  for(const ln of lines){
    const parts = ln.split(',');
    if(parts.length < 6) continue;
    parsedOrders.push({
      name: parts[0].trim(),
      phone: parts[1].trim(),
      address: parts[2].trim(),
      city: parts[3].trim(),
      pincode: parts[4].trim(),
      qty: parseInt(parts[5].trim() || '0',10)
    });
  }
  renderCsvPreview();
  calculateCost();
});

document.getElementById('clearCsv').addEventListener('click', ()=> {
  csvInput.value=''; parsedOrders=[]; csvPreview.innerHTML=''; document.getElementById('costBreakdown').innerHTML='';
});

function renderCsvPreview(){
  csvPreview.innerHTML = '';
  parsedOrders.forEach((p,i)=>{
    const el = document.createElement('div');
    el.className = 'row';
    el.innerHTML = `<div style="display:flex; justify-content:space-between;"><div><b>${escapeHtml(p.name)}</b> • ${escapeHtml(p.city)}<br/><small>${escapeHtml(p.address)}</small></div><div>Qty: ${p.qty}</div></div>`;
    csvPreview.appendChild(el);
  });
}

function calculateCost(){
  const printRate = parseInt(document.getElementById('printRate').value || '15',10);
  const deliveryFee = parseInt(document.getElementById('deliveryFee').value || '100',10);
  const totalCards = parsedOrders.reduce((s,p)=> s + (p.qty||0), 0);
  const printingCost = totalCards * printRate;
  const deliveryCost = parsedOrders.length * deliveryFee;
  const total = printingCost + deliveryCost;
  document.getElementById('costBreakdown').innerHTML = `
    <div>Total addresses: ${parsedOrders.length}</div>
    <div>Total cards: ${totalCards}</div>
    <div>Printing: ₹${printingCost} (${printRate}/card)</div>
    <div>Delivery: ₹${deliveryCost} (${deliveryFee}/address)</div>
    <div style="font-weight:700; margin-top:6px;">Total: ₹${total}</div>
  `;
  // save as an order in localStorage for demo
  if(parsedOrders.length) {
    saveOrdersAsDemo(parsedOrders, total);
  }
}

/* ===== Orders storage & dashboard ===== */
function saveOrdersAsDemo(parsed, totalCost){
  const existing = JSON.parse(localStorage.getItem(KEY_ORDERS) || '[]');
  const order = {
    id: Date.now(),
    items: parsed,
    totalCost,
    status: 'Created',
    trackingPrefix: 'WDA' + String(existing.length + 1).padStart(3,'0')
  };
  existing.unshift(order);
  localStorage.setItem(KEY_ORDERS, JSON.stringify(existing));
  parsedOrders = []; document.getElementById('csvInput').value = '';
  document.getElementById('csvPreview').innerHTML = '';
  document.getElementById('costBreakdown').innerHTML = '';
  renderDashboard();
}

function loadOrders(){
  return JSON.parse(localStorage.getItem(KEY_ORDERS) || '[]');
}

function updateOrderStatus(orderId, status){
  const all = loadOrders();
  const o = all.find(x=>x.id === orderId);
  if(o){ o.status = status; localStorage.setItem(KEY_ORDERS, JSON.stringify(all)); renderDashboard(); }
}

function renderDashboard(){
  const all = loadOrders();
  document.getElementById('totalOrders').textContent = all.length;
  const pending = all.filter(o=> o.status === 'Created' || o.status === 'In Transit').length;
  document.getElementById('pending').textContent = pending;
  document.getElementById('dispatched').textContent = all.filter(o=>o.status==='Dispatched').length;
  document.getElementById('delivered').textContent = all.filter(o=>o.status==='Delivered').length;
  const rev = all.reduce((s,o)=> s + (o.totalCost || 0), 0);
  document.getElementById('revenue').textContent = `₹${rev}`;

  const tbody = document.getElementById('ordersTable');
  tbody.innerHTML = '';
  all.forEach(o=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${escapeHtml(o.items[0].name)}</td>
      <td>${o.items.reduce((s,it)=> s + (it.qty||0),0)}</td>
      <td>${o.trackingPrefix}</td>
      <td>
        <select data-id="${o.id}" class="status">
          <option ${o.status==='Created'?'selected':''}>Created</option>
          <option ${o.status==='Dispatched'?'selected':''}>Dispatched</option>
          <option ${o.status==='In Transit'?'selected':''}>In Transit</option>
          <option ${o.status==='Delivered'?'selected':''}>Delivered</option>
        </select>
      </td>`;
    tbody.appendChild(tr);
  });

  document.querySelectorAll('select.status').forEach(s=>{
    s.addEventListener('change', (e)=>{
      const id = parseInt(e.target.dataset.id,10);
      updateOrderStatus(id, e.target.value);
    });
  });
}
renderDashboard();

/* ===== Recommendations (rule-based) ===== */
function scoreVenue(v, filters){
  const capacityScore = filters.capacity ? Math.min(1, v.capacity / (filters.capacity || 1)) : 1;
  const budgetScore = filters.maxBudget && filters.maxBudget>0 ? Math.min(1, (filters.maxBudget / v.price)) : 1;
  const ratingScore = (v.rating || 3) / 5;
  return capacityScore * 0.4 + budgetScore * 0.4 + ratingScore * 0.2;
}

function renderRecommendations(filters){
  const rec = document.getElementById('recommended');
  rec.innerHTML = '';
  const f = filters || getFilters();
  const scored = venues.map(v => ({...v, score: scoreVenue(v,f)})).sort((a,b)=> b.score - a.score).slice(0,5);
  scored.forEach(v=>{
    const d = document.createElement('div');
    d.className = 'rec-card';
    d.innerHTML = `<div style="font-weight:700">${v.name}</div>
      <div style="font-size:13px; color:#6b7280">₹${v.price} • ${v.capacity} guests</div>
      <div style="margin-top:6px; font-size:13px">Score: ${v.score.toFixed(2)}</div>`;
    rec.appendChild(d);
  });
}
renderRecommendations(getFilters());

/* ===== Utilities ===== */
function debounce(fn, delay=300){
  let t;
  return (...args)=> { clearTimeout(t); t = setTimeout(()=> fn(...args), delay); };
}

function escapeHtml(str){
  if(!str) return '';
  return String(str).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
}

// Intro Animation - Hide after 3 seconds
setTimeout(() => {
  const introAnim = document.getElementById('intro-animation');
  if (introAnim) {
    introAnim.style.display = 'none';
  }
}, 3000);
