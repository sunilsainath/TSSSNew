/**
 * Exercises the HTML sanitizer against XSS payloads and the established
 * output contract. The module is TypeScript, so it is transpiled to a scratch
 * file inside the project (bare imports resolve) and imported from there.
 *
 * Usage: node scripts/sanitizer-check.mjs
 */
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

const ts = (await import("typescript")).default;
const source = await readFile(path.join(root, "src", "lib", "utils", "sanitize.ts"), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});

const scratch = await mkdtemp(path.join(root, ".sanitizer-check-"));
await writeFile(path.join(scratch, "sanitize.mjs"), compiled.outputText);
const { pathToFileURL } = await import("node:url");
const { sanitizeHtml, textToSafeHtml, slugify } = await import(
  pathToFileURL(path.join(scratch, "sanitize.mjs")).href
);

let passed = 0;
let failed = 0;

function check(name, condition, detail = "") {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name} ${detail}`);
  }
}

const has = (html, ...needles) => needles.every((needle) => html.includes(needle));
const lacks = (html, ...needles) => needles.every((needle) => !html.includes(needle.toLowerCase()) || !html.toLowerCase().includes(needle.toLowerCase()));

console.log("1. Script and event handlers never survive");
check("script tags stripped", lacks(sanitizeHtml('<script>alert(1)</script>'), "<script"));
check("svg onload stripped", lacks(sanitizeHtml('<svg onload="alert(1)">'), "onload"));
check("img onerror stripped", lacks(sanitizeHtml('<img src=x onerror="alert(1)">'), "onerror"));
check("onclick on allowed tag stripped", lacks(sanitizeHtml('<a href="/x" onclick="alert(1)">x</a>'), "onclick"));
check("style attribute stripped", lacks(sanitizeHtml('<p style="color:expression(alert(1))">x</p>'), "style="));
check("unquoted javascript href dropped", lacks(sanitizeHtml('<a href=javascript:alert(1)>x</a>'), "javascript"));
check("quoted javascript href dropped", lacks(sanitizeHtml('<a href="javascript:alert(1)">x</a>'), "javascript"));
check("entity-encoded protocol dropped", lacks(sanitizeHtml('<a href="java&#115;cript:alert(1)">x</a>'), "java"));
check("vbscript dropped", lacks(sanitizeHtml('<a href="vbscript:msgbox(1)">x</a>'), "vbscript"));
check("data uri dropped", lacks(sanitizeHtml('<a href="data:text/html,<script>alert(1)</script>">x</a>'), "data:"));
check("protocol-relative dropped", lacks(sanitizeHtml('<a href="//evil.example/x">x</a>'), "//evil"));
check("comment smuggling escaped", lacks(sanitizeHtml('<!--<img src=x onerror=alert(1)>-->'), "onerror"));

console.log("\n2. Legitimate content is preserved");
check("paragraphs kept", has(sanitizeHtml("<p>Hello</p>"), "<p>Hello</p>"));
check("https links kept", has(sanitizeHtml('<a href="https://example.com">x</a>'), 'href="https://example.com"'));
check("relative links kept", has(sanitizeHtml('<a href="/events/x">x</a>'), 'href="/events/x"'));
check("anchors kept", has(sanitizeHtml('<a href="#contact">x</a>'), 'href="#contact"'));
check("mailto kept", has(sanitizeHtml('<a href="mailto:a@b.com">x</a>'), "mailto:"));
check("tel kept", has(sanitizeHtml('<a href="tel:+9112345">x</a>'), "tel:"));
check("quote breakout neutralised", has(sanitizeHtml('<a href="/x&quot; onclick=&quot;y">t</a>'), "&quot;"));
check(
  "quote breakout has no live handler",
  sanitizeHtml('<a href="/x&quot; onclick=&quot;y">t</a>') === '<a href="/x&quot; onclick=&quot;y">t</a>',
);

console.log("\n3. Output contract unchanged");
check("plain text survives", sanitizeHtml("one\n\ntwo").includes("one"), JSON.stringify(sanitizeHtml("one\n\ntwo")));
check("single newlines become breaks", sanitizeHtml("one\ntwo").includes("<br"));
check("empty stays empty", sanitizeHtml("") === "");
check("textToSafeHtml wraps text", textToSafeHtml("hello").includes("hello"));
check("slugify unchanged", slugify("Hello World!") === "hello-world");

await rm(scratch, { recursive: true, force: true });

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);