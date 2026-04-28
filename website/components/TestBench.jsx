export default function TestBench({ manualTestString, onManualInput, manualMatch, testResults }) {
  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Manual Test */}
      <section className="space-y-3">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
          Manual Test Bench
        </h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Type a string to test against your regex..."
            value={manualTestString}
            oninput={(e) => onManualInput(e.target.value)}
            className="w-full bg-[#0c0c0e] border border-[#27272a] focus:border-blue-500/50 rounded-xl px-6 py-4 text-white font-mono outline-none transition-all cursor-text"
          />
          <div
            className={`absolute right-4 top-1/2 -translate-y-1/2 px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest ${manualMatch ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
          >
            {manualMatch ? 'Match' : 'No Match'}
          </div>
        </div>
      </section>

      {/* Predefined Suite */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">
            Predefined Test Suite
          </h2>
          <span className="text-[11px] font-black text-zinc-300 uppercase tracking-widest bg-zinc-800/80 px-3 py-1 rounded-lg border border-zinc-700/50">
            {testResults.filter((r) => r.isCorrect).length} / {testResults.length} Passed
          </span>
        </div>

        <div className="space-y-3">
          {testResults.map((result, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-3.5 bg-[#09090b] border rounded-xl transition-all ${result.isCorrect ? 'border-[#27272a] hover:border-zinc-700' : 'border-red-500/40 bg-red-500/[0.03]'}`}
            >
              <div className="flex flex-col gap-1 overflow-hidden mr-4">
                <div className="flex items-center gap-2">
                  {result.isCorrect ? (
                    <span className="text-green-500 text-xs font-bold">✓</span>
                  ) : (
                    <span className="text-red-500 text-xs font-bold">✗</span>
                  )}
                  <code className="text-sm text-white font-mono truncate">
                    {result.input || <span className="italic text-zinc-500">empty string</span>}
                  </code>
                </div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-tight pl-5 ${result.expected ? 'text-green-500/80' : 'text-red-500/80'}`}
                >
                  {result.expected ? 'Expected: Match' : 'Expected: Fail'}
                </span>
              </div>
              <div
                className={`shrink-0 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${result.isMatch ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
              >
                {result.isMatch ? 'Matched' : 'Failed'}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
