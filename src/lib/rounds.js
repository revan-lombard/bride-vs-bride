import { THEME } from './theme'

/**
 * Pre-loaded content banks — everything here appears as one-tap load buttons
 * on the host panel, so nothing has to be typed or pasted under pressure on
 * the day.
 *
 * Feud boards from the pre-event survey don't live here — load those with
 * "Use as Feud round" on /#/survey-results. This bank is for extra hand-made
 * rounds (or boards you copy out of the survey results as a backup).
 */

export const FEUD_ROUNDS = [
  {
    question: 'Name something the brides will fight over in the honeymoon suite',
    answers: [
      { text: 'The bathroom mirror', points: 8 },
      { text: 'Suitcase space', points: 5 },
      { text: 'The aircon remote', points: 4 },
      { text: 'Who books the activities', points: 2 },
    ],
    // Wrong answers mixed into the phone options — without these every
    // pick is on the board and nobody can ever get a strike.
    decoys: ['The minibar', 'Which side of the bed', 'The wedding photos'],
  },
  {
    question: 'Name something guests will sneak home from the wedding',
    answers: [
      { text: 'Table decor', points: 9 },
      { text: 'Leftover cake', points: 6 },
      { text: 'The flower arrangements', points: 3 },
      { text: 'An extra bottle of wine', points: 2 },
    ],
    decoys: ['The guest book', 'A chair cover', 'The DJ'],
  },
]

export const POLL_PRESETS = [
  {
    question: 'Who said "I love you" first?',
    options: [THEME.brideA, THEME.brideB],
  },
  {
    question: 'Who is more likely to get them lost on a road trip?',
    options: [THEME.brideA, THEME.brideB],
  },
  {
    question: 'Who will cry first at the wedding?',
    options: [THEME.brideA, THEME.brideB, 'The mothers', 'Everyone at once'],
  },
]

/**
 * Lyric-game rounds — an EMOJI SONG QUIZ: the TV shows an emoji clue plus a
 * hint (artist · year), with blanks shaped like the title; guests buzz and
 * shout the song title, the host awards ✅ +5 / +10 and taps ✨ Reveal.
 * Songs chosen for maximum singalong across the decades + the musicals.
 *
 *   kind: 'emoji'  → TV header "Emoji Song Quiz", clue shown big
 *   snippet        → the emoji clue
 *   hint           → small line under the clue
 *   answer         → the title (revealed by the host)
 *
 * Why not real lyrics? They're copyrighted and this repo is public, so
 * lyric text doesn't live here. For a classic finish-the-lyric round, type
 * the line into ✍️ Manual entry on the host panel on the day (it goes to
 * the live game only, never into the code) — no `kind` = lyric style.
 *
 * 🎵 KARAOKE ROUNDS (manual entry or your own entries here): prepare a
 * track with tools/prepare_lyric_track.py (song plays normally, vocals fade
 * at the cut, backing continues) and add to the entry:
 *
 *   audio: 'dancing-queen-karaoke-cut.mp3',   // filename only
 *   cutAt: 64,                                 // seconds where vocals stop
 *
 * The mp3s are NEVER committed or deployed (copyrighted audio on a public
 * site is a no-go) — keep them in a folder on the display laptop and load
 * them with one click on the TV view when prompted.
 */
export const LYRIC_ROUNDS = [
  { kind: 'emoji', song: 'Dancing Queen — ABBA', snippet: '💃 👑', hint: 'ABBA · 1976 · also in Mamma Mia!', answer: 'Dancing Queen' },
  { kind: 'emoji', song: 'I Will Survive — Gloria Gaynor', snippet: '👁️ 📜 🏝️💪', hint: 'Gloria Gaynor · 1978 · disco anthem', answer: 'I Will Survive' },
  { kind: 'emoji', song: 'Summer Nights — Grease', snippet: '☀️🏖️ 🌙✨', hint: 'Grease · 1978 · Danny & Sandy', answer: 'Summer Nights' },
  { kind: 'emoji', song: "Livin' on a Prayer — Bon Jovi", snippet: '💓 🔛 🙏', hint: 'Bon Jovi · 1986 · Tommy & Gina', answer: "Livin' on a Prayer" },
  { kind: 'emoji', song: "Don't Stop Believin' — Journey", snippet: '🚫🛑 🙏✨', hint: 'Journey · 1981 · Glee made it huge again', answer: "Don't Stop Believin'" },
  { kind: 'emoji', song: 'Total Eclipse of the Heart — Bonnie Tyler', snippet: '💯 🌑☀️ ❤️', hint: 'Bonnie Tyler · 1983 · power ballad', answer: 'Total Eclipse of the Heart' },
  { kind: 'emoji', song: 'Wannabe — Spice Girls', snippet: '🙋‍♀️ ➡️ 🐝', hint: 'Spice Girls · 1996 · their first single', answer: 'Wannabe' },
  { kind: 'emoji', song: 'I Want It That Way — Backstreet Boys', snippet: '👁️ 🤲 👉 🛣️', hint: 'Backstreet Boys · 1999', answer: 'I Want It That Way' },
  { kind: 'emoji', song: 'Since U Been Gone — Kelly Clarkson', snippet: '⏳ 👉 🐝 👋', hint: 'Kelly Clarkson · 2004', answer: 'Since U Been Gone' },
  { kind: 'emoji', song: 'Kaptein (Span die Seile) — Kurt Darren', snippet: '👨‍✈️⛵ 🪢', hint: 'Kurt Darren · 2002 · Afrikaans dance-floor classic', answer: 'Kaptein (Span die Seile)' },
  { kind: 'emoji', song: 'Breaking Free — High School Musical', snippet: '💥 🆓', hint: 'High School Musical · 2006', answer: 'Breaking Free' },
  { kind: 'emoji', song: "You Can't Stop the Beat — Hairspray", snippet: '👉 🚫🛑 🥁', hint: 'Hairspray · 2007 film finale', answer: "You Can't Stop the Beat" },
  { kind: 'emoji', song: 'Rolling in the Deep — Adele', snippet: '🎳 ⤵️ 🌊', hint: 'Adele · 2010', answer: 'Rolling in the Deep' },
  { kind: 'emoji', song: 'Shake It Off — Taylor Swift', snippet: '🥤 👉 📴', hint: 'Taylor Swift · 2014', answer: 'Shake It Off' },
]

/**
 * 🎶 Noot vir Noot — guess-the-song rounds. A clip plays on the TV, the
 * buzz winner picks the title on their phone; a hit auto-awards `points`,
 * a miss greys that option out for the next buzzer. Options are shuffled
 * on load, so listing the correct one first here is fine.
 *
 * Audio uses the same local-folder loader as the karaoke rounds — drop the
 * mp3s in the music folder on the display laptop and set `audio` to the
 * filename, with clipStart/clipEnd in seconds (clipEnd 0 = play until the
 * host stops it). No audio prep script needed — original tracks work as-is.
 * ✏️ Swap in your own songs/decoys; double-check titles and artists.
 */
export const NOOT_ROUNDS = [
  {
    song: 'Loslappie — Kurt Darren',
    correct: 'Loslappie — Kurt Darren',
    options: [
      'Loslappie — Kurt Darren',
      'Kaptein — Kurt Darren',
      'Sê Net Ja — Kurt Darren',
      'Hasie — Kurt Darren',
    ],
    audio: '', // e.g. 'loslappie.mp3'
    clipStart: 0,
    clipEnd: 0,
    points: 10,
  },
  {
    song: 'De La Rey — Bok van Blerk',
    correct: 'De La Rey — Bok van Blerk',
    options: [
      'De La Rey — Bok van Blerk',
      'Afrikanerhart — Bok van Blerk',
      'Kaplyn — Bok van Blerk',
      'Tyd om te Trek — Bok van Blerk',
    ],
    audio: '',
    clipStart: 0,
    clipEnd: 0,
    points: 10,
  },
  {
    song: 'Lisa se Klavier — Koos Kombuis',
    correct: 'Lisa se Klavier — Koos Kombuis',
    options: [
      'Lisa se Klavier — Koos Kombuis',
      'Kinders van die Wind — Koos du Plessis',
      'Blou — Valiant Swart',
      'Sonvanger — Valiant Swart',
    ],
    audio: '',
    clipStart: 0,
    clipEnd: 0,
    points: 10,
  },
  {
    song: 'Pampoen — Steve Hofmeyr',
    correct: 'Pampoen — Steve Hofmeyr',
    options: [
      'Pampoen — Steve Hofmeyr',
      'Agter Elke Man — Steve Hofmeyr',
      'Toeka — Steve Hofmeyr',
      'Windpomp — ander een',
    ],
    audio: '',
    clipStart: 0,
    clipEnd: 0,
    points: 10,
  },
]

/**
 * Gift Bingo words — each guest's card gets 24 of these at random, and the
 * host taps each one as the bride opens it. Swap in whatever fits your gift
 * table; keep them short (they have to fit a phone square) and have at
 * least 24. The more words, the longer a game lasts.
 */
export const GIFT_WORDS = [
  'Tea towels', 'Apron', 'Oven gloves', 'Wooden spoons', 'Whisk', 'Spatula',
  'Mixing bowls', 'Measuring cups', 'Rolling pin', 'Grater', 'Colander',
  'Cake tin', 'Baking tray', 'Frying pan', 'Pots', 'Potjie', 'Knife set',
  'Cutting board', 'Cheese board', 'Braai tongs', 'Tupperware', 'Storage jars',
  'Spice rack', 'Salt & pepper', 'Recipe book', 'Kettle', 'Toaster', 'Blender',
  'Air fryer', 'Coffee machine', 'Teapot', 'Mugs', 'Wine glasses',
  'Champagne flutes', 'Dinner set', 'Cutlery set', 'Serving platter',
  'Salad bowl', 'Placemats', 'Ice trays', 'Candles', 'Wine', 'Gift voucher',
  'Kitchen scale',
]

/**
 * Bride Knows Best (Newlywed game) — two kinds of round:
 *
 *  kind 'bride':   both brides answer secretly on their phones (or the host
 *                  enters it); each team predicts what THEIR bride picked.
 *  kind 'whosaid': a quote or "who is more likely to…" with a known answer
 *                  ('A' = brideA, 'B' = brideB); everyone votes.
 *
 * Teams score up to `points` by the share of their guessers who got it
 * right (fair with uneven teams); each correct guesser earns MVP points.
 * Placeholders — swap in the real questions and quotes.
 */
export const NEWLYWED_ROUNDS = [
  {
    kind: 'bride',
    question: 'Dream honeymoon destination',
    options: ['Mauritius', 'Paris', 'Bali', 'A game lodge', 'Road trip'],
  },
  {
    kind: 'bride',
    question: 'Perfect date night',
    options: ['Fancy dinner', 'Couch + movie', 'Wine farm', 'Hike + picnic'],
  },
  {
    kind: 'bride',
    question: 'Who does the dishes?',
    options: [THEME.brideA, THEME.brideB, 'Nobody — paper plates', 'The dishwasher'],
  },
  {
    kind: 'bride',
    question: 'First thing she notices about someone',
    options: ['Smile', 'Eyes', 'Shoes', 'Sense of humour'],
  },
  {
    kind: 'whosaid',
    question: 'PASTE: a quote one of the brides actually said',
    answer: 'A',
  },
  {
    kind: 'whosaid',
    question: 'Who is more likely to cry at the vows?',
    answer: 'B',
  },
]

/**
 * The evening's order for the host's ▶ Next button. Each step switches to
 * `game` and loads one item from the banks above (by position, counting
 * from 0), so the host never hunts for content mid-show:
 *
 *   feud: 0        → FEUD_ROUNDS[0]          poll: 1   → POLL_PRESETS[1]
 *   lyric: 2       → LYRIC_ROUNDS[2]         noot: 0   → NOOT_ROUNDS[0]
 *   newlywed: 3    → NEWLYWED_ROUNDS[3]
 *   bingo: { mode: 'gifts' | 'numbers', pattern: 'line' | 'twoLines' | 'corners' | 'full' }
 *   (CHEER, LOBBY and WINNER need nothing loaded)
 *
 * `note` is the host's cue for that step. Reorder, delete or repeat steps
 * freely; steps whose content is still a PASTE: placeholder switch game but
 * load nothing (use ✍️ Manual entry there).
 */
export const RUN_SHEET = [
  { game: 'LOBBY', note: 'Welcome everyone — get them scanning the QR code. Check the team counts in 👥.' },
  { game: 'CHEER', note: 'Warm-up! Tap Start, then hype the room for 10 seconds.' },
  { game: 'FEUD', feud: 0, note: 'Read the question out, then Arm buzzers. Re-arm after each guess.' },
  { game: 'NEWLYWED', newlywed: 0, note: 'Brides answer secretly (👰 marked in players). Reveal once both are 🔒.' },
  { game: 'POLL', poll: 0, note: 'Give them ~20s (⏱ timer), Close voting, then 📊 Show results.' },
  { game: 'BINGO', bingo: { mode: 'gifts', pattern: 'line' }, note: 'Gift Bingo while the presents are opened — tap each gift on the grid.' },
  { game: 'FEUD', feud: 1, note: 'Second Feud board. Arm buzzers after reading the question.' },
  { game: 'NEWLYWED', newlywed: 1, note: 'Another secret bride answer.' },
  { game: 'NEWLYWED', newlywed: 5, note: 'Who said it? — everyone votes, then Reveal.' },
  { game: 'LYRIC', lyric: 0, note: 'Emoji Song Quiz: arm buzzers — the winner shouts the title. ✅ +5 / +10, then ✨ Reveal. Load the next song from the Lyric bank (13 more).' },
  { game: 'NOOT', noot: 0, note: 'Play the clip, arm buzzers — the winner picks the song.' },
  { game: 'CHEER', note: 'Final showdown! Last chance to catch up.' },
  { game: 'BINGO', bingo: { mode: 'numbers', pattern: 'full' }, note: 'Number bingo for a full house — try ⏩ Auto-draw.' },
  { game: 'WINNER', note: 'The big reveal: team winner, then the MVP. Thank everyone! 🥂' },
]
