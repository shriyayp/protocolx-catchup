function Header() {
  return (
    <header className="relative z-40 border-b border-white/[0.06] bg-black/30 backdrop-blur-xl">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3.5 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="chrome-badge flex h-9 w-9 items-center justify-center rounded-[11px]" aria-hidden="true">
            <span className="text-base font-black tracking-[-0.1em] text-slate-900">C<span className="opacity-50">/</span></span>
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-[0.16em] text-slate-100">CATCHUP</h1>
            <p className="eyebrow mt-0.5 text-[8px] tracking-[0.2em]">Conversation intelligence</p>
          </div>
        </div>
        <div className="hidden items-center gap-4 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-600 sm:flex">
          <span>On-device analysis</span>
        </div>
      </div>
    </header>
  )
}

export default Header
