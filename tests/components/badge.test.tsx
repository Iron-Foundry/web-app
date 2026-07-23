import { describe, expect, test } from "bun:test";
import { render } from "@testing-library/react";
import { Badge } from "@/components/ui/badge";

describe("Badge", () => {
  test("renders children in a badge slot", () => {
    const { getByText } = render(<Badge>Owner</Badge>);
    const el = getByText("Owner");
    expect(el.getAttribute("data-slot")).toBe("badge");
  });

  test("applies destructive variant classes", () => {
    const { getByText } = render(<Badge variant="destructive">Banned</Badge>);
    expect(getByText("Banned").className).toContain("bg-destructive");
  });
});
