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

- While an active frenzy event has signups open, the event page shows the whole event board (all tiers and cards, activities, milestones and multipliers) in place of the standings, charts and leaderboards.
- In the frenzy template editor, staff move tiers up and down, and the board, the team pages and the editor show the tiers in that order. Each tier has a points multiplier, such as 1.1 for Medium, that scales its items' points above the base.
- A frenzy card shows up to 9 item rows. A longer card scrolls inside, with a fade and a chevron at the foot until the last row. The chevron scrolls further down.
- The event board has its own page at `/activities/frenzy/board`. Outside signups, a "Board" button on the event page opens it.
- In the frenzy template editor, the card name lists the matching collection log pages as you type, without regard to capitals or apostrophes. Picking one, such as K'ril Tsutsaroth or Chambers of Xeric, names the card after it and adds the page's drops the card lacks. Each drop takes its rate from the fastest OSRSClans source, so The Gauntlet takes Corrupted Gauntlet rates. Guaranteed drops, such as the Gauntlet cape, stay out. A free-text name, such as Slayer, adds nothing.
- The PVM Frenzy draft page at `/activities/frenzy/draft`. It shows whose turn it is, the snake grid of rounds and captains, the pool of signups with search and a rank filter, the recent picks, and every team's full roster. The page updates live on each pick. The captain on turn picks with "Pick", and staff pick for an absent captain. Staff move members between teams after the draft.
- The frenzy event editor has a captain draft section. Staff choose Full draft or Top Picks, the top picks per captain, and the captains from the signups, then draw the order, start the draft or reset it.
- The frenzy signup offers "Willing to captain a team", and each signup or change sends the browser's time zone.
- On the draft page a signed-in viewer sees how far each captain's and member's time is ahead of or behind their own, such as "+2h" or "-5h 30m", in the pool, the snake grid and the rosters.
- PVM Frenzy signups: while staff have signups open, a signed-in member signs up for the active event from the event page, picks which linked account to compete with, switches it or withdraws. Staff open and close signups from the event editor.

### Removed

- The frenzy template editor's point cap, tier budget, Recalculate and point lock controls.
- The Bingo page at `/bingo`, its Community menu link, and its board and team data.
- The OSRS world map: the tile marker editor, preview and guide embed, and the `/map-test` page.

### Changed

- The home page clan stats show The Fractured Archive kills in purple. Loot value and Tombs of Amascut are yellow, Chambers of Xeric is green, and Theatre of Blood stays red.
- Recent achievements sits on its own row beneath Rank structure on the home page.
- The frenzy template editor shows each item's points as they follow from a fixed cap of 1,000,000 for all items at full completion, by hours per drop. The points change as items and rates change.
- Frenzy card points are whole numbers, with .5 rounding up.
- The site wears the Monogram skin: near-black surfaces, an orange accent, neutral borders, a light mode in warm white, and gradient fills on the main buttons and the brand. Cards no longer glow on hover.
- The top bar carries the I/F logo, the three section menus as plain text, Staff, and the profile menu with the role in its colour. The pages of the current section sit in a row under the bar. On staff pages that row carries the staff pages.
- The footer lists the three sections as columns beside Links and Follow, with square social buttons.
- The members area uses a rail beside the content: your name, the seven pages and Settings. Under the md breakpoint the page row carries the members pages, and the floating menu button is gone.
- The Dashboard puts your figures in one strip under the welcome line, then Account Ranks, Badges and Name Changes, the activity feed, and competitions with their status as a word.
- The Profile puts its figures in one strip under your name. The Skills and Goals cards switch accounts with underlined names in place of round buttons.
- Tickets, Surveys, Applications, Suggestions, Bug Reports and Settings take the same page head and flat panels. A list that fails to load says so in place of showing as empty.
- Suggestions and Bug Reports in the members area edit your own open post in the Feedback Board's edit dialog.
- Rotating an API key asks in a dialog of the site, not in the browser's confirm box.
- Home opens with the live or upcoming competition as a notice above a hero of the logo, the title, the Discord and Wise Old Man buttons and the clan photo. The event banners sit side by side, the seven clan stats show as tiles in their own colours, Who we are sits beside Recent achievements, and the ranks show in their gem colours.
- About, Rules and Our Team take the gradient page title and flat panels. Our Team shows extra roles on keyboard focus as well as on hover.
- All page titles use the gradient, and labels and filter buttons are flat in place of round pills.
- Login shows the I/F mark over the Discord and API key panels. Calendar frames the Teamup calendar in a panel. Shared goals use the flat goal rows.
- The Feedback Board and Leaderboards switch tabs with underlined text in place of filled buttons. The ToA Overall and Challenge switch is underlined words as well.
- Parties: the vibe and status are coloured words, the roster is plain names, and the create, edit and notification forms open in the site's dialog. The time picker and the Join-as account choice use the site's own select in place of the browser's.
- Competitions: the plugin notice, the competition picker with status as words, and the picked competition's head with its countdown take flat panels.
- Resources and Guide: the category cards, recently updated entries and the article foot (dates, the useful reaction, copy and export) take flat panels.
- Tile Race: the head shows Rolls paused, the next event and the days left as coloured words.
- The Feedback Board shows Edit on the author's own open post. Edit opens the Submit form with the post's fields and saves through `PATCH /feedback/{id}`. Edit no longer shows on a post that has left Open, because the API refuses that edit.
- Signed-out visitors see the staff avatars on the Our Team page.
- The Ranking page has no Filter button. The button opened an empty control.
- The Tile Race progress bar stops its loop when the reader sets `prefers-reduced-motion`.
- The frenzy and tile race pages show Manage to staff with `frenzy.admin` / `tilerace.admin` edit, the same ids the Control Panel pages and the API check.
- The asset manager, the guide icon picker, the item name map, skill icons, bank tags and tile race item icons read OSRSClans. Item downloads offer the OSRSClans sizes (36 x 32 to 512 x 455) and sprite downloads scale 1x to 16x, all as WebP.
- RuneLite tile marker configs no longer show on the site, and a `[[tilemarker:...]]` embed in a guide renders as nothing. The stored configs and embeds stay.
- The Reference Data page reads OSRSClans. It has a tab per OSRSClans category, a search, and each source's kill rate. A source opens a dialog with its drop table, grouped by the Wiki headings, with item images and hours a drop.
- The PVM Frenzy event page shows the teams in one standings table, with a column per tier. The points charts sit on the page under it, not in a sheet.
- The PVM Frenzy team page shows all tiers, activities, milestones, multipliers and charts on one page, with a section rail.
- A frenzy source card shows its image, a yellow item at the base count and a green item with its duplicate. Its title turns yellow and green by the same rule. The (i) button shows the kill rate and the chance and hours a drop of each item.
- The staff template editor is a workspace: tiers and cards on the left, the picked card in the middle, and the template fields, budgets and actions on the right.
- The version history shows both sides of each change.

- The frenzy rate picker names a kill rate that staff set in Foundry as "Foundry".
- Staff with `frenzy.admin` edit set, change and remove a Foundry kill rate in the Reference Data source dialog, for a source that OSRSClans gives none.
- A frenzy card can be a typed group, such as Slayer or Miscellaneous, that holds items from several sources.
- A frenzy item takes its drop chance and kill rate from a picked OSRSClans loot rate row. A row with no kill rate leaves KPH to set by hand.
- A frenzy card takes its image from an OSRSClans NPC, an OSRSClans sprite or one of its items. With no image, it shows its item images.

### Fixed

- The frenzy card image picker searches for the current card's name each time it opens. It no longer keeps the first card's name.
- The card image picker shows "No images found" when no result has an image. It no longer shows an empty grid.
- The card image and item searches wait until typing stops, so they no longer send a request on each keystroke.
- Leaving the frenzy item search without a pick shows the item's own name again.

## [1.12.0] - 2026-08-18

### Removed

- The recap's "Approved proofs, cumulative" chart. The tiles-per-day chart
  beside it carried the same story, and now runs full width.

### Changed

- The recap calls a submitted requirement a tile, not a proof: "Tiles approved",
  "Tiles submitted per day", "Approved tiles per participant". People on a team
  are participants, not racers, and a participant's count is "Tiles proven".

## [1.11.1] - 2026-08-18

### Fixed

- A stopped tile race shows its recap. The page only counted an event as over
  when it was flagged finished or its end date had passed, so an event that was
  simply stopped kept rendering the board. `/tilerace/active` returns the live
  event whenever there is one, so `is_active: false` is now taken as the answer
  rather than re-deriving it from the board state.

## [1.11.0] - 2026-08-18

### Added

- The tile race Controls tab has an "End the event" card: pick the winning team
  from a list ordered by board position, or no winner, and end it. Rolls lock
  and the public page swaps to the recap. Until now the only thing that could
  end an event was a finish pad with its `ends_game` trigger on; the stop button
  in the events list deactivates the event, which hides it rather than
  concluding it. The card takes over the old Game Over panel and still offers
  Reset Game once the event is finished, now naming the recorded winner.

## [1.10.0] - 2026-08-18

### Added

- The tile race page shows an event recap once the event has ended. When nothing
  else is running or scheduled the recap takes the place of the board: the
  winner, five event totals, a stepped chart of every team's position over time,
  cumulative approved proofs, submissions per day by verdict, final standings,
  top contributors and the rosters as they stood at close. Racers removed during
  the event are excluded from every per-racer and per-team proof count, and the
  contributor panel says how many were dropped.
- While another event is running or scheduled, the finished board stays and the
  recap folds away behind a "Show recap" button, with the next event named in
  the header.

### Fixed

- A finished tile race no longer shows "Ends today" forever, no longer polls for
  new rolls every three seconds, and no longer plays the roll animation for
  rolls it loads. The countdown badge is computed from `ends_at` with no upper
  bound on the past, so any past end date read as ending now.

## [1.9.0] - 2026-08-02

### Changed

- The tile race Recent Rolls panel carries the event's full roll history in its
  own scroll area. It fetched only the newest 25 rolls and grew the page as they
  arrived; it now fetches every roll and, on large screens, matches the height of
  the team-card column beside it, scrolling within that height (capped at 24rem
  when the layout stacks).

## [1.8.0] - 2026-08-02

### Changed

- The tile race path editor draws its cells with the same `BoardCell` component
  as the public board, so a builder cell shows the full-size tile icon, its
  title, the modifier badges and the description/requirement tooltip instead of
  a step number and a 12px icon. Tooltips are suppressed while a draw or erase
  drag is in flight.

### Added

- Tiles already on the board carry an `xN` count in the builder's tile picker,
  and the tag row gains Placed / Not Placed filters that stack with the tag and
  search filters.

## [1.7.0] - 2026-08-02

### Changed

- The tile race board reads the masked public payload. Fog of war is now the
  server's call, so the client no longer receives the tiles it draws as `?`.
  Membership and the signup panel key off `my_team_id` / `my_signup` instead of
  scanning a roster the response no longer carries, and the shared board
  components are typed against `TileRacePublicEvent` / `TileRacePublicTeam`.

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
