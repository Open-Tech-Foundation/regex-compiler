export default function CompilationPreview({
  result,
  compiledRegex,
  isCopied,
  isCompiling,
  onCopy,
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">
            Compiled Output
          </h2>
          {isCompiling && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[9px] font-bold text-blue-400 uppercase tracking-wider animate-pulse">
              Compiling...
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#09090b] border border-[#27272a] rounded-lg cursor-default opacity-80 shadow-sm">
          <div className="w-4 h-4 bg-[#f7df1e] text-black flex items-center justify-center font-bold text-[8px] rounded-sm shrink-0">
            JS
          </div>
          <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">
            JavaScript
          </span>
        </div>
      </div>
      <div
        className={`relative group p-8 bg-zinc-900/30 border border-zinc-800 rounded-2xl transition-opacity duration-300 ${isCompiling ? 'opacity-50' : 'opacity-100'}`}
      >
        {result && result.error ? (
          <div className="flex items-start gap-4 text-red-400">
            <svg
              className="w-5 h-5 shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="font-mono text-sm leading-relaxed">{result.error}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <code className="text-blue-400 break-all font-mono text-lg font-semibold tracking-tight cursor-text">
              {compiledRegex}
            </code>
            <button
              onclick={onCopy}
              className={`absolute right-3 top-3 p-2 rounded-lg transition-all flex items-center gap-2 ${isCopied ? 'bg-green-500/20 text-green-400' : 'opacity-0 group-hover:opacity-100 bg-zinc-800 hover:bg-zinc-700 text-zinc-300'} cursor-pointer`}
            >
              {isCopied ? (
                <span className="text-[10px] font-bold uppercase tracking-wider">Copied!</span>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                  />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
