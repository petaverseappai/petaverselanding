import { useEffect } from "react";

/**
 * Minimal, dependency-free renderer for the canonical legal Markdown.
 * Supports the subset our legal docs use: #/##/### headings, paragraphs, "-" bullet lists,
 * GitHub-style pipe tables, and inline bold (**x**). Not a general Markdown engine — intentionally
 * small so we avoid adding a dependency for three static documents.
 */

interface Frontmatter {
  title?: string;
  effectiveDate?: string;
  lastUpdated?: string;
  version?: string;
}

export function MarkdownDocument({ raw }: { raw: string }) {
  const { frontmatter, body } = splitFrontmatter(raw);

  useEffect(() => {
    if (frontmatter.title) document.title = `${frontmatter.title} — PetaVerse`;
  }, [frontmatter.title]);

  return (
    <main className="min-h-screen bg-white text-gray-800">
      <div className="mx-auto max-w-3xl px-5 py-10 sm:px-6 sm:py-14">
        <a href="/" className="inline-flex items-center gap-2.5">
          <img src="/assets/brand/logo.png" alt="PetaVerse" className="h-9 w-auto" />
          <span className="text-xl font-bold text-gray-900">PetaVerse</span>
        </a>

        {(frontmatter.effectiveDate || frontmatter.lastUpdated) && (
          <p className="mt-6 text-sm text-gray-500">
            {frontmatter.effectiveDate && <>Effective date: {frontmatter.effectiveDate}</>}
            {frontmatter.effectiveDate && frontmatter.lastUpdated && " · "}
            {frontmatter.lastUpdated && <>Last updated: {frontmatter.lastUpdated}</>}
            {frontmatter.version && <> · Version {frontmatter.version}</>}
          </p>
        )}

        <article className="mt-4">{renderBlocks(body)}</article>

        <footer className="mt-14 border-t border-gray-200 pt-6 text-sm text-gray-500">
          <p>
            Questions? Contact us at{" "}
            <a href="mailto:support@petaverseapp.com" className="text-blue-600 hover:underline">
              support@petaverseapp.com
            </a>
            .
          </p>
          <div className="mt-2 space-x-4">
            <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
            <a href="/terms" className="text-blue-600 hover:underline">Terms &amp; Conditions</a>
            <a href="/community-guidelines" className="text-blue-600 hover:underline">Community Guidelines</a>
          </div>
        </footer>
      </div>
    </main>
  );
}

function splitFrontmatter(raw: string): { frontmatter: Frontmatter; body: string } {
  const normalized = raw.replace(/\r\n/g, "\n");
  const fm: Frontmatter = {};
  if (!normalized.startsWith("---\n")) return { frontmatter: fm, body: normalized };

  const end = normalized.indexOf("\n---", 4);
  if (end < 0) return { frontmatter: fm, body: normalized };

  const block = normalized.slice(4, end);
  for (const line of block.split("\n")) {
    const idx = line.indexOf(":");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim().replace(/^"|"$/g, "");
    (fm as Record<string, string>)[key] = value;
  }
  const body = normalized.slice(end + 4).replace(/^\n+/, "");
  return { frontmatter: fm, body };
}

function renderBlocks(body: string) {
  const lines = body.split("\n");
  const out: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i++;
      continue;
    }

    // Headings
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      const level = h[1].length;
      const text = h[2];
      if (level === 1) out.push(<h1 key={key++} className="mt-4 text-3xl font-bold text-gray-900">{inline(text)}</h1>);
      else if (level === 2) out.push(<h2 key={key++} className="mt-8 text-xl font-semibold text-gray-900">{inline(text)}</h2>);
      else out.push(<h3 key={key++} className="mt-6 text-lg font-semibold text-gray-900">{inline(text)}</h3>);
      i++;
      continue;
    }

    // Tables (pipe rows with a separator line below the header)
    if (line.trim().startsWith("|") && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1])) {
      const headers = splitRow(line);
      i += 2; // skip header + separator
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      out.push(
        <div key={key++} className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {headers.map((hd, j) => (
                  <th key={j} className="border border-gray-200 bg-gray-50 px-3 py-2 text-left font-semibold">{inline(hd)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri}>
                  {r.map((c, ci) => (
                    <td key={ci} className="border border-gray-200 px-3 py-2 align-top">{inline(c)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Bullet lists
    if (/^\s*-\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*-\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*-\s+/, ""));
        i++;
      }
      out.push(
        <ul key={key++} className="mt-3 list-disc space-y-1 pl-6 text-[15px] leading-relaxed">
          {items.map((it, j) => <li key={j}>{inline(it)}</li>)}
        </ul>
      );
      continue;
    }

    // Paragraph (gather consecutive non-empty, non-structural lines)
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(#{1,3})\s+/.test(lines[i]) &&
      !/^\s*-\s+/.test(lines[i]) &&
      !lines[i].trim().startsWith("|")
    ) {
      para.push(lines[i]);
      i++;
    }
    out.push(<p key={key++} className="mt-3 text-[15px] leading-relaxed">{inline(para.join(" "))}</p>);
  }

  return out;
}

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());
}

/** Inline formatting: only **bold** is used in our documents. */
function inline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    const b = /^\*\*([^*]+)\*\*$/.exec(part);
    return b ? <strong key={i}>{b[1]}</strong> : <span key={i}>{part}</span>;
  });
}
