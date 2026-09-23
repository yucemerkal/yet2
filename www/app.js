// ---------- VERİ KATMANI (localStorage) ----------
const DB = {
  get(key, fallback){
    try{
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    }catch(e){ return fallback; }
  },
  set(key, value){
    localStorage.setItem(key, JSON.stringify(value));
  }
};

let pantry = DB.get('pantry', []);
let shoppingList = DB.get('shoppingList', []);
let expenses = DB.get('expenses', []); // {id, date(ISO), amount, category}
let water = DB.get('water', []); // {id, date(ISO day), ml, time}
const WATER_GOAL = DB.get('waterGoal', 2500);

function save(){
  DB.set('pantry', pantry);
  DB.set('shoppingList', shoppingList);
  DB.set('expenses', expenses);
  DB.set('water', water);
}
function uid(){ return Date.now() + '-' + Math.random().toString(36).slice(2,7); }
function todayKey(){ return new Date().toISOString().slice(0,10); }
function monthKey(d){ return (d||new Date().toISOString()).slice(0,7); }

// ---------- SABİT TARİF VERİTABANI ----------
// Malzeme adları pantry'deki isimlerle küçük harf karşılaştırılır (basit içerir kontrolü).
const RECIPES = [
  { name:'Menemen', time:'15 dk', kcal:320, servings:2,
    ingredients:['yumurta','domates','biber','soğan'],
    steps:'Soğan ve biberi kavurun, domatesi ekleyip pişirin, üzerine yumurtaları kırıp karıştırarak pişirin.' },
  { name:'Sebzeli Omlet', time:'10 dk', kcal:260, servings:1,
    ingredients:['yumurta','biber','domates','peynir'],
    steps:'Sebzeleri doğrayıp hafifçe soteleyin, çırpılmış yumurtayı ekleyip peynirle üzerini kapatın.' },
  { name:'Domatesli Makarna', time:'20 dk', kcal:420, servings:2,
    ingredients:['makarna','domates','soğan','peynir'],
    steps:'Makarnayı haşlayın. Soğan ve domatesten sos yapıp makarnayla karıştırın, peynir serpin.' },
  { name:'Tavuklu Makarna', time:'25 dk', kcal:480, servings:2,
    ingredients:['tavuk','makarna','krema','mantar'],
    steps:'Tavuğu ve mantarı soteleyin, kremayı ekleyin, haşlanmış makarnayla karıştırın.' },
  { name:'Peynirli Tost', time:'8 dk', kcal:280, servings:1,
    ingredients:['ekmek','peynir'],
    steps:'Ekmeğin arasına peyniri koyup tost makinesinde kızartın.' },
  { name:'Yoğurtlu Elma + Ceviz', time:'5 dk', kcal:180, servings:1,
    ingredients:['elma','yoğurt','ceviz'],
    steps:'Elmayı doğrayın, yoğurdun üzerine ekleyip cevizle süsleyin.' },
  { name:'Sütlü Müsli', time:'5 dk', kcal:250, servings:1,
    ingredients:['süt','müsli'],
    steps:'Müslinin üzerine soğuk sütü dökün.' },
];

function pantryNames(){
  return pantry.map(p => p.name.trim().toLowerCase());
}
function recipeMatch(recipe){
  const names = pantryNames();
  const have = recipe.ingredients.filter(ing => names.some(n => n.includes(ing) || ing.includes(n)));
  const missing = recipe.ingredients.filter(ing => !have.includes(ing));
  const pct = Math.round((have.length / recipe.ingredients.length) * 100);
  return { pct, missing };
}

// ---------- SEKME (TAB) YÖNETİMİ ----------
document.querySelectorAll('.navbtn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});
function switchTab(tab){
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.navbtn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  document.querySelector(`.navbtn[data-tab="${tab}"]`).classList.add('active');
  renderAll();
}

// ---------- KİLER ----------
document.getElementById('pantryForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = document.getElementById('pantryName').value.trim();
  const qty = parseFloat(document.getElementById('pantryQty').value) || 1;
  const unit = document.getElementById('pantryUnit').value;
  const expiry = document.getElementById('pantryExpiry').value;
  if(!name) return;
  pantry.push({ id: uid(), name, qty, unit, expiry });
  save();
  e.target.reset();
  document.getElementById('pantryQty').value = 1;
  renderAll();
});

function renderPantry(){
  const el = document.getElementById('pantryList');
  if(pantry.length === 0){ el.innerHTML = '<p class="empty">Kilerin boş. Yukarıdan ürün ekle.</p>'; return; }
  el.innerHTML = pantry.map(p => `
    <li>
      <div>
        <span class="name">${escapeHtml(p.name)}</span>
        <div class="meta">${p.qty} ${p.unit}${p.expiry ? ' · SKT: ' + p.expiry : ''}</div>
      </div>
      <button class="del" onclick="removePantry('${p.id}')">✕</button>
    </li>`).join('');
}
function removePantry(id){
  pantry = pantry.filter(p => p.id !== id);
  save(); renderAll();
}

// ---------- TARİFLER ----------
function renderRecipes(){
  const el = document.getElementById('recipeList');
  const scored = RECIPES.map(r => ({ r, ...recipeMatch(r) })).sort((a,b) => b.pct - a.pct);
  el.innerHTML = scored.map(({r, pct, missing}) => `
    <div class="recipe-card">
      <span class="pct ${pct < 60 ? 'low' : ''}">%${pct} malzeme mevcut</span>
      <h4>${r.name}</h4>
      <div class="meta">⏱ ${r.time} · 🔥 ${r.kcal} kcal · 🍽 ${r.servings} porsiyon</div>
      ${missing.length ? `<div class="missing">Eksik: ${missing.join(', ')}</div>` : '<div>✅ Tüm malzemeler evde</div>'}
      <details>
        <summary>Malzemeler ve Yapılışı</summary>
        <ul>${r.ingredients.map(i => `<li>${i}</li>`).join('')}</ul>
        <p>${r.steps}</p>
      </details>
      <div>
        <a class="yt" target="_blank" href="https://www.youtube.com/results?search_query=${encodeURIComponent(r.name + ' tarifi')}">🎥 YouTube'da Ara</a>
        ${missing.length ? `<button class="add-missing" onclick='addMissingToList(${JSON.stringify(missing)})'>Eksikleri Market Listesine Ekle</button>` : ''}
      </div>
    </div>
  `).join('');
}
function addMissingToList(missing){
  missing.forEach(name => {
    if(!shoppingList.some(s => s.name.toLowerCase() === name.toLowerCase())){
      shoppingList.push({ id: uid(), name, checked:false });
    }
  });
  save(); renderAll();
  switchTab('market');
}

// ---------- MARKET LİSTESİ ----------
document.getElementById('shoppingForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = document.getElementById('shoppingName').value.trim();
  if(!name) return;
  shoppingList.push({ id: uid(), name, checked:false });
  save();
  e.target.reset();
  renderAll();
});
function renderShopping(targetId, limit){
  const el = document.getElementById(targetId);
  let list = shoppingList;
  if(limit) list = list.slice(0, limit);
  if(list.length === 0){ el.innerHTML = '<p class="empty">Market listesi boş.</p>'; return; }
  el.innerHTML = list.map(s => `
    <li class="${s.checked ? 'checked' : ''}">
      <label style="display:flex;align-items:center;gap:8px;flex:1;">
        <input type="checkbox" ${s.checked ? 'checked' : ''} onchange="toggleShopping('${s.id}')">
        <span class="name">${escapeHtml(s.name)}</span>
      </label>
      <button class="del" onclick="removeShopping('${s.id}')">✕</button>
    </li>`).join('');
}
function toggleShopping(id){
  const item = shoppingList.find(s => s.id === id);
  if(item) item.checked = !item.checked;
  save(); renderAll();
}
function removeShopping(id){
  shoppingList = shoppingList.filter(s => s.id !== id);
  save(); renderAll();
}

// ---------- HARCAMA TAKİBİ ----------
document.getElementById('expenseForm').addEventListener('submit', e => {
  e.preventDefault();
  const amount = parseFloat(document.getElementById('expenseAmount').value);
  const category = document.getElementById('expenseCategory').value;
  if(!amount) return;
  expenses.push({ id: uid(), date: new Date().toISOString(), amount, category });
  save();
  e.target.reset();
  renderAll();
});
function renderExpenses(){
  const thisMonth = monthKey();
  const monthTotal = expenses.filter(x => monthKey(x.date) === thisMonth)
    .reduce((sum,x) => sum + x.amount, 0);

  // son 4 ay
  const months = {};
  expenses.forEach(x => {
    const m = monthKey(x.date);
    months[m] = (months[m]||0) + x.amount;
  });
  const sortedMonths = Object.keys(months).sort().slice(-4);

  document.getElementById('expenseSummary').innerHTML = `
    <div class="card"><div class="label">Bu Ay Toplam Harcama</div><div class="value">${monthTotal.toFixed(0)} TL</div></div>
    ${sortedMonths.map(m => `<div class="card"><div class="label">${m}</div><div class="value">${months[m].toFixed(0)} TL</div></div>`).join('')}
  `;

  const history = [...expenses].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0,10);
  document.getElementById('expenseHistory').innerHTML = history.length ? history.map(x => `
    <li>
      <div>
        <span class="name">${x.category}</span>
        <div class="meta">${new Date(x.date).toLocaleDateString('tr-TR')}</div>
      </div>
      <div>
        <b>${x.amount.toFixed(0)} TL</b>
        <button class="del" onclick="removeExpense('${x.id}')">✕</button>
      </div>
    </li>`).join('') : '<p class="empty">Henüz harcama kaydı yok.</p>';
}
function removeExpense(id){
  expenses = expenses.filter(x => x.id !== id);
  save(); renderAll();
}

// ---------- SU TAKİBİ ----------
document.querySelectorAll('.water-buttons button').forEach(btn => {
  btn.addEventListener('click', () => {
    const ml = parseInt(btn.dataset.ml, 10);
    water.push({ id: uid(), date: todayKey(), ml, time: new Date().toISOString() });
    save(); renderAll();
  });
});
function waterToday(){
  return water.filter(w => w.date === todayKey()).reduce((s,w) => s + w.ml, 0);
}
function renderWater(){
  document.getElementById('waterAmount').textContent = waterToday();
  document.getElementById('waterGoal').textContent = WATER_GOAL;
}

// ---------- ANA SAYFA ----------
function renderHome(){
  const monthTotal = expenses.filter(x => monthKey(x.date) === monthKey())
    .reduce((s,x) => s + x.amount, 0);
  document.getElementById('homeSummary').innerHTML = `
    <div class="card"><div class="label">💧 Su</div><div class="value">${waterToday()} ml</div></div>
    <div class="card"><div class="label">🏠 Evde Ürün</div><div class="value">${pantry.length} adet</div></div>
    <div class="card"><div class="label">💰 Bu Ay Market</div><div class="value">${monthTotal.toFixed(0)} TL</div></div>
    <div class="card"><div class="label">🛒 Eksik Ürün</div><div class="value">${shoppingList.filter(s=>!s.checked).length}</div></div>
  `;

  const scored = RECIPES.map(r => ({ r, ...recipeMatch(r) })).sort((a,b) => b.pct - a.pct).slice(0,3);
  document.getElementById('homeRecipes').innerHTML = scored.map(({r,pct}) => `
    <div class="recipe-card">
      <span class="pct ${pct < 60 ? 'low' : ''}">%${pct} malzeme mevcut</span>
      <h4>${r.name}</h4>
    </div>`).join('');

  renderShopping('homeShopping', 5);
}

// ---------- YARDIMCI ----------
function escapeHtml(str){
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderAll(){
  renderHome();
  renderPantry();
  renderRecipes();
  renderShopping('shoppingListEl');
  renderExpenses();
  renderWater();
}

renderAll();
