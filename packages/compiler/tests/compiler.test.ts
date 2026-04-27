import { expect, test, describe } from "bun:test";
import { compileToJS } from "../src/compiler";
import { RegexDSL } from "../src/types";

describe("Regex Compiler Expansion", () => {
  test("Character set", () => {
    const dsl: RegexDSL = [{ charSet: { chars: "a-z", exclude: false } }];
    expect(compileToJS(dsl)).toBe("[a-z]");
  });

  test("Excluded character set", () => {
    const dsl: RegexDSL = [{ charSet: { chars: "0-9", exclude: true } }];
    expect(compileToJS(dsl)).toBe("[^0-9]");
  });

  test("Choice (Alternation)", () => {
    const dsl: RegexDSL = [
      {
        choice: [
          [{ literal: "cat" }],
          [{ literal: "dog" }]
        ]
      }
    ];
    expect(compileToJS(dsl)).toBe("(?:cat|dog)");
  });

  test("Boolean quantifiers", () => {
    expect(compileToJS([{ repeat: { type: "digit", optional: true } }])).toBe("\\d?");
    expect(compileToJS([{ repeat: { type: "digit", oneOrMore: true } }])).toBe("\\d+");
    expect(compileToJS([{ repeat: { type: "digit", zeroOrMore: true } }])).toBe("\\d*");
  });

  test("Complex mix", () => {
    const dsl: RegexDSL = [
      { startOfLine: true },
      { charSet: { chars: "A-Z" } },
      { repeat: { type: "word", zeroOrMore: true } },
      { choice: [[{ literal: ".com" }], [{ literal: ".org" }]] },
      { endOfLine: true }
    ];
    expect(compileToJS(dsl)).toBe("^[A-Z]\\w*(?:\\.com|\\.org)$");
  });
});
