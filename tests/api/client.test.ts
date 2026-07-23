import { afterEach, describe, expect, test } from "bun:test";
import { ApiRequestError, apiFetch } from "@/api/client";

const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
});

function stubFetch(response: Response): void {
  globalThis.fetch = (async () => response) as unknown as typeof fetch;
}

describe("apiFetch", () => {
  test("parses a JSON body on success", async () => {
    stubFetch(
      new Response(JSON.stringify({ id: "abc" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const body = await apiFetch<{ id: string }>("/parties/abc");
    expect(body).toEqual({ id: "abc" });
  });

  test("returns undefined for 204 No Content", async () => {
    stubFetch(new Response(null, { status: 204 }));
    const body = await apiFetch<void>("/parties/abc", { method: "DELETE" });
    expect(body).toBeUndefined();
  });

  test("throws ApiRequestError mapping FastAPI detail + code", async () => {
    stubFetch(
      new Response(JSON.stringify({ code: "FORBIDDEN", detail: "Nope" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }),
    );
    try {
      await apiFetch("/staff/secret");
      throw new Error("expected apiFetch to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiRequestError);
      const e = err as ApiRequestError;
      expect(e.status).toBe(403);
      expect(e.code).toBe("FORBIDDEN");
      expect(e.message).toBe("Nope");
    }
  });

  test("extracts the first validation error message", async () => {
    stubFetch(
      new Response(
        JSON.stringify({ detail: [{ msg: "field required", loc: ["body"] }] }),
        { status: 422, headers: { "Content-Type": "application/json" } },
      ),
    );
    try {
      await apiFetch("/parties/", { method: "POST" });
      throw new Error("expected apiFetch to throw");
    } catch (err) {
      expect((err as ApiRequestError).message).toBe("field required");
    }
  });
});
