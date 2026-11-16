---
id: exp-map-projection
type: experiment
title: 星圖投影方法：t-SNE 改成 MDS
date: 2026-11-16
status: validated
summary: 30 篇筆記用 t-SNE 時出現離群點，其他點全擠在角落；MDS 直接保留餘弦距離，點與點的最小間距中位數從 0.095 提升到 0.102，而且距離可以解讀。
tags: [visualization, dimensionality-reduction, moon-rag]
links: [tsne-2008]
applied_in: [moon-rag/pipeline/build_atlas.py]
source: 1440px 截圖比較，以及最近鄰距離的統計
---

## 問題

第一版星圖用 t-SNE（perplexity 8）。截圖中 Sentence-BERT 被推到左上角，其他 29 個點擠在右下四分之一，標籤全部疊在一起，根本無法閱讀。

## 比較

座標正規化到 0 到 1 後，計算每個點與最近鄰的距離：

| 方法 | 最近鄰距離中位數 | 距離小於 0.04 的點 |
|---|---|---|
| t-SNE perplexity 3 | 0.058 | 6 |
| t-SNE perplexity 5 | 0.058 | 0 |
| t-SNE perplexity 8 | 0.095 | 0 |
| PCA | 0.088 | 9 |
| MDS（餘弦距離） | 0.102 | 0 |

## 結論

資料量少時，t-SNE 的局部最佳化不穩定，而且距離本身沒有意義。MDS 讓 2D 距離盡量貼近餘弦距離，筆記數量在百篇以內時更適合。筆記超過數百篇後可以再評估 UMAP。
