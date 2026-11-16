---
id: idea-lost-middle-order
type: idea
title: 頭尾擺放重排結果
date: 2026-11-16
status: planned
summary: 依 Lost in the Middle 的發現，把重排分數最高的兩段放在 Prompt 的頭和尾，其餘放中間，看回答準確率是否提升。
tags: [prompting, long-context, chatbotv2]
links: [lost-in-middle-2023, exp-ablation-rerank]
applied_in: []
---

## 想法

ChatbotV2 的 generate_prompt 依分數由高到低串接文件，最相關的在最前面，第二相關的卻在中間偏前。把第 1 名放開頭、第 2 名放結尾，讓兩個最強的位置都放最相關的內容。

## 成本

只改 generate_prompt 裡的排序，不增加任何 API 呼叫。

## 驗證方式

同一份問答測試集，比較兩種擺放的回答正確率。文件只有 5 段時效果可能不明顯，要另外測 10 段的情況。
