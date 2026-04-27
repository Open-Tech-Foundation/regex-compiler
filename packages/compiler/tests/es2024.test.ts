import { expect, test, describe } from "bun:test";
import { compileToJS } from "../src/compiler";

describe("Regex Compiler - ES2024 Advanced Support", () => {
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
        { hex: "41" }, // A
        { unicode: "0042" }, // B
        { unicode: "1F600" } // Emoji
      ]
    };
    const result = compileToJS(dsl) as any;
    expect(result.pattern).toBe("\\x41\\u0042\\u{1F600}");
  });
});
