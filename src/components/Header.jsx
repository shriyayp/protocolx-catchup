/**
 * Header — Premium glass header with chrome brand badge.
 */
function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-black/20 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:py-4">
        <div className="flex items-center gap-3">
          <div className="chrome-badge flex h-10 w-10 items-center justify-center rounded-xl shadow-lg">
            <span className="text-base font-bold text-slate-900">C</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight sm:text-xl">
              <span className="chrome-text">CatchUp</span>
            </h1>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Conversation intelligence
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
