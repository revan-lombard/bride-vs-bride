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

/**
 * Family Feud boards — kitchen-tea / wedding themed. Each has 5 answers
 * (highest first, like the real board) and 2 decoys: plausible wrong
 * answers mixed into the phone options so strikes and steals happen.
 *
 * ⚠️ The point values are our ESTIMATES of how 50 people would answer, not
 * survey data — scaled so a full board (~50) outweighs the 10-point games
 * without drowning them out. For real numbers, run the pre-event survey and tap "Use as
 * Feud round" on /#/survey-results — or edit the points here.
 */
export const FEUD_ROUNDS = [
  {
    question: 'Name something the brides will fight over in the honeymoon suite',
    answers: [
      { text: 'The bathroom mirror', points: 15 },
      { text: 'The aircon remote', points: 12 },
      { text: 'Suitcase space', points: 9 },
      { text: 'Which side of the bed', points: 8 },
      { text: 'Who books the activities', points: 4 },
    ],
    decoys: ['The minibar', 'The wedding photos'],
  },
  {
    question: 'Name something guests sneak home from a wedding',
    answers: [
      { text: 'Table decor', points: 16 },
      { text: 'Leftover cake', points: 12 },
      { text: 'The flowers', points: 9 },
      { text: 'A bottle of wine', points: 6 },
      { text: 'Their name card', points: 3 },
    ],
    decoys: ['The guest book', 'A chair cover'],
  },
  {
    question: 'Name something every kitchen tea gift table has',
    answers: [
      { text: 'Tea towels', points: 16 },
      { text: 'Wine glasses', points: 11 },
      { text: 'Tupperware', points: 9 },
      { text: 'A kettle', points: 6 },
      { text: 'Wooden spoons', points: 4 },
    ],
    decoys: ['A toolbox', 'A fishing rod'],
  },
  {
    question: 'Name something a bride does the night before her wedding',
    answers: [
      { text: 'Can\'t sleep', points: 15 },
      { text: 'Face mask / skincare', points: 11 },
      { text: 'Cries', points: 8 },
      { text: 'Checks the to-do list again', points: 7 },
      { text: 'Has a glass of wine', points: 5 },
    ],
    decoys: ['Goes for a run', 'Watches rugby'],
  },
  {
    question: 'Name something that can go wrong at a wedding',
    answers: [
      { text: 'Rain', points: 15 },
      { text: 'Someone arrives late', points: 11 },
      { text: 'The music / DJ', points: 8 },
      { text: 'A wardrobe malfunction', points: 6 },
      { text: 'A guest has too much to drink', points: 4 },
    ],
    decoys: ['The flowers wilt', 'The speeches run too long'],
  },
  {
    question: 'Name a popular honeymoon destination',
    answers: [
      { text: 'Mauritius', points: 16 },
      { text: 'Bali', points: 10 },
      { text: 'Zanzibar', points: 8 },
      { text: 'Paris', points: 6 },
      { text: 'Seychelles', points: 5 },
    ],
    decoys: ['Maldives', 'Cape Town'],
  },
  {
    question: 'Name something in a bride\'s emergency kit',
    answers: [
      { text: 'Safety pins', points: 15 },
      { text: 'Tissues', points: 11 },
      { text: 'Plasters', points: 8 },
      { text: 'Painkillers', points: 6 },
      { text: 'Lipstick', points: 5 },
    ],
    decoys: ['Hairspray', 'Deodorant'],
  },
  {
    question: 'Name a reason a wedding speech goes wrong',
    answers: [
      { text: 'It\'s too long', points: 17 },
      { text: 'Embarrassing stories', points: 12 },
      { text: 'The speaker is tipsy', points: 9 },
      { text: 'They forget what to say', points: 6 },
      { text: 'The mic doesn\'t work', points: 4 },
    ],
    decoys: ['They get the names wrong', 'They cry all the way through'],
  },
  {
    question: 'Name something you need for a perfect braai',
    answers: [
      { text: 'Boerewors / meat', points: 17 },
      { text: 'Charcoal or wood', points: 11 },
      { text: 'Firelighters', points: 7 },
      { text: 'Tongs', points: 6 },
      { text: 'Cold drinks', points: 4 },
    ],
    decoys: ['Pap', 'A potato salad'],
  },
  {
    question: 'Name something people do on the dance floor at a wedding',
    answers: [
      { text: 'Sokkie / langarm', points: 13 },
      { text: 'A conga line', points: 11 },
      { text: 'Dad dancing', points: 9 },
      { text: 'Take their shoes off', points: 8 },
      { text: 'Sing along loudly', points: 5 },
    ],
    decoys: ['The limbo', 'The Macarena'],
  },
  {
    question: 'Name a chore newlyweds will argue about',
    answers: [
      { text: 'Dishes', points: 15 },
      { text: 'Laundry', points: 12 },
      { text: 'Taking out the rubbish', points: 9 },
      { text: 'Cooking', points: 7 },
      { text: 'Making the bed', points: 4 },
    ],
    decoys: ['Ironing', 'Walking the dog'],
  },
  {
    question: 'Name something you need for the perfect date night',
    answers: [
      { text: 'Good food', points: 14 },
      { text: 'Wine', points: 12 },
      { text: 'A movie', points: 8 },
      { text: 'Candles', points: 6 },
      { text: 'Dessert', points: 5 },
    ],
    decoys: ['Flowers', 'A board game'],
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
 * 🎶 Noot vir Noot — guess-the-song rounds. The song plays, the buzz winner
 * picks the title on their phone; a hit auto-awards `points` (default 10),
 * a miss greys that option out for the next buzzer. Options are shuffled
 * on load, so listing the correct one first here is fine.
 *
 * Two ways to play the music:
 *  - 📱 From your phone (no prep): leave `audio: ''`. Play the song on
 *    Spotify/YouTube through a speaker and tap "🎧 Playing from my phone" —
 *    the TV shows "Luister…" while it plays.
 *  - 💻 From the TV laptop: drop the mp3s in the music folder on the display
 *    laptop and set `audio` to the filename, plus clipStart/clipEnd in
 *    seconds (clipEnd 0 = play until the host stops it). The mp3s are never
 *    committed — copyrighted audio stays off the public site.
 *
 * The "Which ABBA/Queen/… song is it?" rounds use one artist's hits as the
 * options, so recognising the voice isn't enough — you need the title.
 */
export const NOOT_ROUNDS = [
  {
    song: 'De la Rey — Bok van Blerk',
    prompt: 'Raai die liedjie! 🎶',
    correct: 'De la Rey — Bok van Blerk',
    options: ['De la Rey — Bok van Blerk', 'Afrikaners is Plesierig — Bok van Blerk', 'Kaptein (Span die Seile) — Kurt Darren', 'Hie\' Kommie Bokke — Kurt Darren'],
    audio: '',
  },
  {
    song: 'Kaptein (Span die Seile) — Kurt Darren',
    prompt: 'Raai die liedjie! 🎶',
    correct: 'Kaptein (Span die Seile) — Kurt Darren',
    options: ['Kaptein (Span die Seile) — Kurt Darren', 'Hie\' Kommie Bokke — Kurt Darren', 'De la Rey — Bok van Blerk', 'Afrikaners is Plesierig — Bok van Blerk'],
    audio: '',
  },
  {
    song: 'Lisa se Klavier — Koos Kombuis',
    prompt: 'Raai die liedjie! 🎶',
    correct: 'Lisa se Klavier — Koos Kombuis',
    options: ['Lisa se Klavier — Koos Kombuis', 'Kinders van die Wind — Laurika Rauch', 'Suikerbossie — Volksliedjie', 'Sarie Marais — Volksliedjie'],
    audio: '',
  },
  {
    song: 'Suikerbossie — Volksliedjie',
    prompt: 'Sing saam! Watter volksliedjie is dit? 🎶',
    correct: 'Suikerbossie — Volksliedjie',
    options: ['Suikerbossie — Volksliedjie', 'Sarie Marais — Volksliedjie', 'Jan Pierewiet — Volksliedjie', 'Bobbejaan Klim die Berg — Volksliedjie'],
    audio: '',
  },
  {
    song: 'Jerusalema — Master KG',
    prompt: 'Name that tune! 🇿🇦',
    correct: 'Jerusalema — Master KG',
    options: ['Jerusalema — Master KG', 'Pata Pata — Miriam Makeba', 'Weekend Special — Brenda Fassie', 'Vulindlela — Brenda Fassie'],
    audio: '',
  },
  {
    song: 'Vulindlela — Brenda Fassie',
    prompt: 'Name that tune! 💒',
    correct: 'Vulindlela — Brenda Fassie',
    options: ['Vulindlela — Brenda Fassie', 'Weekend Special — Brenda Fassie', 'Pata Pata — Miriam Makeba', 'Impi — Johnny Clegg'],
    audio: '',
  },
  {
    song: 'Impi — Johnny Clegg',
    prompt: 'Name that tune! 🇿🇦',
    correct: 'Impi — Johnny Clegg',
    options: ['Impi — Johnny Clegg', 'Scatterlings of Africa — Johnny Clegg', 'Shosholoza — Traditional', 'Jerusalema — Master KG'],
    audio: '',
  },
  {
    song: 'Mamma Mia — ABBA',
    prompt: 'Which ABBA song is it? 🪩',
    correct: 'Mamma Mia — ABBA',
    options: ['Mamma Mia — ABBA', 'Dancing Queen — ABBA', 'Waterloo — ABBA', 'Gimme! Gimme! Gimme! — ABBA'],
    audio: '',
  },
  {
    song: 'I Wanna Dance with Somebody — Whitney Houston',
    prompt: 'Which Whitney song is it? 🎤',
    correct: 'I Wanna Dance with Somebody — Whitney Houston',
    options: ['I Wanna Dance with Somebody — Whitney Houston', 'I Will Always Love You — Whitney Houston', 'How Will I Know — Whitney Houston', 'Greatest Love of All — Whitney Houston'],
    audio: '',
  },
  {
    song: 'Don\'t Stop Me Now — Queen',
    prompt: 'Which Queen song is it? 👑',
    correct: 'Don\'t Stop Me Now — Queen',
    options: ['Don\'t Stop Me Now — Queen', 'Bohemian Rhapsody — Queen', 'We Will Rock You — Queen', 'Another One Bites the Dust — Queen'],
    audio: '',
  },
  {
    song: 'Marry You — Bruno Mars',
    prompt: 'Which Bruno Mars song is it? 💍',
    correct: 'Marry You — Bruno Mars',
    options: ['Marry You — Bruno Mars', 'Just the Way You Are — Bruno Mars', 'Locked Out of Heaven — Bruno Mars', 'Uptown Funk — Mark Ronson ft. Bruno Mars'],
    audio: '',
  },
  {
    song: 'Single Ladies (Put a Ring on It) — Beyoncé',
    prompt: 'Which Beyoncé song is it? 💍',
    correct: 'Single Ladies (Put a Ring on It) — Beyoncé',
    options: ['Single Ladies (Put a Ring on It) — Beyoncé', 'Crazy in Love — Beyoncé', 'Halo — Beyoncé', 'Love On Top — Beyoncé'],
    audio: '',
  },
  {
    song: 'Love Story — Taylor Swift',
    prompt: 'Which Taylor Swift song is it? 💌',
    correct: 'Love Story — Taylor Swift',
    options: ['Love Story — Taylor Swift', 'You Belong with Me — Taylor Swift', 'Blank Space — Taylor Swift', 'Shake It Off — Taylor Swift'],
    audio: '',
  },
  {
    song: 'Mr. Brightside — The Killers',
    prompt: 'Name that tune! 🎸',
    correct: 'Mr. Brightside — The Killers',
    options: ['Mr. Brightside — The Killers', 'Don\'t Stop Me Now — Queen', 'Sweet Caroline — Neil Diamond', 'Girls Just Want to Have Fun — Cyndi Lauper'],
    audio: '',
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
  { game: 'NOOT', noot: 0, note: 'Play ~10s of the song on your phone/speaker, tap 🎧 Playing from my phone, arm buzzers — the winner picks the title. 13 more songs in the Noot bank.' },
  { game: 'CHEER', note: 'Final showdown! Last chance to catch up.' },
  { game: 'BINGO', bingo: { mode: 'numbers', pattern: 'full' }, note: 'Number bingo for a full house — try ⏩ Auto-draw.' },
  { game: 'WINNER', note: 'The big reveal: team winner, then the MVP. Thank everyone! 🥂' },
]
