import { compileToJS } from "../packages/compiler/src/compiler";

const EXAMPLE_REGISTRY = [
  {
    id: "email",
    title: "Email Validator",
    dsl: {
      nodes: [
        { startOfLine: true },
        { capture: { name: "user", pattern: [{ repeat: { type: { charSet: { chars: "a-zA-Z0-9._%+-", exclude: false } }, oneOrMore: true } }] } },
        { literal: "@" },
        { 
          capture: { 
            name: "domain", 
            pattern: [
              { repeat: { type: { charSet: { chars: "a-zA-Z0-9-", exclude: false } }, oneOrMore: true } },
              { 
                repeat: { 
                  type: [
                    { literal: "." },
                    { repeat: { type: { charSet: { chars: "a-zA-Z0-9-", exclude: false } }, oneOrMore: true } }
                  ], 
                  zeroOrMore: true 
                } 
              }
            ] 
          } 
        },
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
  }
];

const example = EXAMPLE_REGISTRY[0];
const compilationResult = compileToJS(example.dsl);

if ('error' in compilationResult) {
  console.log("Error:", compilationResult.error);
} else {
  const re = new RegExp(compilationResult.pattern, compilationResult.flags);
  console.log("Regex:", re.toString());
  
  let passed = 0;
  example.testCases.forEach(tc => {
    const isMatch = re.test(tc.input);
    const isCorrect = isMatch === tc.expected;
    if (isCorrect) passed++;
    console.log(`Input: ${tc.input.padEnd(25)} | Match: ${isMatch.toString().padEnd(5)} | Expected: ${tc.expected.toString().padEnd(5)} | Result: ${isCorrect ? "PASS" : "FAIL"}`);
  });
  console.log(`Summary: ${passed} / ${example.testCases.length} Passed`);
}
