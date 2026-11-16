---
id: exp-openrouter-migration
type: experiment
title: 把 ChatbotV2 從 OpenAI 遷到 OpenRouter
date: 2026-11-16
status: validated
summary: OpenRouter 相容 OpenAI SDK v1，只要換 base_url 與 key，模型名稱改成 provider/model 格式即可，兩個模型都回應成功。
tags: [openrouter, api, chatbotv2]
links: [exp-openai-sdk-v1, exp-gpt35-retired]
applied_in: [ChatbotV2.py, .env]
source: ChatbotV2.py 第 13-32 行
---

## 目標

改用 OpenRouter 的 key，一把 key 就能切換不同供應商的模型。

## 做法

- .env 新增 OPENROUTER_API_KEY、LLM_BASE_URL、LLM_MODEL、LLM_AUX_MODEL
- client 改成 OpenAI(api_key=..., base_url=LLM_BASE_URL)
- 沒有 OpenRouter key 時，退回原本的 OPENAI_API_KEY，不破壞舊設定
- 寫死在程式裡的模型名稱改成讀 .env

## 結果

openai/gpt-4.1 與 openai/gpt-4o-mini 透過 SDK 呼叫都回傳 200。中間發現 gpt-3.5-turbo 已下架，另外記錄在「gpt-3.5-turbo 下架」。
