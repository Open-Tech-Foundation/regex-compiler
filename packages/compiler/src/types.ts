import { RegexDSL, RegexNode, CharClassType, Flags } from "./schema";

export { RegexDSL, RegexNode, CharClassType, Flags };

export interface CompiledRegex {
  pattern: string;
  flags: string;
}

export interface ValidationResult {
  success: boolean;
  error?: string;
  data?: RegexDSL;
}
