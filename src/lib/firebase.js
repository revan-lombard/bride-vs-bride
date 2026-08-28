import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

/**
 * Firebase Realtime Database connection.
 *
 * Config is read from Vite env vars so the repo can stay public without
 * hardcoding project keys. Create a `.env.local` (git-ignored) for local dev,
 * and add the same values as GitHub Actions repository secrets for deploys.
 * See README.md → "Firebase setup".
 *
 * Note: Firebase web API keys are identifiers, not secrets — real protection
 * comes from the Realtime Database security rules (see docs/firebase-rules.json).
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.databaseURL
)

let db = null
if (isFirebaseConfigured) {
  const app = initializeApp(firebaseConfig)
  db = getDatabase(app)
}

export { db }
