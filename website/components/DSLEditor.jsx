import Editor from "./Editor";

export default function DSLEditor({ value, error, issues, onChange, onOpenLibrary }) {
  return (
    <div className={`w-full h-full flex flex-col overflow-hidden transition-colors duration-500 ${error ? 'bg-red-500/[0.02]' : ''}`}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272a] bg-[#0c0c0e]/50 shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">DSL Editor</h2>
          {error ? (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-[9px] font-bold text-red-400 uppercase tracking-wider animate-pulse">
              Invalid DSL
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-[9px] font-bold text-green-500 uppercase tracking-wider">
              Valid
            </span>
          )}
        </div>
        <button 
          onclick={onOpenLibrary}
          className="px-4 py-1.5 bg-[#09090b] border border-[#27272a] hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-sm shadow-blue-900/10"
        >
          Samples Library
        </button>
      </div>
      <div className="flex-1 min-h-0 w-full h-full overflow-hidden relative">
        <Editor value={value} issues={issues} onChange={onChange} />
      </div>
    </div>
  );
}
