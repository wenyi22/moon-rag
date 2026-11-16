---
id: exp-gpt35-retired
type: experiment
title: 沿用 gpt-3.5-turbo 當輔助模型
date: 2026-11-16
status: failed
summary: OpenRouter 對 openai/gpt-3.5-turbo 回傳 404，已經沒有供應商提供，子查詢與 HyDE 改用 gpt-4o-mini。
tags: [openrouter, model-selection, chatbotv2]
links: [exp-openrouter-migration, exp-model-cost]
applied_in: [ChatbotV2.py 的 AUX_MODEL 改為 gpt-4o-mini]
source: OpenRouter /chat/completions 回應
---

## 嘗試

ChatbotV2 的 Self-Query 與 HyDE 寫死使用 gpt-3.5-turbo，遷到 OpenRouter 後直接沿用。

## 結果

回傳 HTTP 404：「openai/gpt-3.5-turbo is no longer available on OpenRouter: no provider serves this model anymore」。如果沒有測試，每次提問都會在子查詢這一步出錯。

## 處置

查詢 /api/v1/models 的價格後，改用 openai/gpt-4o-mini。它是非推理模型，150 個 token 的上限不會被推理過程吃掉。

## 教訓

模型名稱要放在設定檔，並且每次換供應商都要對每個用到的模型實際發一次請求。
