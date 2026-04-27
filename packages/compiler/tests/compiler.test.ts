import { expect, test, describe } from "bun:test";
import { compileToJS } from "../src/compiler";
import { RegexDSL } from "../src/types";

describe("Regex Compiler", () => {
  test("Phone number example", () => {
    const dsl: RegexDSL = [
      { startOfLine: true },
      {
        capture: {
          name: "areaCode",
          pattern: [
            {
              repeat: {
                type: "digit",
                count: 3,
              },
            },
          ],
        },
      },
      { literal: "-" },
      {
        repeat: {
          type: "digit",
          count: 3,
        },
      },
      { literal: "-" },
      {
        repeat: {
          type: "digit",
          count: 4,
        },
      },
      { endOfLine: true },
    ];

    const result = compileToJS(dsl);
    expect(result).toBe("^(?<areaCode>\\d{3})-\\d{3}-\\d{4}$");
  });

  test("Simple literal", () => {
    const dsl: RegexDSL = [{ literal: "abc" }];
    expect(compileToJS(dsl)).toBe("abc");
  });

  test("Escaping special characters", () => {
    const dsl: RegexDSL = [{ literal: "a.b*c?" }];
    expect(compileToJS(dsl)).toBe("a\\.b\\*c\\?");
  });
});
