import { z } from "zod";

export const CharClassSchema = z.enum(["digit", "word", "whitespace", "any"]);

export const FlagsSchema = z.object({
  global: z.boolean().optional(),
  ignoreCase: z.boolean().optional(),
  multiline: z.boolean().optional(),
  dotAll: z.boolean().optional(),
  unicode: z.boolean().optional(),
  sticky: z.boolean().optional(),
});

// Recursive schema for Regex Nodes
export const RegexNodeSchema: z.ZodType<any> = z.lazy(() =>
  z.union([
    z.object({ literal: z.string() }),
    z.object({
      charSet: z.object({
        chars: z.string(),
        exclude: z.boolean().optional(),
      }),
    }),
    z.object({
      repeat: z.object({
        type: z.union([CharClassSchema, RegexNodeSchema, z.array(RegexNodeSchema)]),
        count: z.number().int().nonnegative().optional(),
        min: z.number().int().nonnegative().optional(),
        max: z.number().int().nonnegative().optional(),
        optional: z.boolean().optional(),
        oneOrMore: z.boolean().optional(),
        zeroOrMore: z.boolean().optional(),
      }),
    }),
    z.object({ choice: z.array(z.array(RegexNodeSchema)) }),
    z.object({
      capture: z.object({
        name: z.string().optional(),
        pattern: z.union([RegexNodeSchema, z.array(RegexNodeSchema)]),
      }),
    }),
    z.object({
      group: z.object({
        pattern: z.union([RegexNodeSchema, z.array(RegexNodeSchema)]),
      }),
    }),
    z.object({ startOfLine: z.boolean() }),
    z.object({ endOfLine: z.boolean() }),
    z.object({ wordBoundary: z.boolean() }),
    z.object({ nonWordBoundary: z.boolean() }),
    z.object({
      lookaround: z.object({
        type: z.enum(["positiveLookahead", "negativeLookahead", "positiveLookbehind", "negativeLookbehind"]),
        pattern: z.union([RegexNodeSchema, z.array(RegexNodeSchema)]),
      }),
    }),
    z.object({ backreference: z.union([z.string(), z.number()]) }),
  ])
);

export const RegexDSLSchema = z.object({
  nodes: z.array(RegexNodeSchema),
  flags: FlagsSchema.optional(),
});

export type RegexDSL = z.infer<typeof RegexDSLSchema>;
export type RegexNode = z.infer<typeof RegexNodeSchema>;
export type CharClassType = z.infer<typeof CharClassSchema>;
export type Flags = z.infer<typeof FlagsSchema>;
