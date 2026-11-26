import { describe, expect, test } from "bun:test";
import { ApiRequestError } from "@/api/client";
import { shouldRetry } from "@/lib/queryClient";

describe("shouldRetry", () => {
  test.each([
    [404, false],
    [502, false],
    [503, false],
    [504, false],
    [500, true],
  ])("a %i is retried: %p", (status, retried) => {
    expect(shouldRetry(0, new ApiRequestError(status, "X", "x"))).toBe(retried);
  });

  test("a network error is retried twice at most", () => {
    expect([0, 1, 2].map((n) => shouldRetry(n, new TypeError("fetch failed")))).toEqual([true, true, false]);
  });
});
