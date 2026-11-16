---
id: exp-multilingual-embedding
type: experiment
title: 中文內容要換多語嵌入模型
date: 2026-11-16
status: validated
summary: ChatbotV2 的 all-MiniLM-L6-v2 對中文分不出同義句與無關句（差距 0.216），多語模型的差距是 0.616，但 ChatbotV2 還沒有換。
tags: [embedding, multilingual, chatbotv2]
links: [sentence-bert-2019, exp-sentence-window-chatbot]
applied_in: []
source: pipeline/experiments/emb_multilingual_check.py（3 組同義句、3 組無關句）
---

## 假設

ChatbotV2 的知識庫是中文，但嵌入模型 all-MiniLM-L6-v2 只用英文資料訓練，中文句子大多會被切成無法辨識的 token，向量可能幾乎沒有語意。

## 做法

各取 3 組中文同義句與 3 組無關句，比較兩個模型的餘弦相似度。

| 模型 | 同義句平均 | 無關句平均 | 差距 |
|---|---|---|---|
| all-MiniLM-L6-v2 | 0.724 | 0.508 | 0.216 |
| paraphrase-multilingual-MiniLM-L12-v2 | 0.612 | -0.003 | 0.616 |

## 結論

英文模型連「如何提升模型效能」和「今天的晚餐是牛肉麵」都給 0.516，代表它在中文上的分數主要來自 token 重疊，不是語意。多語模型能把無關句壓到 0 附近。樣本只有 6 組，屬於方向性證據。

## 尚未應用

本網站的 pipeline 已經改用多語模型，但 **ChatbotV2.py 的 EMBEDDING_MODEL_NAME 還是 all-MiniLM-L6-v2**，同時 faiss_index.bin 也要重建。
