import React from "react";

interface FormattedTextOptions {
  isUser?: boolean;
}

/**
 * Parses inline Markdown formatting (bold, italic, bold-italic, code) into React elements.
 * Correctly renders formatted text without raw markdown symbols (*, **, `).
 */
export function renderFormattedMarkdown(
  text: string,
  options: FormattedTextOptions = {}
): React.ReactNode {
  if (!text) return null;

  const { isUser = false } = options;

  return <>{parseMarkdownToNodes(text, isUser, 0)}</>;
}

function parseMarkdownToNodes(
  text: string,
  isUser: boolean,
  depth: number
): React.ReactNode[] {
  if (!text) return [];
  // Prevent excessive recursion depth
  if (depth > 5) return [text];

  // Token regex for:
  // 1. Inline code: `...`
  // 2. Bold italic: ***...***
  // 3. Bold: **...**
  // 4. Italic: *...* (where * is not part of **)
  const tokenRegex = /(`[^`]+`|\*\*\*(?:[^*]|\*(?!\*\*))+\*\*\*|\*\*(?:[^*]|\*(?!\*))+\*\*|(?<!\*)\*(?!\*)(?:[^*]|\*\*[^*]+?\*\*)+?(?<!\*)\*(?!\*))/g;

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    const key = `md-${depth}-${match.index}-${lastIndex}`;

    if (token.startsWith("`") && token.endsWith("`")) {
      const codeText = token.slice(1, -1);
      nodes.push(
        <code
          key={key}
          className={`px-1.5 py-0.5 rounded font-mono text-[11px] sm:text-xs font-semibold ${
            isUser
              ? "bg-white/20 text-white border border-white/30"
              : "bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700/60"
          }`}
        >
          {codeText}
        </code>
      );
    } else if (token.startsWith("***") && token.endsWith("***")) {
      const inner = token.slice(3, -3);
      nodes.push(
        <strong
          key={key}
          className={`font-black italic ${
            isUser ? "text-white" : "text-slate-950 dark:text-white"
          }`}
        >
          {parseMarkdownToNodes(inner, isUser, depth + 1)}
        </strong>
      );
    } else if (token.startsWith("**") && token.endsWith("**")) {
      const inner = token.slice(2, -2);
      nodes.push(
        <strong
          key={key}
          className={`font-black ${
            isUser ? "text-white font-extrabold" : "text-slate-950 dark:text-white"
          }`}
        >
          {parseMarkdownToNodes(inner, isUser, depth + 1)}
        </strong>
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      const inner = token.slice(1, -1);
      nodes.push(
        <em
          key={key}
          className={`italic ${
            isUser ? "text-indigo-100" : "text-slate-600 dark:text-slate-300"
          }`}
        >
          {parseMarkdownToNodes(inner, isUser, depth + 1)}
        </em>
      );
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}
