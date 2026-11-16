---
id: exp-ablation-rerank
type: experiment
title: Cross-Encoder 重排的貢獻
date: 2026-11-16
status: planned
summary: 比較有無 cross-encoder 重排的 top-5 命中率，確認 ms-marco 英文重排模型在中文問題上是否真的有幫助。
tags: [ablation, reranking, chatbotv2]
links: [monobert-2019, colbert-2020, exp-multilingual-embedding]
applied_in: []
source: ChatbotV2.py 的 RE_RANK_MODEL_NAME
---

## 疑慮

cross-encoder/ms-marco-MiniLM-L-6-v2 是在英文 MS MARCO 上訓練的。根據「中文內容要換多語嵌入模型」的結果，英文模型處理中文的能力很弱，重排可能是在亂排。

## 設計

- A：向量檢索直接取前 5 筆
- B：向量檢索取 35 筆，cross-encoder 重排後取前 5 筆
- C：B 改用多語重排模型（例如 BAAI/bge-reranker-v2-m3）
- 指標：top-5 命中率、延遲

## 狀態

尚未執行。
