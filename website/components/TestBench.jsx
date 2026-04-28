
export default function TestBench({
  manualTestString,
  onManualInput,
  manualMatch,
  testResults,
  passedCount,
  result,
}) {
  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Manual Test */}
      <section className="space-y-3">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-200">
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
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-200">
            Predefined Test Suite
          </h2>
          <span className="text-[11px] font-black text-zinc-100 uppercase tracking-widest bg-zinc-800 px-3 py-1 rounded-lg border border-zinc-600">
            {passedCount} / {testResults.length} Passed
          </span>
        </div>

        <div className="space-y-3">
          {testResults.map((tr, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-3.5 bg-[#09090b] border rounded-xl transition-all ${tr.isCorrect ? 'border-[#27272a] hover:border-zinc-700' : 'border-red-500/40 bg-red-500/[0.03]'}`}
            >
              <div className="flex flex-col gap-1 overflow-hidden mr-4">
                <div className="flex items-center gap-2">
                  {tr.isCorrect ? (
                    <span className="text-green-500 text-xs font-bold">✓</span>
                  ) : (
                    <span className="text-red-500 text-xs font-bold">✗</span>
                  )}
                  <span className="font-mono text-xs text-white truncate">{tr.input}</span>
                </div>
                <div className="text-[10px] text-zinc-500 font-medium">
                  Expected:{' '}
                  <span className={tr.expected ? 'text-blue-400/80' : 'text-purple-400/80'}>
                    {tr.expected ? 'Match' : 'Fail'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${tr.isMatch ? 'text-green-400' : 'text-red-400'}`}
                >
                  {tr.isMatch ? 'Matched' : 'Failed'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
