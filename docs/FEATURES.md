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
