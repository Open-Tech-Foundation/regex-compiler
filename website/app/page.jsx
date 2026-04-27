import { compileToJS } from "@opentf/regex-compiler";
import Editor from "../components/Editor";
import Modal from "../components/Modal";

const EXAMPLE_REGISTRY = [
  {
    id: "phone",
    title: "International Phone Number",
    description: "Matches a standard 10-digit phone number with dashes.",
    features: ["Named Groups", "Fixed Count", "Literal Escaping"],
    dsl: {
      nodes: [
        { startOfLine: true },
        { capture: { name: "areaCode", pattern: [{ repeat: { type: "digit", count: 3 } }] } },
        { literal: "-" },
        { capture: { name: "prefix", pattern: [{ repeat: { type: "digit", count: 3 } }] } },
        { literal: "-" },
        { capture: { name: "line", pattern: [{ repeat: { type: "digit", count: 4 } }] } },
        { endOfLine: true }
      ],
      flags: { global: true }
    },
    testCase: "123-456-7890"
  },
  {
    id: "email",
    title: "Email Validator",
    description: "A robust pattern for validating common email address formats.",
    features: ["Character Sets", "Quantifiers", "Sub-patterns"],
    dsl: {
      nodes: [
        { startOfLine: true },
        { capture: { name: "user", pattern: [{ repeat: { type: { charSet: { chars: "a-zA-Z0-9._%+-", exclude: false } }, oneOrMore: true } }] } },
        { literal: "@" },
        { capture: { name: "domain", pattern: [{ repeat: { type: { charSet: { chars: "a-zA-Z0-9.-", exclude: false } }, oneOrMore: true } }] } },
        { literal: "." },
        { capture: { name: "tld", pattern: [{ repeat: { type: { charSet: { chars: "a-zA-Z", exclude: false } }, min: 2 } }] } },
        { endOfLine: true }
      ],
      flags: { ignoreCase: true }
    },
    testCase: "hello.world@opentf.org"
  },
  {
    id: "lookaround",
    title: "Password Strength (Advanced)",
    description: "Uses lookaheads to ensure the password contains at least one digit.",
    features: ["Lookahead", "Groups", "Char Sets"],
    dsl: {
      nodes: [
        { startOfLine: true },
        { lookaround: { type: "positiveLookahead", pattern: [{ repeat: { type: "any", zeroOrMore: true } }, { repeat: { type: "digit", count: 1 } }] } },
        { repeat: { type: "word", min: 8 } },
        { endOfLine: true }
      ]
    },
    testCase: "Password123"
  }
];

export default function HomePage() {
  const dslText = $state(JSON.stringify(EXAMPLE_REGISTRY[0].dsl, null, 2));
  const testString = $state(EXAMPLE_REGISTRY[0].testCase);
  const isModalOpen = $state(false);

  const compilationResult = $derived(() => {
    try {
      const dsl = JSON.parse(dslText);
      return compileToJS(dsl);
    } catch (e) {
      return { error: "Invalid JSON format" };
    }
  });

  const compiledRegex = $derived(() => {
    if (compilationResult && 'pattern' in compilationResult) {
      return `/${compilationResult.pattern}/${compilationResult.flags || ""}`;
    }
    return null;
  });

  const compilationError = $derived(() => {
    if (compilationResult && 'error' in compilationResult) {
      return compilationResult.error;
    }
    return null;
  });

  const matchData = $derived(() => {
    if (!compilationResult || compilationResult.error) return null;
    try {
      const re = new RegExp(compilationResult.pattern, compilationResult.flags);
      const match = testString.match(re);
      return match;
    } catch (e) {
      return null;
    }
  });

  const isMatch = $derived(() => !!matchData);

  const captureGroups = $derived(() => {
    if (!matchData || !matchData.groups) return [];
    return Object.entries(matchData.groups);
  });

  const loadExample = (example) => {
    dslText = JSON.stringify(example.dsl, null, 2);
    testString = example.testCase;
    isModalOpen = false;
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: Editor */}
      <div className="flex-1 flex flex-col border-r border-[#27272a]">
        <div className="px-5 py-2 border-b border-[#27272a] bg-[#0c0c0e] flex justify-between items-center h-14">
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">DSL Editor</span>
          <button 
            onclick={() => isModalOpen = true}
            className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all shadow-lg shadow-blue-900/20 active:scale-95"
          >
            Load Sample
          </button>
        </div>
        <div className="flex-1 overflow-hidden p-2">
          <Editor
            value={dslText}
            onChange={(val) => dslText = val}
          />
        </div>
      </div>

      {/* Right: Preview & Test */}
      <div className="w-[480px] flex flex-col bg-[#0c0c0e]">
        {/* Compiled Result */}
        <div className="p-8 border-b border-[#27272a]">
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-5">Compiled Output</h2>
          <div className={`p-6 bg-[#09090b] border rounded-xl relative group shadow-inner ${compilationError ? "border-red-500/50" : "border-[#27272a]"}`}>
            {compilationError ? (
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Validation Error</span>
                <code className="text-red-400/80 text-xs font-mono break-words leading-relaxed">
                  {compilationError}
                </code>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <code className="text-blue-400 break-all font-mono text-lg font-semibold tracking-tight">
                  {compiledRegex}
                </code>
                <button 
                  onclick={() => navigator.clipboard.writeText(compiledRegex)}
                  className="absolute right-3 top-3 p-2.5 opacity-0 group-hover:opacity-100 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all text-zinc-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Test Bench */}
        <div className="p-8 flex-1 overflow-y-auto">
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6">Test Bench</h2>
          <div className="space-y-8">
            <div>
              <label className="block text-sm font-bold text-zinc-400 uppercase tracking-widest mb-3">Input String</label>
              <input
                type="text"
                value={testString}
                oninput={(e) => testString = e.target.value}
                className="w-full bg-[#09090b] border border-[#27272a] focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 rounded-xl px-6 py-4 text-white outline-none transition-all font-mono text-base"
                placeholder="Enter text to test..."
              />
            </div>

            <div className={`flex items-center gap-4 p-6 rounded-xl border transition-all ${isMatch ? "bg-green-500/5 border-green-500/30" : "bg-red-500/5 border-red-500/30"}`}>
              <div className={`w-4 h-4 rounded-full ${isMatch ? "bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]" : "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]"}`}></div>
              <span className={`text-base font-black uppercase tracking-[0.2em] ${isMatch ? "text-green-500" : "text-red-500"}`}>
                {isMatch ? "MATCH" : "NO MATCH"}
              </span>
            </div>

            {captureGroups.length > 0 && (
              <div className="mt-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-5">Extracted Data</h3>
                <div className="space-y-4">
                  {captureGroups.map(([name, value]) => (
                    <div className="flex flex-col gap-2 p-5 bg-[#09090b] border border-[#27272a] rounded-xl hover:border-blue-500/30 transition-colors shadow-sm">
                      <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-500">{name}</span>
                      <span className="text-base text-blue-400 font-mono font-semibold truncate">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Example Selection Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => isModalOpen = false}
        title="Browse Library"
      >
        <div className="grid grid-cols-1 gap-4">
          {EXAMPLE_REGISTRY.map(ex => (
            <button 
              onclick={() => loadExample(ex)}
              className="group flex flex-col p-6 bg-[#09090b] border border-[#27272a] hover:border-blue-500/50 rounded-xl transition-all text-left"
            >
              <h4 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors mb-2">{ex.title}</h4>
              <p className="text-base text-zinc-400 line-clamp-2 leading-relaxed mb-4">
                {ex.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {ex.features.map(feat => (
                  <span className="px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-bold text-purple-400 uppercase tracking-tight">
                    {feat}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
