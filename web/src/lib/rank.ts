// 相關度排序。所有相關度都用「原始向量」的餘弦相似度，3D 座標只負責擺放（投影一定會失真）。
//
// 兩種起點：
//   1. 以一篇筆記為中心：score = cos(中心向量, 其他筆記向量)
//   2. 以自由文字查詢：瀏覽器端沒有嵌入模型，所以先用字元 bigram 的 TF-IDF 找出字面最相符的筆記，
//      再以它們的向量加權成「種子向量」做語意擴展。score = 0.5 × 字面分數 + 0.5 × 語意分數。
import type { Note } from "./atlas";

export interface Ranked {
  note: Note;
  score: number; // 最終排序分數
  semantic: number; // 向量餘弦相似度
  lexical?: number; // 只有文字查詢時才有
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na * nb) || 1);
}

export function rankByNote(center: Note, notes: Note[]): Ranked[] {
  return notes
    .filter((n) => n.id !== center.id)
    .map((n) => {
      const s = cosine(center.embedding, n.embedding);
      return { note: n, score: s, semantic: s };
    })
    .sort((a, b) => b.score - a.score);
}

// ---- 字面比對：中文用字元 bigram，英文與數字用小寫單字 ----
function tokens(text: string): string[] {
  const t = text.toLowerCase();
  const out: string[] = [...(t.match(/[a-z0-9][a-z0-9.\-]*/g) ?? [])];
  const han = t.replace(/[^一-鿿]+/g, " ").split(" ").filter(Boolean);
  for (const run of han) {
    if (run.length === 1) out.push(run);
    for (let i = 0; i < run.length - 1; i++) out.push(run.slice(i, i + 2));
  }
  return out;
}

const docText = (n: Note) => `${n.title} ${n.title} ${n.summary} ${n.tags.join(" ")} ${n.body}`;

type Vec = Map<string, number>;
const cache = new WeakMap<Note[], { idf: Map<string, number>; vecs: Vec[] }>();

function tfidf(toks: string[], idf: Map<string, number>): Vec {
  const v: Vec = new Map();
  for (const t of toks) v.set(t, (v.get(t) ?? 0) + 1);
  let norm = 0;
  for (const [t, c] of v) {
    const w = (1 + Math.log(c)) * (idf.get(t) ?? 0);
    v.set(t, w);
    norm += w * w;
  }
  norm = Math.sqrt(norm) || 1;
  for (const [t, w] of v) v.set(t, w / norm);
  return v;
}

function lexIndex(notes: Note[]) {
  const hit = cache.get(notes);
  if (hit) return hit;
  const docs = notes.map((n) => tokens(docText(n)));
  const df = new Map<string, number>();
  for (const d of docs) for (const t of new Set(d)) df.set(t, (df.get(t) ?? 0) + 1);
  const idf = new Map<string, number>();
  for (const [t, c] of df) idf.set(t, Math.log((notes.length + 1) / (c + 0.5)));
  const built = { idf, vecs: docs.map((d) => tfidf(d, idf)) };
  cache.set(notes, built);
  return built;
}

export function rankByQuery(query: string, notes: Note[]): Ranked[] {
  const { idf, vecs } = lexIndex(notes);
  const q = tfidf(tokens(query).filter((t) => idf.has(t)), idf);
  if (q.size === 0) return [];

  const lex = vecs.map((v) => {
    let s = 0;
    for (const [t, w] of q) s += w * (v.get(t) ?? 0);
    return s;
  });
  const maxLex = Math.max(...lex);
  if (maxLex <= 0) return [];

  // 種子向量：字面分數前 3 名的筆記向量，依字面分數加權
  const top = lex.map((s, i) => [s, i] as const).sort((a, b) => b[0] - a[0]).slice(0, 3);
  const seed = new Array(notes[0].embedding.length).fill(0);
  for (const [s, i] of top) notes[i].embedding.forEach((x, k) => (seed[k] += s * x));

  return notes
    .map((n, i) => {
      const lexical = lex[i] / maxLex;
      const semantic = cosine(seed, n.embedding);
      return { note: n, lexical, semantic, score: 0.5 * lexical + 0.5 * semantic };
    })
    .sort((a, b) => b.score - a.score);
}

/** 把排名轉成 0..1 的強度，供連線顏色與粗細使用（第 1 名 = 1，最後一名 = 0）。 */
export function strength(rank: number, total: number): number {
  return total <= 1 ? 1 : 1 - rank / (total - 1);
}
