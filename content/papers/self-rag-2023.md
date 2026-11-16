---
id: self-rag-2023
type: paper
title: Self-RAG：自我反思的檢索增強（Asai et al., 2023）
date: 2023-10-17
status: reference
summary: 訓練模型輸出特殊的反思 token，自己決定何時檢索、評估檢索段落是否相關、回答是否有根據。
tags: [rag, self-reflection, generation]
links: [rag-lewis-2020]
source: Asai et al., ICLR 2024
url: https://arxiv.org/abs/2310.11511
---

## 問題

每次都固定檢索固定數量的文件，會把不相關的段落塞進上下文，也讓不需要查資料的問題變慢。

## 方法

- 模型生成時可以輸出 Retrieve token，決定要不要檢索
- 對每段檢索結果輸出相關性判斷，對自己的回答輸出是否有根據的判斷
- 推論時依這些反思分數挑選最好的輸出

## 可以借用的地方

不用重新訓練也能借用這個概念：在 ChatbotV2 生成答案後，加一步檢查答案有沒有被檢索段落支持。
