/**
 * Pre-event survey — sent with the invites at /#/survey. Answers build the
 * Feud boards: on /#/survey-results, "Use as Feud round" turns a question's
 * vote counts into a board (points = votes), so the questions are phrased
 * Family Feud style ("Name…"). None repeat the hand-made FEUD_ROUNDS.
 *
 * Rules of thumb if you edit:
 *  - 4–6 options per question (fixed multiple choice — free text scatters
 *    too widely with a small group to make good Feud boards)
 *  - Write options you expect to split the vote; a runaway winner makes a
 *    boring board
 *  - `id` must be unique and stable — responses are stored against it (and
 *    the option's position), so once the survey has gone out don't reuse
 *    ids, reorder options or renumber. Add new questions with new ids.
 *    (The original placeholders used q1–q6; these use s1–s8 so any test
 *    responses to the placeholders are ignored rather than miscounted.)
 */

export const SURVEY_QUESTIONS = [
  {
    id: 's1',
    question: 'What will the brides argue about first as a married couple?',
    options: [
      'Whose turn it is to cook',
      'The aircon',
      'Who hogs the duvet',
      'What to watch tonight',
      'Whose family to visit for Christmas',
    ],
  },
  {
    id: 's2',
    question: 'Name the first thing a bride does when she wakes up',
    options: [
      'Checks her phone',
      'Hits snooze (three times)',
      'Makes coffee',
      'Cuddles the pets',
      'Rolls over and goes back to sleep',
    ],
  },
  {
    id: 's3',
    question: 'Name what the brides will spend the most money on this year',
    options: [
      'The honeymoon',
      'Takeaways',
      'Home improvements',
      'Spoiling the pets',
      'Shoes and clothes',
    ],
  },
  {
    id: 's4',
    question: 'Name something that always ends up in the bathroom but shouldn\'t',
    options: [
      'A coffee mug',
      'A phone',
      'Laundry',
      'A book or magazine',
      'A snack',
    ],
  },
  {
    id: 's5',
    question: 'Name a song that will get everyone on the wedding dance floor',
    options: [
      'Dancing Queen',
      'Kaptein (Span die Seile)',
      'Jerusalema',
      'Mr. Brightside',
      'Uptown Funk',
    ],
  },
  {
    id: 's6',
    question: 'Name what the brides will be doing at 9pm on a Friday in five years',
    options: [
      'Asleep on the couch',
      'Hosting a braai',
      'Watching a series',
      'Out on a date night',
      'Getting kids or pets to bed',
    ],
  },
  {
    id: 's7',
    question: 'Name the best thing to bring to a kitchen tea',
    options: [
      'Wine',
      'Tea towels',
      'Something homemade',
      'A recipe card with advice',
      'A gift voucher',
    ],
  },
  {
    id: 's8',
    question: 'Name something every married couple needs',
    options: [
      'A sense of humour',
      'Patience',
      'Two duvets',
      'Date nights',
      'A good braai',
    ],
  },
]
