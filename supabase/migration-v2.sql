-- ============================================================
-- v2 마이그레이션: 점수, 정산, 커피내기
-- 기존 DB에 이미 schema.sql을 실행했다면 이 파일만 추가 실행하세요.
-- ============================================================

-- 참여자 스코어 (타수)
alter table participants
  add column if not exists score integer
  check (score is null or (score >= 0 and score <= 200));

-- 라운드 상태에 'completed' 추가
alter table rounds drop constraint if exists rounds_status_check;
alter table rounds add constraint rounds_status_check
  check (status in ('open', 'closed', 'drawn', 'completed'));

-- 게임 후 총액 정산
create table if not exists round_settlements (
  round_id    uuid primary key references rounds(id) on delete cascade,
  total_cost  integer check (total_cost is null or total_cost >= 0),
  updated_at  timestamptz not null default now()
);

-- 커피 내기 기록
create table if not exists coffee_bets (
  id          uuid primary key default gen_random_uuid(),
  round_id    uuid not null references rounds(id) on delete cascade,
  payer_name  text not null,
  note        text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_coffee_bets_round on coffee_bets(round_id);
create index if not exists idx_participants_score on participants(score) where score is not null;

-- Realtime
alter publication supabase_realtime add table coffee_bets;
alter publication supabase_realtime add table round_settlements;

-- RLS
alter table round_settlements enable row level security;
alter table coffee_bets enable row level security;

create policy "round_settlements: public read"   on round_settlements for select using (true);
create policy "round_settlements: public insert"  on round_settlements for insert with check (true);
create policy "round_settlements: public update"  on round_settlements for update using (true);

create policy "coffee_bets: public read"   on coffee_bets for select using (true);
create policy "coffee_bets: public insert" on coffee_bets for insert with check (true);
create policy "coffee_bets: public delete" on coffee_bets for delete using (true);
