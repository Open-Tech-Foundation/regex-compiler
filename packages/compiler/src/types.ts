export type { RegexDSL, RegexNode, CharClassType, Flags, CharSetType } from './schema';

export interface DSLMapping {
  path: string;
  start: number;
  end: number;
}

export interface CompiledRegex {
  pattern: string;
  flags: string;
  mappings?: DSLMapping[];
}

export interface ValidationResult {
  success: boolean;
  error?: string;
  issues?: { path: string; message: string }[];
  data?: any;
}
