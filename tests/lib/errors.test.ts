import { describe, expect, test } from "bun:test";
import { ApiRequestError } from "@/api/client";
import { getErrorMessage } from "@/lib/errors";

describe("getErrorMessage", () => {
  test("uses ApiRequestError message", () => {
    const err = new ApiRequestError(404, "NOT_FOUND", "Party not found");
    expect(getErrorMessage(err)).toBe("Party not found");
  });

  test("uses a plain Error message", () => {
    expect(getErrorMessage(new Error("boom"))).toBe("boom");
  });

  test("falls back for non-error values", () => {
    expect(getErrorMessage("nope")).toBe("Something went wrong");
    expect(getErrorMessage(null, "custom fallback")).toBe("custom fallback");
  });
});
