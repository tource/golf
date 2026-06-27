"use client";

interface DuplicateModalProps {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DuplicateModal({ name, onConfirm, onCancel }: DuplicateModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-zinc-900">이미 신청했어요!</h3>
        <p className="mt-2 text-sm text-zinc-600">
          <span className="font-semibold text-emerald-700">{name}</span>님, 이미
          신청 내역이 있습니다. 변경할까요?
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-zinc-200 py-3 text-sm font-semibold text-zinc-600 hover:bg-zinc-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            변경하기
          </button>
        </div>
      </div>
    </div>
  );
}
