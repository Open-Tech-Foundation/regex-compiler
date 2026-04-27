import { compileToJS } from "@opentf/regex-compiler";
import Editor from "../components/Editor";
import Modal from "../components/Modal";

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
    testCases: [
      { input: "123-456-7890", expected: true },
      { input: "987-654-3210", expected: true },
      { input: "123-45-6789", expected: false },
      { input: "abc-def-ghij", expected: false },
      { input: "1234567890", expected: false }
    ]
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
    testCases: [
      { input: "hello@opentf.org", expected: true },
      { input: "user.name+tag@domain.com", expected: true },
      { input: "invalid-email", expected: false },
      { input: "@missing-user.com", expected: false },
      { input: "user@domain..com", expected: false }
    ]
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
    testCases: [
      { input: "Password123", expected: true },
      { input: "abc12345", expected: true },
      { input: "short1", expected: false },
      { input: "NoDigitsHere", expected: false },
      { input: "12345678", expected: false }
    ]
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
    testCases: [
      { input: "<div>content</div>", expected: true },
      { input: "<span>test</span>", expected: true },
      { input: "<div>mismatch</span>", expected: false },
      { input: "<>empty</>", expected: false },
      { input: "not a tag", expected: false }
    ]
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
    testCases: [
      { input: "B", expected: true },
      { input: "C", expected: true },
      { input: "A", expected: false },
      { input: "E", expected: false },
      { input: "1", expected: false }
    ]
  }
];

export default function HomePage() {
  const selectedExample = $state(EXAMPLE_REGISTRY[0]);
  const dslText = $state(JSON.stringify(EXAMPLE_REGISTRY[0].dsl, null, 2));
  const manualTestString = $state("");
  const isLibraryOpen = $state(false);

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

  const checkMatch = (input) => {
    if (!compilationResult || compilationResult.error) return false;
    try {
      const re = new RegExp(compilationResult.pattern, compilationResult.flags);
      return re.test(input);
    } catch (e) {
      return false;
    }
  };

  const manualMatch = $derived(() => checkMatch(manualTestString));

  const loadExample = (example) => {
    selectedExample = example;
    dslText = JSON.stringify(example.dsl, null, 2);
    manualTestString = example.testCases[0].input;
    isLibraryOpen = false;
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: Editor */}
      <div className="flex-1 flex flex-col border-r border-[#27272a]">
        <div className="px-5 py-2 border-b border-[#27272a] bg-[#0c0c0e] flex justify-between items-center h-14">
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">DSL Editor</span>
          <button 
            onclick={() => isLibraryOpen = true}
            className="px-4 py-1.5 text-[10px] font-bold bg-[#09090b] border border-blue-500/30 hover:border-blue-500 hover:bg-blue-500/5 text-blue-400/90 hover:text-blue-400 rounded-lg uppercase tracking-[0.15em] transition-all active:scale-95 cursor-pointer shadow-sm shadow-blue-900/10"
          >
            Samples
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
      <div className="w-[520px] flex flex-col bg-[#0c0c0e]">
        {/* Compiled Result */}
        <div className="p-8 border-b border-[#27272a]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Compiled Output</h2>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#09090b] border border-[#27272a] rounded-lg cursor-default opacity-80 shadow-sm">
              <div className="w-4 h-4 bg-[#f7df1e] text-black flex items-center justify-center font-bold text-[8px] rounded-sm shrink-0">JS</div>
              <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">JavaScript</span>
            </div>
          </div>
          
          <div className={`p-6 bg-[#09090b] border rounded-xl relative group shadow-inner ${compilationResult?.error ? "border-red-500/50" : "border-[#27272a]"}`}>
            {compilationResult?.error ? (
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Validation Error</span>
                <code className="text-red-400/80 text-xs font-mono break-words leading-relaxed cursor-text">{compilationResult.error}</code>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <code className="text-blue-400 break-all font-mono text-lg font-semibold tracking-tight cursor-text">{compiledRegex}</code>
                <button 
                  onclick={() => navigator.clipboard.writeText(compiledRegex)}
                  className="absolute right-3 top-3 p-2.5 opacity-0 group-hover:opacity-100 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all text-zinc-300 cursor-pointer"
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
        <div className="p-8 flex-1 overflow-y-auto space-y-10">
          {/* Manual Test */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6">Manual Test Bench</h2>
            <div className="space-y-4">
              <input
                type="text"
                value={manualTestString}
                oninput={(e) => manualTestString = e.target.value}
                className="w-full bg-[#09090b] border border-[#27272a] focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 rounded-xl px-6 py-4 text-white outline-none transition-all font-mono text-base cursor-text"
                placeholder="Enter custom text to test..."
              />
              <div className={`flex items-center gap-4 p-5 rounded-xl border transition-all ${manualMatch ? "bg-green-500/5 border-green-500/30" : "bg-red-500/5 border-red-500/30"}`}>
                <div className={`w-3.5 h-3.5 rounded-full ${manualMatch ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"}`}></div>
                <span className={`text-sm font-black uppercase tracking-[0.2em] ${manualMatch ? "text-green-500" : "text-red-500"}`}>
                  {manualMatch ? "MATCH" : "NO MATCH"}
                </span>
              </div>
            </div>
          </section>

          {/* Predefined Suite */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Predefined Test Suite</h2>
              <span className="text-[11px] font-black text-zinc-300 uppercase tracking-widest bg-zinc-800/80 px-3 py-1 rounded-lg border border-zinc-700/50">
                {selectedExample.testCases.filter(c => checkMatch(c.input) === c.expected).length} / {selectedExample.testCases.length} Passed
              </span>
            </div>
            <div className="space-y-3">
              {selectedExample.testCases.map((tc, idx) => {
                const isMatch = checkMatch(tc.input);
                const isCorrect = isMatch === tc.expected;
                return (
                  <div key={idx} className={`flex items-center justify-between p-4 bg-[#09090b] border rounded-xl transition-all group ${isCorrect ? "border-[#27272a] hover:border-zinc-700" : "border-red-500/40 bg-red-500/[0.03]"}`}>
                    <div className="flex flex-col gap-1 overflow-hidden mr-4">
                      <div className="flex items-center gap-2">
                        {isCorrect ? (
                          <span className="text-green-500 text-xs font-bold">✓</span>
                        ) : (
                          <span className="text-red-500 text-xs font-bold">✗</span>
                        )}
                        <code className="text-sm text-white font-mono truncate">{tc.input || <span className="italic text-zinc-500">empty string</span>}</code>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-tight pl-5 ${tc.expected ? "text-green-500/80" : "text-red-500/80"}`}>
                        {tc.expected ? "Expected: Match" : "Expected: Fail"}
                      </span>
                    </div>
                    <div className={`shrink-0 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${isMatch ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                      {isMatch ? "Matched" : "Failed"}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
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
              className="group flex flex-col p-6 bg-[#09090b] border border-[#27272a] hover:border-blue-500/50 rounded-xl transition-all text-left cursor-pointer"
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
    </div>
  );
}
