/**
 * HTML sanitiser for admin-authored content.
 *
 * Tag filtering is done by the `sanitize-html` package, which parses the input
 * as a real document instead of matching tags with regular expressions. A
 * regex cannot know how a browser will parse `<a title=">">` or an entity
 * encoded protocol, and every hand-rolled filter eventually learns that the
 * hard way. The allowlist below mirrors what the previous implementation
 * accepted, so stored content renders exactly as before.
 */

import sanitize from "sanitize-html";

const ALLOWED_TAGS = [
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
];

/**
 * Strips every tag that is not explicitly allowed and all event handler
 * attributes. Anything unexpected is escaped rather than removed so content is
 * never silently mangled.
 */
export function sanitizeHtml(input: string): string {
  if (!input) return "";

  const withBreaks = input.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n");

  const cleaned = sanitize(withBreaks, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href", "target", "rel"],
    },
    // Mirrors the previous safeHref: absolute http(s), mail, phone, and
    // site-relative links only. Protocol-relative (//evil.example) URLs are
    // rejected because the scheme is attacker-controlled.
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: {},
    allowProtocolRelative: false,
  });

  return cleaned
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