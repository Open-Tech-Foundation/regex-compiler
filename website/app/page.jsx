import { compileToJS } from "@opentf/regex-compiler";
import Editor from "../components/Editor";
import Modal from "../components/Modal";
import { REFERENCE_DATA } from "../data/reference";

const EXAMPLE_REGISTRY = [
  {
    id: "phone",
    title: "International Phone Number",
    description: "Matches a standard 10-digit phone number with dashes.",
    features: ["Named Groups", "Fixed Count"],
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
    features: ["Character Sets", "Quantifiers"],
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
    id: "password",
    title: "Strong Password",
    description: "Requires at least one letter, one number, and 8+ characters using Lookaheads.",
    features: ["Lookahead", "Anchors"],
    dsl: {
      nodes: [
        { startOfLine: true },
        { lookaround: { type: "positiveLookahead", pattern: [{ repeat: { type: "any", zeroOrMore: true } }, { repeat: { type: "digit", count: 1 } }] } },
        { lookaround: { type: "positiveLookahead", pattern: [{ repeat: { type: "any", zeroOrMore: true } }, { charSet: { chars: "a-zA-Z" } }] } },
        { repeat: { type: "any", min: 8 } },
        { endOfLine: true }
      ]
    },
    testCase: "Password123"
  },
  {
    id: "html",
    title: "HTML Tag Matcher",
    description: "Matches HTML tags and ensures the closing tag name matches the opening one.",
    features: ["Backreferences", "Named Groups"],
    dsl: {
      nodes: [
        { literal: "<" },
        { capture: { name: "tag", pattern: [{ repeat: { type: "word", oneOrMore: true } }] } },
        { literal: ">" },
        { repeat: { type: "any", zeroOrMore: true } },
        { literal: "</" },
        { backreference: "tag" },
        { literal: ">" }
      ],
      flags: { global: true }
    },
    testCase: "<div>Hello World</div>"
  },
  {
    id: "word",
    title: "Whole Word Search",
    description: "Finds a specific word only if it's not part of another word.",
    features: ["Word Boundaries"],
    dsl: {
      nodes: [
        { wordBoundary: true },
        { literal: "OpenTF" },
        { wordBoundary: true }
      ]
    },
    testCase: "Welcome to OpenTF foundation"
  },
  {
    id: "csv",
    title: "CSV Column Parser",
    description: "Matches a column in a CSV, optionally enclosed in quotes.",
    features: ["Choice", "Non-capturing Groups"],
    dsl: {
      nodes: [
        {
          choice: [
            [
              { literal: "\"" },
              { capture: { name: "quoted", pattern: [{ repeat: { type: { charSet: { chars: "\"", exclude: true } }, zeroOrMore: true } }] } },
              { literal: "\"" }
            ],
            [
              { capture: { name: "unquoted", pattern: [{ repeat: { type: { charSet: { chars: ",", exclude: true } }, zeroOrMore: true } }] } }
            ]
          ]
        }
      ],
      flags: { global: true }
    },
    testCase: "\"John Doe\",30,New York"
  },
  {
    id: "es2024",
    title: "ES2024 Unicode Sets",
    description: "Finds consonants by subtracting vowels from the alphabet using the 'v' flag.",
    features: ["Set Subtraction", "v Flag"],
    dsl: {
      nodes: [
        { 
          charSet: { 
            subtraction: {
              left: { chars: "A-Z" },
              right: { chars: "AEIOU" }
            }
          } 
        }
      ],
      flags: { global: true, unicodeSets: true }
    },
    testCase: "ABCDEFGHIJKL"
  }
];

export default function HomePage() {
  const dslText = $state(JSON.stringify(EXAMPLE_REGISTRY[0].dsl, null, 2));
  const testString = $state(EXAMPLE_REGISTRY[0].testCase);
  const isLibraryOpen = $state(false);
  const isReferenceOpen = $state(false);
  const searchQuery = $state("");

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

  const loadExample = (example) => {
    dslText = JSON.stringify(example.dsl, null, 2);
    testString = example.testCase;
    isLibraryOpen = false;
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: Editor */}
      <div className="flex-1 flex flex-col border-r border-[#27272a]">
        <div className="px-5 py-2 border-b border-[#27272a] bg-[#0c0c0e] flex justify-between items-center h-14">
          <div className="flex items-center gap-6">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">DSL Editor</span>
            <button 
              onclick={() => isReferenceOpen = true}
              className="text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest"
            >
              Reference Guide
            </button>
          </div>
          <button 
            onclick={() => isLibraryOpen = true}
            className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all shadow-lg shadow-blue-900/20 active:scale-95"
          >
            Browse Library
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
          <div className={`p-6 bg-[#09090b] border rounded-xl relative group shadow-inner ${compilationResult?.error ? "border-red-500/50" : "border-[#27272a]"}`}>
            {compilationResult?.error ? (
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Validation Error</span>
                <code className="text-red-400/80 text-xs font-mono break-words leading-relaxed">{compilationResult.error}</code>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <code className="text-blue-400 break-all font-mono text-lg font-semibold tracking-tight">{compiledRegex}</code>
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

      {/* Library Modal */}
      <Modal 
        isOpen={isLibraryOpen} 
        onClose={() => isLibraryOpen = false}
        title="Sample Library"
        size="sm"
      >
        <div className="grid grid-cols-1 gap-4">
          {EXAMPLE_REGISTRY.map(ex => (
            <button 
              onclick={() => loadExample(ex)}
              className="group flex flex-col p-6 bg-[#09090b] border border-[#27272a] hover:border-blue-500/50 rounded-xl transition-all text-left"
            >
              <h4 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors mb-2">{ex.title}</h4>
              <p className="text-base text-zinc-400 line-clamp-2 leading-relaxed mb-4">{ex.description}</p>
              <div className="flex flex-wrap gap-2">
                {ex.features.map(feat => (
                  <span className="px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-bold text-purple-400 uppercase tracking-tight">{feat}</span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </Modal>

      {/* Reference Guide Modal */}
      <Modal 
        isOpen={isReferenceOpen} 
        onClose={() => isReferenceOpen = false}
        title="Reference Guide"
        size="xl"
      >
        <div className="sticky -top-10 -mx-10 px-10 pt-2 pb-8 bg-[#0c0c0e]/80 backdrop-blur-md z-20 border-b border-zinc-800/50 mb-10">
          <input
            type="text"
            placeholder="Search standards (e.g., lookahead, quantifier)..."
            value={searchQuery}
            oninput={(e) => searchQuery = e.target.value}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-6 py-4 text-base text-white focus:border-blue-500 outline-none transition-all shadow-inner"
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
                          <code className="text-blue-400 font-mono font-bold text-base bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 whitespace-nowrap">{item.regex}</code>
                        </div>
                        <code className="text-sm text-zinc-300 font-mono break-all leading-relaxed bg-zinc-900/50 px-3 py-2 rounded-lg border border-zinc-800/50 flex-1">{item.dsl}</code>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-zinc-400 group-hover:text-zinc-300 transition-colors leading-relaxed max-w-4xl">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
