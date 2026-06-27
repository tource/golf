-- ============================================================
-- 관리자 권한 부여 (Supabase SQL Editor에서 실행)
-- 대시보드 UI에서 user_metadata 편집이 안 될 때 이 방법을 사용하세요.
-- ============================================================

-- 1) 먼저 가입된 유저 이메일 확인
select id, email, raw_user_meta_data
from auth.users
order by created_at desc;

-- 2) 아래 이메일을 본인 관리자 계정으로 바꾼 뒤 실행
update auth.users
set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
where email = 'your-admin@email.com';

-- 3) 적용 확인
select email, raw_user_meta_data->>'role' as role
from auth.users
where email = 'your-admin@email.com';

-- ※ 적용 후 /admin/login 에서 로그아웃했다가 다시 로그인해야 JWT에 반영됩니다.
