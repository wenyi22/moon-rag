---
id: idea-rrf-fusion
type: idea
title: 用 RRF 合併多路檢索
date: 2026-11-16
status: planned
summary: ChatbotV2 合併子查詢與 HyDE 結果時只做去重，改用 RRF 可以保留「被多路同時找到」的訊號，而且幾乎不增加成本。
tags: [fusion, retrieval, chatbotv2]
links: [rrf-2009, exp-ablation-self-query]
applied_in: []
---

## 想法

目前每一路檢索各取前幾筆，去重後全部交給重排。被三路都排第一的文件，和只被一路排第十的文件，在進入重排前是平等的。

## 做法

- 每一路的結果依名次計算 1/(60+rank)
- 同一份文件的分數相加，依總分排序
- 取前 N 筆交給 cross-encoder，N 可以比現在小，順便降低重排成本

## 驗證方式

放進「Self-Query 子查詢數量實驗」的合併方式變數一起比較。
