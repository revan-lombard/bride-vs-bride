import { ref, onValue } from 'firebase/database'
import { db } from './firebase'

/**
 * Phone clocks can be seconds apart, which would wreck a timed race. Firebase
 * tells each client how far its clock is from the server's; adding that
 * offset gives every device the same "now".
 */
let offset = 0
if (db) onValue(ref(db, '.info/serverTimeOffset'), (snap) => (offset = snap.val() || 0))

export const serverNow = () => Date.now() + offset
