---
id: sentence-bert-2019
type: paper
title: Sentence-BERT：用孿生網路產生句向量（Reimers & Gurevych, 2019）
date: 2019-08-27
status: reference
summary: 把 BERT 改成孿生網路並做池化，產生可直接用餘弦相似度比較的句向量，是 sentence-transformers 套件的基礎。
tags: [embedding, sentence-transformers]
links: []
source: Reimers & Gurevych, EMNLP 2019
url: https://arxiv.org/abs/1908.10084
---

## 問題

原始 BERT 比較兩個句子時，要把它們一起送進模型（cross-encoder）。在一萬個句子中找最相似的一對，需要約五千萬次推論，無法用在檢索。

## 方法

- 兩個共享權重的 BERT 分別編碼兩個句子（siamese）
- 對 token 輸出做平均池化，得到固定長度的句向量
- 用 NLI 與 STS 資料微調，讓向量的餘弦相似度對應語意相似度

## 對本專案的意義

ChatbotV2 的 all-MiniLM-L6-v2 和本網站用的 paraphrase-multilingual-MiniLM-L12-v2 都屬於這一系列模型。星圖上每一個點，都是這種句向量的平均。
