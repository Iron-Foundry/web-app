import { describe, expect, test } from "bun:test";
import { relativeOffsetLabel } from "@/lib/timeZones";

const WINTER = new Date("2026-01-15T12:00:00Z");
const SUMMER = new Date("2026-07-15T12:00:00Z");

describe("relativeOffsetLabel", () => {
  test.each([
    ["Asia/Kolkata", "Europe/Stockholm", WINTER, "+4h 30m"],
    ["America/New_York", "Europe/Stockholm", WINTER, "-6h"],
    ["Europe/Stockholm", "Europe/Stockholm", WINTER, "±0h"],
    ["Australia/Sydney", "Europe/Stockholm", WINTER, "+10h"],
    ["Australia/Sydney", "Europe/Stockholm", SUMMER, "+8h"],
  ] as const)("%s seen from %s", (member, viewer, at, text) => {
    expect(relativeOffsetLabel(member, viewer, at).text).toBe(text);
  });
});
