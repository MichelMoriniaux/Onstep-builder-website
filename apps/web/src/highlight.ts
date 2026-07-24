// Minimal, dependency-free C-header syntax highlighter for the config previews.
// Returns HTML (input is fully escaped first) using .tok-* classes from index.css.

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Index of the line-comment "//" that is not inside a string, or -1.
function lineCommentIndex(line: string): number {
  let inStr = false;
  for (let i = 0; i < line.length - 1; i++) {
    const ch = line[i];
    if (ch === '"') inStr = !inStr;
    else if (!inStr && ch === "/" && line[i + 1] === "/") return i;
  }
  return -1;
}

const KEYWORDS = /\b(ON|OFF|HIGH|LOW|BOTH|AUTO)\b/;

// Single-pass tokenizer over already-escaped code (no comment part) so tokens
// never nest inside one another.
const TOKENS = /("[^"]*")|(#\w+)|\b(ON|OFF|HIGH|LOW|BOTH|AUTO)\b|\b(\d+\.?\d*)\b/g;

function highlightCode(escaped: string): string {
  return escaped.replace(TOKENS, (m, str, pp, _kw, num) => {
    if (str) return `<span class="tok-str">${str}</span>`;
    if (pp) return `<span class="tok-pp">${pp}</span>`;
    if (num !== undefined && KEYWORDS.test(m) === false && num !== "")
      return `<span class="tok-num">${num}</span>`;
    return `<span class="tok-kw">${m}</span>`;
  });
}

export function highlightC(code: string): string {
  return code
    .split("\n")
    .map((line) => {
      const ci = lineCommentIndex(line);
      if (ci < 0) return highlightCode(escapeHtml(line));
      const codePart = highlightCode(escapeHtml(line.slice(0, ci)));
      const comment = escapeHtml(line.slice(ci));
      return `${codePart}<span class="tok-com">${comment}</span>`;
    })
    .join("\n");
}
