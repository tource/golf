import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { DEFAULT_NICKNAME_MAPPINGS } from "@/lib/data/default-nickname-mappings";

export async function POST() {
  const { supabase, error } = await requireAdmin();
  if (error || !supabase) {
    return NextResponse.json({ error: error ?? "인증 실패" }, { status: 401 });
  }

  const rows = DEFAULT_NICKNAME_MAPPINGS.map((m) => ({
    nickname: m.nickname,
    member_name: m.member_name,
    note: "기본 매핑",
  }));

  const { error: upsertError } = await supabase
    .from("member_nicknames")
    .upsert(rows, { onConflict: "nickname" });

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, count: rows.length });
}
