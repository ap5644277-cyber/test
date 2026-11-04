/* ສົກຮຽນ - ລ/ດ, ສົກຮຽນ  (ທຸກຄົນເບິ່ງໄດ້ / ຜູ້ບໍລິຫານເພີ່ມ-ແກ້ໄຂ-ລົບ) */
registerMenu({
  id: 'years', label: 'ສົກຮຽນ', icon: '📅', order: 20,
  async render(root) {
    async function draw() {
      const [years, studs] = await Promise.all([
        loadYears(),
        fetchAll(() => App.sb.from('students').select('id, academic_year_id').order('id'))
      ]);
      const count = id => studs.filter(s => s.academic_year_id === id).length;
      // ລ/ດ ເລີ່ມຈາກ 1 ຕາມລຳດັບສົກຮຽນເກົ່າ -> ໃໝ່
      const asc = [...years].sort((a, b) => a.year_name.localeCompare(b.year_name));

      root.innerHTML = `
        <div class="page-head">
          <div><h2>ສົກຮຽນ</h2><p class="muted">ຕາຕະລາງເກັບກໍາຂໍ້ມູນສົກຮຽນ</p></div>
          ${App.isAdmin ? `<button class="btn primary" id="y-add">＋ ເພີ່ມສົກຮຽນ</button>` : ''}
        </div>
        <section class="card">
          <div class="table-wrap"><table class="tbl">
            <thead><tr><th style="width:80px">ລ/ດ</th><th>ສົກຮຽນ</th><th>ຈຳນວນນັກສຶກສາ</th>
              ${App.isAdmin ? '<th style="width:140px">ຈັດການ</th>' : ''}</tr></thead>
            <tbody>
              ${asc.map((y, i) => `
                <tr><td>${i + 1}</td><td><b>${esc(y.year_name)}</b></td><td>${count(y.id)}</td>
                  ${App.isAdmin ? `<td class="actions">
                    <button class="btn sm" data-edit="${y.id}">✏️ ແກ້ໄຂ</button>
                    <button class="btn sm danger-o" data-del="${y.id}">🗑</button></td>` : ''}
                </tr>`).join('') || `<tr><td colspan="4" class="empty">ຍັງບໍ່ມີຂໍ້ມູນ</td></tr>`}
            </tbody></table></div>
        </section>`;

      if (App.isAdmin) {
        $('#y-add', root).onclick = () => yearForm(null);
        $$('[data-edit]', root).forEach(b => b.onclick = () => yearForm(years.find(y => y.id == b.dataset.edit)));
        $$('[data-del]', root).forEach(b => b.onclick = () => removeYear(years.find(y => y.id == b.dataset.del)));
      }
    }

    function yearForm(year) {
      const m = openModal({
        title: year ? 'ແກ້ໄຂສົກຮຽນ' : 'ເພີ່ມສົກຮຽນ', size: 'sm', isStatic: true,
        body: `<form id="y-form" class="form-grid one">
                 <label class="fld"><span>ສົກຮຽນ <i class="req">*</i></span>
                   <input name="year_name" required placeholder="ຕົວຢ່າງ: 2026-2027"
                     pattern="[0-9]{4}-[0-9]{4}" value="${esc(year?.year_name || '')}" autofocus></label>
                 <p class="hint">ຮູບແບບ: ປີ-ປີ  ເຊັ່ນ 2026-2027</p>
                 <div class="form-err" id="y-err" hidden></div>
               </form>`,
        footer: `<button type="button" class="btn" data-close>ຍົກເລີກ</button>
                 <button type="submit" form="y-form" class="btn primary">ບັນທຶກ</button>`
      });
      m.$('#y-form').addEventListener('submit', async e => {
        e.preventDefault();
        const name = e.target.year_name.value.trim();
        const [a, b] = name.split('-').map(Number);
        const err = m.$('#y-err');
        if (b !== a + 1) { err.textContent = 'ສົກຮຽນຕ້ອງເປັນປີຕໍ່ເນື່ອງກັນ ເຊັ່ນ 2026-2027'; err.hidden = false; return; }
        try {
          const q = year
            ? App.sb.from('academic_years').update({ year_name: name }).eq('id', year.id).select('id')
            : App.sb.from('academic_years').insert({ year_name: name }).select('id');
          const { data, error } = await q;
          if (error) throw error;
          if (!data.length) throw new Error('ບໍ່ມີສິດບັນທຶກ ກະລຸນາເຂົ້າສູ່ລະບົບຜູ້ບໍລິຫານ');
          m.close(); toast('ບັນທຶກສຳເລັດ'); draw();
        } catch (ex) {
          err.textContent = ex.code === '23505' ? 'ມີສົກຮຽນນີ້ແລ້ວ' : errMsg(ex);
          err.hidden = false;
        }
      });
    }

    async function removeYear(year) {
      if (!await confirmBox(`ລົບສົກຮຽນ ${year.year_name} ແທ້ບໍ?`, 'ລົບ')) return;
      const { data, error } = await App.sb.from('academic_years').delete().eq('id', year.id).select('id');
      if (error) return toast(error.code === '23503'
        ? 'ບໍ່ສາມາດລົບ: ມີນັກສຶກສາໃນສົກຮຽນນີ້' : errMsg(error), 'err');
      if (!data.length) return toast('ບໍ່ມີສິດລົບ', 'err');
      toast('ລົບສຳເລັດ'); draw();
    }

    await draw();
  }
});
