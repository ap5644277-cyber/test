-- =====================================================================
--  ລະບົບບໍລິຫານວິທະຍາໄລ  |  College Administration System
--  ຮັນໄຟລ໌ນີ້ທັງໝົດໃນ Supabase Dashboard  ->  SQL Editor  ->  New query  ->  Run
--  (ຮັນຊ້ຳໄດ້ ບໍ່ເປັນຜົນເສຍ)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) ຕາຕະລາງຜູ້ບໍລິຫານ (ບັນຊີທີ່ມີສິດ ເພີ່ມ / ແກ້ໄຂ / ລົບ)
-- ---------------------------------------------------------------------
create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ຟັງຊັນກວດວ່າ ຜູ້ໃຊ້ທີ່ລັອກອິນຢູ່ ເປັນຜູ້ບໍລິຫານບໍ່
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

alter table public.admin_users enable row level security;

drop policy if exists "admin_users_read_self" on public.admin_users;
create policy "admin_users_read_self" on public.admin_users
  for select to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- 2) ຕາຕະລາງເກັບກໍາຂໍ້ມູນ ສົກຮຽນ   (ລ/ດ, ສົກຮຽນ)
-- ---------------------------------------------------------------------
create table if not exists public.academic_years (
  id         bigint generated always as identity primary key,   -- ລ/ດ
  year_name  text   not null unique                             -- ຕົວຢ່າງ: 2026-2027
             check (year_name ~ '^[0-9]{4}-[0-9]{4}$'),
  created_at timestamptz not null default now()
);

-- ຂໍ້ມູນຕົວຢ່າງ
insert into public.academic_years (year_name) values ('2026-2027')
on conflict (year_name) do nothing;

-- ---------------------------------------------------------------------
-- 3) ຕາຕະລາງເກັບກໍາປະຫວັດນັກສຶກສາ
-- ---------------------------------------------------------------------
create table if not exists public.students (
  id               bigint generated always as identity primary key,
  academic_year_id bigint not null references public.academic_years (id) on delete restrict,  -- ເລືອກສົກຮຽນ
  photo_url        text,                  -- ຮູບພາບ (ລິ້ງໃນ Storage)
  first_name_lo    text not null,         -- ຊື່ (ພາສາລາວ)
  last_name_lo     text not null,         -- ນາມສະກຸນ (ພາສາລາວ)
  first_name_en    text,                  -- ຊື່ (ພາສາອັງກິດ)
  last_name_en     text,                  -- ນາມສະກຸນ (ພາສາອັງກິດ)
  gender           text check (gender in ('ຊາຍ', 'ຍິງ')),       -- ເພດ
  birth_date       date,                  -- ວັນເດືອນປີເກີດ (ແບບ date ສຳລັບຄົ້ນຫາ/ຈັດລຽງ)
  birth_date_lo    text,                  -- ຕົວຢ່າງ: 01 ກັນຍາ 2000
  birth_date_en    text,                  -- ຕົວຢ່າງ: 01 January 2000
  birth_village    text,                  -- ທີ່ເກີດ: ບ້ານ
  birth_district   text,                  -- ທີ່ເກີດ: ເມືອງ
  birth_province   text,                  -- ທີ່ເກີດ: ແຂວງ
  high_school      text,                  -- ຮຽນຈົບ ມ.7 ຈາກ ມ.ສ ໃດ
  phone            text,                  -- ເບີໂທ
  father_phone     text,                  -- ເບີໂທພໍ່
  mother_phone     text,                  -- ເບີໂທແມ່
  emergency_phone  text,                  -- ເບີໂທສຸກເສີນ
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists students_year_idx     on public.students (academic_year_id);
create index if not exists students_province_idx on public.students (birth_province);

-- ---------------------------------------------------------------------
-- 4) ຄວາມປອດໄພ (Row Level Security)
--    - ທຸກຄົນ (ບໍ່ຕ້ອງລັອກອິນ)  : ເບິ່ງໄດ້ຢ່າງດຽວ
--    - ຜູ້ບໍລິຫານທີ່ລັອກອິນ      : ເພີ່ມ / ແກ້ໄຂ / ລົບ ໄດ້
-- ---------------------------------------------------------------------
alter table public.academic_years enable row level security;
alter table public.students       enable row level security;

drop policy if exists "years_select_all"  on public.academic_years;
drop policy if exists "years_admin_write" on public.academic_years;
create policy "years_select_all" on public.academic_years
  for select to anon, authenticated using (true);
create policy "years_admin_write" on public.academic_years
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "students_select_all"  on public.students;
drop policy if exists "students_admin_write" on public.students;
create policy "students_select_all" on public.students
  for select to anon, authenticated using (true);
create policy "students_admin_write" on public.students
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- 5) ບ່ອນເກັບຮູບນັກສຶກສາ (Storage bucket)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('student-photos', 'student-photos', true, 2097152,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = 2097152,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "photos_public_read"  on storage.objects;
drop policy if exists "photos_admin_insert" on storage.objects;
drop policy if exists "photos_admin_update" on storage.objects;
drop policy if exists "photos_admin_delete" on storage.objects;

create policy "photos_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'student-photos');

create policy "photos_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'student-photos' and public.is_admin());

create policy "photos_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'student-photos' and public.is_admin())
  with check (bucket_id = 'student-photos' and public.is_admin());

create policy "photos_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'student-photos' and public.is_admin());

-- ---------------------------------------------------------------------
-- 6) ເພີ່ມຜູ້ບໍລິຫານຄົນທຳອິດ  (ເຮັດຫຼັງຈາກສ້າງຜູ້ໃຊ້ໃນ Authentication -> Users ແລ້ວ)
--    ປ່ຽນອີເມວຂ້າງລຸ່ມ ແລ້ວເອົາ -- ອອກ ແລ້ວຮັນເທື່ອດຽວ:
-- ---------------------------------------------------------------------
-- insert into public.admin_users (user_id)
-- select id from auth.users where email = 'admin@yourcollege.edu.la'
-- on conflict do nothing;
