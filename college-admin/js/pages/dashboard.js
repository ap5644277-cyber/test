/* ໜ້າຫຼັກ - ສະຫຼຸບພາບລວມ (ທຸກຄົນເບິ່ງໄດ້) */
registerMenu({
  id: 'dashboard', label: 'ໜ້າຫຼັກ', icon: '🏠', order: 10,
  async render(root) {
    const [years, students] = await Promise.all([
      loadYears(),
      fetchAll(() => App.sb.from('students').select('id, academic_year_id, gender').order('id'))
    ]);
    const male = students.filter(s => s.gender === 'ຊາຍ').length;
    const female = students.filter(s => s.gender === 'ຍິງ').length;
    const perYear = years.map(y => ({
      name: y.year_name,
      n: students.filter(s => s.academic_year_id === y.id).length
    }));
    const max = Math.max(1, ...perYear.map(p => p.n));

    root.innerHTML = `
      <section class="hero">
        <h2>${esc(CFG.COLLEGE_NAME || 'ວິທະຍາໄລ')}</h2>
        <p>ລະບົບບໍລິຫານຂໍ້ມູນນັກສຶກສາ · ເບິ່ງຂໍ້ມູນໄດ້ທຸກເວລາ 24 ຊົ່ວໂມງ</p>
      </section>

      <div class="stat-grid">
        <div class="stat"><div class="stat-ico">🧑‍🎓</div><div><b>${students.length}</b><span>ນັກສຶກສາທັງໝົດ</span></div></div>
        <div class="stat"><div class="stat-ico">👨</div><div><b>${male}</b><span>ຊາຍ</span></div></div>
        <div class="stat"><div class="stat-ico">👩</div><div><b>${female}</b><span>ຍິງ</span></div></div>
        <div class="stat"><div class="stat-ico">📅</div><div><b>${years.length}</b><span>ສົກຮຽນ</span></div></div>
      </div>

      <section class="card">
        <h3 class="card-title">ຈຳນວນນັກສຶກສາແຍກຕາມສົກຮຽນ</h3>
        ${perYear.length ? `<div class="bars">${perYear.map(p => `
          <div class="bar-row">
            <span class="bar-label">${esc(p.name)}</span>
            <div class="bar-track"><div class="bar-fill" style="width:${(p.n / max) * 100}%"></div></div>
            <span class="bar-val">${p.n}</span>
          </div>`).join('')}</div>`
          : `<p class="empty">ຍັງບໍ່ມີສົກຮຽນ</p>`}
      </section>

      <div class="quick">
        <a class="btn primary" href="#/students">ເບິ່ງປະຫວັດນັກສຶກສາ</a>
        <a class="btn" href="#/reports">ເບິ່ງລາຍງານ</a>
      </div>`;
  }
});
