---
id: rag-lewis-2020
type: paper
title: RAG：檢索增強生成（Lewis et al., 2020）
date: 2020-05-22
status: reference
summary: 把可微分的稠密檢索器接到生成模型前面，讓模型回答時能查外部知識，奠定 RAG 這個名稱與架構。
tags: [rag, generation, retrieval]
links: [dpr-2020]
source: Lewis et al., NeurIPS 2020
url: https://arxiv.org/abs/2005.11401
---

## 問題

大型語言模型把知識存在參數裡，難以更新、無法指出出處，也會產生幻覺。知識密集型任務（開放域問答、事實查核）需要能查證的外部資料。

## 方法

- 檢索器：DPR 雙編碼器，從 Wikipedia 的稠密索引取回 top-k 段落
- 生成器：BART，以問題加上檢索段落為條件生成答案
- RAG-Sequence：整段回答使用同一批文件；RAG-Token：每個 token 可以依賴不同文件
- 檢索器的查詢編碼器與生成器端到端一起微調

## 對本專案的意義

ChatbotV2 的整體流程（檢索、組 Prompt、生成）就是這篇的工程化版本，只是生成器換成 API 模型、檢索器不做微調。
