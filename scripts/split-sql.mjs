// Splits SQL files into numbered parts of at most MAX characters, cutting only between
// top-level statements (never inside $$ function bodies). Handy when a SQL editor or
// file viewer cannot take a large paste.
// Usage: node scripts/split-sql.mjs <outDir> <file.sql> [more.sql…]
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const MAX = 7000;
const [outDir, ...files] = process.argv.slice(2);
if (!outDir || files.length === 0) throw new Error("usage: split-sql.mjs <outDir> <file.sql>…");

const statements = [];
for (const file of files) {
  let current = "";
  let inBody = false;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    if (/^\s*(begin|commit);\s*$/i.test(line)) continue; // each part runs on its own
    if (!current && (line.trim() === "" || line.startsWith("--"))) continue;
    current += line + "\n";
    if ((line.match(/\$\$/g) ?? []).length % 2 === 1) inBody = !inBody;
    if (!inBody && /;\s*$/.test(line)) {
      statements.push(current);
      current = "";
    }
  }
  if (current.trim()) statements.push(current);
}

const parts = [""];
for (const st of statements) {
  if (st.length > MAX) throw new Error(`Statement longer than ${MAX} chars: ${st.slice(0, 80)}`);
  if (parts.at(-1).length + st.length > MAX) parts.push("");
  parts[parts.length - 1] += st + "\n";
}
mkdirSync(outDir, { recursive: true });
parts.forEach((p, i) => {
  const name = `hisse-${String(i + 1).padStart(2, "0")}.sql`;
  writeFileSync(join(outDir, name), `-- Hissə ${i + 1} / ${parts.length}\n${p}`);
});
console.log(`${parts.length} parts written to ${outDir}`);
