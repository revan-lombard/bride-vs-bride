/**
 * Pre-loaded content banks — ✏️ EDIT with the real event content.
 *
 * Everything here appears as one-tap load buttons on the host panel, so
 * nothing has to be typed or pasted under pressure on the day. The entries
 * below are placeholders showing the shape.
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
    options: ['Bride A', 'Bride B'],
  },
  {
    question: 'Who is more likely to get them lost on a road trip?',
    options: ['Bride A', 'Bride B'],
  },
  {
    question: 'Who will cry first at the wedding?',
    options: ['Bride A', 'Bride B', 'The mothers', 'Everyone at once'],
  },
]

/**
 * Finish-the-lyric rounds. `snippet` is what shows on the TV (end it where
 * the guests must take over — a trailing … works well); `answer` is the
 * missing words, revealed by the host after a buzz.
 * ⚠️ Placeholders only — paste in your chosen lyrics yourself.
 */
export const LYRIC_ROUNDS = [
  {
    snippet: 'Replace me with the opening line of love song number one…',
    answer: '…and this with the words that finish it',
  },
  {
    snippet: 'Second song — lyric that stops right before the chorus…',
    answer: 'the chorus words everyone should belt out',
  },
  {
    snippet: 'Third song — a line every guest will know…',
    answer: 'its famous ending',
  },
]
