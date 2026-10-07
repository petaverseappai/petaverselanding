# Legal documents — how to edit & publish

This folder (`landing/legal/`) is the **single source of truth** for the text of the
Privacy Policy, Terms & Conditions, and Community Guidelines.

- The **public website** renders these files (bundled at build time by Cloudflare Pages).
- The **API** serves the body via `GET /api/legal/{type}/{version}/content` and records
  per-user acceptance. Bodies are fetched from **Cloudflare R2** at runtime (12-hour
  in-memory cache, embedded fallback). The API no longer needs to be redeployed when you
  change legal text — only R2 needs to be updated.
- The **mobile app** fetches `/content` and renders it in-app at the consent gate.
- The **admin portal** shows published versions + hashes (read-only).

## ⚠️ The one rule: never edit a published version in place

Each version (`1.0.md`, `1.1.md`, …) is **immutable once published**. Users accepted *that
exact text*, and the acceptance record points at its content hash. If you edit a published
file's body, you silently change what past acceptances refer to — the audit trail breaks.

**To change a document, publish a NEW version.**

## How to edit the Privacy Policy (example)

1. **Copy** the current version to the next number:
   ```
   legal/privacy-policy/1.0.md  →  legal/privacy-policy/1.1.md
   ```
   (Use `2.0` for a major/material change, `1.1` for a minor one — your call.)

2. **Edit `1.1.md`.** Leave `1.0.md` untouched. Update the frontmatter:
   ```yaml
   ---
   documentType: PrivacyPolicy
   version: "1.1"              # must match the new filename's version
   title: Privacy Policy
   effectiveDate: "2026-11-01" # human-facing display string (shown on the web page)
   lastUpdated: "2026-10-20"
   acceptanceKind: Acknowledgement   # Agreement | Acknowledgement
   # effectiveAt: "2026-11-01T00:00:00Z"   # OPTIONAL — see "Scheduling" below
   ---
   ```

3. **Push to main.** Cloudflare Pages rebuilds the website automatically.

4. **Upload to R2.** Put the raw `.md` file (including frontmatter) at:
   ```
   R2 key: legal/privacy-policy/1.1.md
   ```
   The R2 bucket is the public one (same bucket as media). The key convention is always
   `legal/{folder}/{version}.md` where `{folder}` is the hyphenated directory name.

   You can do this via the Cloudflare R2 dashboard, the `wrangler` CLI, or a CI step:
   ```bash
   wrangler r2 object put petaverse-public/legal/privacy-policy/1.1.md \
     --file legal/privacy-policy/1.1.md
   ```

5. **Register the version with the API** (inserts the DB row + invalidates the cache):
   ```
   POST /api/legal/admin/invalidate-cache?documentType=PrivacyPolicy
   Authorization: Bearer <admin-token>
   ```
   This drops the 12-hour cache for that type so the next request fetches from R2
   immediately. The DB version row is inserted automatically on the next API restart via
   `LegalSeeder` — or you can restart the API now to trigger it immediately.

### What happens automatically after that

- `/api/legal/current` reports `1.1` as the current Privacy Policy within one request.
- `/api/legal/status` (and the home-summary pre-check) flips `requiresAction: true` for
  every user who had accepted `1.0` → they are re-prompted on next app open.
- `1.0` stays resolvable at `/api/legal/PrivacyPolicy/1.0/content` forever (served from
  R2, with embedded binary as fallback).
- **No API redeploy required** for a content-only change.

## Scheduling an effective date (optional)

By default a new version becomes **current the moment it is registered**, which immediately
re-prompts users. To publish the text now but have it take legal effect later, add a
machine-readable `effectiveAt:` to the frontmatter (ISO 8601, UTC):

```yaml
effectiveAt: "2026-11-01T00:00:00Z"
```

The version is then published but **not current** — and does **not** flip the acceptance
gate — until that timestamp passes. (`effectiveDate` is only the human string shown on
the web page; keep them consistent.)

## Content hash

The stored hash is the SHA-256 of the **frontmatter-stripped body** (the exact text a user
reads). This is the same value shown in the admin portal, returned by `/content`, and
verified by the mobile app — one canonical hash everywhere. Editing only frontmatter
(e.g. bumping `lastUpdated`) does not change the content hash.

## Acceptance kind

- `Agreement` — the user affirmatively **agrees** ("I agree"). Use for Terms and typically
  Community Guidelines.
- `Acknowledgement` — the user **acknowledges** a notice ("I understand"). Often used for
  the Privacy Policy.

The mobile gate uses this to word the consent CTA.

## Startup behavior (automatic sync)

On every API startup, `LegalSeeder`:
1. Reads all embedded `.md` files from the assembly.
2. Inserts any new `(type, version)` rows into the DB as published.
3. Uploads every embedded doc to R2 at `legal/{folder}/{version}.md` (idempotent PUT).

This means after a fresh deploy, R2 is always at least as up-to-date as the embedded
binary. New versions pushed *only* to R2 (without a deploy) take effect immediately after
calling `invalidate-cache`, or after the 12-hour TTL expires automatically.
