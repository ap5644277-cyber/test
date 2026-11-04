/* =====================================================================
   auth.js  -  ເຊື່ອມ Supabase + ລະບົບເຂົ້າສູ່ລະບົບຜູ້ບໍລິຫານ
   ===================================================================== */
function initSupabase() {
  if (!CFG.SUPABASE_URL || !CFG.SUPABASE_ANON_KEY ||
      CFG.SUPABASE_URL.includes('YOUR-') || CFG.SUPABASE_ANON_KEY.includes('YOUR-')) return false;
  if (!window.supabase) return false;
  App.sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
  return true;
}

/** ກວດ session ປັດຈຸບັນ  ->  'ok' | 'not_admin' */
async function refreshAuth() {
  const { data: { session } } = await App.sb.auth.getSession();
  App.user = session?.user || null;
  App.isAdmin = false;
  if (App.user) {
    const { data } = await App.sb.from('admin_users')
      .select('user_id').eq('user_id', App.user.id).maybeSingle();
    App.isAdmin = !!data;
    if (!App.isAdmin) {                       // ລັອກອິນໄດ້ ແຕ່ບໍ່ແມ່ນຜູ້ບໍລິຫານ -> ອອກທັນທີ
      await App.sb.auth.signOut();
      App.user = null;
      return 'not_admin';
    }
  }
  return 'ok';
}

async function login(email, password) {
  const { error } = await App.sb.auth.signInWithPassword({ email, password });
  if (error) throw new Error('ຊື່ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ');
  const r = await refreshAuth();
  if (r === 'not_admin') throw new Error('ບັນຊີນີ້ບໍ່ມີສິດຜູ້ບໍລິຫານ');
}

async function logout() {
  await App.sb.auth.signOut();
  App.user = null;
  App.isAdmin = false;
}

/** ຟອມເຂົ້າສູ່ລະບົບ (ສະເພາະຜູ້ບໍລິຫານ) */
function openLoginForm(onSuccess) {
  const m = openModal({
    title: '🔐 ເຂົ້າສູ່ລະບົບຜູ້ບໍລິຫານ', size: 'sm', isStatic: true,
    body: `<form id="login-form" class="form-grid one" autocomplete="on">
             <p class="hint">ສະເພາະຜູ້ບໍລິຫານເທົ່ານັ້ນ ຈຶ່ງສາມາດແກ້ໄຂ ຫຼື ລົບຂໍ້ມູນໄດ້</p>
             <label class="fld"><span>ຊື່</span>
               <input type="email" name="email" required autocomplete="username" autofocus></label>
             <label class="fld"><span>ລະຫັດຜ່ານ</span>
               <input type="password" name="password" required autocomplete="current-password"></label>
             <div class="form-err" id="login-err" hidden></div>
           </form>`,
    footer: `<button type="button" class="btn" data-close>ຍົກເລີກ</button>
             <button type="submit" form="login-form" class="btn primary" id="login-submit">ເຂົ້າສູ່ລະບົບ</button>`
  });
  const form = m.$('#login-form');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = m.$('#login-submit'), err = m.$('#login-err');
    err.hidden = true; btn.disabled = true; btn.textContent = 'ກຳລັງກວດສອບ...';
    try {
      await login(form.email.value.trim(), form.password.value);
      m.close();
      toast('ເຂົ້າສູ່ລະບົບສຳເລັດ');
      if (onSuccess) onSuccess();
    } catch (ex) {
      err.textContent = errMsg(ex); err.hidden = false;
      btn.disabled = false; btn.textContent = 'ເຂົ້າສູ່ລະບົບ';
    }
  });
}
