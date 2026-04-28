import Modal from "./Modal";
import { REFERENCE_DATA } from "../data/reference";

export default function ReferenceGuide() {
  const isOpen = $state(false);
  const searchQuery = $state("");
  const selectedItem = $state(null);

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

  const activeItem = $derived(() => {
    if (selectedItem) return selectedItem;
    // Fallback to first filtered item
    if (filteredReference.length > 0 && filteredReference[0].items.length > 0) {
      return filteredReference[0].items[0];
    }
    return null;
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
        <div className="flex flex-col h-[70vh] -m-10 overflow-hidden">
          {/* Global Search */}
          <div className="shrink-0 p-8 border-b border-zinc-800/50 bg-[#0c0c0e]">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-blue-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search standards (e.g., lookahead, quantifier)..."
                value={searchQuery}
                oninput={(e) => searchQuery = e.target.value}
                className="w-full bg-[#09090b] border border-zinc-800 rounded-xl pl-12 pr-6 py-4 text-sm text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all placeholder:text-zinc-600 shadow-inner"
              />
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar Navigation */}
            <div className="w-80 border-r border-zinc-800/50 bg-[#09090b]/30 overflow-y-auto custom-scrollbar p-6">
              <div className="space-y-8">
                {filteredReference.map(cat => (
                  <div key={cat.category} className="space-y-2">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 px-3 mb-4">{cat.category}</h3>
                    <div className="space-y-1">
                      {cat.items.map((item, idx) => (
                        <button
                          key={idx}
                          onclick={() => selectedItem = item}
                          className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center justify-between group ${
                            activeItem === item 
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-lg shadow-blue-500/5" 
                            : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03] border border-transparent"
                          }`}
                        >
                          <span className="font-medium truncate pr-2">{item.title}</span>
                          <code className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors ${
                            activeItem === item ? "bg-blue-500/20 text-blue-300" : "bg-zinc-800 text-zinc-500 group-hover:text-zinc-400"
                          }`}>
                            {item.regex}
                          </code>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Content Detail View */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0c0c0e] p-10">
              {activeItem ? (
                <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="flex items-center gap-4 mb-2">
                    <span className="px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-[10px] font-black text-blue-400 uppercase tracking-widest">
                      Documentation
                    </span>
                  </div>
                  
                  <h2 className="text-4xl font-bold text-white tracking-tight mb-8">
                    {activeItem.title}
                  </h2>

                  <div className="grid gap-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Syntax Preview</label>
                      <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-8 flex flex-col gap-6 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-all"
                            onclick={() => navigator.clipboard.writeText(activeItem.regex)}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                          </button>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="shrink-0">
                            <span className="text-xs text-zinc-500 block mb-2 font-bold uppercase tracking-tighter">Regex</span>
                            <code className="text-3xl text-blue-400 font-mono font-bold leading-none">
                              {activeItem.regex}
                            </code>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">DSL Representation</label>
                      <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-6 relative group">
                         <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-all"
                            onclick={() => navigator.clipboard.writeText(activeItem.dsl)}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                          </button>
                        </div>
                        <pre className="text-sm text-zinc-300 font-mono overflow-x-auto custom-scrollbar leading-relaxed">
                          {activeItem.dsl}
                        </pre>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Description</label>
                      <p className="text-lg text-zinc-400 leading-relaxed font-medium">
                        {activeItem.description}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Live Preview</label>
                      <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4">
                          <span className="px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400">
                            {(() => {
                              try {
                                const re = new RegExp(activeItem.regex, 'g');
                                const count = (activeItem.testString.match(re) || []).length;
                                return `${count} match${count === 1 ? '' : 'es'}`;
                              } catch(e) { return '0 matches'; }
                            })()}
                          </span>
                        </div>
                        <div className="text-xl leading-relaxed font-medium text-zinc-400 whitespace-pre-wrap break-all">
                          {(() => {
                            const text = activeItem.testString;
                            const regexStr = activeItem.regex;
                            if (!regexStr || !text) return text;
                            try {
                              const re = new RegExp(regexStr, 'g');
                              const parts = [];
                              let lastIndex = 0;
                              let match;
                              
                              while ((match = re.exec(text)) !== null) {
                                if (match.index > lastIndex) {
                                  parts.push(text.substring(lastIndex, match.index));
                                }
                                parts.push(<mark className="bg-blue-500/30 text-blue-200 rounded px-0.5 border-b-2 border-blue-500/50">{match[0]}</mark>);
                                lastIndex = re.lastIndex;
                                if (re.lastIndex === match.index) re.lastIndex++; 
                              }
                              
                              if (lastIndex < text.length) {
                                parts.push(text.substring(lastIndex));
                              }
                              
                              return parts;
                            } catch (e) {
                              return text;
                            }
                          })()}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Detailed Breakdown</label>
                      <div className="space-y-3">
                        {activeItem.details.map((detail, dIdx) => (
                          <div key={dIdx} className="flex items-start gap-4 p-4 bg-[#09090b] border border-zinc-800 rounded-xl group/detail hover:border-zinc-700 transition-colors">
                            <code className="shrink-0 px-2 py-1 rounded bg-blue-500/10 text-blue-400 font-mono font-bold text-sm">
                              {detail.part}
                            </code>
                            <div className="flex-1 pt-1">
                              <p className="text-sm text-zinc-300 font-medium group-hover/detail:text-white transition-colors">
                                {detail.meaning}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-4 animate-in fade-in duration-500">
                  <svg className="w-16 h-16 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <p className="text-sm font-medium">No item selected or found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}

