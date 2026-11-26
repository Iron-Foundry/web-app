import { describe, expect, test } from "bun:test";
import { buildCsp, securityHeaders } from "@/lib/security";

const NONCE = "test-nonce-123";

describe("buildCsp", () => {
  test("locks base-uri and object-src to none", () => {
    const csp = buildCsp("https://api.ironfoundry.cc", NONCE);
    expect(csp).toContain("base-uri 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
  });

  test("uses the per-request nonce and drops unsafe-inline for scripts", () => {
    const csp = buildCsp("https://api.ironfoundry.cc", NONCE);
    expect(csp).toContain(`script-src 'self' 'nonce-${NONCE}'`);
    expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
  });

  test("allows esm.sh so the recharts importmap module loads", () => {
    const csp = buildCsp("https://api.ironfoundry.cc", NONCE);
    expect(csp).toContain("script-src 'self' 'nonce-test-nonce-123' https://esm.sh");
    expect(csp).toContain("connect-src 'self' https://api.ironfoundry.cc wss://api.ironfoundry.cc https://esm.sh https://cloudflareinsights.com");
  });

  test("allows the music socket alongside the API origin", () => {
    // A scheme in a CSP source matches only that scheme, so the https entry
    // does not cover wss and the music socket is refused without its own.
    const csp = buildCsp("https://api.ironfoundry.cc", NONCE);
    expect(csp).toContain("wss://api.ironfoundry.cc");
  });

  test("uses ws for a plain http API origin", () => {
    const csp = buildCsp("http://localhost:8000", NONCE);
    expect(csp).toContain("connect-src 'self' http://localhost:8000 ws://localhost:8000");
  });

  test("keeps unsafe-inline for styles (React inline style attributes)", () => {
    const csp = buildCsp("https://api.ironfoundry.cc", NONCE);
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
  });

  test("permits the youtube and teamup iframe embeds", () => {
    const csp = buildCsp("https://api.ironfoundry.cc", NONCE);
    expect(csp).toContain("frame-src https://www.youtube-nocookie.com https://teamup.com");
  });

  test("collapses whitespace when the API origin is empty", () => {
    const csp = buildCsp("", NONCE);
    expect(csp).toContain("connect-src 'self' https://esm.sh https://cloudflareinsights.com");
  });
});

describe("securityHeaders", () => {
  test("derives connect-src from the API URL origin, dropping the path", () => {
    const headers = securityHeaders("https://api.ironfoundry.cc/v1/clan", NONCE);
    expect(headers["Content-Security-Policy"]).toContain("https://api.ironfoundry.cc ");
    expect(headers["Content-Security-Policy"]).not.toContain("/v1/clan");
  });

  test("sets HSTS, nosniff, and referrer policy", () => {
    const headers = securityHeaders("https://api.ironfoundry.cc", NONCE);
    expect(headers["Strict-Transport-Security"]).toBe("max-age=31536000; includeSubDomains");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
  });

  test("falls back to empty origin for an invalid API URL", () => {
    const headers = securityHeaders("not-a-url", NONCE);
    expect(headers["Content-Security-Policy"]).toContain("connect-src 'self' https://esm.sh https://cloudflareinsights.com");
  });
});
