import { describe, expect, test } from "bun:test";
import {
  applyFrame,
  liveSessions,
  pruneStale,
  STALE_AFTER_MS,
  type SessionMap,
} from "@/lib/musicSessions";
import type { MusicSession } from "@/types/music";

const NOW = 1_800_000_000_000;

function session(id: string, overrides: Partial<MusicSession> = {}): MusicSession {
  return {
    voice_channel_id: id,
    guild_id: "1",
    channel_name: `Channel ${id}`,
    bot_index: 0,
    nickname: "Zanaris Zamorak",
    current: null,
    paused: false,
    position_ms: 0,
    updated_at: 0,
    volume: 60,
    loop: "off",
    shuffle: false,
    queue_length: 0,
    remaining_ms: 0,
    listener_count: 1,
    ...overrides,
  };
}

function seen(...ids: string[]): SessionMap {
  return Object.fromEntries(ids.map((id) => [id, { session: session(id), at: NOW }]));
}

describe("applyFrame", () => {
  test("a snapshot replaces everything known", () => {
    const before = seen("111", "222");
    const after = applyFrame(
      before,
      { type: "sessions", sessions: [session("333")] },
      NOW,
    );

    expect(Object.keys(after)).toEqual(["333"]);
  });

  test("a session frame adds one without disturbing the others", () => {
    const after = applyFrame(
      seen("111"),
      { type: "session", session: session("222") },
      NOW,
    );

    expect(Object.keys(after).sort()).toEqual(["111", "222"]);
  });

  test("a session frame replaces the one it names", () => {
    const after = applyFrame(
      seen("111"),
      { type: "session", session: session("111", { queue_length: 7 }) },
      NOW,
    );

    expect(after["111"]!.session.queue_length).toBe(7);
  });

  test("a closed frame drops the session", () => {
    const after = applyFrame(
      seen("111", "222"),
      { type: "closed", voice_channel_id: "111" },
      NOW,
    );

    expect(Object.keys(after)).toEqual(["222"]);
  });

  test("a closed frame for something unknown changes nothing", () => {
    const before = seen("111");
    const after = applyFrame(before, { type: "closed", voice_channel_id: "999" }, NOW);

    // The same object, so a stray frame cannot cause a re-render.
    expect(after).toBe(before);
  });

  test("every frame records when it arrived", () => {
    const after = applyFrame({}, { type: "session", session: session("111") }, NOW);

    expect(after["111"]!.at).toBe(NOW);
  });
});

describe("pruneStale", () => {
  test("a session heard from recently survives", () => {
    const state = seen("111");
    expect(pruneStale(state, NOW + 1_000)).toBe(state);
  });

  test("a session that went quiet is dropped", () => {
    // A killed bot publishes no closing notice, so silence is the only signal.
    const after = pruneStale(seen("111"), NOW + STALE_AFTER_MS + 1);

    expect(Object.keys(after)).toEqual([]);
  });

  test("only the quiet one is dropped", () => {
    const state: SessionMap = {
      ...seen("111"),
      "222": { session: session("222"), at: NOW - STALE_AFTER_MS - 1 },
    };

    expect(Object.keys(pruneStale(state, NOW))).toEqual(["111"]);
  });

  test("nothing expiring returns the same object", () => {
    const state = seen("111", "222");
    expect(pruneStale(state, NOW)).toBe(state);
  });

  test("a session is kept for well over two keepalive rounds", () => {
    // The bot announces every 60s; dropping after one missed round would flap.
    expect(STALE_AFTER_MS).toBeGreaterThan(120_000);
  });
});

describe("liveSessions", () => {
  test("comes back in a stable order", () => {
    expect(liveSessions(seen("222", "111")).map((s) => s.voice_channel_id)).toEqual([
      "111",
      "222",
    ]);
  });
});
