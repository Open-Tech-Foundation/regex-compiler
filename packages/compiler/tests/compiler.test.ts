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

  test("Named Capture Groups", () => {
    const dsl = { 
      nodes: [{ capture: { name: "val", pattern: [{ repeat: { type: "word", oneOrMore: true } }] } }] 
    };
    const result = compileToJS(dsl) as any;
    expect(result.pattern).toBe("(?<val>\\w+)");
  });

  test("Non-capturing Groups", () => {
    const dsl = { 
      nodes: [{ group: { pattern: [{ literal: "abc" }] } }] 
    };
    const result = compileToJS(dsl) as any;
    expect(result.pattern).toBe("(?:abc)");
  });

  test("Lookaheads (Positive and Negative)", () => {
    const pos = { nodes: [{ lookaround: { type: "positiveLookahead", pattern: [{ literal: "foo" }] } }] };
    expect((compileToJS(pos) as any).pattern).toBe("(?=foo)");

    const neg = { nodes: [{ lookaround: { type: "negativeLookahead", pattern: [{ literal: "bar" }] } }] };
    expect((compileToJS(neg) as any).pattern).toBe("(?!bar)");
  });

  test("Lookbehinds (Positive and Negative)", () => {
    const pos = { nodes: [{ lookaround: { type: "positiveLookbehind", pattern: [{ literal: "pre" }] } }] };
    expect((compileToJS(pos) as any).pattern).toBe("(?<=pre)");

    const neg = { nodes: [{ lookaround: { type: "negativeLookbehind", pattern: [{ literal: "nopre" }] } }] };
    expect((compileToJS(neg) as any).pattern).toBe("(?<!nopre)");
  });

  test("Word Boundaries", () => {
    const dsl = { nodes: [{ wordBoundary: true }, { literal: "test" }, { nonWordBoundary: true }] };
    const result = compileToJS(dsl) as any;
    expect(result.pattern).toBe("\\btest\\B");
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
