---
id: exp-map-2-5d
type: experiment
title: 星圖改成 2.5D：MDS 從 2 維改投影到 3 維
date: 2026-11-16
status: validated
summary: 同樣 31 篇筆記，3D MDS 的 stress-1 從 0.228 降到 0.155，5 個最近鄰的保留率從 50% 提升到 63%；多一個高度軸，筆記變多時比較不會擠在一起。
tags: [visualization, dimensionality-reduction, moon-rag]
links: [exp-map-projection]
applied_in: [moon-rag/pipeline/build_atlas.py, moon-rag/web/src/components/AtlasMap.tsx]
source: pipeline/experiments/map_dims_check.py
---

## 問題

筆記變多以後，2D 平面會越來越擠。問題是：把投影多一個維度、用 2.5D 視角顯示，能不能保留更多原始的語意距離？

## 做法

- 讀取 atlas.json 中 31 篇筆記的向量，計算兩兩餘弦距離。
- 用同樣的 MDS 設定（random_state 42、n_init 4）分別投影到 2 維與 3 維。
- 拿投影後的歐氏距離對照原始的餘弦距離，計算三個指標。

## 結果

| 維度 | stress-1（越低越好） | 距離排序 Spearman | 5 個最近鄰保留率 |
|---|---|---|---|
| 2D | 0.228 | 0.877 | 50.3% |
| 3D | 0.155 | 0.918 | 63.2% |

樣本只有 31 篇，屬於方向性證據；筆記數量增加後應重新執行腳本確認。

## 結論

**3D 投影明顯保留了更多鄰近關係。** 星圖改成 2.5D：地面是主要的兩個方向，高度是第三個方向，可以旋轉、傾斜、以滑鼠為中心縮放與平移。傾斜角歸零就是原本的俯視圖。相關度排序仍然只看原始向量的餘弦相似度，投影只負責擺放。
