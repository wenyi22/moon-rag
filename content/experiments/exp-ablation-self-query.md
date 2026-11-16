---
id: exp-ablation-self-query
type: experiment
title: Self-Query 子查詢數量實驗
date: 2026-11-16
status: planned
summary: 比較 0、1、3、5 個子查詢對召回率與延遲的影響，找出 ChatbotV2 的 SELF_QUERY_TOP_K 該設多少。
tags: [ablation, query-expansion, chatbotv2]
links: [exp-ablation-hyde, rrf-2009]
applied_in: []
source: ChatbotV2.py 的 SELF_QUERY_TOP_K
---

## 問題

ChatbotV2 固定生成 3 個子查詢，每個取 10 筆，最多 35 筆候選再交給 cross-encoder。子查詢越多召回越高，但重排成本與延遲也越高。

## 設計

- 子查詢數量：0、1、3、5
- 合併方式：目前的去重，以及 RRF 兩種
- 指標：重排前的召回率、最終 top-5 命中率、延遲

## 狀態

尚未執行，需要先建立問答測試集（與 Sentence-Window 實驗共用）。
