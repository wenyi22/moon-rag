---
id: exp-model-cost
type: experiment
title: 主回答模型從 gpt-4 換成 gpt-4.1
date: 2026-11-16
status: validated
summary: OpenRouter 上 gpt-4 每百萬 token 輸入 30、輸出 60 美元，gpt-4.1 是 2 與 8 美元，較新而且便宜約 15 倍，已經換掉。
tags: [model-selection, cost, chatbotv2]
links: [exp-gpt35-retired, exp-openrouter-migration]
applied_in: [.env 的 LLM_MODEL]
source: OpenRouter /api/v1/models（2026-11-16 查詢）
---

## 數據

| 模型 | 輸入（每百萬 token） | 輸出（每百萬 token） |
|---|---|---|
| openai/gpt-4 | 30 美元 | 60 美元 |
| openai/gpt-4.1 | 2 美元 | 8 美元 |
| openai/gpt-4o-mini | 0.15 美元 | 0.6 美元 |

## 決定

主回答模型改成 openai/gpt-4.1，輔助模型用 gpt-4o-mini。一次簡單測試請求的費用，從 0.00054 美元降到 gpt-4o-mini 的 0.0000033 美元。

## 尚未驗證

gpt-4.1 在 ChatbotV2 知識庫上的回答品質，還沒有和 gpt-4 並排比較過。
