function safeOrigin(apiUrl: string): string {
  try {
    return new URL(apiUrl).origin;
  } catch {
    return "";
  }
}

export function buildCsp(apiOrigin: string, nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://esm.sh https://static.cloudflareinsights.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    `connect-src 'self' ${apiOrigin} https://esm.sh https://cloudflareinsights.com`.replace(/\s+/g, " ").trim(),
    "font-src 'self' data:",
    "frame-src https://www.youtube-nocookie.com https://teamup.com",
    "base-uri 'none'",
    "object-src 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

export function securityHeaders(apiUrl: string, nonce: string): Record<string, string> {
  return {
    "Content-Security-Policy": buildCsp(safeOrigin(apiUrl), nonce),
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  };
}
