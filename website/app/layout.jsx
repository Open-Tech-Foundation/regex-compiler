import ReferenceGuide from "../components/ReferenceGuide";

export default function RootLayout({ children }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#09090b]">
      {/* Shared Header */}
      <header className="flex items-center justify-between px-6 py-5 border-b border-[#27272a] bg-[#09090b] z-10">
        <div className="flex items-center gap-3">
          <img 
            src="https://raw.githubusercontent.com/Open-Tech-Foundation/website/main/static/img/Logo.svg" 
            alt="OpenTF Logo" 
            className="w-9 h-9 object-contain"
          />
          <h1 className="text-2xl font-bold tracking-tight text-white">Regex Compiler</h1>
        </div>
        <nav className="flex items-center">
          <ReferenceGuide />
        </nav>
      </header>

      {/* Main Page Slot */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>

      {/* Shared Footer */}
      <footer className="px-6 py-4 border-t border-[#27272a] bg-[#09090b] flex items-center justify-between text-xs font-medium tracking-wide">
        <div className="text-zinc-400">
          © 2026 <a href="https://web.opentf.workers.dev/" target="_blank" className="text-zinc-200 hover:text-blue-400 transition-colors underline decoration-zinc-700 underline-offset-4 font-semibold cursor-pointer">Open Tech Foundation</a>
        </div>
        <div className="text-zinc-400 flex items-center gap-2">
          <span>🚀 Built using</span> 
          <span className="text-blue-400 font-bold tracking-normal cursor-default">Web App Framework</span>
        </div>
      </footer>
    </div>
  );
}
