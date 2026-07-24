function apiBase(apiUrl: string): string {
  return apiUrl.replace(/\/$/, "");
}

export function linkHeader(apiUrl: string): string {
  const api = apiBase(apiUrl);
  return [
    `</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"`,
    `<${api}/openapi.json>; rel="service-desc"; type="application/json"`,
    `<${api}/docs>; rel="service-doc"; type="text/html"`,
  ].join(", ");
}

export function apiCatalog(apiUrl: string): string {
  const api = apiBase(apiUrl);
  return JSON.stringify({
    linkset: [
      {
        anchor: api,
        "service-desc": [{ href: `${api}/openapi.json`, type: "application/json" }],
        "service-doc": [{ href: `${api}/docs`, type: "text/html" }],
      },
    ],
  });
}
