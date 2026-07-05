"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Link2,
  Plus,
  Search,
  Trash2,
  Upload,
  User,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AdminNav } from "@/components/admin/admin-nav";
import { SelectField } from "@/components/ui/select-field";
import { inputClassNameSm } from "@/components/ui/input-styles";
import { useMemberNames } from "@/hooks/use-member-names";
import type { MemberNickname } from "@/lib/types/database";

export function NicknameMappingPage() {
  const [mappings, setMappings] = useState<MemberNickname[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [nickname, setNickname] = useState("");
  const [memberName, setMemberName] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const { names } = useMemberNames();
  const supabase = createClient();

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("member_nicknames")
      .select("*")
      .order("member_name", { ascending: true });
    if (data) setMappings(data as MemberNickname[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    async function init() {
      await fetch("/api/admin/nicknames/seed", { method: "POST" });
      await load();
    }
    init();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return mappings;
    return mappings.filter(
      (m) =>
        m.nickname.toLowerCase().includes(q) ||
        m.member_name.toLowerCase().includes(q) ||
        (m.note ?? "").toLowerCase().includes(q),
    );
  }, [mappings, search]);

  const memberCount = useMemo(
    () => new Set(mappings.map((m) => m.member_name)).size,
    [mappings],
  );

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!nickname.trim() || !memberName.trim()) return;

    setSaving(true);
    const { error } = await supabase.from("member_nicknames").insert({
      nickname: nickname.trim(),
      member_name: memberName.trim(),
      note: note.trim() || null,
    });
    setSaving(false);

    if (error) {
      alert(
        error.code === "23505"
          ? "이미 등록된 닉네임입니다."
          : error.message,
      );
      return;
    }

    setNickname("");
    setNote("");
    load();
  }

  async function handleDelete(id: string) {
    if (!window.confirm("이 닉네임 매핑을 삭제할까요?")) return;
    await supabase.from("member_nicknames").delete().eq("id", id);
    load();
  }

  async function handleCsvImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setImporting(true);
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    let ok = 0;
    let fail = 0;

    for (const line of lines.slice(1)) {
      const [nick, member, rowNote] = line.split(",").map((s) => s.trim());
      if (!nick || !member || nick === "nickname") continue;

      const { error } = await supabase.from("member_nicknames").upsert(
        { nickname: nick, member_name: member, note: rowNote || null },
        { onConflict: "nickname" },
      );
      if (error) fail++;
      else ok++;
    }

    setImporting(false);
    alert(`CSV 가져오기: ${ok}건 성공, ${fail}건 실패`);
    load();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/60 via-white to-zinc-50">
      <AdminNav />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Hero */}
        <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-8 text-white shadow-xl shadow-emerald-200/40">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <div className="mb-2 flex items-center gap-2 text-emerald-100">
                <Link2 className="h-5 w-5" />
                <span className="text-sm font-medium">스코어 이미지 OCR용</span>
              </div>
              <h2 className="text-2xl font-black sm:text-3xl">닉네임 매핑</h2>
              <p className="mt-2 max-w-lg text-sm text-emerald-100/90">
                앱 닉네임 → 동아리원 이름. 닉네임이 바뀌면{" "}
                <strong className="text-white">새로 추가</strong>하고 예전
                닉네임은 그대로 두세요.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="rounded-2xl bg-white/15 px-5 py-3 text-center backdrop-blur-sm">
                <p className="text-2xl font-black">{mappings.length}</p>
                <p className="text-xs text-emerald-100">닉네임</p>
              </div>
              <div className="rounded-2xl bg-white/15 px-5 py-3 text-center backdrop-blur-sm">
                <p className="text-2xl font-black">{memberCount}</p>
                <p className="text-xs text-emerald-100">멤버</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
          {/* 추가 폼 */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 font-bold text-zinc-900">
                <Plus className="h-4 w-4 text-emerald-600" />
                새 매핑 추가
              </h3>
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500">
                    앱 닉네임
                  </label>
                  <input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="예: 영도도끼3"
                    className={inputClassNameSm}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500">
                    동아리원
                  </label>
                  <SelectField
                    value={memberName}
                    onChange={setMemberName}
                    options={[
                      { value: "", label: "이름 선택" },
                      ...names.map((n) => ({ value: n, label: n })),
                    ]}
                    placeholder="이름 선택"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500">
                    메모 (선택)
                  </label>
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="구 닉네임 등"
                    className={inputClassNameSm}
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving || !memberName}
                  className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {saving ? "저장 중..." : "매핑 추가"}
                </button>
              </form>
            </div>

            <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
              <p className="mb-3 text-xs text-zinc-500">일괄 등록</p>
              <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 py-3 text-sm font-medium text-zinc-600 hover:border-emerald-300 hover:bg-emerald-50/50">
                <Upload className="h-4 w-4" />
                {importing ? "가져오는 중..." : "CSV 가져오기"}
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  disabled={importing}
                  onChange={handleCsvImport}
                />
              </label>
              <a
                href="/nickname-mapping.sample.csv"
                download
                className="mt-2 block text-center text-xs text-emerald-700 hover:underline"
              >
                샘플 CSV 다운로드
              </a>
            </div>
          </aside>

          {/* 목록 */}
          <section>
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="닉네임 또는 이름 검색..."
                className={`${inputClassNameSm} pl-10`}
              />
            </div>

            {loading ? (
              <p className="py-16 text-center text-zinc-400">불러오는 중...</p>
            ) : filtered.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-zinc-200 py-16 text-center text-zinc-400">
                {search ? "검색 결과가 없습니다" : "등록된 매핑이 없습니다"}
              </p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {filtered.map((m) => (
                  <li
                    key={m.id}
                    className="group relative rounded-2xl border border-emerald-100/80 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
                  >
                    <button
                      type="button"
                      onClick={() => handleDelete(m.id)}
                      className="absolute right-3 top-3 rounded-lg p-1.5 text-zinc-300 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                      title="삭제"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <div className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-black text-violet-700">
                          {m.nickname}
                        </p>
                        <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                          앱 닉네임
                        </p>
                      </div>

                      <ArrowRight className="h-5 w-5 shrink-0 text-emerald-400" />

                      <div className="min-w-0 flex-1 text-right">
                        <p className="truncate text-base font-bold text-zinc-900">
                          {m.member_name}
                        </p>
                        <p className="flex items-center justify-end gap-1 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                          <User className="h-3 w-3" />
                          동아리원
                        </p>
                      </div>
                    </div>

                    {m.note && (
                      <p className="mt-3 rounded-lg bg-zinc-50 px-2 py-1 text-xs text-zinc-500">
                        {m.note}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {!loading && mappings.length > 0 && (
              <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-zinc-400">
                <Users className="h-3.5 w-3.5" />
                한 사람에 닉네임 여러 개 등록 가능 (닉네임 변경 대비)
              </p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
