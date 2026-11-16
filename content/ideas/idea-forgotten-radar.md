---
id: idea-forgotten-radar
type: idea
title: 未應用成果雷達
date: 2026-11-16
status: validated
summary: 只要筆記狀態是 validated、applied_in 卻是空的，就是「做成功了但沒拿去用」的成果，網站會自動把它們列出來。
tags: [knowledge-base, workflow, wiki]
links: [idea-wiki-first-rag]
applied_in: [moon-rag 星圖頁的「未應用成果」清單]
---

## 痛點

vibe coding 會同時開很多實驗分支，結論散落在對話、commit 和腦袋裡。很多實驗其實已經證明可行，卻沒有被套用到主線。

## 規則

- 每個實驗結束時，必須把 status 改成 validated 或 failed
- applied_in 記錄這個結論套用到哪些檔案或功能
- validated 但 applied_in 為空，就會出現在雷達上

## 成立的證據

建好第一批筆記時，雷達就抓到兩筆真正被遺忘的成果：多語嵌入模型還沒套用到 ChatbotV2，兩支測試腳本也還停在舊版 SDK。
