export const EXAMPLE_REGISTRY = [
  {
    id: "phone",
    title: "International Phone Number",
    description: "Matches international format phone numbers starting with +, followed by country code and digits.",
    features: ["Quantifiers", "Literal Matching"],
    dsl: {
      nodes: [
        { startOfLine: true },
        { literal: "+" },
        { repeat: { type: "digit", count: 1 } },
        { literal: " " },
        { repeat: { type: "digit", count: 3 } },
        { literal: " " },
        { repeat: { type: "digit", count: 3 } },
        { literal: " " },
        { repeat: { type: "digit", count: 4 } },
        { endOfLine: true }
      ]
    },
    testCases: [
      { input: "+1 555 123 4567", expected: true },
      { input: "+91 987 654 3210", expected: true },
      { input: "123 456 7890", expected: false },
      { input: "+1 555 123", expected: false }
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
        { capture: { name: "user", pattern: [{ repeat: { type: { charSet: { chars: "-a-zA-Z0-9._%+", exclude: false } }, oneOrMore: true } }] } },
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
  },
  {
    id: "password",
    title: "Secure Password",
    description: "Password policy: 8+ chars, at least one digit and one letter.",
    features: ["Lookarounds", "Quantifiers"],
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
      { input: "nodesigits", expected: false }
    ]
  },
  {
    id: "html",
    title: "Basic HTML Tag",
    description: "Extracts content from simple HTML tags using named capture groups.",
    features: ["Backreferences", "Named Groups"],
    dsl: {
      nodes: [
        { literal: "<" },
        { capture: { name: "tag", pattern: [{ repeat: { type: "word", oneOrMore: true } }] } },
        { literal: ">" },
        { capture: { name: "content", pattern: [{ repeat: { type: "any", zeroOrMore: true, lazy: true } }] } },
        { literal: "</" },
        { backreference: "tag" },
        { literal: ">" }
      ]
    },
    testCases: [
      { input: "<div>content</div>", expected: true },
      { input: "<span>hello</span>", expected: true },
      { input: "<div>mismatch</span>", expected: false }
    ]
  },
  {
    id: "es2024",
    title: "ES2024 Consonants",
    description: "Uses new ES2024 Set Subtraction to match consonants only.",
    features: ["Set Subtraction", "v Flag"],
    dsl: {
      nodes: [
        { 
          charSet: { 
            subtraction: {
              left: { chars: "a-z" },
              right: { chars: "aeiou" }
            }
          } 
        }
      ],
      flags: { unicodeSets: true, ignoreCase: true }
    },
    testCases: [
      { input: "B", expected: true },
      { input: "Z", expected: true },
      { input: "A", expected: false },
      { input: "1", expected: false }
    ]
  }
];
