import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface LegalContent {
  documentType: string;
  version: string;
  acceptanceKind: string;
  body: string;
  effectiveAt: string | null;
}

interface Props {
  documentType: string;
}

const DOC_TITLES: Record<string, string> = {
  PrivacyPolicy: "Privacy Policy",
  TermsAndConditions: "Terms & Conditions",
  CommunityGuidelines: "Community Guidelines",
};

const API_BASE = import.meta.env.VITE_BACKEND_URL ?? "https://api.petaverseapp.com/api";

export function MarkdownDocument({ documentType }: Props) {
  const navigate = useNavigate();
  const [doc, setDoc] = useState<LegalContent | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    const CAMEL: Record<string, string> = {
      PrivacyPolicy: "privacyPolicy",
      TermsAndConditions: "termsAndConditions",
      CommunityGuidelines: "communityGuidelines",
    };
    fetch(`${API_BASE}/legal/current`)
      .then((res) => { if (!res.ok) throw new Error(`${res.status}`); return res.json(); })
      .then((current: Record<string, { version: string }>) => {
        const version = current[CAMEL[documentType]]?.version;
        if (!version) throw new Error("no current version");
        return fetch(`${API_BASE}/legal/${documentType}/${version}/content`);
      })
      .then((res) => { if (!res.ok) throw new Error(`${res.status}`); return res.json(); })
      .then((data: LegalContent) => setDoc(data))
      .catch(() => setError(true));
  }, [documentType]);

  const title = DOC_TITLES[documentType] ?? documentType;

  useEffect(() => {
    document.title = doc ? `${DOC_TITLES[documentType] ?? documentType} — PetaVerse` : `${title} — PetaVerse`;
  }, [doc, documentType, title]);

  function handleLogoClick(e: React.MouseEvent) {
    e.preventDefault();
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  }

  return (
    <main className="min-h-screen bg-white text-gray-800">
      <div className="mx-auto max-w-3xl px-5 py-10 sm:px-6 sm:py-14">
        <a href="/" onClick={handleLogoClick} className="inline-flex items-center gap-2.5">
          <img src="/assets/brand/logo.png" alt="PetaVerse" className="h-9 w-auto" />
          <span className="text-xl font-bold text-gray-900">PetaVerse</span>
        </a>

        {error && (
          <p className="mt-10 text-sm text-gray-500">Failed to load document. Please try again later.</p>
        )}

        {!doc && !error && (
          <p className="mt-10 text-sm text-gray-400">Loading…</p>
        )}

        {doc && (
          <>
            <p className="mt-6 text-sm text-gray-500">
              {doc.effectiveAt && <>Effective date: {new Date(doc.effectiveAt).toLocaleDateString()}</>}
              {doc.effectiveAt && <> · </>}
              Version {doc.version}
            </p>
            <article className="mt-4">{renderBlocks(doc.body)}</article>
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
          </>
        )}
      </div>
    </main>
  );
}


function renderBlocks(body: string) {
  const lines = body.split("\n");
  const out: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") { i++; continue; }

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

    if (line.trim().startsWith("|") && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1])) {
      const headers = splitRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) { rows.push(splitRow(lines[i])); i++; }
      out.push(
        <div key={key++} className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>{headers.map((hd, j) => <th key={j} className="border border-gray-200 bg-gray-50 px-3 py-2 text-left font-semibold">{inline(hd)}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => <tr key={ri}>{r.map((c, ci) => <td key={ci} className="border border-gray-200 px-3 py-2 align-top">{inline(c)}</td>)}</tr>)}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    if (/^\s*-\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*-\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*-\s+/, "")); i++; }
      out.push(
        <ul key={key++} className="mt-3 list-disc space-y-1 pl-6 text-[15px] leading-relaxed">
          {items.map((it, j) => <li key={j}>{inline(it)}</li>)}
        </ul>
      );
      continue;
    }

    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(#{1,3})\s+/.test(lines[i]) &&
      !/^\s*-\s+/.test(lines[i]) &&
      !lines[i].trim().startsWith("|")
    ) { para.push(lines[i]); i++; }
    out.push(<p key={key++} className="mt-3 text-[15px] leading-relaxed">{inline(para.join(" "))}</p>);
  }

  return out;
}

function splitRow(line: string): string[] {
  return line.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
}

function inline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    const b = /^\*\*([^*]+)\*\*$/.exec(part);
    return b ? <strong key={i}>{b[1]}</strong> : <span key={i}>{part}</span>;
  });
}
