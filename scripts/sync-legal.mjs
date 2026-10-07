#!/usr/bin/env node
/**
 * Sync the canonical legal Markdown (landing/legal) into the backend's embedded-resource folder so
 * the API's LegalSeeder hashes the exact published bytes the website renders.
 *
 * The landing repo's `legal/` directory is the single source of truth. This copies it into the API
 * repo; the API embeds those files and SHA-256s them at seed time.
 *
 * Usage:
 *   node scripts/sync-legal.mjs            # copy landing/legal -> API LegalContent
 *   node scripts/sync-legal.mjs --check    # fail (exit 1) if the two trees differ (CI drift guard)
 *
 * Override the API location with LEGAL_API_DIR if the repos aren't siblings in the default layout.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const SRC = join(here, "..", "legal");
const DEST =
  process.env.LEGAL_API_DIR ??
  join(here, "..", "..", "..", "..", "Projects", "PetsApp.Api", "src", "PetsApp.Infrastructure", "LegalContent");

const checkOnly = process.argv.includes("--check");

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (name.endsWith(".md")) out.push(full);
  }
  return out;
}

function sha(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

/**
 * The canonical content hash the backend stores and both clients verify is the SHA-256 of the
 * frontmatter-STRIPPED Markdown body (see LegalContentReader in the API) — the exact text a user
 * reads. Strip the leading `--- ... ---` YAML block before hashing so this script reports the same
 * hash the DB, admin portal, /legal/current and /content all show.
 */
function bodyHash(buf) {
  const text = buf.toString("utf8").replace(/\r\n/g, "\n");
  let body = text;
  if (text.startsWith("---\n")) {
    const end = text.indexOf("\n---", 4);
    if (end >= 0) {
      const nl = text.indexOf("\n", end + "\n---".length);
      body = nl < 0 ? "" : text.slice(nl + 1);
    }
  }
  body = body.replace(/^\n+/, "");
  return createHash("sha256").update(Buffer.from(body, "utf8")).digest("hex");
}

if (!existsSync(SRC)) {
  console.error(`[sync-legal] canonical source not found: ${SRC}`);
  process.exit(1);
}

const files = walk(SRC);
let drift = 0;

for (const srcFile of files) {
  const rel = relative(SRC, srcFile);
  const destFile = join(DEST, rel);
  const srcBuf = readFileSync(srcFile);

  if (checkOnly) {
    if (!existsSync(destFile) || sha(readFileSync(destFile)) !== sha(srcBuf)) {
      console.error(`[sync-legal] DRIFT: ${rel} differs between landing and API.`);
      drift++;
    }
    continue;
  }

  mkdirSync(dirname(destFile), { recursive: true });
  writeFileSync(destFile, srcBuf);
  // Report the canonical body hash (what the DB/clients show), not the raw-file hash.
  console.log(`[sync-legal] ${rel}  (body sha256 ${bodyHash(srcBuf).slice(0, 12)}…)`);
}

if (checkOnly && drift > 0) {
  console.error(`[sync-legal] ${drift} file(s) out of sync. Run: node scripts/sync-legal.mjs`);
  process.exit(1);
}

console.log(checkOnly ? "[sync-legal] in sync." : `[sync-legal] synced ${files.length} file(s) to ${DEST}`);
