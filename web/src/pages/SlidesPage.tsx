// 簡報模式：第一張是標題頁，之後每個 ## 段落一張。← → 或空白鍵切換，Esc 回到筆記。
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { StatusTag, TypeTag } from "../components/Tags";
import { useNote } from "../lib/atlas";
import { splitSlides } from "../lib/markdown";
import NotFound from "./NotFound";

export default function SlidesPage() {
  const { id } = useParams();
  const note = useNote(id);
  const navigate = useNavigate();
  const [i, setI] = useState(0);
  const slides = note ? splitSlides(note.body) : [];
  const total = slides.length + 1;

  const go = useCallback((d: number) => setI((v) => Math.min(total - 1, Math.max(0, v + d))), [total]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") (e.preventDefault(), go(1));
      if (e.key === "ArrowLeft" || e.key === "PageUp") (e.preventDefault(), go(-1));
      if (e.key === "Escape" && note) navigate(`/note/${note.id}`);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, navigate, note]);

  if (!note) return <NotFound what={`筆記「${id}」`} />;
  const slide = i > 0 ? slides[i - 1] : null;

  return (
    <div className="deck">
      <div className="deck-bar">
        <span className="deck-title">{note.title}</span>
        <span className="num muted">{i + 1} / {total}</span>
        <Link to={`/note/${note.id}`} className="icon-btn" aria-label="離開簡報"><X size={18} /></Link>
      </div>
      <div className="deck-progress" aria-hidden><span style={{ width: `${((i + 1) / total) * 100}%` }} /></div>

      <section className="slide" key={i} aria-live="polite">
        {slide ? (
          <>
            <h2 className="slide-h">{slide.heading}</h2>
            <div className="prose slide-body" dangerouslySetInnerHTML={{ __html: slide.html }} />
          </>
        ) : (
          <div className="slide-cover">
            <div className="focus-meta">
              <TypeTag type={note.type} />
              <StatusTag status={note.status} />
            </div>
            <h1>{note.title}</h1>
            <p className="lede">{note.summary}</p>
            {note.source && <p className="muted">{note.source}</p>}
          </div>
        )}
      </section>

      <div className="deck-nav">
        <button className="btn" onClick={() => go(-1)} disabled={i === 0}><ChevronLeft size={16} /> 上一張</button>
        <button className="btn primary" onClick={() => go(1)} disabled={i === total - 1}>下一張 <ChevronRight size={16} /></button>
      </div>
    </div>
  );
}
