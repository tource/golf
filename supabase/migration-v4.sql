-- 닉네임 ↔ 동아리원 이름 매핑 (닉네임 변경 시 새 행 추가, 예전 닉네임 유지)
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

create policy "member_nicknames: public read"
  on member_nicknames for select using (true);

create policy "member_nicknames: admin insert"
  on member_nicknames for insert with check (is_admin());

create policy "member_nicknames: admin update"
  on member_nicknames for update using (is_admin());

create policy "member_nicknames: admin delete"
  on member_nicknames for delete using (is_admin());
