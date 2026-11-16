// Markdown → 安全的 HTML，以及把內文依 ## 切成投影片。
import { marked } from "marked";
import DOMPurify from "dompurify";

marked.setOptions({ gfm: true, breaks: false });

export function renderMarkdown(md: string): string {
  return DOMPurify.sanitize(marked.parse(md, { async: false }) as string);
}

export interface Slide {
  heading: string;
  html: string;
}

/** 每個 ## 段落是一張投影片（AGENTS.md 的內容規則）。## 之前的文字會被忽略。 */
export function splitSlides(body: string): Slide[] {
  return body
    .split(/^## /m)
    .slice(1)
    .map((part) => {
      const nl = part.indexOf("\n");
      const heading = (nl === -1 ? part : part.slice(0, nl)).trim();
      const rest = nl === -1 ? "" : part.slice(nl + 1);
      return { heading, html: renderMarkdown(rest) };
    });
}
