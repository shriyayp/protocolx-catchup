function Header() {
  return (
    <header className="relative z-40 border-b border-white/[0.08] bg-black/20 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
        <div className="flex items-center gap-3">
          <div className="chrome-badge flex h-10 w-10 items-center justify-center rounded-[13px]" aria-hidden="true">
            <span className="text-lg font-black tracking-[-0.12em] text-slate-900">C<span className="opacity-60">/</span></span>
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-[0.18em] text-slate-100">CATCHUP</h1>
            <p className="eyebrow mt-0.5 text-[9px] tracking-[0.22em]">Conversation intelligence</p>
          </div>
        </div>
        <div className="hidden items-center gap-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 sm:flex">
          <span>Private by design</span>
          <span className="h-1 w-1 rounded-full bg-slate-600" />
          <span>On-device analysis</span>
        </div>
      </div>
    </header>
  )
}

export default Header
