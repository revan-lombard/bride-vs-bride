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

Games: **LOBBY** (join screen), **FEUD** (Family Feud board with reveals + strikes), **POLL** (live voting with animated results), **LYRIC** (finish-the-lyric buzzer round).

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

Live URL: `https://<your-username>.github.io/bride-vs-bride/`

## Pre-event survey

1. Edit `src/lib/surveyQuestions.js` with the real questions (4–6 fixed options each) and push.
2. Send `/#/survey` out with the invites — it's themed as a teaser and never links to the game views.
3. Watch responses roll in live at `/#/survey-results`. One response set per device; names optional.
4. Before the event, tap **Close** on the results page so late submissions can't change locked-in boards.
5. On the day, tap **Use as Feud round** on any question — vote counts become the board (points = votes), then switch to FEUD on the host panel.

## Karaoke lyric rounds

The Lyric game can play the actual song: the track plays with vocals, the vocals fade out at your chosen moment, the backing continues, and the TV flips to word-shaped blanks + "buzz in".

1. **Prepare each track** (once, before the event): `pip install demucs`, then
   `python tools/prepare_lyric_track.py song.mp3 --cut 1:04` — it prints the `audio:` and `cutAt:` lines to paste into that song's entry in `src/lib/rounds.js`.
2. **Keep the mp3s in a folder on the display laptop** — they are never committed or deployed (copyrighted audio must not go on a public site). `.gitignore` blocks mp3s as a safety net.
3. **On the day**: the first karaoke round shows a "load the music folder" button on the TV — click it once and select all the prepared mp3s. From then on the host's ▶️ Play on TV button runs each round end-to-end.

## Running the show (day-of checklist)

1. Open `/#/display` on the TV and **click the page once** (unlocks browser audio for sound cues).
2. Open `/#/host` on your phone/laptop.
3. Guests scan the QR code shown in the LOBBY screen (or from the host panel).
4. Switch games from the host panel — every phone follows automatically.
5. **Feud rounds:** paste a round into the host panel as `Question` on line 1, then `answer | points` per line. Tap answers to reveal, tap ✕ for strikes.
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
