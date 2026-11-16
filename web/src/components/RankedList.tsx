// 相關度排行：從最相關到最不相關。色塊與地圖連線同色，滑過時地圖上對應的線會加粗。
import { ArrowUpRight, Crosshair } from "lucide-react";
import { Link } from "react-router-dom";
import { strength, type Ranked } from "../lib/rank";
import { relevanceColor } from "./AtlasMap";
import { ForgottenTag, StatusTag, TypeTag } from "./Tags";

interface Props {
  ranked: Ranked[];
  topN: number;
  hoverId: string | null;
  onHover: (id: string | null) => void;
  onFocus: (id: string) => void;
  mode: "note" | "query";
}

export default function RankedList({ ranked, topN, hoverId, onHover, onFocus, mode }: Props) {
  const shown = ranked.slice(0, topN);
  return (
    <ol className="ranked">
      {shown.map((r, i) => (
        <li
          key={r.note.id}
          className={`ranked-row${hoverId === r.note.id ? " hot" : ""}`}
          onMouseEnter={() => onHover(r.note.id)}
          onMouseLeave={() => onHover(null)}
        >
          <span className="swatch" style={{ background: relevanceColor(strength(i, shown.length)) }} aria-hidden />
          <span className="rank-num">{i + 1}</span>
          <div className="ranked-main">
            <button className="ranked-title" onClick={() => onFocus(r.note.id)} title="以這篇為中心重新排序">
              {r.note.title}
            </button>
            <div className="ranked-meta">
              <TypeTag type={r.note.type} />
              <StatusTag status={r.note.status} />
              <ForgottenTag note={r.note} />
            </div>
          </div>
          <div className="ranked-score" title={mode === "query" ? "0.5 × 字面 + 0.5 × 語意" : "向量餘弦相似度"}>
            <span className="num">{r.score.toFixed(2)}</span>
            {mode === "query" && (
              <span className="sub num">
                字 {r.lexical!.toFixed(2)} · 意 {r.semantic.toFixed(2)}
              </span>
            )}
          </div>
          <div className="ranked-actions">
            <button className="icon-btn" onClick={() => onFocus(r.note.id)} aria-label={`以「${r.note.title}」為中心`}>
              <Crosshair size={16} />
            </button>
            <Link className="icon-btn" to={`/note/${r.note.id}`} aria-label={`開啟「${r.note.title}」`}>
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </li>
      ))}
    </ol>
  );
}
