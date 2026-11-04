/* ປະຫວັດນັກສຶກສາ - ທຸກຄົນເບິ່ງໄດ້ / ຜູ້ບໍລິຫານເພີ່ມ-ແກ້ໄຂ-ລົບ */
(function () {
  const FIELDS = ['academic_year_id', 'first_name_lo', 'last_name_lo', 'first_name_en', 'last_name_en',
    'gender', 'birth_date', 'birth_date_lo', 'birth_date_en', 'birth_village', 'birth_district',
    'birth_province', 'high_school', 'phone', 'father_phone', 'mother_phone', 'emergency_phone'];

  /* ---------- ຮູບພາບ ---------- */
  async function uploadPhoto(file) {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const path = `${new Date().getFullYear()}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await App.sb.storage.from(CFG.PHOTO_BUCKET)
      .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
    if (error) throw error;
    return App.sb.storage.from(CFG.PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
  }
  function photoPath(url) {
    if (!url) return null;
    const marker = `/${CFG.PHOTO_BUCKET}/`;
    const i = url.indexOf(marker);
    return i < 0 ? null : decodeURIComponent(url.slice(i + marker.length).split('?')[0]);
  }
  async function removePhoto(url) {               // ພະຍາຍາມລົບ ບໍ່ເປັນບັນຫາຖ້າລົ້ມເຫຼວ
    const p = photoPath(url);
    if (p) { try { await App.sb.storage.from(CFG.PHOTO_BUCKET).remove([p]); } catch (_) { /* ignore */ } }
  }

  /* ---------- ຟອມ ເພີ່ມ / ແກ້ໄຂ ---------- */
  const fld = (name, label, v, o = {}) =>
    `<label class="fld ${o.span ? 'span2' : ''}"><span>${label}${o.req ? '<i class="req">*</i>' : ''}</span>
       <input name="${name}" type="${o.type || 'text'}" value="${esc(v ?? '')}" ${o.req ? 'required' : ''}
         ${o.ph ? `placeholder="${esc(o.ph)}"` : ''} ${o.attr || ''}></label>`;

  function studentForm(s, onSaved) {
    const isEdit = !!s;
    s = s || {};
    const yearOpts = App.years.map(y =>
      `<option value="${y.id}" ${y.id === s.academic_year_id ? 'selected' : ''}>${esc(y.year_name)}</option>`).join('');
    const m = openModal({
      title: isEdit ? 'ແກ້ໄຂປະຫວັດນັກສຶກສາ' : 'ເພີ່ມນັກສຶກສາ', size: 'lg', isStatic: true,
      body: `<form id="s-form" class="form-grid">
        <label class="fld"><span>ເລືອກສົກຮຽນ<i class="req">*</i></span>
          <select name="academic_year_id" required><option value="">-- ເລືອກ --</option>${yearOpts}</select></label>
        <div class="fld photo-fld">
          <span>ຮູບພາບ</span>
          <div class="photo-row">
            <div id="photo-prev">${avatar(s, 'lg')}</div>
            <input type="file" name="photo" accept="image/jpeg,image/png,image/webp">
          </div>
          <small class="hint">JPG / PNG / WEBP ບໍ່ເກີນ 2 MB</small>
        </div>

        ${fld('first_name_lo', 'ຊື່ (ພາສາລາວ)', s.first_name_lo, { req: true })}
        ${fld('last_name_lo', 'ນາມສະກຸນ (ພາສາລາວ)', s.last_name_lo, { req: true })}
        ${fld('first_name_en', 'ຊື່ (ພາສາອັງກິດ)', s.first_name_en)}
        ${fld('last_name_en', 'ນາມສະກຸນ (ພາສາອັງກິດ)', s.last_name_en)}

        <label class="fld"><span>ເພດ</span>
          <select name="gender"><option value="">-- ເລືອກ --</option>
            ${GENDERS.map(g => `<option ${g === s.gender ? 'selected' : ''}>${g}</option>`).join('')}</select></label>
        ${fld('birth_date', 'ວັນເດືອນປີເກີດ', s.birth_date, { type: 'date' })}
        ${fld('birth_date_lo', 'ວັນເດືອນປີເກີດ (ພາສາລາວ)', s.birth_date_lo, { ph: '01 ກັນຍາ 2000' })}
        ${fld('birth_date_en', 'ວັນເດືອນປີເກີດ (ພາສາອັງກິດ)', s.birth_date_en, { ph: '01 September 2000' })}

        ${fld('birth_village', 'ທີ່ເກີດ: ບ້ານ', s.birth_village)}
        ${fld('birth_district', 'ທີ່ເກີດ: ເມືອງ', s.birth_district)}
        ${fld('birth_province', 'ທີ່ເກີດ: ແຂວງ', s.birth_province)}
        ${fld('high_school', 'ຮຽນຈົບ ມ.7 ຈາກ ມ.ສ ໃດ?', s.high_school)}

        ${fld('phone', 'ເບີໂທ', s.phone, { type: 'tel' })}
        ${fld('father_phone', 'ເບີໂທພໍ່', s.father_phone, { type: 'tel' })}
        ${fld('mother_phone', 'ເບີໂທແມ່', s.mother_phone, { type: 'tel' })}
        ${fld('emergency_phone', 'ເບີໂທສຸກເສີນ', s.emergency_phone, { type: 'tel' })}
        <div class="form-err span2" id="s-err" hidden></div>
      </form>`,
      footer: `<button type="button" class="btn" data-close>ຍົກເລີກ</button>
               <button type="submit" form="s-form" class="btn primary" id="s-save">💾 ບັນທຶກ</button>`
    });
    const form = m.$('#s-form');

    // ເລືອກວັນເກີດ -> ເຕີມຮູບແບບ ລາວ/ອັງກິດ ໃຫ້ອັດຕະໂນມັດ (ແກ້ໄຂເອງໄດ້)
    form.birth_date.addEventListener('change', () => {
      form.birth_date_lo.value = fmtDateLo(form.birth_date.value);
      form.birth_date_en.value = fmtDateEn(form.birth_date.value);
    });
    // preview ຮູບ
    form.photo.addEventListener('change', () => {
      const f = form.photo.files[0];
      if (f) m.$('#photo-prev').innerHTML = `<img class="avatar lg" src="${URL.createObjectURL(f)}" alt="">`;
    });

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const err = m.$('#s-err'), btn = m.$('#s-save');
      err.hidden = true;
      const fd = new FormData(form);
      const rec = {};
      FIELDS.forEach(f => { rec[f] = (fd.get(f) || '').toString().trim() || null; });
      rec.academic_year_id = Number(rec.academic_year_id);
      if (rec.birth_date) {
        rec.birth_date_lo = rec.birth_date_lo || fmtDateLo(rec.birth_date);
        rec.birth_date_en = rec.birth_date_en || fmtDateEn(rec.birth_date);
      }
      rec.updated_at = new Date().toISOString();

      const file = form.photo.files[0];
      if (file) {
        if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { err.textContent = 'ຮູບຕ້ອງເປັນ JPG / PNG / WEBP'; err.hidden = false; return; }
        if (file.size > 2 * 1024 * 1024) { err.textContent = 'ຮູບໃຫຍ່ເກີນ 2 MB'; err.hidden = false; return; }
      }

      btn.disabled = true; btn.textContent = 'ກຳລັງບັນທຶກ...';
      let newUrl = null;
      try {
        if (file) { newUrl = await uploadPhoto(file); rec.photo_url = newUrl; }
        const q = isEdit
          ? App.sb.from('students').update(rec).eq('id', s.id).select('id')
          : App.sb.from('students').insert(rec).select('id');
        const { data, error } = await q;
        if (error) throw error;
        if (!data.length) throw new Error('ບໍ່ມີສິດບັນທຶກ ກະລຸນາເຂົ້າສູ່ລະບົບຜູ້ບໍລິຫານ');
        if (newUrl && isEdit && s.photo_url) removePhoto(s.photo_url);
        m.close(); toast('ບັນທຶກສຳເລັດ'); onSaved();
      } catch (ex) {
        if (newUrl) removePhoto(newUrl);
        err.textContent = errMsg(ex); err.hidden = false;
        btn.disabled = false; btn.textContent = '💾 ບັນທຶກ';
      }
    });
  }

  /* ---------- ລາຍລະອຽດ (ເບິ່ງຢ່າງດຽວ) ---------- */
  function showDetail(s, onChanged) {
    const items = REPORT_COLUMNS.filter(c => c.label !== 'ລ/ດ' && c.label !== 'ຮູບພາບ')
      .map(c => `<div class="kv"><dt>${esc(c.label)}</dt><dd>${esc(c.get(s, 0)) || '<span class="muted">-</span>'}</dd></div>`).join('');
    const m = openModal({
      title: 'ປະຫວັດນັກສຶກສາ', size: 'lg',
      body: `<div class="detail">
               <div class="detail-photo">${avatar(s, 'xl')}
                 <div class="detail-name">${esc(s.first_name_lo)} ${esc(s.last_name_lo)}</div>
                 <div class="muted">${esc(s.first_name_en || '')} ${esc(s.last_name_en || '')}</div></div>
               <dl class="kv-grid">${items}</dl></div>`,
      footer: App.isAdmin
        ? `<button type="button" class="btn danger-o" id="d-del">🗑 ລົບ</button>
           <span class="spacer"></span>
           <button type="button" class="btn" data-close>ປິດ</button>
           <button type="button" class="btn primary" id="d-edit">✏️ ແກ້ໄຂ</button>`
        : `<span class="spacer"></span><button type="button" class="btn" data-close>ປິດ</button>`
    });
    if (App.isAdmin) {
      m.$('#d-edit').onclick = () => { m.close(); studentForm(s, onChanged); };
      m.$('#d-del').onclick = () => { m.close(); removeStudent(s, onChanged); };
    }
  }

  async function removeStudent(s, onChanged) {
    if (!await confirmBox(`ລົບ ${s.first_name_lo} ${s.last_name_lo} ແທ້ບໍ? ການລົບບໍ່ສາມາດກູ້ຄືນໄດ້`, 'ລົບ')) return;
    const { data, error } = await App.sb.from('students').delete().eq('id', s.id).select('id');
    if (error) return toast(errMsg(error), 'err');
    if (!data.length) return toast('ບໍ່ມີສິດລົບ', 'err');
    removePhoto(s.photo_url);
    toast('ລົບສຳເລັດ'); onChanged();
  }

  /* ---------- ໜ້າລາຍການ ---------- */
  registerMenu({
    id: 'students', label: 'ປະຫວັດນັກສຶກສາ', icon: '🧑‍🎓', order: 30,
    async render(root) {
      const st = { rows: [], year: '', q: '', page: 1, per: 20 };
      await loadYears();

      root.innerHTML = `
        <div class="page-head">
          <div><h2>ປະຫວັດນັກສຶກສາ</h2><p class="muted">ຄລິກແຖວເພື່ອເບິ່ງລາຍລະອຽດ</p></div>
          <div class="head-actions">
            <button class="btn" id="s-xls">📥 ສົ່ງອອກ Excel</button>
            <button class="btn primary" id="s-add">＋ ເພີ່ມນັກສຶກສາ</button>
          </div>
        </div>
        <section class="card">
          <div class="toolbar">
            <select id="f-year"><option value="">ທຸກສົກຮຽນ</option>
              ${App.years.map(y => `<option value="${y.id}">${esc(y.year_name)}</option>`).join('')}</select>
            <input id="f-q" type="search" placeholder="ຄົ້ນຫາ ຊື່, ເບີໂທ, ແຂວງ, ມ.ສ...">
            <span class="muted" id="f-count"></span>
          </div>
          <div id="tbl"></div>
        </section>`;

      const filtered = () => {
        const q = st.q.trim().toLowerCase();
        return st.rows.filter(r =>
          (!st.year || String(r.academic_year_id) === st.year) &&
          (!q || [r.first_name_lo, r.last_name_lo, r.first_name_en, r.last_name_en, r.phone,
                  r.birth_province, r.birth_district, r.high_school].join(' ').toLowerCase().includes(q)));
      };

      function drawTable() {
        const rows = filtered();
        const pages = Math.max(1, Math.ceil(rows.length / st.per));
        if (st.page > pages) st.page = pages;
        const start = (st.page - 1) * st.per;
        const slice = rows.slice(start, start + st.per);
        $('#f-count', root).textContent = `ທັງໝົດ ${rows.length} ຄົນ`;
        $('#tbl', root).innerHTML = `
          <div class="table-wrap"><table class="tbl clickable">
            <thead><tr><th>ລ/ດ</th><th>ຮູບ</th><th>ສົກຮຽນ</th><th>ຊື່ ແລະ ນາມສະກຸນ</th><th>ເພດ</th>
              <th>ວັນເດືອນປີເກີດ</th><th>ແຂວງເກີດ</th><th>ເບີໂທ</th>${App.isAdmin ? '<th>ຈັດການ</th>' : ''}</tr></thead>
            <tbody>${slice.map((r, i) => `
              <tr data-id="${r.id}">
                <td>${start + i + 1}</td><td>${avatar(r)}</td>
                <td>${esc(r.academic_years?.year_name)}</td>
                <td><div class="nm">${esc(r.first_name_lo)} ${esc(r.last_name_lo)}</div>
                    <div class="sub">${esc(r.first_name_en || '')} ${esc(r.last_name_en || '')}</div></td>
                <td>${esc(r.gender)}</td>
                <td>${esc(r.birth_date_lo || fmtDateLo(r.birth_date))}</td>
                <td>${esc(r.birth_province)}</td><td>${esc(r.phone)}</td>
                ${App.isAdmin ? `<td class="actions">
                  <button class="btn sm" data-act="edit" data-id="${r.id}">✏️</button>
                  <button class="btn sm danger-o" data-act="del" data-id="${r.id}">🗑</button></td>` : ''}
              </tr>`).join('') || `<tr><td colspan="9" class="empty">ບໍ່ພົບຂໍ້ມູນ</td></tr>`}
            </tbody></table></div>
          <div class="pager">
            <button class="btn sm" id="pg-prev" ${st.page <= 1 ? 'disabled' : ''}>‹ ກ່ອນໜ້າ</button>
            <span>ໜ້າ ${st.page} / ${pages}</span>
            <button class="btn sm" id="pg-next" ${st.page >= pages ? 'disabled' : ''}>ຕໍ່ໄປ ›</button>
          </div>`;
      }

      async function reload() {
        const [rows] = await Promise.all([loadStudents(), loadYears()]);
        st.rows = rows; drawTable();
      }

      root.addEventListener('click', e => {
        const t = e.target;
        if (t.id === 'pg-prev') { st.page--; drawTable(); return; }
        if (t.id === 'pg-next') { st.page++; drawTable(); return; }
        const btn = t.closest('[data-act]');
        const tr = t.closest('tr[data-id]');
        const row = st.rows.find(r => r.id == (btn?.dataset.id || tr?.dataset.id));
        if (!row) return;
        if (btn?.dataset.act === 'edit') studentForm(row, reload);
        else if (btn?.dataset.act === 'del') removeStudent(row, reload);
        else showDetail(row, reload);
      });
      $('#f-year', root).onchange = e => { st.year = e.target.value; st.page = 1; drawTable(); };
      $('#f-q', root).oninput = e => { st.q = e.target.value; st.page = 1; drawTable(); };
      $('#s-xls', root).onclick = () =>
        exportExcel(filtered(), REPORT_COLUMNS, `students_${todayStamp()}.xlsx`, 'ນັກສຶກສາ');
      $('#s-add', root).onclick = () => studentForm(null, reload);

      await reload();
    }
  });
})();