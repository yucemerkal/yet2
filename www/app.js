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

// pantry (evdeki ürünler) = tüm zamanların birikimli girişleri: {id, name, kg, price, date}
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
function isThisWeek(dateISO){
  const d = new Date(dateISO);
  const now = new Date();
  const diffDays = (now - d) / (1000*60*60*24);
  return diffDays <= 7;
}

// ---------- SABİT YEMEK LİSTESİ (SADECE EŞLEŞTİRME İÇİN — TARİF METNİ YOK) ----------
// Buradaki isimler sadece pantry ile eşleştirip "bunu yapabilirsin" demek için kullanılıyor.
// Gerçek tarif/video için kullanıcı internete yönlendiriliyor (aşağıdaki link fonksiyonlarına bak).
const DISHES = [
  { name:'Menemen', ingredients:['yumurta','domates','biber','soğan'] },
  { name:'Sebzeli Omlet', ingredients:['yumurta','biber','domates','peynir'] },
  { name:'Domatesli Makarna', ingredients:['makarna','domates','soğan','peynir'] },
  { name:'Tavuklu Makarna', ingredients:['tavuk','makarna','krema','mantar'] },
  { name:'Peynirli Tost', ingredients:['ekmek','peynir'] },
  { name:'Yoğurtlu Elma ve Ceviz', ingredients:['elma','yoğurt','ceviz'] },
  { name:'Sütlü Müsli', ingredients:['süt','müsli'] },
  { name:'Patates Yemeği', ingredients:['patates','soğan','domates'] },
  { name:'Mercimek Çorbası', ingredients:['kırmızı mercimek','soğan','havuç'] },
  { name:'Izgara Tavuk Salata', ingredients:['tavuk','marul','domates'] },
];

function pantryNames(){
  return pantry.map(p => p.name.trim().toLowerCase());
}
function dishMatch(dish){
  const names = pantryNames();
  const have = dish.ingredients.filter(ing => names.some(n => n.includes(ing) || ing.includes(n)));
  const missing = dish.ingredients.filter(ing => !have.includes(ing));
  const pct = Math.round((have.length / dish.ingredients.length) * 100);
  return { pct, missing };
}

// ---------- İNTERNET YÖNLENDİRME LİNKLERİ ----------
function youtubeSearchUrl(q){ return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q); }
function googleSearchUrl(q){ return 'https://www.google.com/search?q=' + encodeURIComponent(q); }
function nefisSearchUrl(q){ return 'https://www.nefisyemektarifleri.com/arama/?s=' + encodeURIComponent(q); }
function yemekComSearchUrl(q){ return 'https://yemek.com/arama/?q=' + encodeURIComponent(q); }

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

// ---------- HAFTALIK ALIŞVERİŞ GİRİŞİ (ANA SAYFA) ----------
document.getElementById('weeklyForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = document.getElementById('weeklyName').value.trim();
  const kg = parseFloat(document.getElementById('weeklyKg').value);
  const price = parseFloat(document.getElementById('weeklyPrice').value);
  if(!name || isNaN(kg) || isNaN(price)) return;
  pantry.push({ id: uid(), name, kg, price, date: new Date().toISOString() });
  save();
  e.target.reset();
  renderAll();
});

function renderWeekly(){
  const weekItems = pantry.filter(p => isThisWeek(p.date));
  const totalKg = weekItems.reduce((s,p) => s + p.kg, 0);
  const totalPrice = weekItems.reduce((s,p) => s + p.price, 0);

  document.getElementById('weeklySummary').innerHTML = `
    <div class="card"><div class="label">📦 Bu Hafta Toplam Kilo</div><div class="value">${totalKg.toFixed(1)} kg</div></div>
    <div class="card"><div class="label">💰 Bu Hafta Toplam Harcama</div><div class="value">${totalPrice.toFixed(0)} TL</div></div>
  `;

  const el = document.getElementById('weeklyList');
  if(weekItems.length === 0){ el.innerHTML = '<p class="empty">Bu hafta henüz ürün girmedin.</p>'; return; }
  el.innerHTML = [...weekItems].reverse().map(p => `
    <li>
      <div>
        <span class="name">${escapeHtml(p.name)}</span>
        <div class="meta">${p.kg} kg · ${p.price.toFixed(0)} TL</div>
      </div>
      <button class="del" onclick="removePantry('${p.id}')">✕</button>
    </li>`).join('');
}

// ---------- PİŞİR BUTONU ----------
document.getElementById('cookBtn').addEventListener('click', () => {
  renderRecipeLinks();
  switchTab('recipes');
});

function renderRecipeLinks(){
  const el = document.getElementById('recipeLinks');

  if(pantry.length === 0){
    el.innerHTML = '<p class="empty">Önce Ana Sayfa\'dan evine aldığın ürünleri gir.</p>';
    return;
  }

  const scored = DISHES.map(d => ({ d, ...dishMatch(d) }))
    .filter(x => x.pct > 0)
    .sort((a,b) => b.pct - a.pct);

  const allNames = [...new Set(pantry.map(p => p.name.trim()))];
  const generalQuery = allNames.join(', ') + ' ile ne yapılır';

  let html = `
    <div class="recipe-card general">
      <h4>🔎 Elimdekilerle Genel Arama</h4>
      <div class="meta">${escapeHtml(allNames.join(', '))}</div>
      <div class="link-row">
        <a class="src-link yt" target="_blank" href="${youtubeSearchUrl(generalQuery)}">🎥 YouTube'da Video</a>
        <a class="src-link" target="_blank" href="${googleSearchUrl(generalQuery)}">📝 Google'da Tarif</a>
      </div>
    </div>
  `;

  if(scored.length === 0){
    html += '<p class="empty">Evindeki ürünlerle tam eşleşen bir yemek bulamadık, yukarıdaki genel aramayı deneyebilirsin.</p>';
  } else {
    html += scored.map(({d, pct, missing}) => `
      <div class="recipe-card">
        <span class="pct ${pct < 60 ? 'low' : ''}">%${pct} malzeme mevcut</span>
        <h4>${d.name}</h4>
        ${missing.length ? `<div class="missing">Eksik: ${missing.join(', ')}</div>` : '<div>✅ Tüm malzemeler evde</div>'}
        <div class="link-row">
          <a class="src-link yt" target="_blank" href="${youtubeSearchUrl(d.name + ' tarifi')}">🎥 YouTube</a>
          <a class="src-link" target="_blank" href="${googleSearchUrl(d.name + ' tarifi')}">📝 Google</a>
          <a class="src-link" target="_blank" href="${nefisSearchUrl(d.name)}">🍲 Nefis Yemek Tarifleri</a>
          <a class="src-link" target="_blank" href="${yemekComSearchUrl(d.name)}">🍽️ Yemek.com</a>
        </div>
        ${missing.length ? `<button class="add-missing" onclick='addMissingToList(${JSON.stringify(missing)})'>Eksikleri Market Listesine Ekle</button>` : ''}
      </div>
    `).join('');
  }

  el.innerHTML = html;
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

// ---------- KİLER (EVDEKİ ÜRÜNLER LİSTESİ) ----------
function renderPantry(){
  const el = document.getElementById('pantryList');
  if(pantry.length === 0){ el.innerHTML = '<p class="empty">Kilerin boş. Ana Sayfa\'dan ürün ekleyebilirsin.</p>'; return; }
  el.innerHTML = [...pantry].reverse().map(p => `
    <li>
      <div>
        <span class="name">${escapeHtml(p.name)}</span>
        <div class="meta">${p.kg} kg · ${p.price.toFixed(0)} TL · ${new Date(p.date).toLocaleDateString('tr-TR')}</div>
      </div>
      <button class="del" onclick="removePantry('${p.id}')">✕</button>
    </li>`).join('');
}
function removePantry(id){
  pantry = pantry.filter(p => p.id !== id);
  save(); renderAll();
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
function renderShopping(){
  const el = document.getElementById('shoppingListEl');
  if(shoppingList.length === 0){ el.innerHTML = '<p class="empty">Market listesi boş.</p>'; return; }
  el.innerHTML = shoppingList.map(s => `
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

// ---------- HARCAMA TAKİBİ (İSTATİSTİKLER) ----------
function renderExpenses(){
  const thisMonth = monthKey();
  const pantryMonthTotal = pantry.filter(p => monthKey(p.date) === thisMonth)
    .reduce((sum,p) => sum + p.price, 0);
  const otherMonthTotal = expenses.filter(x => monthKey(x.date) === thisMonth)
    .reduce((sum,x) => sum + x.amount, 0);
  const monthTotal = pantryMonthTotal + otherMonthTotal;

  document.getElementById('expenseSummary').innerHTML = `
    <div class="card"><div class="label">Bu Ay Toplam Harcama</div><div class="value">${monthTotal.toFixed(0)} TL</div></div>
    <div class="card"><div class="label">Bu Ay Market (kg girişleri)</div><div class="value">${pantryMonthTotal.toFixed(0)} TL</div></div>
  `;

  const history = [...pantry].map(p => ({ date:p.date, label:p.name, amount:p.price }))
    .concat(expenses.map(x => ({ date:x.date, label:x.category, amount:x.amount })))
    .sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0,10);

  document.getElementById('expenseHistory').innerHTML = history.length ? history.map(x => `
    <li>
      <div>
        <span class="name">${escapeHtml(x.label)}</span>
        <div class="meta">${new Date(x.date).toLocaleDateString('tr-TR')}</div>
      </div>
      <b>${x.amount.toFixed(0)} TL</b>
    </li>`).join('') : '<p class="empty">Henüz harcama kaydı yok.</p>';
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

// ---------- YARDIMCI ----------
function escapeHtml(str){
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderAll(){
  renderWeekly();
  renderPantry();
  renderShopping();
  renderExpenses();
  renderWater();
}

renderAll();
