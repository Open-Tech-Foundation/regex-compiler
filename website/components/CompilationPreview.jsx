export default function CompilationPreview({
  result,
  compiledRegex,
  isCopied,
  isCompiling,
  onCopy,
  onCopyLink,
  isLinkCopied,
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
            Compiled Output
          </h2>
          {isCompiling && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[9px] font-bold text-blue-400 uppercase tracking-wider animate-pulse">
              Compiling...
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onclick={onCopyLink}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-[10px] font-bold uppercase tracking-wider cursor-pointer ${
              isLinkCopied
                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                : 'bg-zinc-900 border-[#27272a] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              stroke-width="2" 
              stroke-linecap="round" 
              stroke-linejoin="round"
              className="lucide lucide-link"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
            {isLinkCopied ? 'Link Copied!' : 'Copy Share Link'}
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#09090b] border border-[#27272a] rounded-lg cursor-default opacity-80 shadow-sm">
            <div className="w-4 h-4 bg-[#f7df1e] text-black flex items-center justify-center font-bold text-[8px] rounded-sm shrink-0">
              JS
            </div>
            <span className="text-[10px] font-bold text-zinc-100 uppercase tracking-wider">
              JavaScript
            </span>
          </div>
        </div>
      </div>
      <div
        className={`relative group p-8 bg-zinc-900/30 border border-zinc-800 rounded-2xl transition-opacity duration-300 ${isCompiling ? 'opacity-50' : 'opacity-100'}`}
      >
        {result && result.error ? (
          <div className="flex items-start gap-4 text-red-400">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              stroke-width="2" 
              stroke-linecap="round" 
              stroke-linejoin="round"
              className="lucide lucide-alert-circle shrink-0 mt-0.5"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
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
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  stroke-width="2" 
                  stroke-linecap="round" 
                  stroke-linejoin="round"
                  className="lucide lucide-copy"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
