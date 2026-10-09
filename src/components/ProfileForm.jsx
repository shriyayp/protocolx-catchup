function ProfileForm({ value, onChange, presetUser }) {
  const handleNameChange = (e) => {
    onChange({ name: e.target.value, aliases: value.aliases })
  }

  const handleAliasesChange = (e) => {
    onChange({ name: value.name, aliases: e.target.value })
  }

  return (
    <div className="glass p-5">
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
        Your name as it appears in the chat
      </label>
      <input
        type="text"
        value={value.name || ''}
        onChange={handleNameChange}
        placeholder="e.g. Rahul"
        aria-label="Your name as it appears in the chat"
        className="w-full rounded-xl border border-white/[0.08] bg-black/20 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:border-violet-400/30 focus:outline-none"
      />
      <label className="mt-4 mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
        Other names people use for you
        <span className="font-normal normal-case text-slate-600"> (optional, comma-separated)</span>
      </label>
      <input
        type="text"
        value={value.aliases || ''}
        onChange={handleAliasesChange}
        placeholder="e.g. Rah, RK"
        aria-label="Other names people use for you, comma-separated"
        className="w-full rounded-xl border border-white/[0.08] bg-black/20 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:border-violet-400/30 focus:outline-none"
      />
    </div>
  )
}

export default ProfileForm
