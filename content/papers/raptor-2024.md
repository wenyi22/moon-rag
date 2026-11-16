---
id: raptor-2024
type: paper
title: RAPTOR：遞迴摘要樹檢索（Sarthi et al., 2024）
date: 2024-01-31
status: reference
summary: 把文件切塊後反覆分群並摘要，建出由細到粗的樹，檢索時可以同時取回細節與高層摘要。
tags: [rag, summarization, hierarchy]
links: [graphrag-2024]
source: Sarthi et al., ICLR 2024
url: https://arxiv.org/abs/2401.18059
---

## 問題

只檢索短小的連續段落，難以回答需要整合整份文件的問題，例如「這本書的主題是什麼」。

## 方法

- 底層：原始文字切塊並編碼
- 對 chunk 向量分群（高斯混合模型），用 LLM 把每一群摘要成新節點
- 對摘要節點重複上述步驟，直到形成一棵樹
- 檢索時把整棵樹攤平一起搜尋，同時拿到不同抽象層級的內容

## 對本專案的意義

本網站先整理成筆記、再拿筆記檢索的作法，是 RAPTOR 的手動版：每篇筆記的 summary 就是一個高層節點。
