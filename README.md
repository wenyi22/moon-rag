# Moon RAG 研究星圖

把**論文筆記、實驗紀錄與想法**放進同一個向量空間。選一個研究，所有相關的筆記會依相關度用彩色連線串起來，並由高到低排序；首頁會自動列出「已經成立、卻還沒被應用」的實驗成果。

- 網站：https://wenyi22.github.io/moon-rag/
- 規則：[AGENTS.md](AGENTS.md)（給 AI 讀的完整專案規則）

## 為什麼做這個

vibe coding 時會同時開很多實驗分支，人腦記不住哪些實驗彼此相關，很多成果做出來就被遺忘了。這個專案延伸自先前的 RAG 問答系統（ChatbotV2）：原本是「把文件轉成向量來回答問題」，現在改成「先把研究整理成格式固定的筆記，再對筆記做向量化、視覺化與問答」。

## 功能

| 頁面 | 做什麼 |
|---|---|
| 星圖 `/` | 點一篇筆記或輸入主題，畫出相關度連線（琥珀色最相關，青藍色最不相關）並列出排行 |
| 筆記 `/notes` | 依類型、狀態篩選，可以只看「未應用」 |
| 筆記頁 `/note/:id` | 內文、應用位置、人工連結、向量最相近的筆記 |
| 簡報 `/slides/:id` | 每個 `##` 段落自動成為一張投影片，可以用方向鍵切換 |
| 問答 `/ask` | 先檢索筆記，再由 OpenRouter 模型回答並引用出處（key 由使用者在瀏覽器輸入） |

## 架構

```
content/*.md  →  pipeline/build_atlas.py  →  web/public/data/atlas.json  →  React（Vite）  →  GitHub Pages
  （筆記）       （驗證、切塊、嵌入、MDS 投影）                              （星圖、總表、簡報、問答）
```

- 嵌入模型：`paraphrase-multilingual-MiniLM-L12-v2`（中英混合內容）
- 切塊：Sentence-Window，視窗 3、重疊 1（沿用 ChatbotV2）
- 建置時會比對 `content_hash`：內容改了卻沒重建 atlas，建置就會失敗

## 快速開始

```bash
python -m venv .venv && .venv/Scripts/pip install -r pipeline/requirements.txt
python pipeline/build_atlas.py

cd web && npm install && npm run dev
```

## 之後如何新增內容

對 AI 說「**新增論文筆記：<arXiv 網址>**」或「**記錄實驗：<描述>**」。AI 讀完 AGENTS.md 後會：

1. 從 `templates/` 複製對應模板，依命名規則存到 `content/<類型>/<id>.md`
2. 依 frontmatter 規格填好狀態、摘要、標籤與 `links`
3. 依段落規則撰寫內文，每個 `##` 自動成為一張投影片
4. 回頭更新被套用的舊筆記的 `applied_in`
5. 重建 atlas 並執行建置檢查，push 後由 GitHub Actions 自動部署

規則寫得夠具體，AI 不需要理解前端程式碼也能新增內容；而 pipeline 的格式驗證與建置時的同步檢查，會擋下不符合規則的修改。

## 授權

程式碼採用 MIT 授權。論文筆記為個人整理，著作權屬於原作者。
