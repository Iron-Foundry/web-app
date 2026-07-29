import { describe, expect, test } from "bun:test";
import {
  duration,
  listenedTotal,
  livePosition,
  toTrackInput,
} from "@/components/music/format";
import type { MusicHistory, MusicSession } from "@/types/music";

function entry(overrides: Partial<MusicHistory["track"]> = {}): MusicHistory {
  return {
    at: "2026-07-29T20:15:00Z",
    event: "played",
    track: {
      identifier: "abc123",
      title: "Zanaris Nocturne",
      author: "Barbarian Assault",
      length_ms: 180_000,
      is_stream: false,
      uri: "https://open.spotify.com/track/abc123",
      artwork: "https://i.scdn.co/image/abc123",
      isrc: "USABC1234567",
      source: "spotify",
      requested_source: "spotify",
      played_source: "youtube",
      requester_id: "111222333444555666",
      requester_name: "Saltis",
      ...overrides,
    },
  };
}

function playing(overrides: Partial<MusicSession> = {}): MusicSession {
  return {
    voice_channel_id: "1479967329084375071",
    guild_id: "1234567890",
    channel_name: "Music Lounge",
    bot_index: 0,
    nickname: "Zanaris Zamorak",
    current: entry().track,
    paused: false,
    // A float epoch, exactly as the session hash stores it.
    position_ms: 42_000,
    updated_at: 1_774_000_000.5,
    volume: 60,
    loop: "off",
    shuffle: false,
    queue_length: 0,
    remaining_ms: 0,
    listener_count: 1,
    ...overrides,
  };
}

describe("livePosition", () => {
  test("is a whole number of milliseconds", () => {
    // `updated_at` is a float, so the extrapolation is fractional unless it is
    // rounded - and the seek built from it is refused by the API, which takes
    // an integer. This is what made the seek bar do nothing at all.
    const position = livePosition(playing(), 1_774_000_007_123);

    expect(Number.isInteger(position)).toBe(true);
  });

  test("advances from the reported position by the time since it was taken", () => {
    expect(livePosition(playing(), 1_774_000_003_500)).toBe(45_000);
  });

  test("never runs past the end of the track", () => {
    expect(livePosition(playing(), 1_774_009_999_999)).toBe(180_000);
  });

  test("a paused session sits where it was left", () => {
    expect(livePosition(playing({ paused: true }), 1_774_000_099_999)).toBe(
      42_000,
    );
  });

  test("nothing playing is position zero", () => {
    expect(livePosition(playing({ current: null }), 1_774_000_003_500)).toBe(0);
  });
});

describe("listenedTotal", () => {
  test("reads as hours and minutes once it passes an hour", () => {
    expect(listenedTotal(12 * 3_600_000 + 4 * 60_000)).toBe("12h 04m");
  });

  test("drops the hours when there are none", () => {
    expect(listenedTotal(4 * 60_000)).toBe("4m");
  });

  test("keeps counting past a day rather than wrapping", () => {
    // A clan total runs long; mm:ss would put four digits in the minutes
    // column, which is why this is not `duration`.
    expect(listenedTotal(50 * 3_600_000)).toBe("50h 00m");
    expect(duration(50 * 3_600_000)).toBe("50:00:00");
  });

  test("a negative total is zero rather than a minus sign", () => {
    expect(listenedTotal(-1000)).toBe("0m");
  });
});

describe("toTrackInput", () => {
  test("renames length_ms to the duration_ms a playlist stores", () => {
    expect(toTrackInput(entry()).duration_ms).toBe(180_000);
  });

  test("keeps the isrc, which is what lets a dead link re-resolve", () => {
    expect(toTrackInput(entry()).isrc).toBe("USABC1234567");
  });

  test("carries no playable audio handle", () => {
    // The API never sends one; this makes sure nothing reintroduces it on the
    // way back out to the queue or a playlist.
    const input = toTrackInput(entry());

    expect("encoded" in input).toBe(false);
    expect("payload" in input).toBe(false);
  });

  test("a track with no isrc still converts", () => {
    expect(toTrackInput(entry({ isrc: null })).isrc).toBeNull();
  });

  test("carries the cover, which cannot be recovered once dropped", () => {
    // Requeueing or saving a played track is the one chance to keep the art:
    // the audio re-resolves to a mirror whose own cover is a different one.
    expect(toTrackInput(entry()).artwork).toBe("https://i.scdn.co/image/abc123");
  });
});
