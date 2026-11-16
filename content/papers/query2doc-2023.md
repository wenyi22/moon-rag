---
id: query2doc-2023
type: paper
title: Query2doc：用 LLM 擴寫查詢（Wang et al., 2023）
date: 2023-03-14
status: reference
summary: 讓 LLM 依查詢生成偽文件，再把偽文件接在原查詢後面，同時提升稀疏（BM25）與稠密檢索的效果。
tags: [retrieval, query-expansion]
links: [hyde-2022]
source: Wang, Yang & Wei, EMNLP 2023
url: https://arxiv.org/abs/2303.07678
---

## 方法

- 用少量範例提示 LLM，依查詢寫出一段偽文件
- 稀疏檢索：把原查詢重複數次再接上偽文件，避免原查詢的權重被稀釋
- 稠密檢索：把查詢與偽文件串接後一起編碼

## 和 HyDE 的差別

HyDE 用偽文件取代查詢，Query2doc 則是把偽文件接在查詢後面。ChatbotV2 目前採用 HyDE 的做法，兩者可以當作同一個消融實驗的兩個變體。
