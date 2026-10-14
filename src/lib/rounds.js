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
  },
  {
    question: 'Name something guests will sneak home from the wedding',
    answers: [
      { text: 'Table decor', points: 9 },
      { text: 'Leftover cake', points: 6 },
      { text: 'The flower arrangements', points: 3 },
      { text: 'An extra bottle of wine', points: 2 },
    ],
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
 * Finish-the-lyric rounds — songs chosen for maximum singalong across the
 * decades + the musicals. `snippet` is what shows on the TV (end it where
 * the guests must take over — a trailing … works well); `answer` is the
 * missing words, revealed by the host after a buzz.
 *
 * ✏️ PASTE THE LYRICS YOURSELF: each entry says which line goes where.
 * The pattern for nearly all of them: snippet = the chorus up to just
 * before its most famous line (usually the title line), answer = that
 * famous line. Delete any you don't want; on the day you just tap the
 * ones you like.
 *
 * 🎵 KARAOKE ROUNDS: prepare a track with tools/prepare_lyric_track.py
 * (song plays normally, vocals fade at the cut, backing continues), then
 * add to the entry:
 *
 *   audio: 'dancing-queen-karaoke-cut.mp3',   // filename only
 *   cutAt: 64,                                 // seconds where vocals stop
 *
 * The mp3s are NEVER committed or deployed (copyrighted audio on a public
 * site is a no-go) — keep them in a folder on the display laptop and load
 * them with one click on the TV view when prompted. On the day: tap the
 * 🎵 round, tap "▶️ Play on TV" — when the vocals drop out the TV flips to
 * the blanks + "buzz in" state automatically.
 */
export const LYRIC_ROUNDS = [
  // ---- 70s ----
  {
    song: 'Dancing Queen — ABBA (1976, also Mamma Mia!)',
    snippet: 'PASTE: the first two lines of the chorus, stopping right before the title line…',
    answer: 'PASTE: the title line',
  },
  {
    song: 'I Will Survive — Gloria Gaynor (1978)',
    snippet: 'PASTE: the chorus opening, stopping right before the title line…',
    answer: 'PASTE: the title line',
  },
  {
    song: 'Summer Nights — Grease (1978)',
    snippet: 'PASTE: the famous opening two lines, stopping before line three…',
    answer: 'PASTE: line three — bonus: make Team Melissa sing Danny, Team Calista sing Sandy',
  },

  // ---- 80s (all three double as Rock of Ages numbers) ----
  {
    song: "Livin' on a Prayer — Bon Jovi (1986, Rock of Ages)",
    snippet: 'PASTE: the pre-chorus (the halfway-there part), stopping before the title line…',
    answer: 'PASTE: the title line',
  },
  {
    song: "Don't Stop Believin' — Journey (1981, Rock of Ages)",
    snippet: 'PASTE: the famous first line of verse one, stopping halfway through line two…',
    answer: 'PASTE: the rest of line two',
  },
  {
    song: 'Total Eclipse of the Heart — Bonnie Tyler (1983, Rock of Ages)',
    snippet: 'PASTE: the two-word opening phrase plus the first full line of verse one, stopping before it resolves…',
    answer: 'PASTE: the line that resolves it',
  },

  // ---- 90s ----
  {
    song: 'Wannabe — Spice Girls (1996)',
    snippet: 'PASTE: the first line of the chorus, stopping at the end of it…',
    answer: 'PASTE: the second line of the chorus',
  },
  {
    song: 'I Want It That Way — Backstreet Boys (1999)',
    snippet: 'PASTE: the two chorus lines before the title line…',
    answer: 'PASTE: the title line',
  },

  // ---- 2000s ----
  {
    song: 'Since U Been Gone — Kelly Clarkson (2004)',
    snippet: 'PASTE: the chorus from the title line onward, stopping before the line about breathing…',
    answer: 'PASTE: the breathing line',
  },
  {
    song: 'Kaptein (Span die Seile) — Kurt Darren (2002)',
    snippet: 'PASTE: the chorus opening, stopping right before the subtitle phrase…',
    answer: 'PASTE: the subtitle phrase — the whole kitchen tea will finish this one',
  },
  {
    song: 'Breaking Free — High School Musical (2006)',
    snippet: 'PASTE: the first two chorus lines, stopping before the title line…',
    answer: 'PASTE: the title line',
  },
  {
    song: "You Can't Stop the Beat — Hairspray (2007 film)",
    snippet: 'PASTE: the run-up lines of the chorus, stopping right before the title line…',
    answer: 'PASTE: the title line',
  },

  // ---- 2010s ----
  {
    song: 'Rolling in the Deep — Adele (2010)',
    snippet: 'PASTE: the famous first line of verse one…',
    answer: 'PASTE: the second line',
  },
  {
    song: 'Shake It Off — Taylor Swift (2014)',
    snippet: 'PASTE: the chorus (players/haters lines), stopping before the title line…',
    answer: 'PASTE: the title line',
  },
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
