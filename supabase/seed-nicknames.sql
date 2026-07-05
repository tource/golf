-- ============================================================
-- 닉네임 매핑 테이블 + 기본 데이터 (한 번에 실행)
-- Supabase Dashboard → SQL Editor 에서 전체 붙여넣기 후 Run
-- ============================================================

-- 1. 테이블 (없으면 생성)
create table if not exists member_nicknames (
  id           uuid primary key default gen_random_uuid(),
  nickname     text not null,
  member_name  text not null,
  note         text,
  created_at   timestamptz not null default now(),
  unique (nickname)
);

create index if not exists idx_member_nicknames_member on member_nicknames(member_name);

alter table member_nicknames enable row level security;

-- 2. RLS (재실행해도 오류 없음)
drop policy if exists "member_nicknames: public read" on member_nicknames;
drop policy if exists "member_nicknames: admin insert" on member_nicknames;
drop policy if exists "member_nicknames: admin update" on member_nicknames;
drop policy if exists "member_nicknames: admin delete" on member_nicknames;

create policy "member_nicknames: public read"
  on member_nicknames for select using (true);

create policy "member_nicknames: admin insert"
  on member_nicknames for insert with check (is_admin());

create policy "member_nicknames: admin update"
  on member_nicknames for update using (is_admin());

create policy "member_nicknames: admin delete"
  on member_nicknames for delete using (is_admin());

-- 3. 기본 닉네임 매핑 12명
insert into member_nicknames (nickname, member_name, note) values
  ('머피탈출', '민구현', '기본 매핑'),
  ('서엉호오오', '김성호', '기본 매핑'),
  ('하모예_', '김진환', '기본 매핑'),
  ('힘빼고머리공', '박종성', '기본 매핑'),
  ('콩콩김프로', '김상현', '기본 매핑'),
  ('우잉워닝', '장원희', '기본 매핑'),
  ('하락중이에오', '김민기', '기본 매핑'),
  ('스기콩프로', '박슬기', '기본 매핑'),
  ('민상우씨', '민상우', '기본 매핑'),
  ('아싸@!!', '기효정', '기본 매핑'),
  ('우리투투', '김수환', '기본 매핑'),
  ('영도도끼2', '김효석', '기본 매핑')
on conflict (nickname) do update set
  member_name = excluded.member_name,
  note = excluded.note;
