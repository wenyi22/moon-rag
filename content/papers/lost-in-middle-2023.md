---
id: lost-in-middle-2023
type: paper
title: Lost in the Middle：長上下文的位置效應（Liu et al., 2023）
date: 2023-07-06
status: reference
summary: 相關資訊放在上下文開頭或結尾時模型表現最好，放在中間時準確率明顯下降，呈現 U 形曲線。
tags: [long-context, prompting, rag]
links: [rag-lewis-2020]
source: Liu et al., TACL 2024
url: https://arxiv.org/abs/2307.03172
---

## 發現

在多文件問答與鍵值檢索任務中改變正確文件的位置：放在最前或最後時準確率最高，放在中間時最差。標榜長上下文的模型也有這個現象。

## 對 RAG 的影響

- 檢索的文件不是放越多越好，更多文件可能稀釋關鍵資訊
- 文件在 Prompt 中的擺放順序，本身就是一個可以調整的變數

## 對本專案的意義

ChatbotV2 依重排分數由高到低串接 5 段文件。根據這篇論文，可以試試把最相關的放在頭尾，見想法「頭尾擺放重排結果」。
