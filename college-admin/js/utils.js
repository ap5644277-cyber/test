/* =====================================================================
   utils.js  -  ຟັງຊັນຊ່ວຍ, Menu registry, ຕາຕະລາງຄໍລຳລາຍງານ, Excel export
   ===================================================================== */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const CFG = window.APP_CONFIG || {};
const GENDERS = ['ຊາຍ', 'ຍິງ'];

const App = { sb: null, user: null, isAdmin: false, years: [] };

function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}
function errMsg(e) { return (e && (e.message || e.error_description)) || String(e); }

/* ---------- Menu registry (ເພີ່ມເມນູໃໝ່ໃນອະນາຄົດ) ---------- */
const MENUS = [];
/**
 * registerMenu({ id, label, icon, order, adminOnly, render(container) })
 *  - id        : ໃຊ້ເປັນ URL  (#/id)
 *  - render    : async function ທີ່ຂຽນເນື້ອຫາລົງໃນ container
 *  - adminOnly : true = ສະເພາະຜູ້ບໍລິຫານທີ່ລັອກອິນ
 */
function registerMenu(m) {
  const i = MENUS.findIndex(x => x.id === m.id);
  if (i >= 0) MENUS[i] = m; else MENUS.push(m);
}

/* ---------- Toast ---------- */
function toast(msg, type = 'ok') {
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.textContent = msg;
  $('#toast-root').appendChild(el);
  setTimeout(() => el.classList.add('hide'), 3200);
  setTimeout(() => el.remove(), 3700);
}

/* ---------- Modal ---------- */
function openModal({ title, body, footer = '', size = '', isStatic = false, onClose }) {
  const wrap = document.createElement('div');
  wrap.className = 'modal-backdrop';
  wrap.innerHTML =
    `<div class="modal ${size}" role="dialog" aria-modal="true">
       <div class="modal-head"><h3>${esc(title)}</h3>
         <button type="button" class="icon-btn" data-close aria-label="ປິດ">✕</button></div>
       <div class="modal-body"></div>
       <div class="modal-foot"></div>
     </div>`;
  const bodyEl = $('.modal-body', wrap);
  if (typeof body === 'string') bodyEl.innerHTML = body; else bodyEl.appendChild(body);
  const footEl = $('.modal-foot', wrap);
  if (footer) footEl.innerHTML = footer; else footEl.remove();
  $('#modal-root').appendChild(wrap);

  const onKey = e => { if (e.key === 'Escape') close(); };
  function close() {
    if (!wrap.isConnected) return;
    wrap.remove();
    document.removeEventListener('keydown', onKey);
    if (onClose) onClose();
  }
  document.addEventListener('keydown', onKey);
  if (!isStatic) wrap.addEventListener('mousedown', e => { if (e.target === wrap) close(); });
  $$('[data-close]', wrap).forEach(b => b.addEventListener('click', close));
  return { el: wrap, close, $: s => wrap.querySelector(s) };
}

function confirmBox(message, okText = 'ຢືນຢັນ') {
  return new Promise(resolve => {
    let answered = false;
    const m = openModal({
      title: 'ຢືນຢັນ', size: 'sm',
      body: `<p class="confirm-text">${esc(message)}</p>`,
      footer: `<button type="button" class="btn" data-close>ຍົກເລີກ</button>
               <button type="button" class="btn danger" id="c-yes">${esc(okText)}</button>`,
      onClose: () => { if (!answered) resolve(false); }
    });
    m.$('#c-yes').onclick = () => { answered = true; m.close(); resolve(true); };
  });
}

/* ---------- ວັນທີ ລາວ / ອັງກິດ ---------- */
const LAO_MONTHS = ['ມັງກອນ', 'ກຸມພາ', 'ມີນາ', 'ເມສາ', 'ພຶດສະພາ', 'ມິຖຸນາ',
                    'ກໍລະກົດ', 'ສິງຫາ', 'ກັນຍາ', 'ຕຸລາ', 'ພະຈິກ', 'ທັນວາ'];
const EN_MONTHS  = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
function fmtDateLo(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d} ${LAO_MONTHS[+m - 1]} ${y}`;
}
function fmtDateEn(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d} ${EN_MONTHS[+m - 1]} ${y}`;
}

/* ---------- Data helpers ---------- */
async function fetchAll(buildQuery) {          // ດຶງຂໍ້ມູນທັງໝົດ ເກີນ 1000 ແຖວໄດ້
  const size = 1000; let from = 0, all = [];
  for (;;) {
    const { data, error } = await buildQuery().range(from, from + size - 1);
    if (error) throw error;
    all = all.concat(data);
    if (data.length < size) break;
    from += size;
  }
  return all;
}
async function loadYears() {
  const { data, error } = await App.sb.from('academic_years')
    .select('*').order('year_name', { ascending: false });
  if (error) throw error;
  App.years = data;
  return data;
}
function loadStudents() {
  return fetchAll(() => App.sb.from('students')
    .select('*, academic_years(year_name)').order('id', { ascending: false }));
}

/* ---------- Avatar ---------- */
function avatar(r, cls = '') {
  return r.photo_url
    ? `<img class="avatar ${cls}" src="${esc(r.photo_url)}" alt="" loading="lazy">`
    : `<div class="avatar ph ${cls}">👤</div>`;
}

/* ---------- ຄໍລຳລາຍງານ (ຕາມໂຄງສ້າງຕາຕະລາງ students) ---------- */
const REPORT_COLUMNS = [
  { label: 'ລ/ດ',                       get: (r, i) => i + 1, w: 6 },
  { label: 'ສົກຮຽນ',                    get: r => r.academic_years?.year_name || '', w: 12 },
  { label: 'ຮູບພາບ',                    get: r => r.photo_url || '', html: r => avatar(r), excelLabel: 'ຮູບພາບ (ລິ້ງ)', w: 30 },
  { label: 'ຊື່ (ລາວ)',                 get: r => r.first_name_lo || '', w: 16 },
  { label: 'ນາມສະກຸນ (ລາວ)',            get: r => r.last_name_lo || '', w: 18 },
  { label: 'ຊື່ (ອັງກິດ)',              get: r => r.first_name_en || '', w: 16 },
  { label: 'ນາມສະກຸນ (ອັງກິດ)',         get: r => r.last_name_en || '', w: 18 },
  { label: 'ເພດ',                       get: r => r.gender || '', w: 8 },
  { label: 'ວັນເດືອນປີເກີດ (ລາວ)',       get: r => r.birth_date_lo || fmtDateLo(r.birth_date), w: 20 },
  { label: 'ວັນເດືອນປີເກີດ (ອັງກິດ)',    get: r => r.birth_date_en || fmtDateEn(r.birth_date), w: 22 },
  { label: 'ທີ່ເກີດ - ບ້ານ',            get: r => r.birth_village || '', w: 16 },
  { label: 'ທີ່ເກີດ - ເມືອງ',           get: r => r.birth_district || '', w: 16 },
  { label: 'ທີ່ເກີດ - ແຂວງ',            get: r => r.birth_province || '', w: 16 },
  { label: 'ຮຽນຈົບ ມ.7 ຈາກ ມ.ສ',        get: r => r.high_school || '', w: 24 },
  { label: 'ເບີໂທ',                     get: r => r.phone || '', w: 14 },
  { label: 'ເບີໂທພໍ່',                   get: r => r.father_phone || '', w: 14 },
  { label: 'ເບີໂທແມ່',                   get: r => r.mother_phone || '', w: 14 },
  { label: 'ເບີໂທສຸກເສີນ',               get: r => r.emergency_phone || '', w: 14 },
];

/* ---------- ສົ່ງອອກ Excel (SheetJS) ---------- */
function exportExcel(rows, columns, filename, sheetName = 'ຂໍ້ມູນ') {
  if (typeof XLSX === 'undefined') {
    toast('ໂຫຼດ Excel library ບໍ່ສຳເລັດ ກະລຸນາກວດອິນເຕີເນັດ', 'err');
    return;
  }
  if (!rows.length) { toast('ບໍ່ມີຂໍ້ມູນສຳລັບສົ່ງອອກ', 'err'); return; }
  const headers = columns.map(c => c.excelLabel || c.label);
  const data = rows.map((r, i) => {
    const o = {};
    columns.forEach((c, k) => { o[headers[k]] = c.get(r, i); });
    return o;
  });
  const ws = XLSX.utils.json_to_sheet(data, { header: headers });
  ws['!cols'] = columns.map(c => ({ wch: c.w || 16 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  XLSX.writeFile(wb, filename);
  toast('ສົ່ງອອກ Excel ສຳເລັດ');
}
function todayStamp() {
  const d = new Date(), p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
}
