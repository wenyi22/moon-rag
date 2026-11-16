// 2.5D 向量星圖：每個點是一篇筆記（3D MDS 座標，距離近似餘弦距離），選定中心後依相關度畫出彩色連線。
// 連線顏色與粗細只看「排名」：第 1 名最亮最粗（琥珀色），越後面越冷越細（青色）。
//
// 操作：滾輪 / 觸控板 / 雙指 → 以指標為中心縮放；拖曳 → 平移；右鍵或 Shift 拖曳 → 旋轉與傾斜。
// 投影數學在 lib/camera.ts；這個檔案只負責畫 SVG 與處理輸入。
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Box, Maximize, RotateCcw, RotateCw, Square, ZoomIn, ZoomOut } from "lucide-react";
import type { Note } from "../lib/atlas";
import { isForgotten } from "../lib/atlas";
import { TYPE_META } from "../lib/meta";
import { strength, type Ranked } from "../lib/rank";
import { fit, project, TILT_MAX, toWorld, VIEW_25D, VIEW_TOP, zoomAt, type Cam, type Projected, type Vec3 } from "../lib/camera";

/** 縮放範圍：相對於「剛好放下全部筆記」的倍率 */
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 12;
/** 拖曳超過這個距離（px）才算拖曳，否則視為點擊 */
const DRAG_SLOP = 4;
const GRID = 100;

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

/** 標籤放右邊會超出畫面時改放左邊（看實際寬度，不是固定比例，窄螢幕才不會被切掉） */
const labelOnLeft = (x: number, r: number, lw: number, w: number) => x + r + 7 + lw > w - 6;

interface Box2 { x1: number; y1: number; x2: number; y2: number }
const overlaps = (a: Box2, b: Box2) => a.x1 < b.x2 && b.x1 < a.x2 && a.y1 < b.y2 && b.y1 < a.y2;

/**
 * 依優先順序擺放標籤，和已擺好的標籤或別的點重疊就略過（滑過或聚焦時仍會顯示）。
 * 這同時就是「依縮放程度顯示標籤」：縮小時點擠在一起、放得下的標籤少；放大後空間變多，標籤自然變多。
 */
function placeLabels(order: Note[], pos: Map<string, Projected>, w: number, h: number, size: (n: Note) => number, radius: (n: Note) => number): Set<string> {
  const visible = (q: Projected) => q.x > 0 && q.x < w && q.y > 0 && q.y < h;
  const dots = [...pos].filter(([, q]) => visible(q)).map(([id, q]) => ({ id, x1: q.x - 8, y1: q.y - 8, x2: q.x + 8, y2: q.y + 8 }));
  const placed: Box2[] = [];
  const ok = new Set<string>();
  for (const n of order) {
    const q = pos.get(n.id)!;
    if (!visible(q)) continue; // 畫面外的不必算
    const lw = labelWidth(shortTitle(n.title), size(n));
    const r = radius(n) + 7;
    const x1 = labelOnLeft(q.x, radius(n), lw, w) ? q.x - r - lw : q.x + r;
    const box = { x1: x1 - 3, y1: q.y - 10, x2: x1 + lw + 3, y2: q.y + 9 };
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
  const stageRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // SVG 的座標系等於實際像素尺寸，手機的直式畫面就不會被縮在中間一小塊
  const [{ w, h }, setSize] = useState({ w: 1000, h: 640 });
  useLayoutEffect(() => {
    const el = stageRef.current!;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      if (width > 0 && height > 0) setSize({ w: Math.round(width), h: Math.round(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // 上方留給視角控制列，下方留給操作提示
  const pad = useMemo(() => (w < 640 ? { t: 64, r: 24, b: 36, l: 24 } : { t: 76, r: 56, b: 44, l: 56 }), [w]);

  const world = useMemo(() => new Map<string, Vec3>(notes.map((n) => [n.id, toWorld(n)])), [notes]);

  // 地面：放在所有點的下方，格線範圍跟著資料走
  const ground = useMemo(() => {
    const vs = [...world.values()];
    const z = Math.min(...vs.map((v) => v.z)) - 30;
    const snap = (v: number, f: (x: number) => number) => f(v / GRID) * GRID;
    const x1 = snap(Math.min(...vs.map((v) => v.x)), Math.floor) - GRID;
    const x2 = snap(Math.max(...vs.map((v) => v.x)), Math.ceil) + GRID;
    const y1 = snap(Math.min(...vs.map((v) => v.y)), Math.floor) - GRID;
    const y2 = snap(Math.max(...vs.map((v) => v.y)), Math.ceil) + GRID;
    const lines: [Vec3, Vec3][] = [];
    for (let x = x1; x <= x2; x += GRID) lines.push([{ x, y: y1, z }, { x, y: y2, z }]);
    for (let y = y1; y <= y2; y += GRID) lines.push([{ x: x1, y, z }, { x: x2, y, z }]);
    return { z, lines };
  }, [world]);
  // 自動置中要放得下的範圍：每個點，加上它在地面的投影（傾斜時地面在點的下方）
  const extent = useMemo(() => [...world.values()].flatMap((v) => [v, { ...v, z: ground.z }]), [world, ground]);

  // ---------- 相機 ----------
  const [cam, setCam] = useState<Cam>(() => fit(extent, VIEW_25D, w, h, pad));
  const fitK = useRef(cam.k);
  const touched = useRef(false); // 使用者動過相機後，視窗改變大小就不再自動重新置中

  const refit = useCallback(
    (view: { yaw: number; tilt: number }) => {
      const c = fit(extent, view, w, h, pad);
      fitK.current = c.k;
      setCam(c);
    },
    [extent, w, h, pad],
  );
  useEffect(() => {
    if (!touched.current) refit({ yaw: cam.yaw, tilt: cam.tilt });
    // 只在畫布尺寸或資料改變時重新置中
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refit]);

  const zoomBy = useCallback(
    (factor: number, px = w / 2, py = h / 2) => {
      touched.current = true;
      setCam((c) => zoomAt(c, factor, px, py, w, h, fitK.current * ZOOM_MIN, fitK.current * ZOOM_MAX));
    },
    [w, h],
  );
  const rotate = (dYaw: number, dTilt: number) => {
    touched.current = true;
    setCam((c) => ({ ...c, yaw: c.yaw + dYaw, tilt: Math.min(TILT_MAX, Math.max(0, c.tilt + dTilt)) }));
  };

  // 滾輪要能 preventDefault（不讓頁面跟著捲動），React 的 onWheel 是 passive，所以自己註冊
  useEffect(() => {
    const svg = svgRef.current!;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = svg.getBoundingClientRect();
      const step = e.deltaMode === 1 ? 0.05 : 0.0015; // 以「行」為單位的滑鼠要放大步伐
      zoomBy(Math.exp(-e.deltaY * step), e.clientX - r.left, e.clientY - r.top);
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [zoomBy]);

  // ---------- 拖曳：一指平移、兩指縮放、右鍵或 Shift 旋轉 ----------
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef({ moved: 0, rotate: false, captured: false });
  const [dragging, setDragging] = useState(false);

  const local = (e: React.PointerEvent) => {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    pointers.current.set(e.pointerId, local(e));
    if (pointers.current.size === 1) gesture.current = { moved: 0, rotate: e.button === 2 || e.shiftKey, captured: false };
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const next = local(e);
    const g = gesture.current;
    g.moved += Math.hypot(next.x - prev.x, next.y - prev.y);
    // 超過門檻才擷取指標：太早擷取的話，點擊事件會落在 svg 上，點不到筆記
    if (g.moved > DRAG_SLOP && !g.captured) {
      g.captured = true;
      svgRef.current!.setPointerCapture(e.pointerId);
      setDragging(true);
    }

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.entries()].map(([id, p]) => (id === e.pointerId ? next : p));
      const [pa, pb] = [...pointers.current.values()];
      const before = Math.hypot(pa.x - pb.x, pa.y - pb.y) || 1;
      const after = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const midPrev = { x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2 };
      touched.current = true;
      setCam((c) => {
        const z = zoomAt(c, after / before, mid.x, mid.y, w, h, fitK.current * ZOOM_MIN, fitK.current * ZOOM_MAX);
        return { ...z, tx: z.tx + mid.x - midPrev.x, ty: z.ty + mid.y - midPrev.y };
      });
    } else if (g.captured) {
      const dx = next.x - prev.x, dy = next.y - prev.y;
      if (g.rotate) rotate(dx * 0.008, dy * 0.006);
      else {
        touched.current = true;
        setCam((c) => ({ ...c, tx: c.tx + dx, ty: c.ty + dy }));
      }
    }
    pointers.current.set(e.pointerId, next);
  };

  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) setDragging(false);
  };

  // 拖曳結束時瀏覽器仍可能送出 click，拖過就不算選取
  const select = (id: string) => {
    if (gesture.current.moved > DRAG_SLOP) return;
    onSelect(id);
  };

  // ---------- 投影 ----------
  const pos = useMemo(() => new Map(notes.map((n) => [n.id, project(world.get(n.id)!, cam, w, h)])), [notes, world, cam, w, h]);
  const at = (v: Vec3) => project(v, cam, w, h);

  // 從清單選了一篇在畫面外的筆記時，把它移到畫面中央（只平移，不改縮放）
  useEffect(() => {
    if (!center) return;
    setCam((c) => {
      const q = project(world.get(center.id)!, c, w, h);
      const inside = q.x > pad.l && q.x < w - pad.r && q.y > pad.t && q.y < h - pad.b;
      return inside ? c : { ...c, tx: c.tx - (q.x - w / 2), ty: c.ty - (q.y - h / 2) };
    });
  }, [center, world, w, h, pad]);

  const tilted = cam.tilt > 0.05;

  // ---------- 相關度 ----------
  const shown = useMemo(() => (ranked ? ranked.slice(0, topN) : []), [ranked, topN]);
  const rankOf = useMemo(() => new Map(shown.map((r, i) => [r.note.id, i])), [shown]);

  // 起點：選定的筆記；文字查詢時則是前 3 名在 3D 空間中的加權中心（菱形標記）
  const originWorld = useMemo((): Vec3 | null => {
    if (center) return world.get(center.id)!;
    if (!shown.length) return null;
    const top = shown.slice(0, 3);
    const sw = top.reduce((s, r) => s + r.score, 0) || 1;
    const sum = (k: keyof Vec3) => top.reduce((s, r) => s + world.get(r.note.id)![k] * r.score, 0) / sw;
    return { x: sum("x"), y: sum("y"), z: sum("z") };
  }, [center, shown, world]);
  const origin = originWorld && at(originWorld);

  const active = ranked !== null;
  const baseRadius = (n: Note) => (center?.id === n.id ? 10 : rankOf.has(n.id) ? 7.5 : 5.5);
  // 透視造成的大小差異壓在 ±20% 內，深度感夠就好，不要讓遠處的點小到點不到
  const radius = (n: Note) => baseRadius(n) * Math.min(1.2, Math.max(0.8, pos.get(n.id)!.p));

  const order = useMemo(() => {
    // 標籤優先順序：中心 → 排行（依名次）→ 未應用成果 → 其他
    const list = [
      ...(center ? [center] : []),
      ...shown.map((r) => r.note),
      ...(active ? [] : notes.filter(isForgotten)),
      ...(active ? [] : notes),
    ];
    return [...new Map(list.map((n) => [n.id, n])).values()];
  }, [center, shown, active, notes]);
  const labelSize = (n: Note) => (active && n.id !== center?.id ? 11.5 : 13);
  const labels = placeLabels(order, pos, w, h, labelSize, radius);

  const manual = center ? notes.filter((n) => center.links.includes(n.id) || n.links.includes(center.id)) : [];
  const key = center?.id ?? shown.map((r) => r.note.id).join(",");
  // 畫家演算法：遠的先畫，近的疊在上面
  const byDepth = [...notes].sort((a, b) => pos.get(a.id)!.near - pos.get(b.id)!.near);
  const isTop = cam.tilt < 0.02;

  return (
    <div className="atlas-stage" ref={stageRef}>
      <svg
        ref={svgRef}
        className={`atlas-map${dragging ? " dragging" : ""}`}
        viewBox={`0 0 ${w} ${h}`}
        role="group"
        aria-label="筆記向量星圖，可縮放、平移與旋轉"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* 地面格線：俯視時就是原本的方格背景 */}
        <g className="ground">
          {ground.lines.map(([a, b], i) => {
            const [p, q] = [at(a), at(b)];
            return <line key={i} x1={p.x} y1={p.y} x2={q.x} y2={q.y} />;
          })}
        </g>

        {/* 傾斜時，每個點往地面拉一條細線，看得出高度 */}
        {tilted &&
          notes.filter((n) => !active || center?.id === n.id || rankOf.has(n.id)).map((n) => {
            const v = world.get(n.id)!;
            const top = pos.get(n.id)!;
            const foot = at({ ...v, z: ground.z });
            return (
              <g key={`s-${n.id}`} className="stem">
                <line x1={top.x} y1={top.y} x2={foot.x} y2={foot.y} />
                <circle cx={foot.x} cy={foot.y} r={1.8} />
              </g>
            );
          })}

        {/* 人工標註的關係（frontmatter links）：虛線 */}
        {center &&
          manual.map((n) => {
            const [a, b] = [pos.get(center.id)!, pos.get(n.id)!];
            return <line key={`m-${n.id}`} className="edge-manual" x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
          })}

        {/* 相關度連線：先畫低分，高分疊在上面。pathLength=1 讓逐條畫出的動畫與實際長度無關（縮放時不會斷線） */}
        <g key={key}>
          {origin &&
            [...shown].reverse().map((r) => {
              const i = rankOf.get(r.note.id)!;
              const s = strength(i, shown.length);
              const q = pos.get(r.note.id)!;
              const hot = hoverId === r.note.id;
              return (
                <line
                  key={r.note.id}
                  className="edge-rel"
                  pathLength={1}
                  x1={origin.x}
                  y1={origin.y}
                  x2={q.x}
                  y2={q.y}
                  stroke={relevanceColor(s)}
                  strokeWidth={hot ? 4.5 : 1 + 2.6 * s}
                  strokeOpacity={hot ? 1 : 0.45 + 0.5 * s}
                  style={{ "--delay": `${i * 45}ms` } as React.CSSProperties}
                />
              );
            })}
        </g>

        {origin && !center && (
          <rect className="query-mark" x={origin.x - 7} y={origin.y - 7} width="14" height="14" transform={`rotate(45 ${origin.x} ${origin.y})`} />
        )}

        {byDepth.map((n) => {
          const q = pos.get(n.id)!;
          const i = rankOf.get(n.id);
          const isCenter = center?.id === n.id;
          const lit = !active || isCenter || i !== undefined;
          const hot = hoverId === n.id;
          const color = TYPE_META[n.type].color;
          const hollow = n.status === "planned";
          const r = radius(n);
          const showLabel = hot || labels.has(n.id);
          const anchorEnd = labelOnLeft(q.x, r, labelWidth(shortTitle(n.title), labelSize(n)), w);
          return (
            <g
              key={n.id}
              className={`node${lit ? "" : " dim"}${hot ? " hot" : ""}`}
              transform={`translate(${q.x} ${q.y})`}
              role="button"
              tabIndex={0}
              aria-label={`${TYPE_META[n.type].label}：${n.title}${i !== undefined ? `，相關度第 ${i + 1} 名` : ""}`}
              onClick={() => select(n.id)}
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

      <div className="map-controls" role="toolbar" aria-label="星圖視角">
        <div className="seg" role="group" aria-label="視角">
          <button className={isTop ? "on" : ""} aria-pressed={isTop} onClick={() => (touched.current = false, refit(VIEW_TOP))}>
            <Square size={14} /> 俯視
          </button>
          <button className={isTop ? "" : "on"} aria-pressed={!isTop} onClick={() => (touched.current = false, refit(VIEW_25D))}>
            <Box size={14} /> 2.5D
          </button>
        </div>
        <div className="ctrl-group">
          <button className="icon-btn" aria-label="放大" title="放大" onClick={() => zoomBy(1.35)}><ZoomIn size={16} /></button>
          <button className="icon-btn" aria-label="縮小" title="縮小" onClick={() => zoomBy(1 / 1.35)}><ZoomOut size={16} /></button>
          <button className="icon-btn" aria-label="向左旋轉" title="向左旋轉" onClick={() => rotate(-Math.PI / 8, 0)}><RotateCcw size={16} /></button>
          <button className="icon-btn" aria-label="向右旋轉" title="向右旋轉" onClick={() => rotate(Math.PI / 8, 0)}><RotateCw size={16} /></button>
          <button className="icon-btn" aria-label="顯示全部筆記" title="顯示全部筆記" onClick={() => (touched.current = false, refit({ yaw: cam.yaw, tilt: cam.tilt }))}><Maximize size={16} /></button>
        </div>
      </div>
      <p className="map-hint" aria-hidden>
        <span className="hint-fine">滾輪縮放 · 拖曳平移 · 右鍵或 Shift 拖曳旋轉</span>
        <span className="hint-coarse">雙指縮放 · 拖曳平移</span>
      </p>
    </div>
  );
}
