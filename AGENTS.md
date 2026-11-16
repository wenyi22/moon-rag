# AGENTS.md — Moon RAG 研究星圖

> 給 AI 代理（Claude Code、Codex、Cursor 等）與協作者閱讀的專案規則。
> **任何新增或修改都必須遵守本文件。** 規則需要調整時，先改這份文件，再改程式。

---

## 1. 專案目的

vibe coding 時會同時開很多實驗分支，結論散落在對話、commit 和腦袋裡。很多實驗**已經證明可行，卻沒有被套用**。

Moon RAG 把三種資料放進同一個向量空間：

| 類型 | 是什麼 | 例子 |
|---|---|---|
| `paper` 論文 | 外部文獻的筆記 | HyDE、RAPTOR |
| `experiment` 實驗 | 自己做過或規劃中的實驗 | 中文嵌入模型比較 |
| `idea` 想法 | 還沒驗證的改進方向 | 用 RRF 合併多路檢索 |

網站提供四種畫面，**全部由 `content/` 的 Markdown 自動產生**：

1. **星圖**（`/`）：選一篇筆記或輸入主題 → 相關筆記依相關度畫出彩色連線，右側由高到低排序
2. **總表**（`/notes`）：依類型、狀態篩選，可以只看「未應用成果」
3. **簡報**（`/slides/:id`）：每個 `##` 段落一張投影片
4. **問答**（`/ask`）：檢索筆記後交給 OpenRouter 模型回答，並引用 `[筆記id]`

核心規則只有一句：**`status: validated` 而 `applied_in` 為空 = 被遺忘的成果**，網站會自動標出來。

---

## 2. 資料流

```
content/<類型>/<id>.md          ← 唯一的資料來源（人或 AI 撰寫）
        │  python pipeline/build_atlas.py
        │    1. 驗證 frontmatter（格式錯誤直接失敗）
        │    2. Sentence-Window 切塊（視窗 3、重疊 1，沿用 ChatbotV2）
        │    3. paraphrase-multilingual-MiniLM-L12-v2 嵌入 → 平均成筆記向量
        │    4. MDS（餘弦距離）投影成 3D 座標（x、y 是地面，z 是高度）
        ▼
web/public/data/atlas.json      ← 產物，必須 commit，禁止手動編輯
        │  npm run build（先檢查 content_hash，過期就失敗）
        ▼
web/dist/  →  GitHub Actions  →  GitHub Pages
```

- 相關度一律用**原始向量的餘弦相似度**；3D 座標只負責擺放。
- 瀏覽器端沒有嵌入模型。文字查詢用「字元 bigram TF-IDF 找起點 + 向量擴展」，分數 = 0.5 × 字面 + 0.5 × 語意。

---

## 3. 目錄結構

```
moon-rag/
├── AGENTS.md                 本文件（規則的唯一來源）
├── CLAUDE.md                 指向本文件
├── PRODUCT.md                產品定位與使用者
├── README.md                 給人看的簡介與快速開始
├── content/
│   ├── papers/               type: paper
│   ├── experiments/          type: experiment
│   └── ideas/                type: idea
├── templates/                三種類型的筆記模板（新增時從這裡複製）
├── pipeline/
│   ├── build_atlas.py        content → atlas.json
│   ├── requirements.txt
│   └── experiments/          可重現實驗用的腳本（被實驗筆記的 source 引用）
├── web/
│   ├── public/data/atlas.json
│   ├── scripts/check-atlas.mjs   建置前的同步檢查
│   └── src/
│       ├── main.tsx          路由（新增頁面在這裡註冊）
│       ├── styles.css        全站唯一樣式檔與設計 token
│       ├── lib/              atlas 型別、排序、相機投影（camera.ts）、markdown、類型與狀態設定
│       ├── components/       AtlasMap、RankedList、Tags、Layout
│       └── pages/            每個路由一個檔案
└── .github/workflows/deploy.yml
```

---

## 4. 新增一篇筆記（AI 的標準流程）

使用者說「**新增論文筆記：<網址或內容>**」、「**記錄實驗：<描述>**」或「**新增想法：<描述>**」時，依序執行：

1. **決定類型與 id**：依第 5 節的命名規則決定 id，先確認 `content/` 裡沒有同名檔案。
2. **複製模板**：`templates/<type>.md` → `content/<資料夾>/<id>.md`。
3. **填寫 frontmatter**：依第 6 節的規格，`summary` 必須是一句話的**結論**，不是主題描述。
4. **撰寫內文**：依第 7 節的段落規則，每個 `##` 會變成一張投影片。
5. **建立關聯**：讀過現有筆記的 `title` 與 `summary`，把真正相關的 id 填進 `links`。只連你能說出關係的筆記，不要為了湊數。
6. **回頭更新舊筆記**：
   - 新實驗套用了某個舊結論 → 在舊筆記的 `applied_in` 加上位置
   - 新實驗推翻了舊結論 → 把舊筆記改成 `failed`，並在內文說明
7. **重建星圖**：`python pipeline/build_atlas.py`
8. **驗證**：`cd web && npm run build` 必須成功。
9. **回報**：告訴使用者新筆記的 id、星圖上最相關的 3 篇，以及目前的「未應用成果」清單有沒有變化。

---

## 5. 命名與放置

| 項目 | 規則 | 例子 |
|---|---|---|
| 論文 id | `<簡稱>-<年份>`，全小寫 kebab-case | `hyde-2022`、`lost-in-middle-2023` |
| 實驗 id | `exp-<主題>` | `exp-multilingual-embedding` |
| 想法 id | `idea-<主題>` | `idea-rrf-fusion` |
| 檔名 | 與 id 完全相同，加 `.md` | `content/papers/hyde-2022.md` |
| 資料夾 | 由 `type` 決定：`papers/`、`experiments/`、`ideas/` | — |
| 可重現腳本 | `pipeline/experiments/<描述>.py`，並寫進該實驗筆記的 `source` | `emb_multilingual_check.py` |

**id 一旦發布就不要改**：其他筆記的 `links` 和外部分享的網址（`/#/note/<id>`）都會壞掉。

---

## 6. Frontmatter 規格

`pipeline/build_atlas.py` 會驗證以下規則，違反就建置失敗。

| 欄位 | 必填 | 型別 | 規則 |
|---|---|---|---|
| `id` | ✓ | string | kebab-case，與檔名相同 |
| `type` | ✓ | enum | `paper` ｜ `experiment` ｜ `idea` |
| `title` | ✓ | string | 論文：`<簡稱>：<中文說明>（<第一作者> et al., <年>）` |
| `date` | ✓ | `YYYY-MM-DD` | 論文用發表日；實驗與想法用建立或最後更新日 |
| `status` | ✓ | enum | 見下表 |
| `summary` | ✓ | string | 一句話的結論，顯示在星圖、總表與問答 |
| `tags` | ✓ | string[] | 非空，英文小寫 kebab-case，優先沿用既有標籤 |
| `links` | | id[] | 相關筆記，必須是存在的 id，星圖上畫成虛線 |
| `applied_in` | | string[] | 結論套用的檔案、函式或功能；論文不填 |
| `source` | | string | 論文：作者與會議；實驗：程式位置或腳本路徑 |
| `url` | | string | 論文原文連結（arXiv 優先） |

### 狀態

| status | 顯示 | 何時使用 |
|---|---|---|
| `reference` | 參考文獻 | **只有論文使用，論文也只能用這個** |
| `planned` | 規劃中 | 設計好了，還沒執行 |
| `running` | 進行中 | 已實作或執行中，但還沒有評估結果 |
| `validated` | 成立 | 有證據支持結論（數據、錯誤訊息、截圖） |
| `failed` | 不成立 | 做過了，結論是否定的；要寫出改用了什麼 |

### 未應用規則

- `validated` 而且 `applied_in: []` → 出現在星圖首頁的「未應用成果」與總表的「未應用」篩選。
- 把結論套用到程式後，**同一個 commit** 裡要更新 `applied_in`。
- 不要為了讓清單變短而填假的 `applied_in`。

---

## 7. 內文格式

- 內文只用 `##` 作為段落標題，**每個 `##` 是一張投影片**，`##` 之前的文字不會出現在簡報中。
- 每篇 3 到 5 個段落；每段最多 6 個條列或 4 句話。超過就拆段。
- 表格用於比較數據；數字一律寫出單位與樣本數。
- 粗體只用在**最需要被注意的一句**（例如「尚未應用」的說明），網站會用強調色顯示。
- 引用其他筆記時寫它的中文標題，例如「見實驗『HyDE 消融實驗』」。

建議段落：

| 類型 | 段落 |
|---|---|
| paper | 問題 → 方法 → 結果與限制 → 對本專案的意義 |
| experiment（已執行） | 假設或問題 → 做法 → 結果 → 結論，或尚未應用的說明 |
| experiment（planned） | 問題 → 設計（對照組、變數、指標） → 狀態 |
| idea | 想法 → 做法 → 成本 → 驗證方式 |

### 誠實規則（最重要）

- **只記錄真的發生過的事。** 預期效果寫成「預期」，並放在 `planned` 狀態的筆記裡。
- 數字必須能追溯到 `source`：腳本、輸出或 API 回應。沒有量測就不寫數字。
- 論文筆記只寫能從原文確認的內容；不確定的細節寧可不寫。
- 樣本很小時要直接寫出來（例如「樣本只有 6 組，屬於方向性證據」）。

---

## 8. 網站風格

- **深色主題**：使用情境是夜間 vibe coding，與深色編輯器並排。
- **所有顏色、字體、圓角都用 `web/src/styles.css` 的 `:root` token**，元件裡不寫死色碼。
- 類型顏色：論文 `--type-paper`（青）、實驗 `--type-experiment`（珊瑚）、想法 `--type-idea`（萊姆）。
- 狀態一律用 `StatusTag` 元件顯示（圖示加文字），不只靠顏色表達。
- 相關度色階：琥珀色（最相關）到青藍色（最不相關），由 `relevanceColor()` 產生。地圖連線與排行色塊必須用同一個函式。
- 強調色是琥珀 `--accent`，只用於主要按鈕、目前位置與需要注意的資訊。**禁止使用紫色。**
- 字體：IBM Plex Sans + Noto Sans TC；數字與 id 用 IBM Plex Mono（`.num`）。
- 圖示只用 `lucide-react`，不用 emoji 代替圖示。
- 動態：只有星圖連線依名次逐條畫出這一個主要動畫；必須尊重 `prefers-reduced-motion`。
- 星圖是 **2.5D**：滾輪、觸控板或雙指以指標為中心縮放，拖曳平移，右鍵或 Shift 拖曳旋轉與傾斜；「俯視」等同 2D。投影數學只放在 `lib/camera.ts`，`AtlasMap.tsx` 只負責繪製與輸入。
- 響應式：1440、768、390 三種寬度都要能用，390 不可出現橫向捲軸。

---

## 9. 新增頁面或功能

1. 在 `web/src/pages/<名稱>Page.tsx` 建立元件。
2. 在 `web/src/main.tsx` 的 `<Routes>` 加一條 `Route`。
3. 需要出現在選單時，加到 `components/Layout.tsx` 的 `NAV`。
4. 資料只能從 `useAtlas()` 取得，**不要另外 fetch 或寫死筆記內容**。
5. 類型與狀態的顯示一律用 `TypeTag`、`StatusTag`、`ForgottenTag`。
6. 樣式寫進 `styles.css` 對應的區塊，沿用既有的 class（`.page`、`.btn`、`.chip`、`.side-block`）。

### 新增類型或狀態

必須**三處同時修改**，否則建置或畫面會出錯：

1. `pipeline/build_atlas.py` 的 `TYPES` 或 `STATUSES`
2. `web/src/lib/atlas.ts` 的 `NoteType` 或 `NoteStatus`
3. `web/src/lib/meta.ts` 的 `TYPE_META` 或 `STATUS_META`，以及本文件第 6 節

---

## 10. 擴展門檻

筆記數量增加時，依下表處理。**新增筆記後（第 4 節第 9 步）若總數超過下一個門檻，要在回報中提醒使用者。**

| 筆記數 | 會遇到的問題 | 處理方式 | 狀態 |
|---|---|---|---|
| 約 100 | 點和標籤擠在一起 | 2.5D、縮放平移、依空間顯示標籤 | 已完成 |
| 約 500 | SVG 重繪變慢；標籤碰撞計算是 O(n²) | 標籤只算畫面內的點（已做）；改用網格索引加速碰撞檢查 | 待做 |
| 約 1000 | atlas.json 約 4 MB（目前每篇約 4 KB） | 拆成地圖用的輕量檔與內文檔，內文在打開筆記時才載入 | 待做 |
| 數千 | MDS 是 O(n²) 記憶體；SVG 撐不住 | 投影改 UMAP；`AtlasMap` 改用 Canvas 或 WebGL，`lib/camera.ts` 沿用 | 待做 |

重新評估投影時，執行 `python pipeline/experiments/map_dims_check.py` 並更新實驗「星圖改成 2.5D」。

---

## 11. 指令

```bash
# Python 環境（一次）
python -m venv .venv
.venv/Scripts/pip install -r pipeline/requirements.txt      # Windows
# .venv/bin/pip install -r pipeline/requirements.txt       # macOS / Linux

python pipeline/build_atlas.py --check   # 只驗證 frontmatter（秒級）
python pipeline/build_atlas.py           # 重建 atlas.json（第一次會下載約 470 MB 的模型）

cd web
npm install
npm run dev        # 本機開發 http://localhost:5173
npm run build      # 同步檢查 + 型別檢查 + 建置
```

---

## 12. 提交前檢查清單

- [ ] `python pipeline/build_atlas.py` 成功，`atlas.json` 已更新
- [ ] `cd web && npm run build` 成功
- [ ] 新筆記在星圖上點得到，簡報至少有 2 張
- [ ] 有用到的舊筆記已更新 `applied_in` 或 `status`
- [ ] commit 訊息使用 Conventional Commits：`content:` 新增或修改筆記、`feat:` 新功能、`fix:` 修正、`docs:` 文件

---

## 13. 禁止事項

- **不要把任何 API key 寫進 repo。** 問答頁的 key 由使用者在瀏覽器輸入，只存在 localStorage。
- 不要手動編輯 `web/public/data/atlas.json`，它只能由 pipeline 產生。
- 不要編造實驗數據、論文內容或引用。
- 不要刪除 `failed` 的實驗，失敗也是知識，可以避免重做。
- 不要繞過 `npm run build` 的同步檢查（例如直接改 `content_hash`）。
