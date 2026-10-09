function ErrorBanner({ message }) {
  if (!message) return null
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-400/20 bg-red-500/[0.08] px-4 py-3 text-sm text-red-300"
    >
      <strong className="font-semibold text-red-200">Error: </strong>
      {message}
    </div>
  )
}

export default ErrorBanner
