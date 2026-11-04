/* =====================================================================
   app.js  -  ເລີ່ມຕົ້ນລະບົບ, router, ເມນູ
   ===================================================================== */
let routeToken = 0;

const currentId = () => (location.hash.replace(/^#\/?/, '').split('?')[0]) || 'dashboard';
const sortedMenus = () => [...MENUS].sort((a, b) => (a.order || 100) - (b.order || 100));

function renderMenu() {
  const cur = currentId();
  $('#menu').innerHTML = sortedMenus().filter(m => !m.adminOnly || App.isAdmin).map(m =>
    `<a href="#/${esc(m.id)}" class="${m.id === cur ? 'active' : ''}">
       <span class="mi">${m.icon || '•'}</span><span>${esc(m.label)}</span></a>`).join('');
}

function renderAuthBox() {
  const box = $('#auth-box'), badge = $('#role-badge');
  if (App.isAdmin) {
    box.innerHTML = `<div class="who"><span class="dot ok"></span>
        <div><small>ຜູ້ບໍລິຫານ</small><div class="em">${esc(App.user.email)}</div></div></div>
      <button class="btn sm ghost-light" id="btn-logout">ອອກຈາກລະບົບ</button>`;
    badge.innerHTML = '<span class="pill admin">ໂໝດຜູ້ບໍລິຫານ</span>';
    $('#btn-logout').onclick = async () => { await logout(); afterAuthChange(); toast('ອອກຈາກລະບົບແລ້ວ'); };
  } else {
    box.innerHTML = `<div class="who"><span class="dot"></span><div><small>ໂໝດເບິ່ງຢ່າງດຽວ</small></div></div>
      <button class="btn sm primary" id="btn-login">🔐 ເຂົ້າສູ່ລະບົບຜູ້ບໍລິຫານ</button>`;
    badge.innerHTML = '<span class="pill">ເບິ່ງຢ່າງດຽວ</span>';
    $('#btn-login').onclick = () => openLoginForm(afterAuthChange);
  }
}

function afterAuthChange() { renderAuthBox(); renderMenu(); route(); }

async function route() {
  const token = ++routeToken;
  const id = currentId();
  const menu = MENUS.find(m => m.id === id) || sortedMenus()[0];
  renderMenu();
  $('#page-title').textContent = menu.label;
  $('#sidebar').classList.remove('open');
  const view = $('#view');

  if (menu.adminOnly && !App.isAdmin) {
    view.innerHTML = `<section class="card center"><h3>🔒 ສະເພາະຜູ້ບໍລິຫານ</h3>
      <p class="muted">ກະລຸນາເຂົ້າສູ່ລະບົບເພື່ອໃຊ້ເມນູນີ້</p>
      <button class="btn primary" id="need-login">ເຂົ້າສູ່ລະບົບ</button></section>`;
    $('#need-login').onclick = () => openLoginForm(afterAuthChange);
    return;
  }
  view.innerHTML = '<div class="loading"><span class="spin"></span> ກຳລັງໂຫຼດ...</div>';
  const container = document.createElement('div');       // ກັນບັນຫາ race ເວລາປ່ຽນໜ້າໄວ
  try {
    await menu.render(container);
    if (token !== routeToken) return;
    view.replaceChildren(container);
    window.scrollTo(0, 0);
  } catch (e) {
    if (token !== routeToken) return;
    console.error(e);
    view.innerHTML = `<section class="card center"><h3>⚠️ ເກີດຂໍ້ຜິດພາດ</h3>
      <p class="muted">${esc(errMsg(e))}</p>
      <p class="hint">ກວດວ່າໄດ້ຮັນ supabase/schema.sql ແລ້ວ ແລະ ຄ່າໃນ js/config.js ຖືກຕ້ອງ</p>
      <button class="btn" onclick="route()">ລອງໃໝ່</button></section>`;
  }
}

function showSetupGuide() {
  $('#menu').innerHTML = '';
  $('#auth-box').innerHTML = '';
  $('#page-title').textContent = 'ຕັ້ງຄ່າລະບົບ';
  $('#view').innerHTML = `
    <section class="card">
      <h3>⚙️ ຍັງບໍ່ໄດ້ຕັ້ງຄ່າ Supabase</h3>
      <ol class="steps">
        <li>ສ້າງ Project ໃນ <b>supabase.com</b></li>
        <li>ເປີດ <b>SQL Editor</b> ແລ້ວຮັນໄຟລ໌ <code>supabase/schema.sql</code></li>
        <li>ເອົາ <b>Project URL</b> ແລະ <b>anon public key</b> (Project Settings → API) ໄປໃສ່ໄຟລ໌ <code>js/config.js</code></li>
        <li>ບັນທຶກ ແລ້ວ Refresh ໜ້ານີ້</li>
      </ol>
      <p class="hint">ລາຍລະອຽດຄົບຖ້ວນຢູ່ໃນໄຟລ໌ README.md</p>
    </section>`;
}

async function boot() {
  $('#btn-burger').onclick = () => $('#sidebar').classList.toggle('open');
  if (!initSupabase()) { showSetupGuide(); return; }
  try { if (await refreshAuth() === 'not_admin') toast('ບັນຊີນີ້ບໍ່ມີສິດຜູ້ບໍລິຫານ', 'err'); }
  catch (e) { console.error(e); }
  renderAuthBox();
  App.sb.auth.onAuthStateChange(evt => {
    if (evt === 'SIGNED_OUT' && App.isAdmin) setTimeout(() => { App.user = null; App.isAdmin = false; afterAuthChange(); }, 0);
  });
  window.addEventListener('hashchange', route);
  route();
}
document.addEventListener('DOMContentLoaded', boot);
