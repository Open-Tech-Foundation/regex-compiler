export const REFERENCE_DATA = [
  {
    category: "Character Classes",
    items: [
      { 
        title: "Any Character", 
        regex: ".", 
        dsl: "{ \"repeat\": { \"type\": \"any\", \"count\": 1 } }", 
        description: "Matches any character except line breaks.",
        testString: "glib jocks vex dwarves!",
        details: [{ part: ".", meaning: "Any character (except newline)" }]
      },
      { 
        title: "Character Set",
        regex: "[abc]", 
        dsl: "{ \"charSet\": { \"chars\": \"abc\" } }", 
        description: "Matches any one of the enclosed characters.",
        testString: "alphabet soup",
        details: [{ part: "[abc]", meaning: "Matches 'a', 'b', or 'c'" }]
      },
      { 
        title: "Negated Character Set",
        regex: "[^abc]", 
        dsl: "{ \"charSet\": { \"chars\": \"abc\", \"exclude\": true } }", 
        description: "Matches anything that is not enclosed in the brackets.",
        testString: "apple",
        details: [{ part: "[^abc]", meaning: "Matches any character EXCEPT 'a', 'b', or 'c'" }]
      },
      { 
        title: "Character Set Subtraction",
        regex: "[A-Z--[AEIOU]]", 
        dsl: "{ \"charSet\": { \"subtraction\": { \"left\": { \"chars\": \"A-Z\" }, \"right\": { \"chars\": \"AEIOU\" } } } }", 
        description: "Matches characters in the left set EXCEPT those in the right set.",
        testString: "BADGE",
        details: [
          { part: "[A-Z]", meaning: "Uppercase letters A-Z" },
          { part: "--", meaning: "Subtraction operator" },
          { part: "[AEIOU]", meaning: "Excluded vowels" }
        ]
      },
      { 
        title: "Character Set Intersection",
        regex: "[a-z&&[p-z]]", 
        dsl: "{ \"charSet\": { \"intersection\": [ { \"chars\": \"a-z\" }, { \"chars\": \"p-z\" } ] } }", 
        description: "Matches characters that are present in BOTH sets.",
        testString: "pqrst",
        details: [
          { part: "[a-z]", meaning: "Range a-z" },
          { part: "&&", meaning: "Intersection operator" },
          { part: "[p-z]", meaning: "Range p-z" }
        ]
      }
    ]
  },
  {
    category: "Predefined Classes",
    items: [
      { 
        title: "Digit", 
        regex: "\\d", 
        dsl: "{ \"repeat\": { \"type\": \"digit\", \"count\": 1 } }", 
        description: "Matches any digit (0-9).", 
        testString: "Agent 007",
        details: [{ part: "\\d", meaning: "Any digit 0-9" }]
      },
      { 
        title: "Non-Digit", 
        regex: "\\D", 
        dsl: "{ \"repeat\": { \"type\": \"nonDigit\", \"count\": 1 } }", 
        description: "Matches any character that is not a digit.", 
        testString: "Agent 007",
        details: [{ part: "\\D", meaning: "Any character NOT a digit" }]
      },
      { 
        title: "Word Character", 
        regex: "\\w", 
        dsl: "{ \"repeat\": { \"type\": \"word\", \"count\": 1 } }", 
        description: "Matches any alphanumeric character plus underscore.", 
        testString: "var_1 = 10",
        details: [{ part: "\\w", meaning: "A-Z, a-z, 0-9, and _" }]
      },
      { 
        title: "Non-Word Character", 
        regex: "\\W", 
        dsl: "{ \"repeat\": { \"type\": \"nonWord\", \"count\": 1 } }", 
        description: "Matches any character that is not a word character.", 
        testString: "100%",
        details: [{ part: "\\W", meaning: "Any character NOT a word character" }]
      },
      { 
        title: "Whitespace", 
        regex: "\\s", 
        dsl: "{ \"repeat\": { \"type\": \"whitespace\", \"count\": 1 } }", 
        description: "Matches any whitespace character.", 
        testString: "a b\nc",
        details: [{ part: "\\s", meaning: "Space, tab, newline, etc." }]
      },
      { 
        title: "Non-Whitespace", 
        regex: "\\S", 
        dsl: "{ \"repeat\": { \"type\": \"nonWhitespace\", \"count\": 1 } }", 
        description: "Matches any character that is not whitespace.", 
        testString: " a ",
        details: [{ part: "\\S", meaning: "Any character NOT whitespace" }]
      },
      { 
        title: "Newline", 
        regex: "\\n", 
        dsl: "{ \"repeat\": { \"type\": \"newline\", \"count\": 1 } }", 
        description: "Matches a line feed character.", 
        testString: "line1\nline2",
        details: [{ part: "\\n", meaning: "Newline character (LF)" }]
      },
      { 
        title: "Tab", 
        regex: "\\t", 
        dsl: "{ \"repeat\": { \"type\": \"tab\", \"count\": 1 } }", 
        description: "Matches a horizontal tab character.", 
        testString: "col1\tcol2",
        details: [{ part: "\\t", meaning: "Tab character" }]
      }
    ]
  },
  {
    category: "Special Escapes",
    items: [
      { 
        title: "Hex Escape", 
        regex: "\\x41", 
        dsl: "{ \"hex\": \"41\" }", 
        description: "Matches character with hex code 41 ('A').", 
        testString: "ABC",
        details: [{ part: "\\x41", meaning: "Hex character 41" }]
      },
      { 
        title: "Unicode Escape", 
        regex: "\\u0041", 
        dsl: "{ \"unicode\": \"0041\" }", 
        description: "Matches character with 4-digit Unicode hex code.", 
        testString: "ABC",
        details: [{ part: "\\u0041", meaning: "Unicode character U+0041" }]
      },
      { 
        title: "Unicode Code Point", 
        regex: "\\u{1F600}", 
        dsl: "{ \"unicode\": \"1F600\" }", 
        description: "Matches character with Unicode code point.", 
        testString: "😀 smile",
        details: [{ part: "\\u{1F600}", meaning: "Unicode code point U+1F600" }]
      },
      { 
        title: "Unicode Property", 
        regex: "\\p{L}", 
        dsl: "{ \"unicodeProperty\": { \"property\": \"L\" } }", 
        description: "Matches characters based on Unicode properties.", 
        testString: "aΩ中",
        details: [{ part: "\\p{L}", meaning: "Any Unicode Letter" }]
      },
      { 
        title: "Negated Property", 
        regex: "\\P{L}", 
        dsl: "{ \"unicodeProperty\": { \"property\": \"L\", \"exclude\": true } }", 
        description: "Matches characters NOT having specified Unicode property.", 
        testString: "123!@#",
        details: [{ part: "\\P{L}", meaning: "Any character NOT a Unicode Letter" }]
      }
    ]
  },
  {
    category: "Quantifiers",
    items: [
      { 
        title: "Asterisk", 
        regex: "a*", 
        dsl: "{ \"repeat\": { \"type\": { \"literal\": \"a\" }, \"zeroOrMore\": true } }", 
        description: "Matches 0 or more times.", 
        testString: "baaaa!",
        details: [{ part: "*", meaning: "0 or more times (greedy)" }]
      },
      { 
        title: "Plus", 
        regex: "a+", 
        dsl: "{ \"repeat\": { \"type\": { \"literal\": \"a\" }, \"oneOrMore\": true } }", 
        description: "Matches 1 or more times.", 
        testString: "baaaa!",
        details: [{ part: "+", meaning: "1 or more times (greedy)" }]
      },
      { 
        title: "Question Mark", 
        regex: "a?", 
        dsl: "{ \"repeat\": { \"type\": { \"literal\": \"a\" }, \"optional\": true } }", 
        description: "Matches 0 or 1 time.", 
        testString: "apple pear",
        details: [{ part: "?", meaning: "Optional (0 or 1 time)" }]
      },
      { 
        title: "Range (min, max)", 
        regex: "a{2,5}", 
        dsl: "{ \"repeat\": { \"type\": { \"literal\": \"a\" }, \"min\": 2, \"max\": 5 } }", 
        description: "Matches between n and m times.", 
        testString: "baaaa!",
        details: [{ part: "{2,5}", meaning: "Between 2 and 5 times" }]
      },
      { 
        title: "Lazy Quantifier", 
        regex: "a*?", 
        dsl: "{ \"repeat\": { \"type\": { \"literal\": \"a\" }, \"zeroOrMore\": true, \"lazy\": true } }", 
        description: "Matches the smallest possible number of occurrences.", 
        testString: "baaaa!",
        details: [{ part: "*?", meaning: "0 or more times (non-greedy)" }]
      }
    ]
  },
  {
    category: "Assertions",
    items: [
      { 
        title: "Start of Input", 
        regex: "^", 
        dsl: "{ \"startOfLine\": true }", 
        description: "Matches beginning of input.", 
        testString: "hello",
        details: [{ part: "^", meaning: "Start of line/input" }]
      },
      { 
        title: "End of Input", 
        regex: "$", 
        dsl: "{ \"endOfLine\": true }", 
        description: "Matches end of input.", 
        testString: "hello",
        details: [{ part: "$", meaning: "End of line/input" }]
      },
      { 
        title: "Word Boundary", 
        regex: "\\b", 
        dsl: "{ \"wordBoundary\": true }", 
        description: "Matches a word boundary position.", 
        testString: "hi there!",
        details: [{ part: "\\b", meaning: "Boundary between word/non-word" }]
      },
      { 
        title: "Non-Word Boundary", 
        regex: "\\B", 
        dsl: "{ \"nonWordBoundary\": true }", 
        description: "Matches position NOT at a word boundary.", 
        testString: "hello",
        details: [{ part: "\\B", meaning: "Not a word boundary" }]
      },
      { 
        title: "Positive Lookahead", 
        regex: "(?=pie)", 
        dsl: "{ \"lookaround\": { \"type\": \"positiveLookahead\", \"pattern\": [{ \"literal\": \"pie\" }] } }", 
        description: "Matches position followed by pattern.", 
        testString: "applepie",
        details: [{ part: "(?=...)", meaning: "Positive Lookahead" }]
      },
      { 
        title: "Negative Lookahead", 
        regex: "(?!pie)", 
        dsl: "{ \"lookaround\": { \"type\": \"negativeLookahead\", \"pattern\": [{ \"literal\": \"pie\" }] } }", 
        description: "Matches position NOT followed by pattern.", 
        testString: "applesauce",
        details: [{ part: "(?!...)", meaning: "Negative Lookahead" }]
      },
      { 
        title: "Positive Lookbehind", 
        regex: "(?<=apple)", 
        dsl: "{ \"lookaround\": { \"type\": \"positiveLookbehind\", \"pattern\": [{ \"literal\": \"apple\" }] } }", 
        description: "Matches position preceded by pattern.", 
        testString: "applepie",
        details: [{ part: "(?<=...)", meaning: "Positive Lookbehind" }]
      },
      { 
        title: "Negative Lookbehind", 
        regex: "(?<!apple)", 
        dsl: "{ \"lookaround\": { \"type\": \"negativeLookbehind\", \"pattern\": [{ \"literal\": \"apple\" }] } }", 
        description: "Matches position NOT preceded by pattern.", 
        testString: "cherrypie",
        details: [{ part: "(?<!...)", meaning: "Negative Lookbehind" }]
      }
    ]
  },
  {
    category: "Groups & Choice",
    items: [
      { 
        title: "Alternation (OR)", 
        regex: "cat|dog", 
        dsl: "{ \"choice\": [ [{ \"literal\": \"cat\" }], [{ \"literal\": \"dog\" }] ] }", 
        description: "Matches either pattern.", 
        testString: "cat dog",
        details: [{ part: "|", meaning: "Choice/OR operator" }]
      },
      { 
        title: "Capturing Group", 
        regex: "(abc)", 
        dsl: "{ \"capture\": { \"pattern\": [{ \"literal\": \"abc\" }] } }", 
        description: "Groups pattern and creates a capture group.", 
        testString: "abcabc",
        details: [{ part: "(...)", meaning: "Capturing group" }]
      },
      { 
        title: "Named Capturing Group", 
        regex: "(?<year>\\d{4})", 
        dsl: "{ \"capture\": { \"name\": \"year\", \"pattern\": [{ \"repeat\": { \"type\": \"digit\", \"count\": 4 } }] } }", 
        description: "Groups pattern and gives it a name.", 
        testString: "2024-04-28",
        details: [{ part: "(?<name>...)", meaning: "Named capturing group" }]
      },
      { 
        title: "Non-Capturing Group", 
        regex: "(?:abc)", 
        dsl: "{ \"group\": { \"pattern\": [{ \"literal\": \"abc\" }] } }", 
        description: "Groups without capturing.", 
        testString: "abcabc",
        details: [{ part: "(?:...)", meaning: "Non-capturing group" }]
      },
      { 
        title: "Backreference (Numeric)", 
        regex: "\\1", 
        dsl: "{ \"backreference\": 1 }", 
        description: "Matches same text as captured by group index.", 
        testString: "aa",
        details: [{ part: "\\1", meaning: "Backreference to group 1" }]
      },
      { 
        title: "Backreference (Named)", 
        regex: "\\k<year>", 
        dsl: "{ \"backreference\": \"year\" }", 
        description: "Matches same text as captured by named group.", 
        testString: "2024-2024",
        details: [{ part: "\\k<name>", meaning: "Backreference to named group" }]
      }
    ]
  },
  {
    category: "Flags",
    items: [
      { 
        title: "Global", 
        regex: "g", 
        dsl: "{ \"flags\": { \"global\": true } }", 
        description: "Find all matches.", 
        testString: "banana",
        details: [{ part: "g", meaning: "Global search" }]
      },
      { 
        title: "Ignore Case", 
        regex: "i", 
        dsl: "{ \"flags\": { \"ignoreCase\": true } }", 
        description: "Case-insensitive matching.", 
        testString: "Apple APPLE",
        details: [{ part: "i", meaning: "Case-insensitive" }]
      },
      { 
        title: "Multiline", 
        regex: "m", 
        dsl: "{ \"flags\": { \"multiline\": true } }", 
        description: "Treats ^ and $ as matching line starts/ends.", 
        testString: "line1\nline2",
        details: [{ part: "m", meaning: "Multiline mode" }]
      },
      { 
        title: "DotAll (Single line)", 
        regex: "s", 
        dsl: "{ \"flags\": { \"dotAll\": true } }", 
        description: "Allows . to match newlines.", 
        testString: "a\nb",
        details: [{ part: "s", meaning: "DotAll mode" }]
      },
      { 
        title: "Unicode", 
        regex: "u", 
        dsl: "{ \"flags\": { \"unicode\": true } }", 
        description: "Full Unicode support.", 
        testString: "😀",
        details: [{ part: "u", meaning: "Unicode mode" }]
      },
      { 
        title: "Sticky", 
        regex: "y", 
        dsl: "{ \"flags\": { \"sticky\": true } }", 
        description: "Matches only from current position.", 
        testString: "banana",
        details: [{ part: "y", meaning: "Sticky mode" }]
      },
      { 
        title: "Indices", 
        regex: "d", 
        dsl: "{ \"flags\": { \"indices\": true } }", 
        description: "Generates indices for matches.", 
        testString: "abc",
        details: [{ part: "d", meaning: "Indices mode" }]
      },
      { 
        title: "Unicode Sets", 
        regex: "v", 
        dsl: "{ \"flags\": { \"unicodeSets\": true } }", 
        description: "Advanced Unicode features (ES2024).", 
        testString: "[A--B]",
        details: [{ part: "v", meaning: "Unicode Sets mode" }]
      }
    ]
  }
];
