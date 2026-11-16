---
id: exp-venv-rebuild
type: experiment
title: 用 Python 3.13 重建 RAG 環境
date: 2026-11-16
status: validated
summary: rag_env 依賴的 Python 3.10 已被移除，改用 3.13 建立 .venv 並補上 requirements.txt，所有依賴都能匯入。
tags: [environment, python, chatbotv2]
links: [exp-openai-sdk-v1]
applied_in: [requirements.txt, .venv]
source: E:\LLM\requirements.txt
---

## 問題

執行 rag_env 的 python.exe 時出現錯誤：No Python at Python310\python.exe。venv 只是指向基底 Python 的捷徑，基底被移除後整個環境就壞了，而專案又沒有 requirements.txt 可以重建。

## 做法

- 從舊 site-packages 與 ChatbotV2 的 import 整理出真正需要的套件
- 寫成 requirements.txt：openai、python-dotenv、sentence-transformers、torch、faiss-cpu、numpy、jieba、tqdm
- py -3.13 -m venv .venv 後安裝

## 結果

openai 3.51、torch 2.15（CPU）、faiss 1.16、sentence-transformers 6.3 全部能匯入，ChatbotV2 的設定也能正確載入。
