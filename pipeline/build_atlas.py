"""
build_atlas.py — 把 content/ 的 Markdown 筆記編譯成網站用的 web/public/data/atlas.json

流程（延續 ChatbotV2.py 的 RAG 前處理）：
  1. 讀取 content/{papers,experiments,ideas}/*.md，解析並驗證 frontmatter
  2. Sentence-Window 切塊（與 ChatbotV2 相同的視窗 / 重疊設定）
  3. sentence-transformers 產生每個 chunk 的向量，平均後成為筆記向量
  4. MDS 以餘弦距離把筆記向量投影成 3D 座標，供 2.5D 星圖顯示（為何不用 t-SNE 見 exp-map-projection，為何用 3D 見 exp-map-2-5d）
  5. 輸出 atlas.json（筆記內容 + 向量 + 座標 + content_hash）

content_hash 讓 CI 檢查「內容改了卻沒重建 atlas」的情況（見 web/scripts/check-atlas.mjs）。

用法：
  python pipeline/build_atlas.py            # 完整重建
  python pipeline/build_atlas.py --check    # 只驗證 frontmatter，不算向量
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from datetime import date, datetime
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
CONTENT_DIR = ROOT / "content"
OUT_FILE = ROOT / "web" / "public" / "data" / "atlas.json"

# ---- 規格：與 AGENTS.md「Frontmatter 規格」一節保持一致 ----
TYPES = {"paper": "papers", "experiment": "experiments", "idea": "ideas"}
STATUSES = {"validated", "failed", "running", "planned", "reference"}
REQUIRED = ["id", "type", "title", "date", "status", "summary", "tags"]
ID_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")

# 中英混合內容 → 使用多語模型（ChatbotV2 的 all-MiniLM-L6-v2 只用英文訓練）
EMBEDDING_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
WINDOW_SIZE = 3  # 與 ChatbotV2.SENTENCE_WINDOW_SIZE 相同
WINDOW_OVERLAP = 1  # 與 ChatbotV2.SENTENCE_WINDOW_OVERLAP 相同
SENTENCE_SPLIT = re.compile(r"(?<=[。！？!?；;])|\n+")


class ContentError(Exception):
    pass


def content_files() -> list[Path]:
    return sorted(CONTENT_DIR.glob("*/*.md"))


def content_hash(files: list[Path]) -> str:
    """sha256(相對路徑 + 內容)，CRLF 正規化成 LF；Node 端的 check-atlas.mjs 用同一演算法。"""
    h = hashlib.sha256()
    for f in sorted(files, key=lambda p: p.relative_to(ROOT).as_posix()):
        h.update(f.relative_to(ROOT).as_posix().encode("utf-8"))
        h.update(b"\0")
        h.update(f.read_bytes().replace(b"\r\n", b"\n"))
        h.update(b"\0")
    return h.hexdigest()


def parse_note(path: Path) -> dict:
    text = path.read_text(encoding="utf-8").replace("\r\n", "\n")
    m = re.match(r"^---\n(.*?)\n---\n(.*)$", text, re.S)
    if not m:
        raise ContentError(f"{path}: 缺少 --- frontmatter --- 區塊")
    meta = yaml.safe_load(m.group(1)) or {}
    body = m.group(2).strip()

    missing = [k for k in REQUIRED if k not in meta]
    if missing:
        raise ContentError(f"{path}: 缺少欄位 {missing}")
    if isinstance(meta["date"], (date, datetime)):
        meta["date"] = meta["date"].isoformat()[:10]

    folder = path.parent.name
    checks = [
        (ID_RE.match(str(meta["id"])), "id 必須是 kebab-case"),
        (meta["id"] == path.stem, f"id '{meta['id']}' 必須與檔名 '{path.stem}' 相同"),
        (meta["type"] in TYPES, f"type 必須是 {sorted(TYPES)}"),
        (TYPES.get(meta["type"]) == folder, f"type={meta['type']} 的檔案必須放在 content/{TYPES.get(meta['type'])}/"),
        (meta["status"] in STATUSES, f"status 必須是 {sorted(STATUSES)}"),
        ((meta["type"] == "paper") == (meta["status"] == "reference"), "論文用 status: reference，其他類型不可用"),
        (re.match(r"^\d{4}-\d{2}-\d{2}$", str(meta["date"])), "date 格式必須是 YYYY-MM-DD"),
        (isinstance(meta["tags"], list) and meta["tags"], "tags 必須是非空清單"),
        ("## " in body, "內文至少要有一個 ## 段落（每個 ## 是一張投影片）"),
    ]
    for ok, msg in checks:
        if not ok:
            raise ContentError(f"{path}: {msg}")

    return {
        "id": meta["id"],
        "type": meta["type"],
        "title": meta["title"],
        "date": meta["date"],
        "status": meta["status"],
        "summary": meta["summary"],
        "tags": [str(t) for t in meta["tags"]],
        "links": [str(x) for x in meta.get("links") or []],
        "applied_in": [str(x) for x in meta.get("applied_in") or []],
        "source": meta.get("source", ""),
        "url": meta.get("url", ""),
        "body": body,
        "path": path.relative_to(ROOT).as_posix(),
    }


def validate_links(notes: list[dict]) -> None:
    ids = {n["id"] for n in notes}
    if len(ids) != len(notes):
        raise ContentError("有重複的 id")
    for n in notes:
        bad = [x for x in n["links"] if x not in ids]
        if bad:
            raise ContentError(f"{n['path']}: links 指向不存在的 id {bad}")


def sentence_windows(text: str) -> list[str]:
    """Sentence-Window 切塊：與 ChatbotV2.load_knowledge_base 同樣的視窗 / 重疊概念。"""
    plain = re.sub(r"[#*`>\[\]|]", " ", text)
    sents = [s.strip() for s in SENTENCE_SPLIT.split(plain) if s and s.strip()]
    step = max(1, WINDOW_SIZE - WINDOW_OVERLAP)
    windows = [" ".join(sents[i:i + WINDOW_SIZE]) for i in range(0, max(1, len(sents)), step)]
    return [w for w in windows if w] or [plain[:500]]


def embed_and_project(notes: list[dict]) -> None:
    import numpy as np
    from sentence_transformers import SentenceTransformer
    from sklearn.manifold import MDS

    model = SentenceTransformer(EMBEDDING_MODEL)
    vecs = []
    for n in notes:
        # 標題與摘要也算一個 chunk，讓筆記向量更貼近它的主題
        chunks = [f"{n['title']}。{n['summary']}"] + sentence_windows(n["body"])
        emb = model.encode(chunks, normalize_embeddings=True)
        v = emb.mean(axis=0)
        vecs.append(v / np.linalg.norm(v))
        n["chunks"] = len(chunks)
    mat = np.vstack(vecs)

    # MDS 投影成 3D：讓 3D 距離盡量貼近餘弦距離（比 2D 多保留的資訊見 content/experiments/exp-map-2-5d.md）
    dist = np.clip(1 - mat @ mat.T, 0, None)
    np.fill_diagonal(dist, 0)
    try:
        mds = MDS(n_components=3, dissimilarity="precomputed", random_state=42, n_init=4)
    except TypeError:  # 新版 scikit-learn 把參數改名為 metric
        mds = MDS(n_components=3, metric="precomputed", random_state=42, n_init=4)
    xyz = mds.fit_transform(dist)

    # MDS 的座標軸方向是任意的：用 SVD 轉到主軸，x 是變異最大的方向，z（高度）是最小的方向
    xyz = xyz - xyz.mean(axis=0)
    _, _, vt = np.linalg.svd(xyz, full_matrices=False)
    xyz = xyz @ vt.T
    # 三軸用同一個比例縮放到 0..1（置中於 0.5），保留真實的長寬高比例；前端依畫面自動縮放
    xyz = xyz / (2 * np.abs(xyz).max() + 1e-9) + 0.5

    for n, v, p in zip(notes, mat, xyz):
        n["embedding"] = [round(float(x), 4) for x in v]
        n["x"], n["y"], n["z"] = (round(float(c), 4) for c in p)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="只驗證內容，不計算向量")
    args = ap.parse_args()

    files = content_files()
    try:
        notes = [parse_note(f) for f in files]
        validate_links(notes)
    except ContentError as e:
        print(f"[內容錯誤] {e}", file=sys.stderr)
        return 1
    print(f"驗證通過：{len(notes)} 篇筆記")
    if args.check:
        return 0

    embed_and_project(notes)
    atlas = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "model": EMBEDDING_MODEL,
        "dim": len(notes[0]["embedding"]) if notes else 0,
        "content_hash": content_hash(files),
        "notes": notes,
    }
    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text(json.dumps(atlas, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"已寫入 {OUT_FILE.relative_to(ROOT)}（{OUT_FILE.stat().st_size // 1024} KB）")
    return 0


if __name__ == "__main__":
    sys.exit(main())
