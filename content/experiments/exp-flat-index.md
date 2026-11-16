---
id: exp-flat-index
type: experiment
title: Flat 索引的選擇
date: 2025-01-08
status: validated
summary: 知識庫只有數十筆，ChatbotV2 用 FAISS IndexFlatL2 精確搜尋，召回不打折、也沒有效能問題，近似索引沒有必要。
tags: [faiss, vector-index, chatbotv2]
links: [faiss-2017]
applied_in: [ChatbotV2.py 的 FAISS 索引, faiss_index.bin]
source: ChatbotV2.py、ChatbotV2_Report.md 3.2 節
---

## 決策

IndexFlatL2 會逐一計算查詢與每個向量的距離，結果是精確的最近鄰，不會因為近似而漏掉文件。

## 為什麼不用 IVF 或 HNSW

- 近似索引要先訓練分群或建圖，資料少時分群本身就不穩定
- 幾十筆向量的暴力搜尋只要毫秒等級
- 近似索引的價值在百萬筆以上

## 何時要重新評估

知識庫超過約十萬筆，或者查詢延遲成為瓶頸時。
