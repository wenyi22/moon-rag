---
id: idea-wiki-first-rag
type: idea
title: 先整理成 Wiki，再檢索
date: 2026-11-16
status: running
summary: 不直接對原始文件切塊檢索，而是讓 AI 先把每份資料整理成有固定格式、互相連結的筆記，再對筆記做向量檢索，也就是這個網站本身。
tags: [rag, knowledge-base, wiki]
links: [raptor-2024, graphrag-2024, idea-forgotten-radar]
applied_in: [moon-rag]
---

## 想法

ChatbotV2 直接把 knowledge_base.txt 切塊建索引。原始資料雜亂時，檢索出來的段落也是雜亂的。先讓 AI 依 AGENTS.md 的格式整理出摘要、標籤、狀態與連結，每篇筆記就是一個乾淨的高層節點。

## 和論文的關係

- 類似 RAPTOR 的摘要節點，但由人與 AI 一起維護
- links 欄位是手動版的 GraphRAG 關係邊

## 目前進度

網站與 pipeline 已完成。還沒有比較「對筆記檢索」與「對原始文件檢索」的回答品質。
