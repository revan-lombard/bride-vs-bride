# 💍 Bride vs. Bride

A real-time multi-game web app for a bridal kitchen tea. Guests scan a QR code and use their phones as buzzers and voting pads; the host runs the show from a control panel; a TV/projector shows the live board.

## The screens

| Route | Who | What |
|---|---|---|
| `/#/` | Guests | Join a team, buzz, vote |
| `/#/host` | Host | Switch games, arm buzzers, run polls/feud rounds, edit scores, fire sound cues |
| `/#/display` | TV / projector | Scoreboard, Feud board, poll results, buzz alerts (16:9) |
| `/#/survey` | Invitees (pre-event) | Multiple-choice survey sent with the invites — answers build the Feud boards |
| `/#/survey-results` | Host | Live survey tallies, open/close toggle, one-tap "Use as Feud round" |

Games: **LOBBY** (join screen), **FEUD** (Family Feud board with reveals + strikes), **POLL** (live voting with animated results), **LYRIC** (finish-the-lyric buzzer round), **NOOT** (Noot vir Noot guess-the-song), **BINGO** (Bridal Bingo with a tumbler on the TV), **NEWLYWED** (Bride Knows Best: secret bride answers + who-said-it), **CHEER** (10-second tapping tug-of-war), **WINNER** (final standings, MVP reveal + confetti).

## Stack

- **React 19 + Vite 6 + Tailwind CSS 4** — static build, hosted free on GitHub Pages
- **Firebase Realtime Database** — sub-100ms state sync (buzzer races resolved with a transaction, so the first tap always wins)
- **HashRouter** — so deep links work on GitHub Pages without server rewrites

## Firebase setup (once)

1. Create a free project at [console.firebase.google.com](https://console.firebase.google.com) (Spark plan is plenty).
2. **Build → Realtime Database → Create database.** Choose the closest region (`europe-west1` for South Africa).
3. Paste the rules from [`docs/firebase-rules.json`](docs/firebase-rules.json) into the Rules tab and publish.
4. **Project settings → Your apps → Add web app.** Copy the config values.
5. Locally: `cp .env.example .env.local` and fill in the values.
6. For deploys: add the same five values as **repository secrets** on GitHub (Settings → Secrets and variables → Actions): `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_DATABASE_URL`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`.

> Firebase web keys are identifiers, not secrets — access control is done by the database rules. Keeping them in secrets just keeps the repo tidy and lets you swap projects without code changes.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173/bride-vs-bride/` — add `#/host` or `#/display` for the other views. Open multiple tabs (or your phone on the same Wi-Fi) to test the sync.

## Deploy

Push to `main`. The GitHub Actions workflow builds and publishes to GitHub Pages automatically. One-time setup: repo **Settings → Pages → Source → GitHub Actions**.

Live URL: **https://revan-lombard.github.io/bride-vs-bride/** (guests `#/`, host `#/host`, TV `#/display`)

## Pre-event survey

1. Edit `src/lib/surveyQuestions.js` with the real questions (4–6 fixed options each) and push.
2. Send `/#/survey` out with the invites — it's themed as a teaser and never links to the game views.
3. Watch responses roll in live at `/#/survey-results`. One response set per device; names optional.
4. Before the event, tap **Close** on the results page so late submissions can't change locked-in boards.
5. On the day, tap **Use as Feud round** on any question — vote counts become the board (points = votes), then switch to FEUD on the host panel.

## 🎶 Emoji Song Quiz (the Lyric game)

The Lyric game's bank holds 14 real singalong songs as **emoji clues** (💃 👑 + "ABBA · 1976" → *Dancing Queen*). The TV shows the clue, the hint and blanks shaped like the title. Arm buzzers, the buzz winner shouts the title, award it with **✅ +5 / +10**, then **✨ Reveal answer**. The songs and clues are in `LYRIC_ROUNDS` in `src/lib/rounds.js`.

Real lyrics aren't stored in the repo, because they're copyrighted and the repo is public. For a classic finish-the-lyric round, type the line into ✍️ **Manual entry** on the day. It only goes to the live game, never into the code.

## 💌 Messages for the brides

Every phone has a 💌 button, and the lobby and end-of-show screens nudge people to use it. Guests write a message (to Melissa, to Calista, or to both), sign it, and can send as many as they like. The TV lobby shows a running count, but never the messages themselves.

- **Kept safe:** messages are stored at their own `messages` path, so **Reset everything never deletes them**. The rules let guests add messages but not edit anyone's message, with a 600-character limit.
- **Collect them:** tap **💌 N** at the top of the host panel, or open `/#/messages` (same PIN). It lists every message live. **Remove** deletes one you don't want. **⬇️ Keepsake page** downloads a pretty printable page (open it, then Print → Save as PDF to send the brides), and there's also **⬇️ Text file** and **📋 Copy all**.
- **Rehearsal mode** messages are kept separately, so practice messages never mix with the real ones.

> **One-time:** re-publish `docs/firebase-rules.json` in the Firebase console — it now includes the `messages` section. Until you do, sending a message fails ("Couldn't send").

## Karaoke lyric rounds

The Lyric game can play the actual song: the track plays with vocals, the vocals fade out at your chosen moment, the backing continues, and the TV flips to word-shaped blanks + "buzz in".

1. **Prepare each track** (once, before the event): `pip install demucs`, then
   `python tools/prepare_lyric_track.py song.mp3 --cut 1:04` — it prints the `audio:` and `cutAt:` lines to paste into that song's entry in `src/lib/rounds.js`.
2. **Keep the mp3s in a folder on the display laptop** — they are never committed or deployed (copyrighted audio must not go on a public site). `.gitignore` blocks mp3s as a safety net.
3. **On the day**: the first karaoke round shows a "load the music folder" button on the TV — click it once and select all the prepared mp3s. From then on the host's ▶️ Play on TV button runs each round end-to-end.

## Bridal Bingo

75-ball bingo with the columns spelled **B-R-I-D-E**. Every phone gets its own 5×5 card (💍 free centre square).

1. Switch to **BINGO** on the host panel, pick the pattern (One line / Two lines / Four corners / Full house) and tap **Deal cards & start**.
2. Tap **🎱 Draw ball** (or turn on **Auto-draw**, a ball every 12s — keep the host screen awake). The TV tumbler spins, rattles and drops the ball, with its bingo call underneath; phones show "just called" at the same moment.
3. Guests tap the numbers on their own card. Only numbers that were really called will mark — tap too early and the square shakes. If they miss one, it's on them!
4. When their marked squares complete the pattern, the **BINGO!** button lights up. The first claim wins: the TV goes full-screen with their card, confetti and applause, and the pattern's points go to their team automatically.
5. Tap **Continue for Full house** (etc.) to keep playing the same cards for a bigger pattern, or **New cards** to deal again.

Pattern points are in `PATTERNS` in `src/lib/bingo.js`.

### Gift Bingo (the kitchen-tea classic)

Pick **🎁 Gifts** before dealing. Cards hold 24 gift words (Tea towels, Air fryer, Braai tongs…) instead of numbers. While the bride opens presents, tap each gift on the host panel's word grid as it comes out. Tap it again to undo a mis-tap. The TV shows "🎁 Just opened: Air fryer" with a sparkle sound and lights the word up on a board of all gifts. Guests mark their own cards exactly like number bingo. Gifts keep counting while a winner is on screen, because the unwrapping doesn't stop. Edit the word list (`GIFT_WORDS` in `src/lib/rounds.js`) to match what's likely on the gift table. Keep the words short and have at least 24.

## Sound effects

Everything is synthesized in the browser (`src/lib/sounds.js`) — no audio files. The TV plays sounds automatically from game events: game switches (whoosh + title splash), buzzes, Feud reveals and strikes, Noot answers, lyric reveals, poll result drumrolls, score changes (with an animated count-up), the timer's last five seconds and a horn at zero, the bingo tumbler and ball drop, bingo wins and the winner screen's applause. The host's soundboard has extras (drumroll, applause, horn…). Phones play quiet tap sounds and vibrate (Android) for their own buzzes, votes and bingo marks; each device has a 🔊/🔇 toggle.

## Rehearsal mode

Add `?rehearsal=1` to any game URL (e.g. `#/host?rehearsal=1`, `#/display?rehearsal=1`), or tap **🧪 Switch to rehearsal** under ⚙️ Setup on the host panel. Everything — scores, buzzers, roster, bingo — then runs against a separate `/game-test` copy, so the live game is never touched. An amber "REHEARSAL" strip shows on every screen, the QR code automatically points guests at the rehearsal, and the mode sticks for that browser tab until you switch back.

> **One-time:** re-publish the rules from `docs/firebase-rules.json` in the Firebase console — they now include the `game-test` path. Without it rehearsal writes are refused.

## Bride Knows Best (Newlywed + Who said it?)

1. **Mark the brides:** on the host panel open 👥 players and tap 👰 on Melissa's phone (once = Melissa, twice = Calista, three times = back to a normal guest).
2. Switch to **NEWLYWED** and tap a round from the bank (`NEWLYWED_ROUNDS` in `src/lib/rounds.js`, or ✍️ Manual entry).
3. **💑 Bride rounds:** each bride's phone shows a 🤫 secret-answer pad. Everyone else sees "What did *your* bride pick?" and guesses. The TV shows 🔒 as each bride locks in. If a bride has no phone, the host can enter her answer ("Enter her answer for her").
4. **🗨️ Who said it?:** a quote (or "Who is more likely to…?"). Everyone votes Melissa or Calista. If the bank entry has no answer, the host taps "It was Melissa / Calista" to reveal.
5. **✨ Reveal & score:** each team earns up to 10 points scaled by the *share* of its guessers who got it right (fair with uneven teams). Each correct guesser earns 5 personal points.

## 📋 Run sheet (the host's ▶ Next button)

The top of the host panel shows the evening in order. **▶ Start the show / ▶ Next** switches to the next game *and* loads its content in one tap: the Feud board, the poll, the bride question, the bingo deal. A 💡 cue tells you what to do on that step. Open **All steps** to see your progress (✓) or **Go** to any step. Your place is saved in the database, so reloading the host page or using a second device keeps it. The game buttons below still work for going off-script.

Edit the order in `RUN_SHEET` at the bottom of `src/lib/rounds.js`. Each step names a game and which bank item to load (`feud: 0` = the first Feud round, `bingo: { mode: 'gifts', pattern: 'line' }`, …) plus an optional `note`. Steps whose content is still a `PASTE:` placeholder switch to that game but load nothing ("✏️ needs content"), so use ✍️ Manual entry there.

## 📊 Round recaps

When you switch away from a game where points changed, the TV shows a recap for about 7 seconds before the next game's title:
- what each team won that round, plus the totals
- who's leading, and by how much
- ⭐ the star of the round (biggest personal gain) and 🌟 the MVP so far
- "Up next: …"

Phones get a quick toast at the same time ("Your team +12 · you +5 ⭐ — you're leading by 3!"). Switching away from a round where nobody scored skips the recap, and so does switching to the 🏆 Winner screen, which has its own reveal. Want the standings mid-game? Tap **📊 Show scoreboard check on the TV** under Scores on the host panel.

## 🪢 Cheer-off (tug-of-war)

Switch to **Cheer-off** and tap **Start**. The TV and phones count down 3-2-1, then for **10 seconds** every phone is one giant button in its team colour. Everyone taps as fast as they can and a 💍 on a rope swings towards the team that's pulling harder. The winner gets **10 points** (a tie splits them), and the top tapper gets 5 MVP points and a shout-out on the TV.

- **Fair with uneven teams:** the rope and the result use *average taps per player*, so 4 keen aunts can beat 7 lazy cousins.
- **No auto-clickers:** each phone counts at most 15 taps a second.
- **Same beat on every phone:** all devices use Firebase's server clock, so nobody's phone starts early.
- **Settings:** length and points are in `src/lib/cheer.js`. The round scores itself after the buzzer (host panel or TV, whichever is awake), and a **Finish now** button appears if it ever stalls.

## MVP & personal points

Every guest now has personal points, shown as ⭐ in their phone header and in the host roster. They come from correct Feud picks, Noot vir Noot songs, bingo wins, Bride Knows Best guesses, and Lyric answers. For Lyric, tap **✅ +5 / +10 to {name}** when the buzz winner gets it right. This also awards their team, so you don't need the score buttons.

The **🏆 WINNER** screen reveals the result in three beats: the winning team, then a 🥁 drumroll "And your MVP is…", then the MVP with the runners-up, **⚡ Fastest Finger** (most buzz wins) and **📣 Hype Queen** (most emoji reactions).

## Install & offline

- **Add to home screen:** Android/Chrome shows a **📲 Add to home screen** button on the join screen (and under ⚙️ Setup on the host panel). iPhones show the Share → Add to Home Screen tip. Installed, it opens full-screen with no browser bars.
- **Offline app shell:** a service worker keeps the app's files on each device, so a page reload during a Wi-Fi blip still opens the app (it then shows "Reconnecting…" until the network returns). Live game data still needs a connection.
- **Screens stay awake:** phones, the host panel and the TV ask the browser to keep the screen on while open. A sleeping phone drops its connection and a sleeping host stops bingo auto-draw.

## Emoji reactions

Phones have a row of emojis along the bottom (😂 ❤️ 🎉 👏 😱 🔥 💍 🥂). Each tap floats up the TV with the guest's name: Team A's from the left half, Team B's from the right. Taps are limited to one every 0.6s per phone, and the TV shows at most 50 at once. The host can switch reactions off (and back on) under **Emoji reactions**, e.g. during a serious moment.

> **One-time:** reactions live at their own `reactions` path, so re-publish `docs/firebase-rules.json` in the Firebase console (it now includes `reactions` as well as `game-test`).

## Players & connection

- **Roster:** the host panel shows who's joined (👥 N online, per team). Tap ✏️ to fix a name, ⇄ to switch team, ✕ to remove someone (their phone goes back to the join screen). Changes apply on the guest's phone instantly. Grey dot = phone asleep or left; ⚠️ flags two players with the same name.
- **Lobby:** the TV lists everyone who's joined under each team as they arrive.
- **Reconnecting:** if a phone loses connection, its screen is covered with "Reconnecting…" so nobody hammers a dead buzzer; after 12s it offers a Refresh button (team and bingo card survive). The TV and host panel show a small red "offline" pill instead.

## Running the show (day-of checklist)

1. Open `/#/display` on the TV and **click the page once** — a yellow "click to turn on sound" prompt shows until you do (browsers block audio until then).
2. Open `/#/host` on your phone/laptop and work down the **📋 Run sheet** with ▶ Next. (Practising beforehand? Use rehearsal mode — see above.)
3. Guests scan the QR code shown in the LOBBY screen (or from the host panel).
4. Switch games from the host panel — every phone follows automatically.
5. **Feud rounds:** load a round (survey results page, content bank, or paste `Question` + `answer | points` lines), then arm the buzzers. Guests see the question + options on their phones; the buzz winner picks on their phone and the board auto-reveals a hit (or auto-strikes a miss) with the sound cue. Re-arm for the next guess; award the revealed total with the 🏆 buttons. Manual tap-to-reveal and ✕ buttons still work as an override.
   - **Steal:** the 3rd strike hands the board to the *other* team: the TV shows "🦹 STEAL!" with the points at stake, and after you arm the buzzers only their phones can buzz, for **one** guess. A hit takes the round: the defenders' points from this board move over, plus the new answer's points. A miss means the defenders keep everything. Afterwards, **✨ Reveal the rest of the board** shows the remaining answers without scoring them. (Added strikes by hand with the ✕ buttons? Use **🦹 Start steal** on the host panel.)
6. **Polls:** type a question + options, open, then "Show results" for the big reveal.
7. **Buzzer rounds (Feud face-offs / Lyric):** tap "Arm buzzers" — first phone to tap takes over the TV. Award points, re-arm, repeat.
8. If anything goes weird: "Reset everything" puts the state back to defaults (scores included — edit scores back manually if needed).

## Project layout

```
src/
  lib/
    firebase.js        Firebase init (env-driven)
    schema.js          Canonical state shape, teams, player persistence
    gameActions.js     Every read/write to shared game state (host + guest)
    surveyQuestions.js Pre-event survey content — EDIT with the real questions
    surveyActions.js   Survey reads/writes (/survey root), tally + Feud converter
    theme.js           Brides' names + event title — EDIT with the real names
    rounds.js          Pre-loaded Feud/poll/lyric content banks — EDIT before the event
    sounds.js          WebAudio synth cues (no audio files)
  hooks/
    useGameState.js    Live /game subscription all game views render from
    useSurvey.js       Live /survey subscription for the survey views
  views/
    GuestView.jsx         Join screen, buzzer pad, vote pad
    HostView.jsx          Control panel
    DisplayView.jsx       TV board
    SurveyView.jsx        Invitee pre-event survey
    SurveyResultsView.jsx Host tally + "Use as Feud round"
docs/
  firebase-rules.json  Database security rules
  FEATURES.md          Roadmap of potential features & enhancements
```
