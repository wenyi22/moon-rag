"""2D 與 3D MDS 的投影保真度比較（實驗筆記 exp-map-2-5d 的 source）。

直接讀 atlas.json 裡的筆記向量，不需要嵌入模型：
  python pipeline/experiments/map_dims_check.py

指標（都是拿「投影後的歐氏距離」對照「原始向量的餘弦距離」）：
  - stress-1：Kruskal stress，越低越好
  - spearman：距離排序的相關係數，越高越好
  - knn@5：每篇筆記在投影中的 5 個最近鄰，有多少比例也是原始空間的 5 個最近鄰
"""
import json
from pathlib import Path

import numpy as np
from scipy.stats import spearmanr
from sklearn.manifold import MDS

ATLAS = Path(__file__).resolve().parents[2] / "web" / "public" / "data" / "atlas.json"
K = 5


def mds(dist: np.ndarray, dims: int) -> np.ndarray:
    try:
        m = MDS(n_components=dims, dissimilarity="precomputed", random_state=42, n_init=4)
    except TypeError:  # 新版 scikit-learn 參數改名
        m = MDS(n_components=dims, metric="precomputed", random_state=42, n_init=4)
    return m.fit_transform(dist)


def knn_overlap(a: np.ndarray, b: np.ndarray) -> float:
    n = len(a)
    hits = 0
    for i in range(n):
        na = set(np.argsort(a[i])[1 : K + 1])
        nb = set(np.argsort(b[i])[1 : K + 1])
        hits += len(na & nb)
    return hits / (n * K)


def main() -> None:
    notes = json.loads(ATLAS.read_text(encoding="utf-8"))["notes"]
    mat = np.array([n["embedding"] for n in notes])
    mat /= np.linalg.norm(mat, axis=1, keepdims=True)
    dist = np.clip(1 - mat @ mat.T, 0, None)
    np.fill_diagonal(dist, 0)
    iu = np.triu_indices(len(mat), 1)

    print(f"notes={len(notes)}")
    for dims in (2, 3):
        xy = mds(dist, dims)
        d = np.linalg.norm(xy[:, None] - xy[None], axis=-1)
        # 把投影距離縮放到與原始距離同尺度，再算 stress-1
        scale = (d[iu] @ dist[iu]) / (d[iu] @ d[iu])
        stress = np.sqrt(((dist[iu] - scale * d[iu]) ** 2).sum() / (dist[iu] ** 2).sum())
        rho = spearmanr(d[iu], dist[iu]).statistic
        print(f"{dims}D  stress-1={stress:.3f}  spearman={rho:.3f}  knn@{K}={knn_overlap(d, dist):.3f}")


if __name__ == "__main__":
    main()
