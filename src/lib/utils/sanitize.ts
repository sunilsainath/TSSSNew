/** Small, dependency free HTML sanitiser for admin authored content. */

const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "ul",
  "ol",
  "li",
  "h2",
  "h3",
  "h4",
  "blockquote",
  "a",
  "code",
  "pre",
]);

const ALLOWED_ATTRIBUTES: Record<string, Set<string>> = {
  a: new Set(["href", "target", "rel"]),
};

function escapeText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function safeHref(href: string): string | null {
  const trimmed = href.trim();
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(trimmed)) return trimmed;
  return null;
}

/**
 * Strips every tag that is not explicitly allowed and all event handler
 * attributes. Anything unexpected is escaped rather than removed so content is
 * never silently mangled.
 */
export function sanitizeHtml(input: string): string {
  if (!input) return "";

  const withBreaks = input.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n");

  let output = "";
  let index = 0;

  const tagPattern = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)\/?>/g;
  let match: RegExpExecArray | null;

  while ((match = tagPattern.exec(withBreaks)) !== null) {
    output += escapeText(withBreaks.slice(index, match.index));
    index = match.index + match[0].length;

    const rawTag = match[1].toLowerCase();
    const isClosing = match[0].startsWith("</");

    if (!ALLOWED_TAGS.has(rawTag)) continue;

    const tag = isClosing ? `</${rawTag}>` : `<${rawTag}`;

    if (isClosing) {
      output += tag;
      continue;
    }

    const attributes = ALLOWED_ATTRIBUTES[rawTag];
    let rendered = tag;

    if (attributes && match[2]) {
      const attributePattern = /([a-zA-Z-]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
      let attributeMatch: RegExpExecArray | null;
      while ((attributeMatch = attributePattern.exec(match[2])) !== null) {
        const name = attributeMatch[1].toLowerCase();
        if (!attributes.has(name)) continue;
        const value = attributeMatch[3] ?? attributeMatch[4] ?? "";
        if (name === "href") {
          const href = safeHref(value);
          if (!href) continue;
          rendered += ` href="${escapeText(href)}"`;
          continue;
        }
        rendered += ` ${name}="${escapeText(value)}"`;
      }
    }

    rendered += ">";
    output += rendered;
  }

  output += escapeText(withBreaks.slice(index));

  return output
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .join("\n\n")
    .replace(/\n/g, "<br />");
}

/** Converts plain text (blog submissions) into safe paragraphs. */
export function textToSafeHtml(input: string): string {
  return sanitizeHtml(input.replace(/\n/g, "\n\n"));
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
