import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const ignored = new Set([".git", ".next", "node_modules", "out", "build", "coverage"]);
const allowedExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".json",
  ".md",
  ".sql",
  ".yml",
  ".yaml",
  ".example",
]);
const patterns = [
  /\bsb_secret_[A-Za-z0-9_-]{16,}\b/,
  /\bgh[ps]_[A-Za-z0-9]{20,}\b/,
  /\b\d{8,10}:[A-Za-z0-9_-]{30,}\b/,
];
const assignment = /\b(SUPABASE_SERVICE_ROLE_KEY|ADMIN_INITIAL_PASSWORD)\s*=\s*([^\s`]+)/g;
const placeholders = ["...", "example", "your-", "<", "kuchli-parol"];

async function filesIn(path) {
  const entries = await readdir(path, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (ignored.has(entry.name) || entry.name.startsWith(".env")) continue;
    const full = join(path, entry.name);
    if (entry.isDirectory()) files.push(...(await filesIn(full)));
    else if (allowedExtensions.has(extname(entry.name))) files.push(full);
  }
  return files;
}

const exposed = [];
for (const file of await filesIn(root)) {
  const content = await readFile(file, "utf8");
  const unsafeAssignment = [...content.matchAll(assignment)].some((match) => {
    const value = match[2].replaceAll(/['"]/g, "").toLowerCase();
    return value.length > 0 && !placeholders.some((item) => value.includes(item));
  });
  if (patterns.some((pattern) => pattern.test(content)) || unsafeAssignment) {
    exposed.push(relative(root, file));
  }
}

if (exposed.length) {
  console.error(`Secretga o'xshash qiymat topildi: ${exposed.join(", ")}`);
  process.exit(1);
}
console.log("Secret scan: toza.");
