// 單篇筆記：內文 + 側欄（狀態、應用位置、人工連結、向量最相近的筆記）。
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, Network, Presentation } from "lucide-react";
import { ForgottenTag, StatusTag, TypeTag } from "../components/Tags";
import { isForgotten, useAtlas, useNote } from "../lib/atlas";
import { renderMarkdown } from "../lib/markdown";
import { rankByNote } from "../lib/rank";
import NotFound from "./NotFound";

export default function NotePage() {
  const { id } = useParams();
  const { notes } = useAtlas();
  const note = useNote(id);
  if (!note) return <NotFound what={`筆記「${id}」`} />;

  const related = rankByNote(note, notes).slice(0, 6);
  const linked = notes.filter((n) => note.links.includes(n.id) || n.links.includes(note.id));

  return (
    <div className="page note-page">
      <Link to="/notes" className="back"><ArrowLeft size={15} /> 全部筆記</Link>
      <div className="note-grid">
        <article className="note-body">
          <div className="focus-meta">
            <TypeTag type={note.type} />
            <StatusTag status={note.status} />
            <ForgottenTag note={note} />
            <span className="muted num">{note.date}</span>
          </div>
          <h1>{note.title}</h1>
          <p className="lede">{note.summary}</p>
          <div className="btn-row">
            <Link className="btn primary" to={`/?focus=${note.id}`}><Network size={15} /> 在星圖中查看</Link>
            <Link className="btn" to={`/slides/${note.id}`}><Presentation size={15} /> 簡報模式</Link>
          </div>
          <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(note.body) }} />
        </article>

        <aside className="note-side">
          {note.type !== "paper" && (
            <section className={isForgotten(note) ? "side-block warn" : "side-block"}>
              <h2>應用於</h2>
              {note.applied_in.length ? (
                <ul className="plain">{note.applied_in.map((a) => <li key={a}><code>{a}</code></li>)}</ul>
              ) : (
                <p className="muted small">還沒有套用到任何地方。</p>
              )}
            </section>
          )}

          {(note.source || note.url) && (
            <section className="side-block">
              <h2>來源</h2>
              {note.source && <p className="small">{note.source}</p>}
              {note.url && (
                <a href={note.url} target="_blank" rel="noreferrer" className="ext">
                  原文 <ExternalLink size={13} />
                </a>
              )}
            </section>
          )}

          {linked.length > 0 && (
            <section className="side-block">
              <h2>人工連結</h2>
              <ul className="plain">
                {linked.map((n) => <li key={n.id}><Link to={`/note/${n.id}`}>{n.title}</Link></li>)}
              </ul>
            </section>
          )}

          <section className="side-block">
            <h2>向量最相近</h2>
            <ol className="plain near">
              {related.map((r) => (
                <li key={r.note.id}>
                  <Link to={`/note/${r.note.id}`}>{r.note.title}</Link>
                  <span className="num muted">{r.score.toFixed(2)}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="side-block">
            <h2>標籤</h2>
            <div className="tag-cloud">{note.tags.map((t) => <code key={t}>{t}</code>)}</div>
            <p className="muted small path">{note.path}</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
