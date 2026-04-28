import { expect, test, describe } from "bun:test";
import { compileToJS } from "../src/compiler";

describe("Regex Compiler - Basic Support", () => {
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
});

describe("Regex Compiler - Advanced Support", () => {
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

  test("Character Set Subtraction (v flag)", () => {
    const dsl = {
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
      flags: { unicodeSets: true }
    };
    const result = compileToJS(dsl) as any;
    expect(result.pattern).toBe("[[A-Z]--[AEIOU]]");
    expect(result.flags).toBe("v");
  });

  test("Character Set Intersection (v flag)", () => {
    const dsl = {
      nodes: [
        { 
          charSet: { 
            intersection: [
              { chars: "a-z" },
              { chars: "p-z" }
            ]
          } 
        }
      ],
      flags: { unicodeSets: true }
    };
    const result = compileToJS(dsl) as any;
    expect(result.pattern).toBe("[[a-z]&&[p-z]]");
    expect(result.flags).toBe("v");
  });

  test("Hex and Unicode Escapes", () => {
    const dsl = {
      nodes: [
        { hex: "41" }, 
        { unicode: "0042" },
        { unicode: "1F600" } 
      ]
    };
    const result = compileToJS(dsl) as any;
    expect(result.pattern).toBe("\\x41\\u0042\\u{1F600}");
  });
});

describe("Regex Compiler - Edge Cases & Bug Fixes", () => {
  test("Invalid DSL - Unrecognized Node", () => {
    const dsl = { nodes: [{ unknownNode: true }] };
    const result = compileToJS(dsl) as any;
    expect(result.error).toBeDefined();
    expect(result.error).toContain("nodes.0: Invalid input");
  });

  test("count: 0 should generate {0}", () => {
    const dsl = {
      nodes: [
        { repeat: { type: "digit", count: 0 } }
      ]
    };
    const result = compileToJS(dsl) as any;
    expect(result.pattern).toBe("\\d{0}");
  });

  test("nested repeats should be wrapped in non-capturing groups", () => {
    const dsl = {
      nodes: [
        { 
          repeat: { 
            type: { repeat: { type: "digit", count: 3 } }, 
            oneOrMore: true 
          } 
        }
      ]
    };
    const result = compileToJS(dsl) as any;
    expect(result.pattern).toBe("(?:\\d{3})+");
  });

  test("multi-character literals in repeat should be wrapped", () => {
    const dsl = {
      nodes: [
        { repeat: { type: { literal: "abc" }, zeroOrMore: true } }
      ]
    };
    const result = compileToJS(dsl) as any;
    expect(result.pattern).toBe("(?:abc)*");
  });

  test("Email Validator", () => {
    const dsl = {
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
    };
    const result = compileToJS(dsl) as any;
    expect(result.pattern).toBe("^(?<user>[a-zA-Z0-9._%+-]+)@(?<domain>[a-zA-Z0-9.-]+)\\.(?<tld>[a-zA-Z]{2,})$");
    expect(result.flags).toBe("i");
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

  test("concatenated groups in repeat should be wrapped", () => {
    const dsl = {
      nodes: [{
        repeat: {
          type: [
            { capture: { pattern: [{ literal: "a" }] } },
            { capture: { pattern: [{ literal: "b" }] } }
          ],
          oneOrMore: true
        }
      }]
    };
    const result = compileToJS(dsl) as any;
    expect(result.pattern).toBe("(?:(a)(b))+");
  });

  test("concatenated character sets in repeat should be wrapped", () => {
    const dsl = {
      nodes: [{
        repeat: {
          type: [
            { charSet: { chars: "a" } },
            { charSet: { chars: "b" } }
          ],
          zeroOrMore: true
        }
      }]
    };
    const result = compileToJS(dsl) as any;
    expect(result.pattern).toBe("(?:[a][b])*");
  });

  test("negative count should return validation error", () => {
    const dsl = {
      nodes: [{ repeat: { type: "digit", count: -3 } }]
    };
    const result = compileToJS(dsl) as any;
    expect(result.error).toBeDefined();
    expect(result.error).toContain("count: Too small");
  });

  test("negative min/max should return validation error", () => {
    const dsl = {
      nodes: [{ repeat: { type: "digit", min: -1, max: -5 } }]
    };
    const result = compileToJS(dsl) as any;
    expect(result.error).toBeDefined();
    expect(result.error).toContain("min: Too small");
    expect(result.error).toContain("max: Too small");
  });
});
