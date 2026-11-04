/* ລາຍງານ - ຕາມໂຄງສ້າງຕາຕະລາງເກັບກໍາປະຫວັດນັກສຶກສາ  (ສົ່ງອອກ Excel / ພິມ) */
registerMenu({
  id: 'reports', label: 'ລາຍງານ', icon: '📊', order: 40,
  async render(root) {
    const [rows] = await Promise.all([loadStudents(), loadYears()]);
    const st = { year: '', gender: '', province: '', q: '' };
    const provinces = [...new Set(rows.map(r => (r.birth_province || '').trim()).filter(Boolean))].sort();

    root.innerHTML = `
      <div class="page-head no-print">
        <div><h2>ລາຍງານນັກສຶກສາ</h2><p class="muted">ກັ່ນຕອງຂໍ້ມູນ ແລ້ວສົ່ງອອກ Excel ຫຼື ພິມ</p></div>
        <div class="head-actions">
          <button class="btn" id="r-print">🖨 ພິມ</button>
          <button class="btn primary" id="r-xls">📥 ສົ່ງອອກ Excel</button>
        </div>
      </div>
      <section class="card">
        <div class="toolbar no-print">
          <select id="r-year"><option value="">ທຸກສົກຮຽນ</option>
            ${App.years.map(y => `<option value="${y.id}">${esc(y.year_name)}</option>`).join('')}</select>
          <select id="r-gender"><option value="">ທຸກເພດ</option>
            ${GENDERS.map(g => `<option>${g}</option>`).join('')}</select>
          <select id="r-prov"><option value="">ທຸກແຂວງ</option>
            ${provinces.map(p => `<option>${esc(p)}</option>`).join('')}</select>
          <input id="r-q" type="search" placeholder="ຄົ້ນຫາ...">
        </div>
        <div class="print-only print-head">
          <h3>${esc(CFG.COLLEGE_NAME || 'ວິທະຍາໄລ')} - ລາຍງານປະຫວັດນັກສຶກສາ</h3>
          <div id="r-filter-text"></div>
        </div>
        <div id="r-sum" class="stat-grid small"></div>
        <div id="r-prov-sum" class="chips"></div>
        <div class="table-wrap"><table class="tbl report-tbl">
          <thead><tr>${REPORT_COLUMNS.map(c => `<th>${esc(c.label)}</th>`).join('')}</tr></thead>
          <tbody id="r-body"></tbody></table></div>
      </section>`;

    const filtered = () => {
      const q = st.q.trim().toLowerCase();
      return rows.filter(r =>
        (!st.year || String(r.academic_year_id) === st.year) &&
        (!st.gender || r.gender === st.gender) &&
        (!st.province || (r.birth_province || '').trim() === st.province) &&
        (!q || REPORT_COLUMNS.map(c => String(c.get(r, 0))).join(' ').toLowerCase().includes(q)));
    };

    function draw() {
      const list = filtered();
      const m = list.filter(r => r.gender === 'ຊາຍ').length;
      const f = list.filter(r => r.gender === 'ຍິງ').length;
      $('#r-sum', root).innerHTML = `
        <div class="stat"><div><b>${list.length}</b><span>ທັງໝົດ</span></div></div>
        <div class="stat"><div><b>${m}</b><span>ຊາຍ</span></div></div>
        <div class="stat"><div><b>${f}</b><span>ຍິງ</span></div></div>`;

      const byProv = {};
      list.forEach(r => { const p = (r.birth_province || '').trim() || 'ບໍ່ລະບຸ'; byProv[p] = (byProv[p] || 0) + 1; });
      $('#r-prov-sum', root).innerHTML = Object.entries(byProv).sort((a, b) => b[1] - a[1])
        .map(([p, n]) => `<span class="chip">${esc(p)} <b>${n}</b></span>`).join('');

      $('#r-body', root).innerHTML = list.map((r, i) =>
        `<tr>${REPORT_COLUMNS.map(c => `<td>${c.html ? c.html(r, i) : esc(c.get(r, i))}</td>`).join('')}</tr>`
      ).join('') || `<tr><td colspan="${REPORT_COLUMNS.length}" class="empty">ບໍ່ພົບຂໍ້ມູນ</td></tr>`;

      const yn = App.years.find(y => String(y.id) === st.year)?.year_name;
      $('#r-filter-text', root).textContent =
        [yn && `ສົກຮຽນ ${yn}`, st.gender && `ເພດ ${st.gender}`, st.province && `ແຂວງ ${st.province}`]
          .filter(Boolean).join(' · ') || 'ທຸກສົກຮຽນ';
    }

    $('#r-year', root).onchange = e => { st.year = e.target.value; draw(); };
    $('#r-gender', root).onchange = e => { st.gender = e.target.value; draw(); };
    $('#r-prov', root).onchange = e => { st.province = e.target.value; draw(); };
    $('#r-q', root).oninput = e => { st.q = e.target.value; draw(); };
    $('#r-print', root).onclick = () => window.print();
    $('#r-xls', root).onclick = () =>
      exportExcel(filtered(), REPORT_COLUMNS, `student-report_${todayStamp()}.xlsx`, 'ລາຍງານນັກສຶກສາ');
    draw();
  }
});
