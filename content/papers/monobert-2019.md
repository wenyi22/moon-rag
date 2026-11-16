---
id: monobert-2019
type: paper
title: 用 BERT 做段落重排序（Nogueira & Cho, 2019）
date: 2019-01-13
status: reference
summary: 把問題與段落一起送進 BERT 判斷相關性（cross-encoder），在 MS MARCO 上大幅領先，確立先召回、再重排的兩階段架構。
tags: [reranking, cross-encoder]
links: [sentence-bert-2019]
source: Nogueira & Cho, arXiv 2019
url: https://arxiv.org/abs/1901.04085
---

## 問題

第一階段檢索（BM25 或向量）追求速度，排序不夠精準，真正相關的段落常排在後面。

## 方法

- 輸入 [CLS] 問題 [SEP] 段落，輸出相關機率
- 只對第一階段取回的前 k 筆重新打分，控制計算量
- 問題與段落在每一層都互相注意，比雙編碼器看得更細

## 對本專案的意義

ChatbotV2 的 cross-encoder/ms-marco-MiniLM-L-6-v2 就是這條路線：它在 MS MARCO 上訓練，用原始問題對合併後的候選文件重排。
