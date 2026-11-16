---
id: graphrag-2024
type: paper
title: GraphRAG：從局部到全局（Edge et al., 2024）
date: 2024-04-24
status: reference
summary: 用 LLM 從文件抽出實體與關係建成知識圖，再做社群偵測並預先摘要，讓 RAG 能回答需要全局理解的問題。
tags: [rag, knowledge-graph, summarization]
links: [raptor-2024]
source: Edge et al., Microsoft Research 2024
url: https://arxiv.org/abs/2404.16130
---

## 問題

一般的向量 RAG 擅長找局部事實，遇到「整個資料集有哪些主題」這類全局問題時，取回的幾段文字無法涵蓋全貌。

## 方法

- LLM 從每個 chunk 抽取實體、關係與主張，合併成知識圖
- 用 Leiden 演算法把圖切成階層式社群
- 為每個社群預先產生摘要
- 回答全局問題時，對各社群摘要分別作答，再彙整（map-reduce）

## 對本專案的意義

星圖中的 links 欄位是人工標註的關係邊。之後可以讓 AI 依 GraphRAG 的方式自動抽取實體來補邊。
