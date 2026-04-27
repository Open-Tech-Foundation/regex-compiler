import Editor from "./Editor";

export default function DSLEditor({ value, onchange, onOpenLibrary }) {
  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272a] bg-[#0c0c0e]/50 shrink-0">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">DSL Editor</h2>
        <button 
          onclick={onOpenLibrary}
          className="px-4 py-1.5 bg-[#09090b] border border-[#27272a] hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-sm shadow-blue-900/10"
        >
          Samples Library
        </button>
      </div>
      <div className="flex-1 min-h-0 w-full h-full overflow-hidden">
        <Editor value={value} onchange={onchange} />
      </div>
    </div>
  );
}
