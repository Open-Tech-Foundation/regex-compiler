import { z } from "zod";

export const CharClassSchema = z.enum([
  "digit", "nonDigit", 
  "word", "nonWord", 
  "whitespace", "nonWhitespace", 
  "any", 
  "tab", "newline", "carriageReturn"
]);

export const FlagsSchema = z.object({
  global: z.boolean().optional(),
  ignoreCase: z.boolean().optional(),
  multiline: z.boolean().optional(),
  dotAll: z.boolean().optional(),
  unicode: z.boolean().optional(),
  sticky: z.boolean().optional(),
  indices: z.boolean().optional(),
  unicodeSets: z.boolean().optional(),
});

// Advanced CharSet Operations (v flag support)
export const CharSetSchema: z.ZodType<any> = z.lazy(() =>
  z.union([
    z.object({ chars: z.string(), exclude: z.boolean().optional() }),
    z.object({ intersection: z.array(CharSetSchema).min(2) }),
    z.object({ subtraction: z.object({ left: CharSetSchema, right: CharSetSchema }) }),
  ])
);

// Recursive schema for Regex Nodes
export const RegexNodeSchema: z.ZodType<any> = z.lazy(() =>
  z.union([
    z.string(),
    z.object({ type: CharClassSchema }),
    z.object({ hex: z.string().regex(/^[0-9a-fA-F]{2}$/, "Must be 2 hex digits") }),
    z.object({ unicode: z.string().regex(/^[0-9a-fA-F]{4,5}$/, "Must be 4-5 hex digits") }),
    z.object({ charSet: CharSetSchema }),
    z.object({
      repeat: z.union([RegexNodeSchema, z.array(RegexNodeSchema)]),
      count: z.number().int().nonnegative().optional(),
      min: z.number().int().nonnegative().optional(),
      max: z.number().int().nonnegative().optional(),
      optional: z.boolean().optional(),
      oneOrMore: z.boolean().optional(),
      zeroOrMore: z.boolean().optional(),
      lazy: z.boolean().optional(),
    }).refine(data => {
      if (data.min !== undefined && data.max !== undefined) {
        return data.min <= data.max;
      }
      return true;
    }, {
      message: "min must be less than or equal to max",
      path: ["min"]
    }),
    z.object({ choice: z.array(z.array(RegexNodeSchema).min(1)).min(1) }),
    z.object({
      capture: z.object({
        name: z.string().optional(),
        pattern: z.union([RegexNodeSchema, z.array(RegexNodeSchema).min(1)]),
      }),
    }),
    z.object({
      group: z.object({
        pattern: z.union([RegexNodeSchema, z.array(RegexNodeSchema).min(1)]),
      }),
    }),
    z.object({ $: z.enum(["start", "end", "boundary", "notBoundary"]) }),
    z.object({
      lookaround: z.object({
        type: z.enum(["positiveLookahead", "negativeLookahead", "positiveLookbehind", "negativeLookbehind"]),
        pattern: z.union([RegexNodeSchema, z.array(RegexNodeSchema)]),
      }),
    }),
    z.object({ backreference: z.union([z.string(), z.number()]) }),
    z.object({
      unicodeProperty: z.object({
        property: z.string(),
        exclude: z.boolean().optional(),
      }),
    }),
  ])
);

export const RegexDSLSchema = z.union([
  z.array(z.union([
    RegexNodeSchema,
    z.object({ flags: FlagsSchema })
  ])),
  z.string(),
  z.object({
    pattern: z.union([RegexNodeSchema, z.array(RegexNodeSchema)]),
    flags: FlagsSchema.optional(),
  }),
  z.intersection(
    RegexNodeSchema,
    z.object({ flags: FlagsSchema.optional() })
  )
]);

export type RegexDSL = z.infer<typeof RegexDSLSchema>;
export type RegexNode = z.infer<typeof RegexNodeSchema>;
export type CharClassType = z.infer<typeof CharClassSchema>;
export type Flags = z.infer<typeof FlagsSchema>;
export type CharSetType = z.infer<typeof CharSetSchema>;
