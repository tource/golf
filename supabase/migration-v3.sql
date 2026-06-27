-- 방 배정: 누구나 읽기/쓰기 (선택적 배정, 언제든 변경)
drop policy if exists "room_assignments: admin insert" on room_assignments;
drop policy if exists "room_assignments: admin update" on room_assignments;
drop policy if exists "room_assignments: admin delete" on room_assignments;

create policy "room_assignments: public insert" on room_assignments for insert with check (true);
create policy "room_assignments: public update" on room_assignments for update using (true);
create policy "room_assignments: public delete" on room_assignments for delete using (true);
