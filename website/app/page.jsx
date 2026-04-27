import { compileToJS } from "@opentf/regex-compiler";
import Editor from "../components/Editor";

const DEFAULT_DSL = [
  { startOfLine: true },
  {
    capture: {
      name: "areaCode",
      pattern: [
        {
          repeat: {
            type: "digit",
            count: 3
          }
        }
      ]
    }
  },
  { literal: "-" },
  {
    repeat: {
      type: "digit",
      count: 3
    }
  },
  { literal: "-" },
  {
    repeat: {
      type: "digit",
      count: 4
    }
  },
  { endOfLine: true }
];

export default function HomePage() {
  const dslText = $state(JSON.stringify(DEFAULT_DSL, null, 2));
  const testString = $state("123-456-7890");

  const compiledRegex = $derived(() => {
    try {
      const dsl = JSON.parse(dslText);
      return compileToJS(dsl);
    } catch (e) {
      return null;
    }
  });

  const isMatch = $derived(() => {
    if (!compiledRegex) return false;
    try {
      const re = new RegExp(compiledRegex);
      return re.test(testString);
    } catch (e) {
      return false;
    }
  });

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#09090b]">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#27272a] bg-[#09090b]">
        <div className="flex items-center gap-3">
          <img 
            src="https://raw.githubusercontent.com/Open-Tech-Foundation/website/main/static/img/Logo.svg" 
            alt="OpenTF Logo" 
            className="w-8 h-8 object-contain"
          />
          <h1 className="text-xl font-bold tracking-tight text-white">Regex Compiler</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-zinc-500 font-mono">v0.1.0</span>
          <button className="px-3 py-1 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors">
            Docs
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden">
        {/* Left: Editor */}
        <div className="flex-1 flex flex-col border-r border-[#27272a]">
          <div className="px-4 py-2 border-b border-[#27272a] bg-[#0c0c0e] flex justify-between items-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">DSL Editor (JSON)</span>
          </div>
          <div className="flex-1 overflow-hidden p-2">
            <Editor
              value={dslText}
              onChange={(val) => dslText = val}
            />
          </div>
        </div>

        {/* Right: Preview & Test */}
        <div className="w-[450px] flex flex-col bg-[#0c0c0e]">
          {/* Compiled Result */}
          <div className="p-6 border-b border-[#27272a]">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-4">Compiled Regex</h2>
            <div className="p-4 bg-zinc-900 border border-[#27272a] rounded-lg relative group">
              <code className="text-blue-400 break-all font-mono text-sm">
                {compiledRegex ? `/${compiledRegex}/` : "Invalid DSL"}
              </code>
              <button className="absolute right-2 top-2 p-1.5 opacity-0 group-hover:opacity-100 bg-zinc-800 hover:bg-zinc-700 rounded transition-all text-zinc-400">
                Copy
              </button>
            </div>
          </div>

          {/* Test Bench */}
          <div className="p-6 flex-1">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-4">Test Bench</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Sample String</label>
                <input
                  type="text"
                  value={testString}
                  oninput={(e) => testString = e.target.value}
                  className="w-full bg-zinc-900 border border-[#27272a] focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 rounded-lg px-4 py-2.5 text-white outline-none transition-all font-mono"
                  placeholder="Enter text to test..."
                />
              </div>

              <div className="flex items-center gap-3 p-4 rounded-lg bg-zinc-900/50 border border-[#27272a]">
                <div className={`w-3 h-3 rounded-full ${isMatch ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"}`}></div>
                <span className="text-sm font-medium">
                  {isMatch ? "Matches pattern" : "No match"}
                </span>
              </div>

              {isMatch && (
                <div className="mt-6">
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Match Details</h3>
                  <div className="space-y-2">
                    {/* Placeholder for group matches if we want to show them */}
                    <div className="text-sm text-zinc-400 italic">Full match found.</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
