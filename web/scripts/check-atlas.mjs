// check-atlas.mjs — 建置前檢查 atlas.json 是否和 content/ 同步
// 演算法必須與 pipeline/build_atlas.py 的 content_hash() 完全一致：
//   sha256( 依相對路徑排序，每個檔案：相對路徑 \0 內容(CRLF→LF) \0 )
// 內容改了卻沒重跑 pipeline → 建置失敗，避免網站顯示過期資料。
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const contentDir = join(root, "content");
const atlasPath = join(root, "web", "public", "data", "atlas.json");

const files = readdirSync(contentDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .flatMap((d) =>
    readdirSync(join(contentDir, d.name))
      .filter((f) => f.endsWith(".md"))
      .map((f) => `content/${d.name}/${f}`),
  )
  .sort();

const h = createHash("sha256");
for (const rel of files) {
  const bytes = readFileSync(join(root, rel)).toString("utf8").replace(/\r\n/g, "\n");
  h.update(Buffer.from(rel, "utf8"));
  h.update(Buffer.from([0]));
  h.update(Buffer.from(bytes, "utf8"));
  h.update(Buffer.from([0]));
}
const expected = h.digest("hex");

if (!existsSync(atlasPath)) {
  console.error("✗ 找不到 web/public/data/atlas.json，請先執行 python pipeline/build_atlas.py");
  process.exit(1);
}
const atlas = JSON.parse(readFileSync(atlasPath, "utf8"));
if (atlas.content_hash !== expected) {
  console.error("✗ atlas.json 已過期：content/ 有變更但沒有重建。");
  console.error("  請執行 python pipeline/build_atlas.py，並把 atlas.json 一起 commit。");
  process.exit(1);
}
if (atlas.notes.length !== files.length) {
  console.error(`✗ 筆記數量不符：content/ 有 ${files.length} 篇，atlas.json 有 ${atlas.notes.length} 篇`);
  process.exit(1);
}
console.log(`✓ atlas.json 與 content/ 同步（${files.length} 篇筆記）`);
