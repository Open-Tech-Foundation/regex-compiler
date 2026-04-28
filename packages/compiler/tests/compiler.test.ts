import { expect, test, describe } from 'bun:test';
import { compileToJS } from '../src/compiler';

describe('Regex Compiler - Basic Support', () => {
  test('Basic Literals and Escaping', () => {
    const dsl = ['hello.world'];
    const result = compileToJS(dsl) as any;
    expect(result.pattern).toBe('hello\\.world');
  });

  test('Character Classes and Flags', () => {
    const dsl = [
      { repeat: { type: 'digit' }, oneOrMore: true },
      { flags: { global: true, ignoreCase: true } },
    ];
    const result = compileToJS(dsl) as any;
    expect(result.pattern).toBe('\\d+');
    expect(result.flags).toBe('gi');
  });

  test('Inverse Classes and Special Escapes', () => {
    const dsl = [
      { repeat: { type: 'nonDigit' }, oneOrMore: true },
      { repeat: { type: 'tab' }, count: 1 },
      { repeat: { type: 'nonWord' }, zeroOrMore: true },
    ];
    const result = compileToJS(dsl) as any;
    expect(result.pattern).toBe('\\D+\\t\\W*');
  });

  test('Lazy Quantifiers', () => {
    const dsl = [{ repeat: { type: 'any' }, zeroOrMore: true, lazy: true }, 'end'];
    const result = compileToJS(dsl) as any;
    expect(result.pattern).toBe('.*?end');
  });
});

describe('Regex Compiler - Advanced Support', () => {
  test('Unicode Properties', () => {
    const dsl = [
      { unicodeProperty: { property: 'L' } },
      { unicodeProperty: { property: 'N', exclude: true } },
    ];
    const result = compileToJS(dsl) as any;
    expect(result.pattern).toBe('\\p{L}\\P{N}');
  });

  test('Named Capture Groups', () => {
    const dsl = [
      { capture: { name: 'val', pattern: [{ repeat: { type: 'word' }, oneOrMore: true }] } },
    ];
    const result = compileToJS(dsl) as any;
    expect(result.pattern).toBe('(?<val>\\w+)');
  });

  test('Lookaheads and Lookbehinds', () => {
    const pos = [{ lookaround: { type: 'positiveLookahead', pattern: ['foo'] } }];
    expect((compileToJS(pos) as any).pattern).toBe('(?=foo)');

    const neg = [{ lookaround: { type: 'negativeLookahead', pattern: ['foo'] } }];
    expect((compileToJS(neg) as any).pattern).toBe('(?!foo)');

    const posB = [{ lookaround: { type: 'positiveLookbehind', pattern: ['foo'] } }];
    expect((compileToJS(posB) as any).pattern).toBe('(?<=foo)');

    const negB = [{ lookaround: { type: 'negativeLookbehind', pattern: ['foo'] } }];
    expect((compileToJS(negB) as any).pattern).toBe('(?<!foo)');
  });

  test('Backreferences', () => {
    const dsl = [
      { capture: { name: 'quote', pattern: [{ charSet: { chars: '\'"' } }] } },
      { repeat: { type: 'any' }, zeroOrMore: true },
      { backreference: 'quote' },
    ];
    const result = compileToJS(dsl) as any;
    expect(result.pattern).toBe('(?<quote>[\'"]).*\\k<quote>');
  });

  test('Character Set Subtraction (v flag)', () => {
    const dsl = [
      {
        charSet: {
          subtraction: {
            left: { chars: 'A-Z' },
            right: { chars: 'AEIOU' },
          },
        },
      },
      { flags: { unicodeSets: true } },
    ];
    const result = compileToJS(dsl) as any;
    expect(result.pattern).toBe('[[A-Z]--[AEIOU]]');
    expect(result.flags).toBe('v');
  });

  test('Character Set Intersection (v flag)', () => {
    const dsl = [
      {
        charSet: {
          intersection: [{ chars: 'a-z' }, { chars: 'p-z' }],
        },
      },
      { flags: { unicodeSets: true } },
    ];
    const result = compileToJS(dsl) as any;
    expect(result.pattern).toBe('[[a-z]&&[p-z]]');
    expect(result.flags).toBe('v');
  });

  test('Hex and Unicode Escapes', () => {
    const dsl = [{ hex: '41' }, { unicode: '0042' }, { unicode: '1F600' }];
    const result = compileToJS(dsl) as any;
    expect(result.pattern).toBe('\\x41\\u0042\\u{1F600}');
  });
});

describe('Regex Compiler - Edge Cases & Bug Fixes', () => {
  test('Invalid DSL - Unrecognized Node', () => {
    const dsl = [{ unknownNode: true }];
    const result = compileToJS(dsl) as any;
    expect(result.error).toBeDefined();
    expect(result.error).toContain(
      'root.0: Unrecognized or invalid node structure. Found keys: unknownNode',
    );
  });

  test('count: 0 should generate {0}', () => {
    const dsl = [{ repeat: { type: 'digit' }, count: 0 }];
    const result = compileToJS(dsl) as any;
    expect(result.pattern).toBe('\\d{0}');
  });

  test('nested repeats should be wrapped in non-capturing groups', () => {
    const dsl = [
      {
        repeat: { repeat: { type: 'digit' }, count: 3 },
        oneOrMore: true,
      },
    ];
    const result = compileToJS(dsl) as any;
    expect(result.pattern).toBe('(?:\\d{3})+');
  });

  test('multi-character literals in repeat should be wrapped', () => {
    const dsl = [{ repeat: 'abc', zeroOrMore: true }];
    const result = compileToJS(dsl) as any;
    expect(result.pattern).toBe('(?:abc)*');
  });

  test('Email Validator', () => {
    const dsl = [
      { $: 'start' },
      {
        capture: {
          name: 'user',
          pattern: [
            { repeat: { charSet: { chars: 'a-zA-Z0-9._%+-', exclude: false } }, oneOrMore: true },
          ],
        },
      },
      '@',
      {
        capture: {
          name: 'domain',
          pattern: [
            { repeat: { charSet: { chars: 'a-zA-Z0-9.-', exclude: false } }, oneOrMore: true },
          ],
        },
      },
      '.',
      {
        capture: {
          name: 'tld',
          pattern: [{ repeat: { charSet: { chars: 'a-zA-Z', exclude: false } }, min: 2 }],
        },
      },
      { $: 'end' },
      { flags: { ignoreCase: true } },
    ];
    const result = compileToJS(dsl) as any;
    expect(result.pattern).toBe(
      '^(?<user>[a-zA-Z0-9._%+-]+)@(?<domain>[a-zA-Z0-9.-]+)\\.(?<tld>[a-zA-Z]{2,})$',
    );
    expect(result.flags).toBe('i');
  });

  test('Complex Nested Choice and Repeats', () => {
    const dsl = [
      {
        repeat: {
          choice: [['a'], [{ repeat: { type: 'digit' }, count: 2 }]],
        },
        optional: true,
      },
    ];
    const result = compileToJS(dsl) as any;
    expect(result.pattern).toBe('(?:a|\\d{2})?');
  });

  test('concatenated groups in repeat should be wrapped', () => {
    const dsl = [
      {
        repeat: [{ capture: { pattern: ['a'] } }, { capture: { pattern: ['b'] } }],
        oneOrMore: true,
      },
    ];
    const result = compileToJS(dsl) as any;
    expect(result.pattern).toBe('(?:(a)(b))+');
  });

  test('concatenated character sets in repeat should be wrapped', () => {
    const dsl = [
      {
        repeat: [{ charSet: { chars: 'a' } }, { charSet: { chars: 'b' } }],
        zeroOrMore: true,
      },
    ];
    const result = compileToJS(dsl) as any;
    expect(result.pattern).toBe('(?:[a][b])*');
  });

  describe('Logical Validation', () => {
    test('should catch duplicate capture group names', () => {
      const dsl = [
        { capture: { name: 'user', pattern: ['a'] } },
        { capture: { name: 'user', pattern: ['b'] } },
      ];
      const result = compileToJS(dsl) as any;
      expect(result).toHaveProperty('error');
      expect(result.issues[0].message).toContain('Duplicate capture group name');
    });

    test('should catch invalid numeric backreferences', () => {
      const dsl = [{ capture: { pattern: ['a'] } }, { backreference: 2 }];
      const result = compileToJS(dsl) as any;
      expect(result).toHaveProperty('error');
      expect(result.issues[0].message).toContain('Group 2 does not exist');
    });

    test('should catch invalid named backreferences', () => {
      const dsl = [{ capture: { name: 'user', pattern: ['a'] } }, { backreference: 'admin' }];
      const result = compileToJS(dsl) as any;
      expect(result).toHaveProperty('error');
      expect(result.issues[0].message).toContain('Named group "admin" does not exist');
    });

    test('should catch logical quantifier errors (min > max)', () => {
      const dsl = [{ repeat: { type: 'digit' }, min: 5, max: 2 }];
      const result = compileToJS(dsl) as any;
      expect(result).toHaveProperty('error');
      expect(result.issues[0].message).toContain('min must be less than or equal to max');
    });

    test('should catch conflicting quantifiers', () => {
      const dsl = [{ repeat: { type: 'digit' }, oneOrMore: true, count: 4 }];
      const result = compileToJS(dsl) as any;
      expect(result).toHaveProperty('error');
      expect(result.issues[0].message).toContain('Conflicting quantifiers');
    });

    test('should enforce strict hex and unicode formats', () => {
      expect(compileToJS([{ hex: 'G1' }])).toHaveProperty('error');
      expect(compileToJS([{ unicode: '123' }])).toHaveProperty('error');
    });

    test('should reject empty choices and captures', () => {
      expect(compileToJS([{ choice: [] }])).toHaveProperty('error');
      expect(compileToJS([{ capture: { pattern: [] } }])).toHaveProperty('error');
    });

    test('should catch negative count/min/max', () => {
      expect(compileToJS([{ repeat: { type: 'digit' }, count: -1 }])).toHaveProperty('error');
      expect(compileToJS([{ repeat: { type: 'digit' }, min: -5 }])).toHaveProperty('error');
    });

    test('should support implicit string literals', () => {
      const dsl = ['abc', '.', 'def'];
      const result = compileToJS(dsl) as any;
      expect(result.pattern).toBe('abc\\.def');
    });
  });
});
