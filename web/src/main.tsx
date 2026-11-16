import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import { AtlasContext, loadAtlas, type Atlas } from "./lib/atlas";
import AtlasPage from "./pages/AtlasPage";
import NotesPage from "./pages/NotesPage";
import NotePage from "./pages/NotePage";
import SlidesPage from "./pages/SlidesPage";
import AskPage from "./pages/AskPage";
import GuidePage from "./pages/GuidePage";
import NotFound from "./pages/NotFound";
import "./styles.css";

// 新增頁面：在 pages/ 建立元件，並在這裡加一條 Route（規則見 AGENTS.md「新增頁面」）。
function App() {
  const [atlas, setAtlas] = useState<Atlas | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    loadAtlas().then(setAtlas).catch((e: Error) => setError(e.message));
  }, []);

  if (error) return <div className="boot error" role="alert">{error}</div>;
  if (!atlas) return <div className="boot" aria-busy="true">載入星圖…</div>;

  return (
    <AtlasContext.Provider value={atlas}>
      <HashRouter>
        <Routes>
          <Route path="/slides/:id" element={<SlidesPage />} />
          <Route element={<Layout />}>
            <Route index element={<AtlasPage />} />
            <Route path="notes" element={<NotesPage />} />
            <Route path="note/:id" element={<NotePage />} />
            <Route path="ask" element={<AskPage />} />
            <Route path="guide" element={<GuidePage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </HashRouter>
    </AtlasContext.Provider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
