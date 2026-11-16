// 使用規則：AGENTS.md 的網頁版摘要，讓訪客（與評分者）看懂這套流程如何延伸。
import { Link } from "react-router-dom";
import { REPO_URL } from "../components/Layout";

const STEPS = [
  { t: "丟進一份資料", d: "一篇論文、一段實驗紀錄或一個想法，交給 AI，並告訴它「依 AGENTS.md 新增筆記」。" },
  { t: "AI 依模板寫筆記", d: "從 templates/ 複製對應類型的模板，填好 frontmatter，內文用 ## 分段，存到 content/<類型>/<id>.md。" },
  { t: "重建向量星圖", d: "執行 python pipeline/build_atlas.py：驗證格式、切塊、嵌入、MDS 投影成 3D 座標，輸出 atlas.json。" },
  { t: "建置檢查", d: "npm run build 先比對 content_hash，內容改了卻沒重建就會失敗，網站不會顯示過期資料。" },
  { t: "推上 GitHub", d: "GitHub Actions 自動建置並部署到 Pages。新筆記會出現在星圖、總表、簡報與問答裡。" },
];

const FIELDS: [string, string][] = [
  ["id", "kebab-case，必須和檔名相同"],
  ["type", "paper｜experiment｜idea，決定存放資料夾"],
  ["status", "validated｜failed｜running｜planned；論文固定為 reference"],
  ["summary", "一句話結論，會顯示在星圖與總表"],
  ["links", "人工標註的相關筆記 id，星圖上畫成虛線"],
  ["applied_in", "結論套用在哪裡；成立卻是空的，就會出現在未應用雷達上"],
];

export default function GuidePage() {
  return (
    <div className="page guide-page">
      <header className="page-head">
        <h1>這套規則怎麼延伸</h1>
        <p className="muted">
          每一篇筆記都是 content/ 裡的一個 Markdown 檔，網站上的星圖、總表、簡報與問答全部由它產生。完整規則寫在{" "}
          <a href={`${REPO_URL}/blob/main/AGENTS.md`} target="_blank" rel="noreferrer">AGENTS.md</a>。
        </p>
      </header>

      <section className="guide-sec">
        <h2>新增一篇筆記的流程</h2>
        <ol className="steps">
          {STEPS.map((s) => (
            <li key={s.t}>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="guide-sec">
        <h2>Frontmatter 的關鍵欄位</h2>
        <dl className="fields">
          {FIELDS.map(([k, v]) => (
            <div key={k}>
              <dt><code>{k}</code></dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="guide-sec">
        <h2>一篇筆記會變成四種畫面</h2>
        <ul className="plain outputs">
          <li><Link to="/">星圖</Link>：向量位置與相關度連線</li>
          <li><Link to="/notes">總表</Link>：依類型、狀態與「未應用」篩選</li>
          <li><Link to="/slides/hyde-2022">簡報</Link>：每個 ## 段落一張投影片</li>
          <li><Link to="/ask">問答</Link>：檢索筆記後由模型回答並引用出處</li>
        </ul>
      </section>
    </div>
  );
}
