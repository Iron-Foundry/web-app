import { describe, expect, test } from "bun:test";
import { EMPTY_DRAFT, draftBody, draftError, type FeedbackDraft } from "@/lib/feedbackDraft";

const filled: FeedbackDraft = { ...EMPTY_DRAFT, title: " Title ", description: " Body ", steps: " Steps " };

describe("draftError", () => {
  test.each([
    [{ ...filled, title: "  " }, "suggestion", "Title is required."],
    [{ ...filled, description: "" }, "suggestion", "Description is required."],
    [{ ...filled, steps: "" }, "bug", "Steps to reproduce are required."],
    [{ ...filled, steps: "" }, "suggestion", null],
    [filled, "bug", null],
  ] as const)("names the first missing field", (draft, type, expected) => {
    expect(draftError(draft, type)).toBe(expected);
  });
});

describe("draftBody", () => {
  test("sends trimmed steps for a bug only", () => {
    expect(draftBody(filled, "bug")).toMatchObject({ title: "Title", steps_to_reproduce: "Steps" });
    expect(draftBody(filled, "suggestion")).not.toHaveProperty("steps_to_reproduce");
  });
});
