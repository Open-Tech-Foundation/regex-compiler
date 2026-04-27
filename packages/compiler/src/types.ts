export type { RegexDSL, RegexNode, CharClassType, Flags } from "./schema";

export interface CompiledRegex {
  pattern: string;
  flags: string;
}

export interface ValidationResult {
  success: boolean;
  error?: string;
  data?: any; // Using any here to avoid circular dependency issues with the schema-derived type
}
