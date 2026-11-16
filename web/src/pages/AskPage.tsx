// 問答：先在瀏覽器端從筆記檢索前 5 篇，再把它們交給 OpenRouter 上的模型回答，答案必須引用 [筆記id]。
// 網站是公開的靜態頁面，所以 API key 由使用者自己填，只存在這台瀏覽器（localStorage），不會進 repo。
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { KeyRound, Loader2, Send } from "lucide-react";
import { isForgotten, useAtlas, type Note } from "../lib/atlas";
import { renderMarkdown } from "../lib/markdown";
import { rankByQuery, type Ranked } from "../lib/rank";

const KEY_STORE = "moonrag.openrouter.key";
const MODEL_STORE = "moonrag.openrouter.model";
const DEFAULT_MODEL = "openai/gpt-4o-mini";
const CONTEXT_K = 5;

const read = (k: string) => {
  try { return localStorage.getItem(k) ?? ""; } catch { return ""; }
};
const write = (k: string, v: string) => {
  try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch { /* 隱私模式下不保存 */ }
};

function contextBlock(n: Note) {
  const flag = isForgotten(n) ? "（注意：這是已成立但尚未應用的成果）" : "";
  return `[${n.id}] ${n.title}${flag}\n類型：${n.type}，狀態：${n.status}\n摘要：${n.summary}\n${n.body.slice(0, 1800)}`;
}

const SYSTEM = `你是研究筆記助理。只能根據提供的筆記回答，使用繁體中文。
每個論點後面用 [筆記id] 標示出處，例如 [hyde-2022]。筆記裡沒有的資訊，直接說筆記中沒有，不要自行補充。
如果相關筆記中有「已成立但尚未應用的成果」，在回答最後提醒使用者。`;

export default function AskPage() {
  const { notes } = useAtlas();
  const [key, setKey] = useState(() => read(KEY_STORE));
  const [remember, setRemember] = useState(() => read(KEY_STORE) !== "");
  const [model, setModel] = useState(() => read(MODEL_STORE) || DEFAULT_MODEL);
  const [question, setQuestion] = useState("");
  const [sources, setSources] = useState<Ranked[]>([]);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const ids = useMemo(() => new Set(notes.map((n) => n.id)), [notes]);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setAnswer("");
    if (!key.trim()) return setError("請先填入 OpenRouter API key。");
    const top = rankByQuery(question, notes).slice(0, CONTEXT_K);
    setSources(top);
    if (!top.length) return setError("筆記中找不到和這個問題相關的字詞，換個說法試試。");

    write(KEY_STORE, remember ? key.trim() : "");
    write(MODEL_STORE, model.trim());
    setBusy(true);
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key.trim()}`, "Content-Type": "application/json", "X-Title": "Moon RAG" },
        body: JSON.stringify({
          model: model.trim() || DEFAULT_MODEL,
          max_tokens: 700,
          temperature: 0.2,
          messages: [
            { role: "system", content: SYSTEM },
            { role: "user", content: `筆記：\n\n${top.map((r) => contextBlock(r.note)).join("\n\n---\n\n")}\n\n問題：${question}` },
          ],
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error?.message ?? `HTTP ${res.status}`);
      const text: string = data?.choices?.[0]?.message?.content ?? "";
      // [id] → 筆記連結；不存在的 id 保持原樣，方便看出模型亂引用
      setAnswer(text.replace(/\[([a-z0-9-]+)\]/g, (m, id) => (ids.has(id) ? `[${id}](#/note/${id})` : m)));
    } catch (err) {
      setError(`OpenRouter 回應錯誤：${(err as Error).message}。請確認 key 與模型名稱。`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page ask-page">
      <header className="page-head">
        <h1>向筆記提問</h1>
        <p className="muted">先從 {notes.length} 篇筆記中檢索最相關的 {CONTEXT_K} 篇，再交給模型回答，答案會附上出處。</p>
      </header>

      <form className="ask-form" onSubmit={ask}>
        <fieldset className="key-row">
          <legend className="sr-only">模型設定</legend>
          <label className="field">
            <span><KeyRound size={14} aria-hidden /> OpenRouter API key</span>
            <input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="sk-or-v1-…" autoComplete="off" spellCheck={false} />
          </label>
          <label className="field">
            <span>模型</span>
            <input value={model} onChange={(e) => setModel(e.target.value)} spellCheck={false} />
          </label>
          <label className="check">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            記住在這台瀏覽器
          </label>
        </fieldset>
        <label className="field grow">
          <span>問題</span>
          <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={3} placeholder="例如：HyDE 和 Query2doc 差在哪？我有哪些實驗還沒套用？" required />
        </label>
        <button className="btn primary" disabled={busy || !question.trim()}>
          {busy ? <Loader2 size={16} className="spin" /> : <Send size={16} />} {busy ? "回答中" : "送出問題"}
        </button>
      </form>

      {error && <p className="error" role="alert">{error}</p>}

      {(answer || sources.length > 0) && (
        <div className="ask-result">
          <section className="answer" aria-live="polite">
            <h2>回答</h2>
            {answer ? <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(answer) }} /> : <p className="muted">{busy ? "等待模型回應…" : "—"}</p>}
          </section>
          <section className="sources">
            <h2>檢索到的筆記</h2>
            <ol className="plain near">
              {sources.map((r) => (
                <li key={r.note.id}>
                  <Link to={`/note/${r.note.id}`}>{r.note.title}</Link>
                  <span className="num muted">{r.score.toFixed(2)}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}
    </div>
  );
}
