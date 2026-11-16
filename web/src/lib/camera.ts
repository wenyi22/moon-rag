// 2.5D 星圖的相機：把筆記的 3D 座標（pipeline 的 MDS 輸出，0..1）投影到螢幕。
// 只放純數學，不碰 React 或 SVG：之後筆記多到要改用 Canvas / WebGL 時，這個檔案可以直接沿用。
//
// 座標系：地面是 X–Y 平面，Z 是高度。
//   yaw  繞垂直軸旋轉（弧度）
//   tilt 傾斜角，0 = 正上方俯視（等同舊的 2D 星圖），越大越像斜看桌面
//   k    縮放倍率；tx、ty 平移（螢幕單位）

export interface Vec3 { x: number; y: number; z: number }
export interface Cam { yaw: number; tilt: number; k: number; tx: number; ty: number }
export interface Projected { x: number; y: number; /** 越大越靠近觀看者，用來決定繪製順序 */ near: number; /** 透視縮放，用於點的大小 */ p: number }

/** 世界尺度：0..1 的座標放大成這麼多單位，k = 1 時一單位約等於一個螢幕像素 */
export const SPAN = 1000;
/** 透視距離：越大透視越弱；2.5D 只要一點深度感，不要魚眼 */
const DEPTH = 2600;

export const TILT_MAX = 1.2; // 約 69°，再斜下去地面會變成一條線
export const VIEW_TOP = { yaw: 0, tilt: 0 };
export const VIEW_25D = { yaw: -0.5, tilt: 0.8 };

export const toWorld = (n: { x: number; y: number; z: number }): Vec3 => ({
  x: (n.x - 0.5) * SPAN,
  y: (n.y - 0.5) * SPAN,
  z: (n.z - 0.5) * SPAN,
});

/** 投影到螢幕座標（w × h 的畫布，原點在左上）。 */
export function project(v: Vec3, cam: Cam, w: number, h: number): Projected {
  const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw);
  const ct = Math.cos(cam.tilt), st = Math.sin(cam.tilt);
  const rx = v.x * cy - v.y * sy;
  const ry = v.x * sy + v.y * cy;
  const near = ry * st + v.z * ct;
  const p = DEPTH / Math.max(DEPTH - near, DEPTH * 0.2);
  return { x: w / 2 + cam.tx + cam.k * p * rx, y: h / 2 + cam.ty + cam.k * p * (ry * ct - v.z * st), near, p };
}

/** 以螢幕上的 (px, py) 為中心縮放：縮放前後，滑鼠底下的那一點保持不動。 */
export function zoomAt(cam: Cam, factor: number, px: number, py: number, w: number, h: number, kMin: number, kMax: number): Cam {
  const k = Math.min(kMax, Math.max(kMin, cam.k * factor));
  const r = k / cam.k;
  // 螢幕點 = 中心 + t + k·q；要讓 q 不變，t' = (px − 中心) − r·(px − 中心 − t)
  const ox = px - w / 2, oy = py - h / 2;
  return { ...cam, k, tx: ox - r * (ox - cam.tx), ty: oy - r * (oy - cam.ty) };
}

export interface Pad { t: number; r: number; b: number; l: number }

/** 依目前的角度，算出能把所有點放進畫面（扣掉四邊留白）的縮放與平移。 */
export function fit(points: Vec3[], view: { yaw: number; tilt: number }, w: number, h: number, pad: Pad): Cam {
  const base: Cam = { ...view, k: 1, tx: 0, ty: 0 };
  const ps = points.map((v) => project(v, base, w, h));
  const xs = ps.map((q) => q.x), ys = ps.map((q) => q.y);
  const [x1, x2, y1, y2] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const k = Math.min((w - pad.l - pad.r) / Math.max(x2 - x1, 1), (h - pad.t - pad.b) / Math.max(y2 - y1, 1));
  // 縮放以畫面中心為準：外框中心經過 k 倍後，要落在扣掉留白後的可用區域中心
  const cx = (pad.l + w - pad.r) / 2, cy = (pad.t + h - pad.b) / 2;
  return { ...base, k, tx: cx - w / 2 - k * ((x1 + x2) / 2 - w / 2), ty: cy - h / 2 - k * ((y1 + y2) / 2 - h / 2) };
}
