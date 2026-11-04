# ລະບົບບໍລິຫານວິທະຍາໄລ (College Administration System)

ເວັບໄຊລ້ວນໆ (HTML + CSS + JavaScript) ເຊື່ອມຖານຂໍ້ມູນອອນລາຍ **Supabase**
ບໍ່ຕ້ອງຕິດຕັ້ງ Node.js ຫຼື build ໃດໆ — ເປີດດ້ວຍ Visual Studio Code ໄດ້ເລີຍ.

## ຄຸນສົມບັດ
- ຖານຂໍ້ມູນສູນກາງອອນລາຍ (Supabase / PostgreSQL) ໃຊ້ງານໄດ້ 24 ຊົ່ວໂມງ
- ເຂົ້າລິ້ງ ເຫັນໜ້າຊອບແວທັນທີ — **ເບິ່ງໄດ້ຢ່າງດຽວ** ແກ້ໄຂ/ລົບບໍ່ໄດ້
- ແກ້ໄຂ / ເພີ່ມ / ລົບ ໄດ້ສະເພາະ **ຜູ້ບໍລິຫານ** ທີ່ເຂົ້າສູ່ລະບົບ (ປ້ອງກັນທີ່ຖານຂໍ້ມູນດ້ວຍ Row Level Security)
- ຕາຕະລາງ **ສົກຮຽນ** (ລ/ດ, ສົກຮຽນ) ແລະ **ປະຫວັດນັກສຶກສາ** (ຄົບທຸກຊ່ອງຕາມທີ່ກຳນົດ + ອັບໂຫຼດຮູບ)
- ເລືອກວັນເກີດ → ເຕີມຮູບແບບ `01 ກັນຍາ 2000` / `01 September 2000` ໃຫ້ອັດຕະໂນມັດ
- **ລາຍງານ** ກັ່ນຕອງຕາມສົກຮຽນ / ເພດ / ແຂວງ, ພິມໄດ້, **ສົ່ງອອກ Excel (.xlsx)** ໄດ້
- ເພີ່ມເມນູໃໝ່ໃນອະນາຄົດໄດ້ງ່າຍ (ເບິ່ງຂ້າງລຸ່ມ)

## ໂຄງສ້າງໂຟນເດີ
```
college-admin/
├─ index.html              ໜ້າຫຼັກ (ໂຄງໜ້າຕາ + ລາຍຊື່ script)
├─ css/style.css           ໜ້າຕາ / ສີ / ຕົວອັກສອນ
├─ js/
│  ├─ config.js            ← ໃສ່ Supabase URL + KEY ຢູ່ນີ້
│  ├─ utils.js             ຟັງຊັນຊ່ວຍ, ຄໍລຳລາຍງານ, ສົ່ງອອກ Excel, ລະບົບເມນູ
│  ├─ auth.js              ເຊື່ອມ Supabase + ຟອມເຂົ້າສູ່ລະບົບຜູ້ບໍລິຫານ
│  ├─ app.js               router + ເມນູ
│  └─ pages/               ແຕ່ລະເມນູ ຢູ່ແຍກໄຟລ໌
│     ├─ dashboard.js  years.js  students.js  reports.js
└─ supabase/schema.sql     ສ້າງຕາຕະລາງ + ຄວາມປອດໄພ + ບ່ອນເກັບຮູບ
```

## ຂັ້ນຕອນຕິດຕັ້ງ

### 1) ສ້າງ Supabase Project
1. ສະໝັກ / ເຂົ້າ <https://supabase.com> → **New project** (ຕັ້ງລະຫັດຖານຂໍ້ມູນ ແລະ ເລືອກ Region ໃກ້ໆ ເຊັ່ນ Singapore)
2. ລໍຖ້າສ້າງສຳເລັດ

### 2) ສ້າງຕາຕະລາງ
1. ເມນູຊ້າຍ **SQL Editor → New query**
2. ເປີດໄຟລ໌ `supabase/schema.sql` ໃນ VS Code → ກ໊ອບທັງໝົດ → ວາງ → ກົດ **Run**
3. ຈະໄດ້: `academic_years`, `students`, `admin_users`, bucket ຮູບ `student-photos` ແລະ policy ຄວາມປອດໄພ

### 3) ສ້າງບັນຊີຜູ້ບໍລິຫານ
1. **Authentication → Users → Add user → Create new user**
   ໃສ່ອີເມວ + ລະຫັດຜ່ານ ແລະ ຕິກ **Auto Confirm User**
2. ກັບໄປ **SQL Editor** ຮັນຄຳສັ່ງນີ້ (ປ່ຽນອີເມວ):
   ```sql
   insert into public.admin_users (user_id)
   select id from auth.users where email = 'admin@yourcollege.edu.la'
   on conflict do nothing;
   ```
3. ແນະນຳ: **Authentication → Sign In / Providers → Email** ປິດ *Allow new users to sign up*
   (ເພື່ອບໍ່ໃຫ້ຄົນນອກສ້າງບັນຊີ — ແມ້ວ່າຈະສ້າງໄດ້ ກໍແກ້ໄຂຂໍ້ມູນບໍ່ໄດ້ ເພາະບໍ່ຢູ່ໃນ `admin_users`)

### 4) ໃສ່ຄ່າເຊື່ອມຕໍ່
**Project Settings → API** ກ໊ອບ `Project URL` ແລະ `anon public` key ໄປໃສ່ `js/config.js`:
```js
SUPABASE_URL: "https://xxxxxxxx.supabase.co",
SUPABASE_ANON_KEY: "eyJhbGciOi...",
COLLEGE_NAME: "ວິທະຍາໄລ ... ຂອງທ່ານ",
```
> ຢ່າໃຊ້ `service_role` key ໃນເວັບເດັດຂາດ. ໃຊ້ສະເພາະ `anon` key.

### 5) ເປີດທົດລອງໃນ Visual Studio Code
1. ຕິດຕັ້ງ extension **Live Server** (ຂອງ Ritwick Dey)
2. ຄລິກຂວາທີ່ `index.html` → **Open with Live Server**
3. ເບິ່ງໃນ browser → ກົດ **🔐 ເຂົ້າສູ່ລະບົບຜູ້ບໍລິຫານ** ໃນແຖບຊ້າຍລຸ່ມ

### 6) ເອົາຂຶ້ນອອນລາຍ 24 ຊົ່ວໂມງ
ເປັນເວັບ static ຈຶ່ງ host ຟຣີໄດ້ ເລືອກອັນໃດອັນໜຶ່ງ:
- **Netlify** — ລາກໂຟນເດີ `college-admin` ໄປວາງທີ່ <https://app.netlify.com/drop>
- **Cloudflare Pages / Vercel / GitHub Pages** — ອັບໂຫຼດໂຟນເດີນີ້ທັງໝົດ

ໄດ້ລິ້ງແລ້ວ ສົ່ງໃຫ້ທຸກຄົນເປີດເບິ່ງໄດ້ເລີຍ. ຫຼັງ deploy ໃຫ້ໄປທີ່ Supabase →
**Authentication → URL Configuration** ໃສ່ລິ້ງເວັບຂອງທ່ານໃນ *Site URL*.

> ໝາຍເຫດ: Supabase ແພັກເກດຟຣີ ຈະ **pause** Project ຖ້າບໍ່ມີການໃຊ້ງານເກີນ ~7 ວັນ
> (ກົດ Restore ໃນ Dashboard ໄດ້). ຖ້າຕ້ອງການໃຊ້ງານຈິງຕະຫຼອດ ແນະນຳແພັກເກດ Pro.

## ວິທີເພີ່ມເມນູໃໝ່ໃນອະນາຄົດ
1. ສ້າງໄຟລ໌ໃໝ່ ເຊັ່ນ `js/pages/teachers.js`:
   ```js
   registerMenu({
     id: 'teachers',            // ຈະກາຍເປັນ #/teachers
     label: 'ອາຈານ',
     icon: '👨‍🏫',
     order: 35,                  // ລຳດັບໃນເມນູ (ນ້ອຍ = ຢູ່ເທິງ)
     adminOnly: false,           // true = ສະເພາະຜູ້ບໍລິຫານ
     async render(root) {
       const { data } = await App.sb.from('teachers').select('*');
       root.innerHTML = `<section class="card"><h2>ອາຈານ</h2> ... </section>`;
     }
   });
   ```
2. ເພີ່ມບັນທັດນີ້ໃນ `index.html` (ກ່ອນ `js/app.js`):
   ```html
   <script src="js/pages/teachers.js"></script>
   ```
3. ສ້າງຕາຕະລາງໃໝ່ໃນ Supabase ແລະ ໃສ່ policy ແບບດຽວກັບ `students`
   (ທຸກຄົນ `select`, ສະເພາະ `public.is_admin()` ຈຶ່ງ insert/update/delete ໄດ້)

ເມນູຈະປາກົດໃນແຖບຊ້າຍອັດຕະໂນມັດ.

## ຕາຕະລາງ `students` (ສະຫຼຸບ)
| ຄໍລຳ | ຄວາມໝາຍ |
|---|---|
| `academic_year_id` | ເລືອກສົກຮຽນ (ອ້າງອີງ `academic_years`) |
| `photo_url` | ຮູບພາບ |
| `first_name_lo`, `last_name_lo` | ຊື່ / ນາມສະກຸນ (ລາວ) |
| `first_name_en`, `last_name_en` | ຊື່ / ນາມສະກຸນ (ອັງກິດ) |
| `gender` | ເພດ (ຊາຍ / ຍິງ) |
| `birth_date`, `birth_date_lo`, `birth_date_en` | ວັນເດືອນປີເກີດ (date / ລາວ / ອັງກິດ) |
| `birth_village`, `birth_district`, `birth_province` | ທີ່ເກີດ: ບ້ານ, ເມືອງ, ແຂວງ |
| `high_school` | ຮຽນຈົບ ມ.7 ຈາກ ມ.ສ ໃດ |
| `phone`, `father_phone`, `mother_phone`, `emergency_phone` | ເບີໂທ / ພໍ່ / ແມ່ / ສຸກເສີນ |
