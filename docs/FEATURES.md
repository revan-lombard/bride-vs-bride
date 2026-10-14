# Bride vs. Bride — Feature Roadmap & Enhancement Ideas

What's built, what's worth adding, and what would take the show to the next level. Roughly ordered by impact-for-effort within each section.

## ✅ Built (v0.1 framework)

- Three synced views: Guest (join/buzz/vote), Host (full control panel), Display (TV board)
- Team join with name + team choice, persisted across phone refreshes
- Race-safe buzzer (Firebase transaction — first tap wins, everyone else sees who got it)
- Full-screen buzz takeover on the TV with team colours
- Family Feud: paste-in rounds, tap-to-reveal answers, 3-strike display with animation
- Live polls: custom question + options, vote changing while open, animated results reveal
- Score editing (+/- quick buttons per team) with live scoreboard
- Host-triggered sound cues (buzz / correct / strike / fanfare) synthesized in-browser, no audio files
- QR code for the guest link (on the lobby screen and in the host panel)
- Connection indicator on guest phones; full state reset button
- Auto-deploy to GitHub Pages via Actions
- **Pre-event survey** (built 2026-08-31): `/#/survey` invitee view + `/#/survey-results` host tally with open/close toggle and "Use as Feud round" (points = votes). Placeholder questions in `src/lib/surveyQuestions.js` still need replacing with the real ones.
- **Content banks** (built 2026-08-31, roadmap #1): one-tap load buttons on the host panel for pre-written Feud rounds, poll presets and lyric rounds — all in `src/lib/rounds.js` (placeholders need replacing).
- **Lyric game TV content** (built 2026-08-31, roadmap #2): snippet on the TV, host-triggered answer reveal, manual entry or bank load.
- **Feud award button** (built 2026-08-31, roadmap #3): sums revealed points, one tap adds them to either team's score.
- **Theming** (built 2026-08-31, roadmap #14): brides' names + event title in `src/lib/theme.js` (still placeholder names) — flows into team labels, lobby, and join screen.

- **Bridal Bingo** (built 2026-10-14): 75-ball B-R-I-D-E bingo. Per-phone cards derived from player id + round seed (nothing stored per player), self-marking with only-called-numbers validation, auto-lit BINGO button, race-safe first claim, auto-scored patterns (line / two lines / corners / full house) with continue-for-bigger-pattern. TV tumbler animation with call phrases, called-numbers board and a winner takeover showing the winning card.
- **Sound everywhere** (built 2026-10-14): 17 synthesized cues; the TV derives sounds from state changes so every buzz, reveal, strike, score change, timer tick and win is heard without host taps. Click-to-enable-sound prompt + mute on the TV, tap sounds/haptics + mute on phones, expanded host soundboard.
- **TV polish** (built 2026-10-14, roadmap #15 + #17): animated score count-up with floating "+N", and a title splash when the host switches games.

- **Rehearsal mode** (built 2026-10-14, roadmap #22): `?rehearsal=1` or the host-panel switch runs everything against `/game-test`; banner on every screen, QR follows the mode, sticky per tab.
- **Reconnect resilience** (built 2026-10-14, roadmap #21): phones get a blocking "Reconnecting…" overlay (Refresh offered after 12s, "Back online" toast); TV and host get an offline pill.
- **Player roster** (built 2026-10-14, roadmap #4): guests register at `players/{id}` with onDisconnect presence; host can rename / switch team / remove, synced live to the phone; duplicate-name warning; joined names on the TV lobby. Buzzes now carry `playerId`, so two guests with the same name can't both see "You buzzed first".

- **Emoji reactions** (built 2026-10-14, roadmap #25): phone emoji bar → floating emojis + names on the TV, per-team sides, 0.6s cooldown, host on/off toggle. Stored at `/reactions/{root}/{playerId}` (one slot + counter per guest) so taps don't resync `/game`.
- **Gift Bingo** (built 2026-10-14): second bingo mode with gift-word cards (`GIFT_WORDS` in rounds.js); host taps gifts as opened (undoable), TV "just opened" + gift board, same marking/claim/scoring as number bingo.

- **Bride Knows Best** (built 2026-10-14, roadmap #8 Newlywed + Who said it?): NEWLYWED game with bride rounds (secret answers on the brides' phones via roster 👰 role, or host-entered; each team predicts its own bride) and who-said-it rounds; share-based team scoring, personal points for correct guessers; TV lock-in/reveal panels and vote split.
- **Personal points + MVP** (built 2026-10-14, roadmap #10): `players/{id}/points` credited in the same multi-path update as team scores (Feud, Noot, Bingo, Newlywed, host "+N to buzz winner" for Lyric); `buzzes` counter; ⭐ on phones and roster; three-beat winner reveal with MVP, podium, Fastest Finger and Hype Queen.
- **PWA** (built 2026-10-14, roadmap #28): manifest + icons, service worker caching the app shell (network-first HTML, cache-first hashed assets, precached at install), install button / iOS hint, screen wake lock on all game views.

- **Cheer-off** (built 2026-10-14): 10s tapping tug-of-war. Server-clock-synced countdown/live/counting phases, taps batched 4×/s per phone into `/reactions/{root}-cheer/{round}` (no new rules), 15 taps/s cap, average-per-tapper scoring, transaction-guarded auto-finish from host or TV, +10 winner / +5 personal for top tapper.

- **Round recaps** (built 2026-10-14, roadmap #17 extended): host game switches go through `switchGame`, which snapshots scores/personal points (`gameStart`) and, when the game being left changed the score, writes a `recap` (team gains, totals, star of the round, MVP so far, next game). TV `GameTransition` plays recap → title splash; phones get a toast; manual "scoreboard check" from the host.

- **Host run sheet** (built 2026-10-14, roadmap #12): `RUN_SHEET` in rounds.js; ▶ Next switches game (recap included) and loads the step's bank content in one tap; per-step host cue; step list with ✓/Go/Redo; position shared in `runStep`; placeholder content skipped safely.

- **Bigger TV layouts** (built 2026-10-14, roadmap #16): Feud as a gold-framed game-show board (numbered tiles flip to answer + points, round total, last pick, strike boxes, full-screen giant ✕ on a miss). Polls: big option tiles + "votes in" meter vs players online + voter names while open (no results until reveal); reveal races bars out sorted with 👑 winner and voter names; two-option polls become a head-to-head tug-of-war bar.

- **Feud steal** (built 2026-10-14): 3rd strike (with answers left) opens `feudState.steal` for the other team; only their phones can buzz; one guess. Hit = defenders' points on this board (answers carry `by: team`) move to the stealers + the answer's points (personal credit to the stealer); miss = defenders keep all. TV banner + drumroll/fanfare/strike cues, phone banners per side, host manual start + "reveal the rest" (unscored).

- **Emoji Song Quiz** (built 2026-10-14): LYRIC_ROUNDS filled with 14 real songs as emoji clues + hints (`kind: 'emoji'`, title as answer); TV renders clue big with "name that song" header. Real lyrics deliberately not stored (copyright, public repo) — manual entry for lyric-style rounds.
- **Messages for the brides** (built 2026-10-14): 💌 composer on phones (to A/B/both, signed, multiple), stored at `/messages/{root}` (survives resets; rules: create/delete only, ≤600 chars); host `/#/messages` page with live list, remove, keepsake HTML download (print → PDF), text download, copy all; message count on the TV lobby and host header.

- **Noot vir Noot content** (built 2026-10-14): NOOT_ROUNDS rewritten — 14 rounds (Afrikaans/SA classics + "which ABBA/Whitney/Queen/Bruno Mars/Beyoncé/Taylor Swift song?" artist rounds) with checked titles/artists; no-audio mode where the host plays from a phone and toggles "Luister…" on the TV.

- **Feud content** (built 2026-10-14): 12 kitchen-tea/wedding boards in FEUD_ROUNDS, 5 answers + 2 decoys each; point values are estimates (≈50 per board for balance with the 10-point games) — the survey's "Use as Feud round" gives real numbers.

- **Bride Knows Best content** (built 2026-10-14): 20 rounds — 10 secret bride answers, 10 "who is more likely / who said" rounds with no invented answers (the host asks the brides at the reveal and taps the name); headers read "Melissa or Calista?".

---

## 📋 Built: pre-event Feud survey (multiple choice)

The real Family Feud trick: survey the invitees *before* the event, then the boards are "we asked the kitchen tea guests…" with genuine data. Decided design (all implemented):

- **Multiple choice, not free text.** With a small group, free-text answers scatter too widely to make good boards ("morning breath" vs "bad breath" vs "her breath"). Each question ships with 4–6 fixed options (questions and options written by Revan in `src/lib/surveyQuestions.js`). This also means tallying is fully automatic — zero manual answer-grouping.
- **Standalone route `/#/survey`** — the URL sent with the invites. Themed like the game ("💍 Bride vs. Bride — help us build the game!") so it doubles as a teaser. Deliberately separate from the game views; invitees never see a link that's one hash-edit from `/#/host`.
- **One response set per device** — respondent id in localStorage (same pattern as the game's player identity); answers can be changed until submitted. Optional name field so we know who responded.
- **Data at a separate `/survey` root** in the same Firebase project (`/survey/responses/{respondentId} = { name, answers: { [questionId]: choice } }`), so game resets never touch survey data. Other respondents' answers are never shown — no bandwagon bias.
- **Host tally view `/#/survey-results`** — live counts per option per question, plus a **"Use as Feud round"** button that converts vote counts straight into a game board (points = votes, or normalised to 100). The survey literally builds the game content.
- **Open/close toggle** so late submissions can't change boards after they're locked in.
- Bonus: the survey is a soft load-test of Firebase with real guests' phones before the event.

*Alternative considered: Google Form. Rejected — needs manual transcription into the game, breaks the theme, and multiple-choice tallying is what the app is already good at.*

---

## 🎯 High value, low effort

1. **Pre-loaded question banks** — hard-code the actual Feud rounds, poll questions and lyric snippets for the event in a `rounds.js` file, so the host taps "Next round" instead of pasting text under pressure. *This is the single biggest day-of quality improvement.*
2. **Lyric game content on the TV** — currently a static screen; show the lyric snippet with the missing words blanked out, and a host-triggered "reveal answer" like Feud.
3. **Feud points → team score button** — "Award revealed points to Team A/B" so the host doesn't mentally sum the board.
4. **Player roster on host panel** — list who has joined per team (write players to `/players` on join). Also enables a "kick/rename" fix-up.
5. **Countdown timer** — host sets 30/60s, big animated countdown on the TV, auto-locks buzzers or closes the poll at zero.
6. **Winner celebration screen** — end-of-show final standings with confetti animation (CSS only, no library needed).
7. **Host confirmation guards** — "are you sure" on game switches mid-round, not just on reset.

## 🚀 High value, medium effort

8. **More game modes**
   - **Trivia** — multiple-choice question pushed to every phone, points for fastest correct answers (reuses poll plumbing + timestamps).
   - **"Who said it?"** — quote on screen, phones vote Bride A or Bride B (a themed poll preset).
   - **Picture round** — baby photos / couple photos on the TV, phones guess.
   - **The Newlywed-style game** — brides answer secretly on their phones, teams predict, reveal both.
9. **Buzz queue instead of single winner** — record the top 3 buzzers in order, so if the first answer is wrong the host passes to the next without re-arming.
10. **Per-player scores + leaderboard** — track individual contributions (buzz wins, correct votes) alongside team scores; "MVP guest" reveal at the end.
11. **Real audio files** — replace synth cues with proper game-show samples (Feud "ding"/"strike" style sounds); preload on the display for instant playback.
12. **Host presets panel** — one-tap sequences ("start Feud round 2" = load round + arm buzzers + play cue) to reduce fumbling.
13. **Haptic feedback** — `navigator.vibrate()` on buzz confirm and vote confirm (Android; iOS Safari ignores it gracefully).

## 🎨 Polish & theming

14. **Real names and colours** — replace "Bride A / Bride B" with the actual brides' names, wedding colour palette, and photos on the lobby screen (a single `theme.js` config file).
15. **Sound + animation on score changes** — score tick-up animation on the TV instead of instant jumps.
16. **Poll results as head-to-head tug-of-war bar** — for two-option polls, a single bar fought over from both ends is far more dramatic than side-by-side bars.
17. **Transitions between games** — animated "Round 2: Family Feud!" splash when the host switches games.
18. **Idle attract mode** — lobby screen cycles photos/messages while waiting.

## 🛡️ Robustness (worth doing before the event)

19. **Host route protection** — a simple PIN gate on `/#/host` (stored in state, checked client-side) so a curious guest who edits the URL can't run the show. Low security, but this is a party, not a bank.
20. **Buzzer latency fairness** — capture `performance.now()` offset per client and adjust; or simpler, accept that Firebase transactions are ~fair and test on the venue Wi-Fi beforehand.
21. **Reconnect resilience** — guests already resume via localStorage; add an explicit "reconnecting…" overlay when `.info/connected` drops so people don't hammer a dead buzzer.
22. **Rehearsal mode** — a second state root (`/game-test`) toggled by URL param so you can rehearse without touching live state.
23. **Firebase rules hardening** — restrict guest writes to only `buzzerState/firstBuzzed` and their own vote path; host writes gated by a token in the URL. Prevents a mischievous guest with dev tools from editing scores.

## 🔮 Stretch ideas

24. **Photo wall** — guests upload a selfie on join (Firebase Storage), shown on the TV during the lobby and next to their name when they buzz.
25. **Reaction emojis** — guests tap emojis that float up the TV screen during rounds (small writes, big fun).
26. **Post-event recap page** — final scores, MVP, funniest poll results, exportable as an image to share in the family group.
27. **Spectator mode** — a read-only phone view mirroring the TV for guests at the back.
28. **PWA install** — manifest + service worker so the app opens full-screen from the home screen and survives flaky venue Wi-Fi better.
29. **Multi-event support** — a `/events/{id}` state root and an event picker, turning this into a reusable party-game kit (kitchen teas, baby showers, year-end functions…).

---

### Suggested build order for the actual event

1. **Pre-event survey** (section above) — build first: it needs to go out with the invites, well before the event, and its results feed everything else.
2. Pre-loaded question banks (#1) + real names/theme (#14) — Feud rounds come straight from survey results via "Use as Feud round".
3. Lyric game content (#2) + Feud award button (#3)
4. Countdown timer (#5) + winner screen (#6)
5. Host PIN (#19) + rehearsal mode (#22)
6. Then polish from the lists above as time allows.
