-- ============================================================
-- 날려보세 골프 동아리 — Supabase 스키마
-- Supabase Dashboard → SQL Editor 에서 실행하세요.
-- ============================================================

-- 관리자 여부 판별 (user_metadata.role === 'admin')
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin',
    false
  );
$$;

-- 1. 매장 (스크린골프장)
create table if not exists venues (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  address         text,
  price_per_hour  integer,
  notes           text,
  created_at      timestamptz not null default now()
);

-- 2. 라운드
create table if not exists rounds (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  date              timestamptz not null,
  venue_id          uuid not null references venues(id) on delete restrict,
  room_count        integer not null check (room_count between 1 and 10),
  players_per_room  integer not null check (players_per_room between 2 and 6),
  status            text not null default 'open'
                    check (status in ('open', 'closed', 'drawn', 'completed')),
  created_at        timestamptz not null default now()
);

-- 3. 참여자 (이름 기반, 로그인 없음)
create table if not exists participants (
  id            uuid primary key default gen_random_uuid(),
  round_id      uuid not null references rounds(id) on delete cascade,
  name          text not null,
  is_attending  boolean not null default true,
  comment       text check (char_length(comment) <= 20),
  score         integer check (score is null or (score >= 0 and score <= 200)),
  created_at    timestamptz not null default now(),
  unique (round_id, name)
);

-- 4. 방 배정 결과
create table if not exists room_assignments (
  id              uuid primary key default gen_random_uuid(),
  round_id        uuid not null references rounds(id) on delete cascade,
  room_number     integer not null check (room_number >= 1),
  participant_id  uuid not null references participants(id) on delete cascade,
  unique (round_id, participant_id)
);

-- 5. 게임 후 비용 정산
create table if not exists round_settlements (
  round_id    uuid primary key references rounds(id) on delete cascade,
  total_cost  integer check (total_cost is null or total_cost >= 0),
  updated_at  timestamptz not null default now()
);

-- 6. 커피 내기
create table if not exists coffee_bets (
  id          uuid primary key default gen_random_uuid(),
  round_id    uuid not null references rounds(id) on delete cascade,
  payer_name  text not null,
  note        text,
  created_at  timestamptz not null default now()
);

-- 인덱스
create index if not exists idx_rounds_status_date on rounds(status, date);
create index if not exists idx_participants_round on participants(round_id);
create index if not exists idx_room_assignments_round on room_assignments(round_id);

-- Realtime
alter publication supabase_realtime add table participants;
alter publication supabase_realtime add table rounds;
alter publication supabase_realtime add table room_assignments;
alter publication supabase_realtime add table round_settlements;
alter publication supabase_realtime add table coffee_bets;

-- RLS
alter table venues           enable row level security;
alter table rounds           enable row level security;
alter table participants     enable row level security;
alter table room_assignments enable row level security;
alter table round_settlements enable row level security;
alter table coffee_bets      enable row level security;

-- venues: 누구나 읽기, 관리자만 쓰기
create policy "venues: public read"  on venues for select using (true);
create policy "venues: admin insert" on venues for insert with check (is_admin());
create policy "venues: admin update" on venues for update using (is_admin());
create policy "venues: admin delete" on venues for delete using (is_admin());

-- rounds: 누구나 읽기, 관리자만 쓰기
create policy "rounds: public read"  on rounds for select using (true);
create policy "rounds: admin insert" on rounds for insert with check (is_admin());
create policy "rounds: admin update" on rounds for update using (is_admin());
create policy "rounds: admin delete" on rounds for delete using (is_admin());

-- participants: 누구나 읽기/쓰기
create policy "participants: public read"   on participants for select using (true);
create policy "participants: public insert" on participants for insert with check (true);
create policy "participants: public update" on participants for update using (true);
create policy "participants: public delete" on participants for delete using (true);

-- room_assignments: 누구나 읽기/쓰기 (선택적 배정, 언제든 변경)
create policy "room_assignments: public read"  on room_assignments for select using (true);
create policy "room_assignments: public insert" on room_assignments for insert with check (true);
create policy "room_assignments: public update" on room_assignments for update using (true);
create policy "room_assignments: public delete" on room_assignments for delete using (true);

create policy "round_settlements: public read"   on round_settlements for select using (true);
create policy "round_settlements: public insert"  on round_settlements for insert with check (true);
create policy "round_settlements: public update"  on round_settlements for update using (true);

create policy "coffee_bets: public read"   on coffee_bets for select using (true);
create policy "coffee_bets: public insert" on coffee_bets for insert with check (true);
create policy "coffee_bets: public delete" on coffee_bets for delete using (true);

-- 샘플 데이터
insert into venues (name, address, price_per_hour, notes) values
  ('골프존 스크린 강남점', '서울 강남구 역삼동', 25000, '룸 10개'),
  ('프렌즈 스크린골프', '서울 송파구 잠실동', 20000, '주차 무료'),
  ('티업존 홍대점', '서울 마포구 홍대입구', 22000, '24시간 운영');

-- 관리자 계정은 Supabase Auth에서 생성 후 user_metadata에 role: "admin" 설정
-- Authentication → Users → 해당 유저 → Raw User Meta Data: { "role": "admin" }
