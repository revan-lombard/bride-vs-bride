export default function SetupNotice() {
  return (
    <div className="min-h-full flex items-center justify-center p-6">
      <div className="max-w-lg bg-white/10 rounded-2xl p-8 space-y-4">
        <h1 className="text-2xl font-bold">🔧 Firebase not configured</h1>
        <p className="text-white/80">
          The app needs a Firebase Realtime Database to sync buzzers, votes and
          scores between phones and the TV.
        </p>
        <ol className="list-decimal list-inside text-white/80 space-y-1 text-sm">
          <li>Create a free project at console.firebase.google.com</li>
          <li>Add a Realtime Database (start in test mode for the event)</li>
          <li>
            Copy the web app config into <code>.env.local</code> — see{' '}
            <code>README.md</code>
          </li>
        </ol>
      </div>
    </div>
  )
}
