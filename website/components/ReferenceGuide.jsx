import Modal from "./Modal";
import { REFERENCE_DATA } from "../data/reference";

export default function ReferenceGuide() {
  const isOpen = $state(false);
  const searchQuery = $state("");

  const filteredReference = $derived(() => {
    if (!searchQuery) return REFERENCE_DATA;
    return REFERENCE_DATA.map(cat => ({
      ...cat,
      items: cat.items.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.regex.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(cat => cat.items.length > 0);
  });

  return (
    <>
      <button 
        onclick={() => isOpen = true}
        className="px-4 py-1.5 bg-[#09090b] border border-blue-500/30 hover:border-blue-500 hover:bg-blue-500/5 text-blue-400/90 hover:text-blue-400 rounded-lg text-[10px] font-bold uppercase tracking-[0.15em] transition-all active:scale-95 cursor-pointer shadow-sm shadow-blue-900/10"
      >
        Reference Guide
      </button>

      <Modal 
        isOpen={isOpen} 
        onClose={() => isOpen = false}
        title="Reference Guide"
        size="xl"
      >
        <div className="sticky -top-10 -mx-10 px-10 pt-2 pb-8 bg-[#0c0c0e]/80 backdrop-blur-md z-20 border-b border-zinc-800/50 mb-10">
          <input
            type="text"
            placeholder="Search standards (e.g., lookahead, quantifier)..."
            value={searchQuery}
            oninput={(e) => searchQuery = e.target.value}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-6 py-4 text-base text-white focus:border-blue-500 outline-none transition-all shadow-inner cursor-text"
          />
        </div>
        <div className="space-y-12 pr-2">
          {filteredReference.map(cat => (
            <div key={cat.category}>
              <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-200 mb-6 pb-3 border-b border-zinc-700/50">{cat.category}</h3>
              <div className="space-y-2">
                {cat.items.map((item, idx) => (
                  <div key={idx} className="flex flex-col gap-4 py-8 border-b border-zinc-800/50 last:border-0 hover:bg-white/[0.015] -mx-4 px-4 rounded-xl transition-colors group">
                    <div className="flex flex-col gap-3">
                      <h4 className="text-base font-bold text-white tracking-tight group-hover:text-blue-400 transition-colors">{item.title}</h4>
                      <div className="flex items-center gap-10">
                        <div className="shrink-0">
                          <code className="text-blue-400 font-mono font-bold text-base bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 whitespace-nowrap cursor-text">{item.regex}</code>
                        </div>
                        <code className="text-sm text-zinc-300 font-mono break-all leading-relaxed bg-zinc-900/50 px-3 py-2 rounded-lg border border-zinc-800/50 flex-1 cursor-text">{item.dsl}</code>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-zinc-400 group-hover:text-zinc-300 transition-colors leading-relaxed max-w-4xl cursor-text">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}
