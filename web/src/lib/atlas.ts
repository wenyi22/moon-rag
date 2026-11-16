// atlas.json 的型別與載入。資料由 pipeline/build_atlas.py 產生，前端只讀不寫。
import { createContext, useContext } from "react";

export type NoteType = "paper" | "experiment" | "idea";
export type NoteStatus = "validated" | "failed" | "running" | "planned" | "reference";

export interface Note {
  id: string;
  type: NoteType;
  title: string;
  date: string;
  status: NoteStatus;
  summary: string;
  tags: string[];
  links: string[];
  applied_in: string[];
  source: string;
  url: string;
  body: string;
  path: string;
  chunks: number;
  embedding: number[];
  x: number;
  y: number;
}

export interface Atlas {
  generated_at: string;
  model: string;
  dim: number;
  content_hash: string;
  notes: Note[];
}

export async function loadAtlas(): Promise<Atlas> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/atlas.json`);
  if (!res.ok) throw new Error(`atlas.json 載入失敗（HTTP ${res.status}）`);
  return res.json();
}

/** 「未應用成果」：結論成立，但 applied_in 是空的。這是本專案要解決的核心問題。 */
export const isForgotten = (n: Note) => n.status === "validated" && n.applied_in.length === 0;

export const AtlasContext = createContext<Atlas | null>(null);

export function useAtlas(): Atlas {
  const a = useContext(AtlasContext);
  if (!a) throw new Error("useAtlas 必須在 AtlasContext 內使用");
  return a;
}

export function useNote(id: string | undefined): Note | undefined {
  return useAtlas().notes.find((n) => n.id === id);
}
