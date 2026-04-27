export const REFERENCE_DATA = [
  {
    category: "Character Classes",
    items: [
      { 
        title: "Character Set",
        regex: "[abc]", 
        dsl: "{ \"charSet\": { \"chars\": \"abc\" } }", 
        description: "Matches any one of the enclosed characters. You can specify a range of characters by using a hyphen." 
      },
      { 
        title: "Negated Character Set",
        regex: "[^abc]", 
        dsl: "{ \"charSet\": { \"chars\": \"abc\", \"exclude\": true } }", 
        description: "Matches anything that is not enclosed in the brackets." 
      },
      { 
        title: "Character Set Subtraction",
        regex: "[A-Z--[AEIOU]]", 
        dsl: "{ \"charSet\": { \"subtraction\": { \"left\": { \"chars\": \"A-Z\" }, \"right\": { \"chars\": \"AEIOU\" } } } }", 
        description: "Matches characters in the left set EXCEPT those in the right set. Requires the 'v' flag." 
      },
      { 
        title: "Character Set Intersection",
        regex: "[a-z&&[p-z]]", 
        dsl: "{ \"charSet\": { \"intersection\": [ { \"chars\": \"a-z\" }, { \"chars\": \"p-z\" } ] } }", 
        description: "Matches characters that are present in BOTH sets. Requires the 'v' flag." 
      }
    ]
  },
  {
    category: "Predefined Classes",
    items: [
      { title: "Digit", regex: "\\d", dsl: "{ \"repeat\": { \"type\": \"digit\", \"count\": 1 } }", description: "Matches any digit (0-9)." },
      { title: "Non-Digit", regex: "\\D", dsl: "{ \"repeat\": { \"type\": \"nonDigit\", \"count\": 1 } }", description: "Matches any character that is not a digit." },
      { title: "Word Character", regex: "\\w", dsl: "{ \"repeat\": { \"type\": \"word\", \"count\": 1 } }", description: "Matches any alphanumeric character (A-Z, a-z, 0-9, _)." },
      { title: "Non-Word Character", regex: "\\W", dsl: "{ \"repeat\": { \"type\": \"nonWord\", \"count\": 1 } }", description: "Matches any character that is not a word character." },
      { title: "Whitespace", regex: "\\s", dsl: "{ \"repeat\": { \"type\": \"whitespace\", \"count\": 1 } }", description: "Matches a single white space character." }
    ]
  },
  {
    category: "Special Escapes",
    items: [
      { title: "Hex Escape", regex: "\\x41", dsl: "{ \"hex\": \"41\" }", description: "Matches the character with the given hex code (e.g., \\x41 matches 'A')." },
      { title: "Unicode Escape", regex: "\\u0041", dsl: "{ \"unicode\": \"0041\" }", description: "Matches the character with the given 4-digit Unicode hex code." },
      { title: "Unicode Code Point", regex: "\\u{1F600}", dsl: "{ \"unicode\": \"1F600\" }", description: "Matches the character with the given Unicode code point (requires 'u' or 'v' flag)." }
    ]
  },
  {
    category: "Quantifiers",
    items: [
      { title: "Asterisk", regex: "a*", dsl: "{ \"repeat\": { \"type\": ..., \"zeroOrMore\": true } }", description: "Matches 0 or more times." },
      { title: "Plus", regex: "a+", dsl: "{ \"repeat\": { \"type\": ..., \"oneOrMore\": true } }", description: "Matches 1 or more times." },
      { title: "Question Mark", regex: "a?", dsl: "{ \"repeat\": { \"type\": ..., \"optional\": true } }", description: "Matches 0 or 1 time." },
      { title: "Lazy Quantifier", regex: "a*?", dsl: "{ \"repeat\": { ..., \"lazy\": true } }", description: "Matches the smallest possible number of occurrences." }
    ]
  },
  {
    category: "Assertions",
    items: [
      { title: "Start of Input", regex: "^", dsl: "{ \"startOfLine\": true }", description: "Matches beginning of input." },
      { title: "End of Input", regex: "$", dsl: "{ \"endOfLine\": true }", description: "Matches end of input." },
      { title: "Word Boundary", regex: "\\b", dsl: "{ \"wordBoundary\": true }", description: "Matches a word boundary." },
      { title: "Positive Lookahead", regex: "(?=...)", dsl: "{ \"lookaround\": { \"type\": \"positiveLookahead\", \"pattern\": [...] } }", description: "Matches x only if followed by y." },
      { title: "Negative Lookahead", regex: "(?!...)", dsl: "{ \"lookaround\": { \"type\": \"negativeLookahead\", \"pattern\": [...] } }", description: "Matches x only if not followed by y." },
      { title: "Positive Lookbehind", regex: "(?<=...)", dsl: "{ \"lookaround\": { \"type\": \"positiveLookbehind\", \"pattern\": [...] } }", description: "Matches x only if preceded by y." }
    ]
  },
  {
    category: "Groups & Choice",
    items: [
      { title: "Alternation (OR)", regex: "x|y", dsl: "{ \"choice\": [ [nodeX], [nodeY] ] }", description: "Matches either x or y." },
      { title: "Capturing Group", regex: "(...)", dsl: "{ \"capture\": { \"pattern\": [...] } }", description: "Groups multiple tokens and creates a capture group." },
      { title: "Named Capturing Group", regex: "(?<name>...)", dsl: "{ \"capture\": { \"name\": \"name\", \"pattern\": [...] } }", description: "Named capture group." },
      { title: "Backreference", regex: "\\k<name>", dsl: "{ \"backreference\": \"name\" }", description: "Matches the same text as previously matched by a group." }
    ]
  },
  {
    category: "Flags",
    items: [
      { title: "Global", regex: "g", dsl: "{ \"flags\": { \"global\": true } }", description: "Find all matches." },
      { title: "Ignore Case", regex: "i", dsl: "{ \"flags\": { \"ignoreCase\": true } }", description: "Ignore case sensitivity." },
      { title: "Indices", regex: "d", dsl: "{ \"flags\": { \"indices\": true } }", description: "Generates indices for capture groups." },
      { title: "Unicode Sets", regex: "v", dsl: "{ \"flags\": { \"unicodeSets\": true } }", description: "Enables advanced Unicode features (ES2024)." }
    ]
  }
];
