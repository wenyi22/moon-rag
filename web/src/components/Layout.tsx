import { FolderGit2 } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useAtlas } from "../lib/atlas";

const NAV = [
  { to: "/", label: "星圖", end: true },
  { to: "/notes", label: "筆記" },
  { to: "/ask", label: "問答" },
  { to: "/guide", label: "使用規則" },
];

export const REPO_URL = "https://github.com/wenyi22/moon-rag";

export default function Layout() {
  const atlas = useAtlas();
  return (
    <div className="shell">
      <a className="skip-link" href="#main">跳到主要內容</a>
      <header className="topbar">
        <NavLink to="/" className="brand" aria-label="Moon RAG 首頁">
          <svg viewBox="0 0 32 32" width="22" height="22" aria-hidden>
            <path d="M20 4a12 12 0 1 0 8 20A10 10 0 0 1 20 4z" fill="var(--accent)" />
          </svg>
          <span>Moon RAG</span>
          <span className="brand-sub">研究星圖</span>
        </NavLink>
        <nav aria-label="主選單">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className="nav-link">
              {n.label}
            </NavLink>
          ))}
        </nav>
        <a className="icon-btn" href={REPO_URL} target="_blank" rel="noreferrer" aria-label="GitHub 原始碼">
          <FolderGit2 size={18} />
        </a>
      </header>
      <main id="main">
        <Outlet />
      </main>
      <footer className="footer">
        <span>{atlas.notes.length} 篇筆記</span>
        <span>嵌入模型 <code>{atlas.model.split("/").pop()}</code></span>
        <span>建置於 <time className="num">{atlas.generated_at.replace("T", " ")}</time></span>
      </footer>
    </div>
  );
}
