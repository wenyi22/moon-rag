// 類型與狀態標籤。全站只用這兩個元件顯示類型與狀態，保持一致。
import { AlertTriangle, CheckCircle2, CircleDashed, CircleDot, BookOpen, XCircle } from "lucide-react";
import type { Note, NoteStatus, NoteType } from "../lib/atlas";
import { isForgotten } from "../lib/atlas";
import { STATUS_META, TYPE_META } from "../lib/meta";

export function TypeTag({ type }: { type: NoteType }) {
  return (
    <span className="tag type-tag" style={{ "--c": TYPE_META[type].color } as React.CSSProperties}>
      <span className="dot" aria-hidden />
      {TYPE_META[type].label}
    </span>
  );
}

const STATUS_ICON: Record<NoteStatus, typeof CheckCircle2> = {
  validated: CheckCircle2,
  failed: XCircle,
  running: CircleDot,
  planned: CircleDashed,
  reference: BookOpen,
};

export function StatusTag({ status }: { status: NoteStatus }) {
  const Icon = STATUS_ICON[status];
  return (
    <span className={`tag status-tag s-${status}`} title={STATUS_META[status].hint}>
      <Icon size={13} strokeWidth={2} aria-hidden />
      {STATUS_META[status].label}
    </span>
  );
}

export function ForgottenTag({ note }: { note: Note }) {
  if (!isForgotten(note)) return null;
  return (
    <span className="tag forgotten-tag" title="結論成立，但 applied_in 是空的">
      <AlertTriangle size={13} strokeWidth={2} aria-hidden />
      未應用
    </span>
  );
}
