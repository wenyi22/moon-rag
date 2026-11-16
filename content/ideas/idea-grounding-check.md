---
id: idea-grounding-check
type: idea
title: 回答前檢查是否有根據
date: 2026-11-16
status: planned
summary: 借用 Self-RAG 的反思概念：生成答案後，再用便宜的模型逐句檢查是否被檢索段落支持，不支持的句子就標註或刪除。
tags: [hallucination, generation, chatbotv2]
links: [self-rag-2023, exp-model-cost]
applied_in: []
---

## 想法

ChatbotV2 目前只靠系統提示「嚴格遵循提供的資料」來抑制幻覺，沒有任何事後檢查。

## 做法

- 生成答案後，把答案拆成句子
- 用 gpt-4o-mini 判斷每一句能不能在檢索段落中找到依據
- 找不到依據的句子加上標記，或請主模型重寫

## 成本

每次回答多一次便宜模型的呼叫，大約是主模型費用的一小部分。
