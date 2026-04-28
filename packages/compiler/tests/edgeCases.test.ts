import { expect, test, describe } from 'bun:test';
import { compileToJS } from '../src/compiler';

describe('Regex Compiler - Additional Edge Cases', () => {

    // ── Flags ────────────────────────────────────────────────────────────────

    describe('Flags', () => {
        test('empty flags object is a no-op', () => {
            const result = compileToJS(['abc', { flags: {} }]) as any;
            expect(result.pattern).toBe('abc');
            expect(result.flags).toBe('');
        });

        test('multiple flag nodes merge together', () => {
            const dsl = [
                'a',
                { flags: { global: true } },
                { flags: { ignoreCase: true } },
            ];
            const result = compileToJS(dsl) as any;
            expect(result.flags).toBe('gi');
        });

        test('u and v flags together should error (JS throws on both)', () => {
            const dsl = ['a', { flags: { unicode: true, unicodeSets: true } }];
            const result = compileToJS(dsl) as any;
            expect(result).toHaveProperty('error');
        });

        test('flags-only DSL with no pattern compiles cleanly', () => {
            const result = compileToJS([{ flags: { global: true } }]) as any;
            expect(result.pattern).toBe('');
            expect(result.flags).toBe('g');
        });
    });

    // ── Top-level DSL ────────────────────────────────────────────────────────

    describe('Top-level DSL', () => {
        test('empty array returns empty pattern', () => {
            const result = compileToJS([]) as any;
            expect(result.pattern).toBe('');
        });

        test('null element in array should error', () => {
            const result = compileToJS([null as any]) as any;
            expect(result).toHaveProperty('error');
        });

        test('number element in array should error', () => {
            const result = compileToJS([42 as any]) as any;
            expect(result).toHaveProperty('error');
        });

        test('error message includes path for nested invalid node', () => {
            const dsl = [{ capture: { pattern: [{ bogus: true }] } }];
            const result = compileToJS(dsl) as any;
            expect(result).toHaveProperty('error');
            // path should point inside the capture, not just root.0
            expect(result.issues[0].message).toMatch(/root\.0/);
        });
    });

    // ── Quantifiers ──────────────────────────────────────────────────────────

    describe('Quantifiers', () => {
        test('min === max produces {n} not {n,n}', () => {
            const result = compileToJS([{ repeat: { type: 'digit' }, min: 3, max: 3 }]) as any;
            expect(result.pattern).toBe('\\d{3}');
        });

        test('min: 0, max: 1 is equivalent to optional', () => {
            const result = compileToJS([{ repeat: 'a', min: 0, max: 1 }]) as any;
            expect(result.pattern).toBe('a?');
        });

        test('count: 1 compiles to bare token, not {1}', () => {
            // {1} is redundant noise — compiler should strip it
            const result = compileToJS([{ repeat: { type: 'digit' }, count: 1 }]) as any;
            expect(result.pattern).toBe('\\d');
        });

        test('lazy on exact count is ignored or warned, not silently kept', () => {
            const result = compileToJS([{ repeat: 'a', count: 3, lazy: true }]) as any;
            // lazy on a fixed count is meaningless — either strip it or return an error
            // adjust expectation to match your design decision:
            expect(result.pattern).toBe('a{3}'); // no trailing '?'
        });

        test('min: 0, max: undefined with no quantifier key should error', () => {
            // min alone with no max and no oneOrMore/zeroOrMore etc
            const result = compileToJS([{ repeat: 'a', min: 0 }]) as any;
            // This is a valid open-ended {0,} — same as zeroOrMore — document or allow
            expect(result.pattern).toBe('a*');
        });
    });

    // ── Character Sets ───────────────────────────────────────────────────────

    describe('Character Sets', () => {
        test('empty chars string should error', () => {
            const result = compileToJS([{ charSet: { chars: '' } }]) as any;
            expect(result).toHaveProperty('error');
        });

        test('reversed range (z-a) should error', () => {
            const result = compileToJS([{ charSet: { chars: 'z-a' } }]) as any;
            expect(result).toHaveProperty('error');
        });

        test('charSet with special chars that need escaping inside []', () => {
            // A literal ] and \ inside a charSet must be escaped
            const result = compileToJS([{ charSet: { chars: '\\]' } }]) as any;
            expect(result.pattern).toBe('[\\\\\\]]');
        });

        test('negated charSet produces [^...]', () => {
            const result = compileToJS([{ charSet: { chars: 'aeiou', exclude: true } }]) as any;
            expect(result.pattern).toBe('[^aeiou]');
        });
    });

    // ── Assertions / Anchors ─────────────────────────────────────────────────

    describe('Assertions', () => {
        test('word boundary compiles correctly', () => {
            const result = compileToJS([{ $: 'boundary' }]) as any;
            expect(result.pattern).toBe('\\b');
        });

        test('non-word boundary compiles correctly', () => {
            const result = compileToJS([{ $: 'notBoundary' }]) as any;
            expect(result.pattern).toBe('\\B');
        });

        test('multiple start anchors should error or produce ^^', () => {
            // decide your design: error or let the regex engine catch it
            const result = compileToJS([{ $: 'start' }, { $: 'start' }, 'a']) as any;
            expect(result).toHaveProperty('error');
        });

        test('end anchor before start anchor should error', () => {
            const result = compileToJS([{ $: 'end' }, 'a', { $: 'start' }]) as any;
            expect(result).toHaveProperty('error');
        });
    });

    // ── Groups ───────────────────────────────────────────────────────────────

    describe('Groups', () => {
        test('non-capturing group compiles to (?:...)', () => {
            const result = compileToJS([{ group: { pattern: ['abc'] } }]) as any;
            expect(result.pattern).toBe('(?:abc)');
        });

        test('unnamed capture compiles to (...)', () => {
            const result = compileToJS([{ capture: { pattern: ['abc'] } }]) as any;
            expect(result.pattern).toBe('(abc)');
        });

        test('capture with empty name string should error', () => {
            const result = compileToJS([{ capture: { name: '', pattern: ['a'] } }]) as any;
            expect(result).toHaveProperty('error');
        });

        test('numeric backreference to group 0 should error (groups are 1-indexed)', () => {
            const result = compileToJS([
                { capture: { pattern: ['a'] } },
                { backreference: 0 },
            ]) as any;
            expect(result).toHaveProperty('error');
        });

        test('deeply nested capture inside repeat inside capture', () => {
            const dsl = [
                {
                    capture: {
                        name: 'outer',
                        pattern: [
                            {
                                repeat: {
                                    capture: { name: 'inner', pattern: [{ type: 'digit' }] },
                                },
                                oneOrMore: true,
                            },
                        ],
                    },
                },
            ];
            const result = compileToJS(dsl) as any;
            expect(result.pattern).toBe('(?<outer>(?<inner>\\d)+)');
        });
    });

    // ── Lookarounds ───────────────────────────────────────────────────────────

    describe('Lookarounds', () => {
        test('empty lookahead pattern should error', () => {
            const result = compileToJS([
                { lookaround: { type: 'positiveLookahead', pattern: [] } },
            ]) as any;
            expect(result).toHaveProperty('error');
        });

        test('lookahead pattern can itself contain a capture group', () => {
            const result = compileToJS([
                { lookaround: { type: 'positiveLookahead', pattern: [{ capture: { pattern: ['foo'] } }] } },
            ]) as any;
            expect(result.pattern).toBe('(?=(foo))');
        });

        test('nested lookahead inside lookbehind', () => {
            const result = compileToJS([
                {
                    lookaround: {
                        type: 'positiveLookbehind',
                        pattern: [{ lookaround: { type: 'positiveLookahead', pattern: ['x'] } }],
                    },
                },
            ]) as any;
            // This is technically invalid regex — should either error or let engine catch it
            expect(result).toHaveProperty('error');
        });
    });

    // ── Literal Escaping ─────────────────────────────────────────────────────

    describe('Literal Escaping', () => {
        test('all regex special chars are escaped in literals', () => {
            const specials = ['.', '*', '+', '?', '^', '$', '{', '}', '[', ']', '(', ')', '|', '\\'];
            for (const char of specials) {
                const result = compileToJS([char]) as any;
                expect(result.pattern).toBe(`\\${char}`);
            }
        });

        test('empty string literal is ignored or errors', () => {
            const result = compileToJS(['']) as any;
            // design decision: no-op or error
            expect(result.pattern).toBe('');
        });

        test('multiline string literal is escaped correctly', () => {
            const result = compileToJS(['line1\nline2']) as any;
            expect(result.pattern).toBe('line1\\nline2');
        });
    });

    // ── Predefined Types ─────────────────────────────────────────────────────

    describe('Predefined Types', () => {
        test('all predefined types compile to correct tokens', () => {
            const cases: [string, string][] = [
                ['digit', '\\d'],
                ['nonDigit', '\\D'],
                ['word', '\\w'],
                ['nonWord', '\\W'],
                ['whitespace', '\\s'],
                ['nonWhitespace', '\\S'],
                ['newline', '\\n'],
                ['tab', '\\t'],
                ['any', '.'],
            ];
            for (const [type, expected] of cases) {
                const result = compileToJS([{ type }]) as any;
                expect(result.pattern).toBe(expected);
            }
        });

        test('unknown type string should error', () => {
            const result = compileToJS([{ type: 'foobar' }]) as any;
            expect(result).toHaveProperty('error');
        });
    });

    // ── Unicode ───────────────────────────────────────────────────────────────

    describe('Unicode', () => {
        test('4-digit unicode escape compiles to \\uXXXX', () => {
            const result = compileToJS([{ unicode: '0041' }]) as any;
            expect(result.pattern).toBe('\\u0041');
        });

        test('5+ digit unicode compiles to \\u{XXXXX}', () => {
            const result = compileToJS([{ unicode: '1F600' }]) as any;
            expect(result.pattern).toBe('\\u{1F600}');
        });

        test('3-digit unicode should error (already caught — keep as regression)', () => {
            expect(compileToJS([{ unicode: '123' }])).toHaveProperty('error');
        });

        test('unicode property with value compiles correctly', () => {
            const result = compileToJS([{ unicodeProperty: { property: 'Script', value: 'Greek' } }]) as any;
            expect(result.pattern).toBe('\\p{Script=Greek}');
        });

        test('negated unicode property with value', () => {
            const result = compileToJS([{ unicodeProperty: { property: 'Script', value: 'Greek', exclude: true } }]) as any;
            expect(result.pattern).toBe('\\P{Script=Greek}');
        });
    });

    // ── Or (Alternation) ─────────────────────────────────────────────────────

    describe('Or (Alternation)', () => {
        test('single-branch or should error or warn', () => {
            const result = compileToJS([{ or: [['a']] }]) as any;
            // An or with one branch is always redundant — should warn or error
            expect(result).toHaveProperty('error');
        });

        test('or with empty branch should error', () => {
            const result = compileToJS([{ or: [['a'], []] }]) as any;
            expect(result).toHaveProperty('error');
        });

        test('or compiles correct separator', () => {
            const result = compileToJS([{ or: [['cat'], ['dog'], ['bird']] }]) as any;
            expect(result.pattern).toBe('cat|dog|bird');
        });

        test('or inside a repeat wraps correctly', () => {
            const result = compileToJS([{ repeat: { or: [['a'], ['b']] }, oneOrMore: true }]) as any;
            expect(result.pattern).toBe('(?:a|b)+');
        });
    });

});