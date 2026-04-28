export type { RegexDSL, RegexNode, CharClassType, Flags, CharSetType } from './schema';

export interface CompiledRegex {
  pattern: string;
  flags: string;
}

export interface ValidationResult {
  success: boolean;
  error?: string;
  issues?: { path: string; message: string }[];
  data?: any;
}
