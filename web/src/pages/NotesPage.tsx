// 筆記總表：依類型、狀態篩選，可以只看「未應用成果」。
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ForgottenTag, StatusTag, TypeTag } from "../components/Tags";
import { isForgotten, useAtlas, type NoteStatus, type NoteType } from "../lib/atlas";
import { STATUS_META, STATUS_ORDER, TYPE_META, TYPE_ORDER } from "../lib/meta";

type Filter = "all" | NoteType;
type SFilter = "all" | NoteStatus | "forgotten";

export default function NotesPage() {
  const { notes } = useAtlas();
  const [type, setType] = useState<Filter>("all");
  const [status, setStatus] = useState<SFilter>("all");

  const rows = useMemo(
    () =>
      notes
        .filter((n) => type === "all" || n.type === type)
        .filter((n) => status === "all" || (status === "forgotten" ? isForgotten(n) : n.status === status))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [notes, type, status],
  );

  const count = (pred: (t: (typeof notes)[number]) => boolean) => notes.filter(pred).length;

  return (
    <div className="page">
      <header className="page-head">
        <h1>全部筆記</h1>
        <p className="muted">依日期由新到舊排列。點標題閱讀，或在星圖中查看它的關聯。</p>
      </header>

      <div className="filters">
        <div className="chip-group" role="group" aria-label="依類型篩選">
          <button className="chip" aria-pressed={type === "all"} onClick={() => setType("all")}>
            全部 <span className="num">{notes.length}</span>
          </button>
          {TYPE_ORDER.map((t) => (
            <button key={t} className="chip" aria-pressed={type === t} onClick={() => setType(t)}>
              {TYPE_META[t].label} <span className="num">{count((n) => n.type === t)}</span>
            </button>
          ))}
        </div>
        <div className="chip-group" role="group" aria-label="依狀態篩選">
          <button className="chip" aria-pressed={status === "all"} onClick={() => setStatus("all")}>
            任何狀態
          </button>
          {STATUS_ORDER.map((s) => (
            <button key={s} className="chip" aria-pressed={status === s} onClick={() => setStatus(s)}>
              {STATUS_META[s].label} <span className="num">{count((n) => n.status === s)}</span>
            </button>
          ))}
          <button className="chip warn" aria-pressed={status === "forgotten"} onClick={() => setStatus("forgotten")}>
            未應用 <span className="num">{count(isForgotten)}</span>
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <table className="notes-table">
          <thead>
            <tr>
              <th scope="col">標題</th>
              <th scope="col">類型</th>
              <th scope="col">狀態</th>
              <th scope="col">應用於</th>
              <th scope="col" className="r">日期</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((n) => (
              <tr key={n.id}>
                <td>
                  <Link to={`/note/${n.id}`} className="row-title">{n.title}</Link>
                  <div className="row-sum">{n.summary}</div>
                </td>
                <td><TypeTag type={n.type} /></td>
                <td>
                  <div className="tag-stack">
                    <StatusTag status={n.status} />
                    <ForgottenTag note={n} />
                  </div>
                </td>
                <td className="applied">{n.applied_in.length ? n.applied_in.join("、") : <span className="muted">—</span>}</td>
                <td className="r num">{n.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="empty">沒有符合條件的筆記。</p>}
      </div>
    </div>
  );
}
