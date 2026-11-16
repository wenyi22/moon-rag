import { Link } from "react-router-dom";

export default function NotFound({ what = "這個頁面" }: { what?: string }) {
  return (
    <div className="page empty-page">
      <h1>找不到{what}</h1>
      <p className="muted">它可能被改名或刪除了。id 必須和 content/ 裡的檔名相同。</p>
      <Link className="btn primary" to="/">回到星圖</Link>
    </div>
  );
}
