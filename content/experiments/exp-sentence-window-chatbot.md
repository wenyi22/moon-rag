---
id: exp-sentence-window-chatbot
type: experiment
title: Sentence-Window 切塊（視窗 3、重疊 1）
date: 2025-01-08
status: running
summary: ChatbotV2 以 3 句為一個視窗、重疊 1 句切塊，保留上下文；已實作並在使用中，但視窗大小對檢索品質的影響還沒有量測。
tags: [chunking, retrieval, chatbotv2]
links: [faiss-2017, exp-multilingual-embedding]
applied_in: [ChatbotV2.py, moon-rag/pipeline/build_atlas.py]
source: ChatbotV2.py 的 SENTENCE_WINDOW_SIZE 與 SENTENCE_WINDOW_OVERLAP
---

## 做法

以 jieba 斷句後，每 3 句組成一個 chunk，相鄰 chunk 重疊 1 句。重疊讓落在邊界上的資訊有兩次被檢索的機會。

## 目前狀態

- 已經在 ChatbotV2 使用
- 本網站的 build_atlas.py 沿用同樣的視窗與重疊設定
- 報告中「提升 10-15% 準確率」是預期值，**不是量測結果**

## 下一步

建立 20 題左右的問答測試集，比較視窗 1、3、5 的 top-5 命中率。
