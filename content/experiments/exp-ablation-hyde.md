---
id: exp-ablation-hyde
type: experiment
title: HyDE 消融實驗
date: 2026-11-16
status: planned
summary: 關掉 HyDE 只用原始查詢與子查詢，比較 top-5 命中率與延遲，確認 HyDE 在小型中文知識庫上是否值得多一次 LLM 呼叫。
tags: [ablation, query-expansion, chatbotv2]
links: [hyde-2022, query2doc-2023, exp-ablation-self-query]
applied_in: []
source: ChatbotV2_Report.md 6.1 節
---

## 問題

HyDE 每次提問多一次 LLM 呼叫。在知識庫很小、用字接近的情況下，它可能沒有幫助，甚至會把假設文件中的錯誤帶進檢索。

## 設計

- 對照組：原始查詢加子查詢
- 實驗組：對照組再加上 HyDE 文件檢索
- 變體：改用 Query2doc，把偽文件接在查詢後面
- 指標：top-5 命中率、平均延遲、每題費用

## 狀態

尚未執行。報告中的數字是預期值，不是結果。
