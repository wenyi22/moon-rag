---
id: faiss-2017
type: paper
title: FAISS：十億級 GPU 相似度搜尋（Johnson et al., 2017）
date: 2017-02-28
status: reference
summary: Meta 的向量檢索函式庫，提供精確搜尋（Flat）與倒排、乘積量化等近似索引，讓大規模向量檢索變得可行。
tags: [retrieval, vector-index, faiss]
links: []
source: Johnson, Douze & Jégou, IEEE Transactions on Big Data 2019
url: https://arxiv.org/abs/1702.08734
---

## 問題

向量數量達到百萬、十億時，逐一計算距離太慢，記憶體也放不下。

## 索引家族

- IndexFlatL2：逐一比對，結果精確，適合小型知識庫
- IVF：先把向量分群，查詢時只搜尋最近的幾群
- PQ（乘積量化）：把向量切段壓縮，大幅降低記憶體用量
- 論文的貢獻之一，是把 k-selection 等步驟搬到 GPU 上高效執行

## 對本專案的意義

ChatbotV2 用的是 IndexFlatL2。知識庫只有幾十筆時，精確搜尋沒有效能問題，見實驗「Flat 索引的選擇」。
