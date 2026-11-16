// 類型與狀態的顯示名稱、顏色與說明。新增類型或狀態時，這裡、AGENTS.md 與 build_atlas.py 三處要一起改。
import type { NoteStatus, NoteType } from "./atlas";

export const TYPE_META: Record<NoteType, { label: string; color: string }> = {
  paper: { label: "論文", color: "var(--type-paper)" },
  experiment: { label: "實驗", color: "var(--type-experiment)" },
  idea: { label: "想法", color: "var(--type-idea)" },
};

export const STATUS_META: Record<NoteStatus, { label: string; hint: string }> = {
  validated: { label: "成立", hint: "有證據支持結論" },
  failed: { label: "不成立", hint: "做過了，結論是否定的" },
  running: { label: "進行中", hint: "已實作，尚未評估" },
  planned: { label: "規劃中", hint: "還沒開始做" },
  reference: { label: "參考文獻", hint: "外部論文" },
};

export const TYPE_ORDER: NoteType[] = ["paper", "experiment", "idea"];
export const STATUS_ORDER: NoteStatus[] = ["validated", "running", "planned", "failed", "reference"];
