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

### Changed

- The competition metric tabs are split into labelled rows - Skills, Bosses,
  Raids, Activities, Computed - each sorted alphabetically and wrapping instead
  of running off the page. Raid metrics are lifted out of the boss list, and a
  metric the config does not know shows up under Other rather than disappearing.

### Added

- A slim team progress bar above the tile race board. Every team sits on it as a
  circular icon puck at its share of the path, and hovering or clicking a puck
  opens a popover with the team's percent complete and its step out of the
  board's total. Teams sharing a step zigzag above and below the track, which
  keeps each one clickable on a tighter horizontal spread than a single row
  allows. The
  track is a rounded multi-hue gradient that pans and hue-cycles on two
  out-of-phase timers, over a blurred primary-gold backdrop glow.

## [1.6.0] - 2026-08-01

### Added

- A Trap tile in the board builder. Its dice count and faces are chosen when the
  trap is placed. A trap-only cell is drawn like any other tile - the bear trap
  icon from the cache service in the cell body, "Trap" as its caption, and a
  tooltip stating the dice and that a team springs it once - on the public board
  and in the builder grid alike. A cell that also carries an assigned tile keeps
  that tile in the body and shows the trap as a corner badge. Traps never gate
  the roll button, since they carry no requirements.

## [1.5.1] - 2026-08-01

### Changed

- Recent Rolls rows carry the team's icon instead of a colour dot, falling back
  to the team initial on its colour when no icon is set, and the dice glyph is
  drawn in the primary gold.

## [1.5.0] - 2026-08-01

### Added

- A "Submissions" review queue on the tile race Controls tab: proof thumbnails,
  the requirement each submission covers, and Approve / Reject / Delete per row,
  filtered by review status. Rejecting takes a reason.
- Team cards show a "Rolled back" badge when a rejected submission has sent a
  team behind the point it had reached.

### Changed

- The roll button now unlocks on a claim rather than a staff tick, and its
  blocked tooltip reads "Submit proof for the current tile first".

## [1.4.0] - 2026-08-01

### Added

- The RSN on a tile race roster row is now a picker over the member's linked
  accounts, so a signup made on the wrong account can be corrected after the
  teams are drawn without moving anyone off their team. A typed name covers
  staff-added members who have no linked account.
- A "Channel Permissions" card on the tile race Controls tab toggles what each
  team's role may do in its own Discord channels: pin messages, delete
  messages, mention everyone and roles, threads, edit their channels, and voice
  moderation. Changes apply to the channels that already exist, so a live event
  keeps its channels and their history.

## [1.3.1] - 2026-08-01

### Changed

- Team markers on the tile race board are twice as large, so team colours,
  icons and initials are readable at a glance. The markers fan out further
  apart when several teams share a cell.

## [1.3.0] - 2026-07-31

### Added

- A Pause toggle on the tile race Controls tab blocks every team from rolling
  without ending the game. The roll button goes dead for everyone with a reason
  in its tooltip, the public page carries a "Rolls paused" badge, and the API
  refuses a roll regardless of what the browser sends.
- A Discord Channels card on Controls creates and tears down the event's
  Discord shape: one category holding a captains channel plus a text and voice
  channel per team, each locked to that team's role. The buttons only queue the
  work, so the card re-reads the event on a timer until the bot reports back and
  says so if it never does.
- Teams can be renamed and given an icon from the Teams tab. Item icons come
  from the cache service by id, NPC art from the wiki. A rename reaches Discord
  straight away when the event is provisioned, so the role and both channels
  cannot drift from the name shown on the site.

### Fixed

- Dice count and sides now save. Both inputs were uncontrolled and committed on
  blur only, so a value the server clamped kept being displayed as typed and a
  change made without leaving the field was silently dropped. They are
  controlled, re-sync to the event, and commit through an explicit Save.
- The board redraws for everyone when any team rolls, not only for whoever
  clicked. Only the roll list was polled; team positions and the fog of war
  horizon derived from them sat in a five-minute cache, so other viewers kept
  the board they loaded with and the fog never lifted.

## [1.2.1] - 2026-07-31

### Changed

- The public tile race page fits a third team card per row from 1280px up, and
  widens from 1152px to 1408px there to keep the cards readable at that count.
  A seventeen-team event drops from nine rows of teams to six. Nothing changes
  below 1280px.

## [1.2.0] - 2026-07-31

### Added

- The tile race admin Teams tab is now a two-column roster board: the unassigned
  pool on the left, team cards on the right. Set a team size and hit Generate
  Teams to build the teams from the signup pool - no more creating each team by
  hand first - and Reset to Signups puts everyone back in the pool. Every member
  row carries a team dropdown, a captain toggle and a remove button, so rosters
  can be adjusted by hand at any point. Members can be added who never signed
  up, for replacements. An optional "every team gets a raider" pass balances
  CoX/ToB/ToA kill count across teams at a threshold you set; qualifying members
  are marked and any team the constraint could not satisfy shows a "no raider"
  warning. The crown on each member row appoints that member as captain,
  replacing the team's current one, so a shortage of captain volunteers at
  signup no longer matters; a team left without one shows a "no captain"
  warning.
- The profile's WOM Stats card shows overall XP, the player's top three skills
  by XP, and their ironman EHP/EHB. Overall XP had a slot in the card already
  but never rendered: the snapshot the API stores kept only the skills the
  ranking config scores, and `overall` is not one of them.

### Fixed

- The music socket is allowed by the Content Security Policy. `connect-src`
  carried the API's `https` origin only, and a CSP source expression with a
  scheme matches that scheme alone, so `wss://` to the very same host was
  refused and the player never connected in production. The websocket origin is
  now derived from the API origin the same way `musicSocketUrl` derives it.

## [1.1.0] - 2026-07-29

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
