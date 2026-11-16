// 向量星圖：每個點是一篇筆記（MDS 座標，2D 距離近似餘弦距離），選定中心後，依相關度畫出彩色連線。
// 連線顏色與粗細只看「排名」：第 1 名最亮最粗（琥珀色），越後面越冷越細（青色）。
import { useMemo } from "react";
import type { Note } from "../lib/atlas";
import { isForgotten } from "../lib/atlas";
import { TYPE_META } from "../lib/meta";
import { strength, type Ranked } from "../lib/rank";

const W = 1000;
const H = 640;
const PAD = 56;
const px = (n: Note) => PAD + n.x * (W - PAD * 2);
const py = (n: Note) => PAD + n.y * (H - PAD * 2);

/** 相關度 0..1 → 琥珀（高）到青藍（低）。RankedList 用同一函式，讓清單色塊對應地圖連線。 */
export function relevanceColor(s: number): string {
  const hue = 195 - 153 * s; // 195 青藍 → 42 琥珀
  const light = 48 + 22 * s;
  return `hsl(${hue.toFixed(0)} 85% ${light.toFixed(0)}%)`;
}

const shortTitle = (t: string) => t.split(/[：（(]/)[0];

/** 粗估標籤寬度：中日韓字約 1em，其他字元約 0.58em。 */
const labelWidth = (t: string, size: number) =>
  [...t].reduce((w, ch) => w + (/[　-鿿＀-￯]/.test(ch) ? size : size * 0.58), 0);

interface Box { x1: number; y1: number; x2: number; y2: number }
const overlaps = (a: Box, b: Box) => a.x1 < b.x2 && b.x1 < a.x2 && a.y1 < b.y2 && b.y1 < a.y2;

/** 依優先順序擺放標籤，和已擺好的標籤重疊就略過（滑過或聚焦時仍會顯示）。 */
function placeLabels(order: Note[], all: Note[], size: (n: Note) => number, radius: (n: Note) => number): Set<string> {
  // 所有點本身也是障礙物，標籤不可壓到別的點
  const dots = all.map((n) => ({ id: n.id, x1: px(n) - 8, y1: py(n) - 8, x2: px(n) + 8, y2: py(n) + 8 }));
  const placed: Box[] = [];
  const ok = new Set<string>();
  for (const n of order) {
    const w = labelWidth(shortTitle(n.title), size(n));
    const r = radius(n) + 7;
    const end = n.x > 0.78;
    const x1 = end ? px(n) - r - w : px(n) + r;
    const box = { x1: x1 - 3, y1: py(n) - 10, x2: x1 + w + 3, y2: py(n) + 9 };
    if (placed.some((b) => overlaps(b, box)) || dots.some((d) => d.id !== n.id && overlaps(d, box))) continue;
    placed.push(box);
    ok.add(n.id);
  }
  return ok;
}

interface Props {
  notes: Note[];
  ranked: Ranked[] | null;
  center: Note | null;
  topN: number;
  hoverId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}

export default function AtlasMap({ notes, ranked, center, topN, hoverId, onHover, onSelect }: Props) {
  const shown = useMemo(() => (ranked ? ranked.slice(0, topN) : []), [ranked, topN]);
  const rankOf = useMemo(() => new Map(shown.map((r, i) => [r.note.id, i])), [shown]);

  // 起點：選定的筆記；文字查詢時則是前 3 名的加權中心（菱形標記）
  const origin = useMemo(() => {
    if (center) return { x: px(center), y: py(center) };
    if (!shown.length) return null;
    const top = shown.slice(0, 3);
    const w = top.reduce((s, r) => s + r.score, 0) || 1;
    return {
      x: top.reduce((s, r) => s + px(r.note) * r.score, 0) / w,
      y: top.reduce((s, r) => s + py(r.note) * r.score, 0) / w,
    };
  }, [center, shown]);

  const active = ranked !== null;
  const radius = (n: Note) => (center?.id === n.id ? 10 : rankOf.has(n.id) ? 7.5 : 5.5);
  const labels = useMemo(() => {
    // 優先順序：中心 → 排行（依名次）→ 未應用成果 → 其他
    const order = [
      ...(center ? [center] : []),
      ...shown.map((r) => r.note),
      ...(active ? [] : notes.filter(isForgotten)),
      ...(active ? [] : notes),
    ];
    const uniq = [...new Map(order.map((n) => [n.id, n])).values()];
    const size = (n: Note) => (active && n.id !== center?.id ? 11.5 : 13);
    return placeLabels(uniq, notes, size, radius);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center, shown, active, notes]);
  const manual = center ? notes.filter((n) => center.links.includes(n.id) || n.links.includes(center.id)) : [];
  const key = center?.id ?? shown.map((r) => r.note.id).join(",");

  return (
    <svg className="atlas-map" viewBox={`0 0 ${W} ${H}`} role="group" aria-label="筆記向量星圖">
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--grid)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill="url(#grid)" />

      {/* 人工標註的關係（frontmatter links）：虛線 */}
      {manual.map((n) => (
        <line key={`m-${n.id}`} className="edge-manual" x1={px(center!)} y1={py(center!)} x2={px(n)} y2={py(n)} />
      ))}

      {/* 相關度連線：先畫低分，高分疊在上面 */}
      <g key={key}>
        {origin &&
          [...shown].reverse().map((r) => {
            const i = rankOf.get(r.note.id)!;
            const s = strength(i, shown.length);
            const len = Math.hypot(px(r.note) - origin.x, py(r.note) - origin.y);
            const hot = hoverId === r.note.id;
            return (
              <line
                key={r.note.id}
                className="edge-rel"
                x1={origin.x}
                y1={origin.y}
                x2={px(r.note)}
                y2={py(r.note)}
                stroke={relevanceColor(s)}
                strokeWidth={hot ? 4.5 : 1 + 2.6 * s}
                strokeOpacity={hot ? 1 : 0.45 + 0.5 * s}
                style={{ "--len": len, "--delay": `${i * 45}ms` } as React.CSSProperties}
              />
            );
          })}
      </g>

      {origin && !center && (
        <rect className="query-mark" x={origin.x - 7} y={origin.y - 7} width="14" height="14" transform={`rotate(45 ${origin.x} ${origin.y})`} />
      )}

      {notes.map((n) => {
        const i = rankOf.get(n.id);
        const isCenter = center?.id === n.id;
        const lit = !active || isCenter || i !== undefined;
        const hot = hoverId === n.id;
        const color = TYPE_META[n.type].color;
        const hollow = n.status === "planned";
        const r = radius(n);
        const showLabel = hot || labels.has(n.id);
        const anchorEnd = n.x > 0.78;
        return (
          <g
            key={n.id}
            className={`node${lit ? "" : " dim"}${hot ? " hot" : ""}`}
            transform={`translate(${px(n)} ${py(n)})`}
            role="button"
            tabIndex={0}
            aria-label={`${TYPE_META[n.type].label}：${n.title}${i !== undefined ? `，相關度第 ${i + 1} 名` : ""}`}
            onClick={() => onSelect(n.id)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelect(n.id))}
            onMouseEnter={() => onHover(n.id)}
            onMouseLeave={() => onHover(null)}
            onFocus={() => onHover(n.id)}
            onBlur={() => onHover(null)}
          >
            <circle r="16" className="hit" />
            {isForgotten(n) && <circle r={r + 6} className="forgotten-ring" />}
            {isCenter && <circle r={r + 7} className="center-ring" />}
            <circle
              r={r}
              fill={hollow ? "var(--bg)" : color}
              stroke={color}
              strokeWidth={hollow ? 2 : 0}
              opacity={n.status === "failed" ? 0.55 : 1}
            />
            {i !== undefined && (
              <text className="rank-badge" y={-r - 6} textAnchor="middle">
                {i + 1}
              </text>
            )}
            {showLabel && (
              <text
                className={`node-label${active && !isCenter && !hot ? " small" : ""}`}
                x={anchorEnd ? -r - 7 : r + 7}
                y={4}
                textAnchor={anchorEnd ? "end" : "start"}
              >
                {shortTitle(n.title)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
