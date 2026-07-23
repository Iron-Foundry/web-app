import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const SRC = join(import.meta.dir, "..", "src");
const SCHEMA = join(SRC, "api", "schema.d.ts");

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx)$/.test(full) && !full.endsWith(".d.ts")) out.push(full);
  }
  return out;
}

/** Path keys of the generated `paths` interface (the committed API contract). */
function schemaPaths(schema: string): string[] {
  const start = schema.indexOf("export interface paths {");
  const end = schema.indexOf("export interface", start + 1);
  const block = schema.slice(start, end === -1 ? undefined : end);
  const paths: string[] = [];
  const re = /^\s{4}"(\/[^"]*)":/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block)) !== null) paths.push(m[1]!);
  return paths;
}

function toSegments(path: string): string[] {
  return path
    .replace(/^\//, "")
    .replace(/\/$/, "")
    .split("/")
    .map((seg) => (seg.startsWith("{") || seg.includes("*") ? "*" : seg));
}

function matches(callPath: string, specPath: string): boolean {
  const a = toSegments(callPath);
  const b = toSegments(specPath);
  if (a.length !== b.length) return false;
  return a.every((seg, i) => seg === "*" || b[i] === "*" || seg === b[i]);
}

function extractCallPaths(source: string): string[] {
  const paths: string[] = [];
  // apiFetch<...>("/path")  or  apiFetch("/path")  or  apiFetch(`/path/${x}`)
  const re = /apiFetch\s*(?:<[^>]*>)?\s*\(\s*(["'`])([^"'`]*)\1/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    let raw = m[2] ?? "";
    if (!raw.startsWith("/")) continue; // dynamic base we cannot resolve
    raw = raw.replace(/\$\{[^}]*\}/g, "*"); // template params -> wildcard
    raw = raw.split("?")[0]!; // drop query string
    if (raw.includes("${") || raw.includes("`")) continue; // unparseable remainder
    paths.push(raw.replace(/\/$/, "") || "/");
  }
  return paths;
}

describe("web-app <-> api contract", () => {
  const schema = readFileSync(SCHEMA, "utf8");

  test("generated schema artifact exists", () => {
    expect(schema).toContain("export interface paths");
    expect(schemaPaths(schema).length).toBeGreaterThan(0);
  });

  // Generous timeout: this walks the whole src tree, which can be slow on a
  // cold/networked filesystem (e.g. OneDrive) and must not flake there.
  test("every apiFetch path exists in the generated schema", () => {
    const specPaths = schemaPaths(schema);

    const callPaths = new Set<string>();
    for (const file of walk(SRC)) {
      for (const p of extractCallPaths(readFileSync(file, "utf8"))) {
        callPaths.add(p);
      }
    }
    expect(callPaths.size).toBeGreaterThan(0);

    const missing = [...callPaths].filter(
      (cp) => !specPaths.some((sp) => matches(cp, sp)),
    );
    expect(missing).toEqual([]);
  }, 60000);
});
