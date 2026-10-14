/** Static-per-mount confetti field; pure CSS animation, no library. */
export default function Confetti({ count = 80 }) {
  const pieces = Array.from({ length: count }, (_, i) => ({
    left: `${(i * 37) % 100}%`,
    delay: `${(i % 20) * 0.25}s`,
    duration: `${3 + (i % 5)}s`,
    color: ['#f472b6', '#a78bfa', '#fbbf24', '#34d399', '#f87171'][i % 5],
    size: 8 + (i % 3) * 4,
  }))
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute top-[-5%] animate-confetti-fall"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  )
}
