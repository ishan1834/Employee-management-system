



import "katex/dist/katex.min.css";
import katex from "react-katex";
import { useMemo } from "react";

const { InlineMath, BlockMath } = katex as unknown as {
  InlineMath: React.FC<{ math: string }>;
  BlockMath: React.FC<{ math: string }>;
};

/**
 * Renders text with inline ($...$) and block ($$...$$) LaTeX,
 * preserving line breaks. Image markdown ![alt](url) is also supported.
 */
export function RichContent({ text, className = "" }: { text: string; className?: string }) {
  const parts = useMemo(() => splitLatex(text ?? ""), [text]);
  return (
    <div className={"whitespace-pre-wrap leading-relaxed " + className}>
      {parts.map((p, i) => {
        if (p.type === "block") {
          try { return <span key={i} className="block my-2 overflow-x-auto"><BlockMath math={p.value} /></span>; }
          catch { return <code key={i} className="text-rose-600">$${p.value}$$</code>; }
        }
        if (p.type === "inline") {
          try { return <InlineMath key={i} math={p.value} />; }
          catch { return <code key={i} className="text-rose-600">${p.value}$</code>; }
        }
        // text — also handle images ![alt](url)
        const out: React.ReactNode[] = [];
        const re = /!\[([^\]]*)\]\(([^)]+)\)/g;
        let last = 0; let m: RegExpExecArray | null;
        while ((m = re.exec(p.value))) {
          if (m.index > last) out.push(p.value.slice(last, m.index));
          out.push(<img key={`${i}-${m.index}`} src={m[2]} alt={m[1]} className="my-2 max-h-64 rounded-lg border border-border" />);
          last = m.index + m[0].length;
        }
        if (last < p.value.length) out.push(p.value.slice(last));
        return <span key={i}>{out}</span>;
      })}
    </div>
  );
}

type Part = { type: "text" | "inline" | "block"; value: string };
function splitLatex(s: string): Part[] {
  const out: Part[] = [];
  let i = 0;
  while (i < s.length) {
    const block = s.indexOf("$$", i);
    const inline = s.indexOf("$", i);
    const next = block === -1 ? inline : inline === -1 ? block : Math.min(block, inline);
    if (next === -1) { out.push({ type: "text", value: s.slice(i) }); break; }
    if (next > i) out.push({ type: "text", value: s.slice(i, next) });
    if (s.slice(next, next + 2) === "$$") {
      const end = s.indexOf("$$", next + 2);
      if (end === -1) { out.push({ type: "text", value: s.slice(next) }); break; }
      out.push({ type: "block", value: s.slice(next + 2, end) });
      i = end + 2;
    } else {
      const end = s.indexOf("$", next + 1);
      if (end === -1) { out.push({ type: "text", value: s.slice(next) }); break; }
      out.push({ type: "inline", value: s.slice(next + 1, end) });
      i = end + 1;
    }
  }
  return out;
}
