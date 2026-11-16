---
id: colbert-2020
type: paper
title: ColBERT：延遲互動檢索（Khattab & Zaharia, 2020）
date: 2020-04-27
status: reference
summary: 保留每個 token 的向量，查詢時用 MaxSim 計算細粒度相似度，在雙編碼器的速度與 cross-encoder 的精度之間取得平衡。
tags: [retrieval, late-interaction, reranking]
links: [dpr-2020, monobert-2019]
source: Khattab & Zaharia, SIGIR 2020
url: https://arxiv.org/abs/2004.12832
---

## 問題

雙編碼器把整段文字壓成一個向量，會流失細節；cross-encoder 精準，但每個候選都要完整跑一次模型，太慢。

## 方法：延遲互動

- 文件端預先算好每個 token 的向量並存起來
- 查詢的每個 token 找出文件中最相似的 token（MaxSim），再把分數加總
- 互動延遲到最後一步，所以文件可以離線編碼

## 可以借用的地方

如果 ChatbotV2 的知識庫變大，cross-encoder 成為瓶頸時，ColBERT 式的重排是中間選項。
