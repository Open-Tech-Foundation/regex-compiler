import { expect, test, describe } from "bun:test";
import { compileToJS } from "../src/compiler";

describe("Regex Compiler - Standard Support", () => {
  test("Basic Literals and Escaping", () => {
    const dsl = { nodes: [{ literal: "hello.world" }] };
    const result = compileToJS(dsl) as any;
    expect(result.pattern).toBe("hello\\.world");
  });

  test("Character Classes and Flags", () => {
    const dsl = { 
      nodes: [{ repeat: { type: "digit", oneOrMore: true } }],
      flags: { global: true, ignoreCase: true }
    };
    const result = compileToJS(dsl) as any;
    expect(result.pattern).toBe("\\d+");
    expect(result.flags).toBe("gi");
  });

  test("Inverse Classes and Special Escapes", () => {
    const dsl = { 
      nodes: [
        { repeat: { type: "nonDigit", oneOrMore: true } },
        { repeat: { type: "tab", count: 1 } },
        { repeat: { type: "nonWord", zeroOrMore: true } }
      ] 
    };
    const result = compileToJS(dsl) as any;
    expect(result.pattern).toBe("\\D+\\t\\W*");
  });

  test("Lazy Quantifiers", () => {
    const dsl = { 
      nodes: [
        { repeat: { type: "any", zeroOrMore: true, lazy: true } },
        { literal: "end" }
      ] 
    };
    const result = compileToJS(dsl) as any;
    expect(result.pattern).toBe(".*?end");
  });

  test("Unicode Properties", () => {
    const dsl = { 
      nodes: [
        { unicodeProperty: { property: "L" } },
        { unicodeProperty: { property: "N", exclude: true } }
      ] 
    };
    const result = compileToJS(dsl) as any;
    expect(result.pattern).toBe("\\p{L}\\P{N}");
  });

  test("Named Capture Groups", () => {
    const dsl = { 
      nodes: [{ capture: { name: "val", pattern: [{ repeat: { type: "word", oneOrMore: true } }] } }] 
    };
    const result = compileToJS(dsl) as any;
    expect(result.pattern).toBe("(?<val>\\w+)");
  });

  test("Lookaheads and Lookbehinds", () => {
    const pos = { nodes: [{ lookaround: { type: "positiveLookahead", pattern: [{ literal: "foo" }] } }] };
    expect((compileToJS(pos) as any).pattern).toBe("(?=foo)");
  });

  test("Backreferences", () => {
    const dsl = { 
      nodes: [
        { capture: { name: "quote", pattern: [{ charSet: { chars: "'\"" } }] } },
        { repeat: { type: "any", zeroOrMore: true } },
        { backreference: "quote" }
      ] 
    };
    const result = compileToJS(dsl) as any;
    expect(result.pattern).toBe("(?<quote>['\"]).*\\k<quote>");
  });
});

describe("Regex Compiler - Edge Cases & Validation", () => {
  test("Invalid DSL - Unrecognized Node", () => {
    const dsl = { nodes: [{ unknownNode: true }] };
    const result = compileToJS(dsl) as any;
    expect(result.error).toBeDefined();
    expect(result.error).toContain("nodes.0: Invalid input");
  });

  test("Complex Nested Choice and Repeats", () => {
    const dsl = {
      nodes: [
        { 
          repeat: { 
            type: {
              choice: [
                [{ literal: "a" }],
                [{ repeat: { type: "digit", count: 2 } }]
              ]
            },
            optional: true 
          } 
        }
      ]
    };
    const result = compileToJS(dsl) as any;
    expect(result.pattern).toBe("(?:a|\\d{2})?");
  });
});
