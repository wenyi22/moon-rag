// 星圖首頁：選一篇筆記或輸入查詢 → 地圖畫出相關度連線，右側列出由高到低的排行。
// 狀態放在網址（?focus=id 或 ?q=文字），所以任何一張星圖都可以直接分享連結。
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertTriangle, ArrowUpRight, Presentation, Search, X } from "lucide-react";
import AtlasMap from "../components/AtlasMap";
import RankedList from "../components/RankedList";
import { ForgottenTag, StatusTag, TypeTag } from "../components/Tags";
import { isForgotten, useAtlas } from "../lib/atlas";
import { rankByNote, rankByQuery } from "../lib/rank";
import { TYPE_META, TYPE_ORDER } from "../lib/meta";

const TOP_OPTIONS = [5, 10, 15]; // 最後會再加上「全部」（筆記數 - 1）

export default function AtlasPage() {
  const { notes } = useAtlas();
  const [params, setParams] = useSearchParams();
  const focusId = params.get("focus");
  const query = params.get("q") ?? "";
  const [draft, setDraft] = useState(query);
  const [topN, setTopN] = useState(10);
  const [hoverId, setHoverId] = useState<string | null>(null);

  const center = notes.find((n) => n.id === focusId) ?? null;
  const ranked = useMemo(() => {
    if (center) return rankByNote(center, notes);
    if (query.trim()) return rankByQuery(query, notes);
    return null;
  }, [center, query, notes]);

  const forgotten = notes.filter(isForgotten);
  const focus = (id: string) => setParams({ focus: id });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setParams(draft.trim() ? { q: draft.trim() } : {});
  };
  const clear = () => {
    setDraft("");
    setParams({});
  };

  return (
    <div className="atlas-page">
      <section className="map-pane" aria-label="向量星圖">
        <AtlasMap notes={notes} ranked={ranked} center={center} topN={topN} hoverId={hoverId} onHover={setHoverId} onSelect={focus} />
        <div className="legend" aria-label="圖例">
          {TYPE_ORDER.map((t) => (
            <span key={t} className="legend-item">
              <span className="legend-dot" style={{ background: TYPE_META[t].color }} />
              {TYPE_META[t].label}
            </span>
          ))}
          <span className="legend-item"><span className="legend-dot hollow" />規劃中</span>
          <span className="legend-item"><span className="legend-dot ring" />未應用成果</span>
          <span className="legend-item">
            <span className="legend-ramp" aria-hidden />
            相關度 高 → 低
          </span>
        </div>
      </section>

      <aside className="side-pane">
        <form className="search" onSubmit={submit} role="search">
          <Search size={16} aria-hidden className="search-icon" />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="輸入研究主題，例如：查詢擴寫、重排、中文嵌入"
            aria-label="搜尋研究主題"
          />
          {(query || center) && (
            <button type="button" className="icon-btn" onClick={clear} aria-label="清除">
              <X size={16} />
            </button>
          )}
        </form>

        {center && (
          <div className="focus-card">
            <div className="focus-meta">
              <TypeTag type={center.type} />
              <StatusTag status={center.status} />
              <ForgottenTag note={center} />
            </div>
            <h1 className="focus-title">{center.title}</h1>
            <p className="focus-summary">{center.summary}</p>
            <div className="btn-row">
              <Link className="btn primary" to={`/note/${center.id}`}>
                閱讀筆記 <ArrowUpRight size={15} />
              </Link>
              <Link className="btn" to={`/slides/${center.id}`}>
                <Presentation size={15} /> 簡報
              </Link>
            </div>
          </div>
        )}

        {!center && query && (
          <div className="focus-card">
            <h1 className="focus-title">「{query}」的相關研究</h1>
            <p className="focus-summary muted">
              字面比對找出起點，再用向量擴展到語意相近的筆記。菱形是查詢在星圖上的位置。
            </p>
          </div>
        )}

        {ranked && ranked.length > 0 && (
          <>
            <div className="list-head">
              <h2>相關度排行</h2>
              <label className="top-select">
                顯示前
                <select value={topN} onChange={(e) => setTopN(Number(e.target.value))}>
                  {[...TOP_OPTIONS, notes.length - 1].map((n, i, all) => (
                    <option key={n} value={n}>{i === all.length - 1 ? "全部" : n}</option>
                  ))}
                </select>
              </label>
            </div>
            <RankedList ranked={ranked} topN={topN} hoverId={hoverId} onHover={setHoverId} onFocus={focus} mode={center ? "note" : "query"} />
          </>
        )}

        {ranked && ranked.length === 0 && (
          <div className="empty">
            <p>沒有筆記含有「{query}」裡的字詞。</p>
            <p className="muted">試試更短的關鍵字，或直接點星圖上的任一顆星。</p>
          </div>
        )}

        {!ranked && (
          <div className="intro">
            <h1 className="focus-title">點一顆星，看它牽動哪些研究</h1>
            <p className="focus-summary">
              {notes.length} 篇論文、實驗與想法放在同一個向量空間。選一篇，所有相關的筆記會依相關度連線並排序。
            </p>
            <h2 className="radar-head">
              <AlertTriangle size={16} aria-hidden /> 未應用成果 <span className="count num">{forgotten.length}</span>
            </h2>
            <p className="muted small">結論已經成立，但還沒有套用到任何地方。</p>
            <ul className="radar">
              {forgotten.map((n) => (
                <li key={n.id}>
                  <button className="radar-item" onClick={() => focus(n.id)} onMouseEnter={() => setHoverId(n.id)} onMouseLeave={() => setHoverId(null)}>
                    <span className="radar-title">{n.title}</span>
                    <span className="radar-sum">{n.summary}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}
