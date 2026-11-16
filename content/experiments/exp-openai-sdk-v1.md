---
id: exp-openai-sdk-v1
type: experiment
title: openai 0.28 與 v1 SDK 不相容
date: 2026-11-16
status: validated
summary: 舊的 rag_env 裝的是 openai 0.28，但 ChatbotV2 用的是 v1 寫法；test1.py 和 test_openai_api.py 仍然是 0.28 寫法，在新環境跑不起來。
tags: [api, environment, chatbotv2]
links: [exp-venv-rebuild, exp-openrouter-migration]
applied_in: []
source: rag_env/Lib/site-packages、test1.py 第 246 行
---

## 發現

- rag_env 內的套件是 openai-0.28.0
- ChatbotV2.py 用 from openai import OpenAI 與 client.chat.completions.create，這是 v1 才有的寫法
- 所以即使 rag_env 沒壞，ChatbotV2 在那個環境也跑不起來

## 影響範圍

- test1.py：openai.ChatCompletion.create，共 3 處
- test_openai_api.py：openai.ChatCompletion.create

## 尚未應用

新的 .venv 裝的是 openai 3.x，**這兩支測試腳本都還沒改寫**，也還沒有改成走 OpenRouter。
