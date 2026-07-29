# Changelog

All notable changes to web-app are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

`package.json` holds the version and is the single source of truth for it.
Bump with `npm version --no-git-tag-version patch|minor` (or `prerelease`).
A MAJOR bump is the maintainer's call and is never made automatically. The bump
happens once, when the accumulated work is about to be pushed - not per
component. Entries land under Unreleased until then.

## [Unreleased]

### Added

- Cover art on the queue, on Up next and on Now Playing, with a placeholder of
  the same size when a track has none so rows keep their alignment. The art is
  carried on every track the browser sends - added to the queue, saved to a
  playlist, reordered within one - because dropping it in a write deletes it
  from the saved playlist, and nothing downstream can look it up again.
- Deleting a playlist and removing a track from one both ask first. Both
  buttons sit beside controls that only rename, share or reorder, and a deleted
  playlist is not recoverable.
- Each track in an opened playlist can be queued on its own, not only the
  playlist whole. The saved row is sent as it stands, so the bot queues the
  track that was saved rather than searching its title again. Available on
  shared playlists too, on the same rule the whole-playlist Queue button uses:
  seeing it is enough, and only a live session you are in is required.
- Now Playing names whoever requested the track and the Activity feed names
  whoever acted, instead of printing a Discord id. The bot attaches the name
  when it writes the record; the id is shown only when it could not.
- A Music panel, opened from the profile menu and built like the Control Panel:
  one dialog, a grouped nav, and one page at a time. Now Playing carries the
  player and the transport controls, Queue drag-reorders and saves itself as a
  playlist, Playlists creates, shares, deletes and queues, and Activity shows
  who did what to the session.
- A mini player pinned to the bottom of every page while something is playing,
  with the track, its progress, pause and skip. Clicking the track opens the
  panel.
- One WebSocket for the whole page, shared by the panel and the mini player. It
  authenticates with its first frame, reconnects with a growing backoff, and is
  the only thing that keeps the player current - the progress bar is
  extrapolated locally between state changes rather than polled.
- Controls are disabled unless the viewer is in the voice channel, which is the
  same rule the Discord panel enforces, so neither surface can drive a channel
  nobody is sitting in. That answer is re-asked whenever the listener count
  changes, so joining a channel unlocks the controls without a reload.
- The queue and activity lists are re-read whenever the session changes, not
  only when this page caused the change. A track queued from Discord moved the
  count on screen while the rows kept showing whatever they held when the page
  was opened.
- The seek bar commits on release rather than while dragging, holds where it was
  dropped until the bot confirms the move, and sends a whole number of
  milliseconds. The extrapolated position is built from a float timestamp, so
  without rounding every seek was refused by the API and the bar did nothing.
- Dragging the seek bar shows the target time in a readout above the thumb,
  tracking it as it moves and clearing on release.
- The seek bar and the mini player's progress bar glide between ticks instead of
  stepping once a second. The position still advances on a one-second timer; a
  matching linear transition fills in the gap, so the motion is continuous
  without the page re-rendering at frame rate. Suppressed while dragging, and
  reset per track so a new track does not slide backwards to zero.
- Both sliders feed the drag back into their own value. A Radix slider given a
  `value` is fully controlled and only commits when its own value changed, so
  the volume slider was inert twice over - the thumb would not move and pointer
  drags sent nothing at all, leaving it stuck at whatever the session opened on.
- A session nothing has been heard from for two and a half minutes is dropped.
  A killed bot publishes no closing notice, so silence is the only signal that
  it has gone.
- Shuffle is a lit toggle rather than a one-shot button, and Now Playing states
  the loop, shuffle and volume in force under the controls.
- Playlist import: paste a YouTube or YouTube Music playlist link and it is
  saved whole, keeping the name the source gave it. Spotify is not offered -
  Spotify serves a playlist, album or artist page only to a signed-in account,
  so those links cannot be imported at all and the page now says so instead of
  inviting a paste that always fails.
- A History page listing everything the session has already played, newest
  first, with a button to queue any of it again and a button opening a dialog
  that saves it into a playlist. The Discord panel shows the last ten; the web
  page shows the whole list the bot still keeps. Saving needs no voice channel,
  queueing does.
- A Clan Stats page: minutes listened, tracks played, skips, sessions, where the
  audio actually streamed from, and the most-played recordings over a chosen
  window. Nothing on it is per member, because the counters behind it carry no
  user id at all.
- Track search, shared by the queue and the playlist editor: search a source or
  paste a link, then add one result or all of them. Searching needs no session,
  so a playlist can be built with nothing playing.
- The queue and playlists have the same full set of edits from the web - add,
  remove and reorder. Playlists additionally create, rename, share and delete,
  and none of that needs a voice channel; only queueing into a live session
  does.
- Discord ids are carried as strings throughout. They are 64-bit snowflakes and
  JavaScript rounds anything above 2^53, which silently pointed the control
  check at the wrong channel and made every playlist read as someone else's.

## [1.0.1] - 2026-07-28

### Fixed

- `typescript` is now an explicit devDependency. It was only present as a
  transitive peer of `openapi-typescript`, so a bump of that package could have
  removed `tsc` and broken `bun run typecheck`.
- `typecheck` and `gen:api-types` invoke their tool's JS entry point through
  `bun` instead of the `node_modules/.bin` shim. The shims are platform
  specific, so a WSL shell sharing the Windows `node_modules` on `/mnt/c` found
  only `tsc.exe` and failed with `tsc: command not found`.

## [1.0.0] - 2026-07-28

Versioning baseline. The site has been in production; 1.0.0 is adopted as the starting point rather than reconstructing its history. The package was also renamed from `bun-react-template` to `web-app`.
