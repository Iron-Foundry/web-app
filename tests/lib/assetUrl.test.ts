import { describe, expect, test } from "bun:test";
import { API_URL } from "@/context/AuthContext";
import { assetThumbnailUrl, assetUrl } from "@/lib/assetUrl";

describe("assetUrl", () => {
  test("prefixes the API base", () => {
    expect(assetUrl("/assets/1.png")).toBe(`${API_URL}/assets/1.png`);
  });
});

describe("assetThumbnailUrl", () => {
  test("appends width for rasterisable image types", () => {
    expect(assetThumbnailUrl("/assets/1.png", "image/png", 256)).toBe(
      `${API_URL}/assets/1.png?w=256`,
    );
  });

  test("returns original for non-thumbnailable types", () => {
    expect(assetThumbnailUrl("/assets/v.mp4", "video/mp4", 256)).toBe(
      `${API_URL}/assets/v.mp4`,
    );
  });
});
