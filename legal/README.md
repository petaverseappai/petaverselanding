# Legal documents — how to edit & publish

This folder (`landing/legal/`) is the **single source of truth** for the text of the
Privacy Policy, Terms & Conditions, and Community Guidelines. Everything else is a synced
copy or a consumer:

- The **public website** renders these files (bundled at build time).
- The **API** embeds a copy (`PetsApp.Infrastructure/LegalContent/`), serves the body via
  `GET /api/legal/{type}/{version}/content`, stores version metadata + a content hash, and
  records per-user acceptance.
- The **mobile app** fetches `/content` and renders it in-app at the consent gate.
- The **admin portal** shows published versions + hashes (read-only).

## ⚠️ The one rule: never edit a published version in place

Each version (`1.0.md`, `1.1.md`, …) is **immutable once published**. Users accepted *that
exact text*, and the acceptance record points at its content hash. If you edit a published
file's body, you silently change what thousands of past acceptances refer to — the audit
trail breaks.

The backend **enforces** this: `LegalSeeder` refuses to update the stored hash of an
already-published version. If you edit `1.0.md` in place, the website will show the new text
but the API keeps serving the old `1.0` — a silent split-brain, surfaced only as a startup
log warning. Don't do it.

**To change a document, publish a NEW version.**

## How to edit the Privacy Policy (example)

1. **Copy** the current version to the next number:
   ```
   legal/privacy-policy/1.0.md  →  legal/privacy-policy/1.1.md
   ```
   (Use `2.0` for a major/material change, `1.1` for a minor one — your call; it's just a
   string, sorted highest-wins within a document type.)

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

3. **Sync into the API repo** and verify no drift:
   ```
   npm run sync-legal     # copies legal/** into the API's LegalContent/**
   npm run check-legal    # exits non-zero if the two trees differ (also runs in CI)
   ```

4. **Commit & push** in both repos (landing + API).

5. **Deploy the API.** On startup the seeder sees a new `(PrivacyPolicy, 1.1)` row with no
   existing record and inserts it as published. The old `1.0` row is left exactly as-is.

6. **Deploy the website.** The public page now renders `1.1`.

### What happens automatically after that

- `/api/legal/current` reports `1.1` as the current Privacy Policy.
- `/api/legal/status` (and the home-summary pre-check) flips `requiresAction: true` for every
  user who had accepted `1.0` → they are re-prompted to accept on next app open.
- `1.0` stays resolvable at `/api/legal/PrivacyPolicy/1.0/content` forever, so old acceptance
  records still point at valid, unchanged text.

## Scheduling an effective date (optional)

By default a new version becomes **current the moment the API boots after deploy**, which
immediately re-prompts users. To publish the text now but have it take legal effect later,
add a machine-readable `effectiveAt:` to the frontmatter (ISO 8601, UTC):

```yaml
effectiveAt: "2026-11-01T00:00:00Z"
```

The version is then published but **not current** — and does **not** flip the acceptance gate
— until that timestamp passes. (`effectiveAt` is the machine field the backend reads;
`effectiveDate` is only the human string shown on the web page. Keep them consistent.)

## Content hash

The stored hash is the SHA-256 of the **frontmatter-stripped body** (the exact text a user
reads). This is the same value shown in the admin portal, returned by `/content`, and
verified by the mobile app — one canonical hash everywhere. Because it's body-only, editing
*frontmatter* (e.g. bumping `lastUpdated`) on a draft does not change the content hash.

## Acceptance kind

- `Agreement` — the user affirmatively **agrees** ("I agree"). Use for Terms and typically
  Community Guidelines.
- `Acknowledgement` — the user **acknowledges** a notice ("I understand"). Often used for the
  Privacy Policy, depending on jurisdiction/legal advice.

The mobile gate uses this to word the consent CTA. It does not change whether re-acceptance
is required — any new current version re-prompts everyone who accepted an older one.
