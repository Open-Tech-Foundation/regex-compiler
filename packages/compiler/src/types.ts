export type CharClassType = "digit" | "word" | "whitespace" | "any";

export interface LiteralNode {
  literal: string;
}

export interface CharSetNode {
  charSet: {
    chars: string;
    exclude?: boolean;
  };
}

export interface RepeatNode {
  repeat: {
    type: CharClassType | RegexNode | RegexNode[];
    count?: number;
    min?: number;
    max?: number;
    optional?: boolean;
    oneOrMore?: boolean;
    zeroOrMore?: boolean;
  };
}

export interface ChoiceNode {
  choice: RegexNode[][];
}

export interface CaptureNode {
  capture: {
    name?: string;
    pattern: RegexNode | RegexNode[];
  };
}

export interface BoundaryNode {
  startOfLine?: boolean;
  endOfLine?: boolean;
}

export type RegexNode =
  | LiteralNode
  | CharSetNode
  | RepeatNode
  | ChoiceNode
  | CaptureNode
  | BoundaryNode;

export type RegexDSL = RegexNode[];

export interface CompiledRegex {
  pattern: string;
  flags?: string;
}
