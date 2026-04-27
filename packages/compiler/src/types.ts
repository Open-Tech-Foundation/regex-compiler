export type CharClassType = "digit" | "word" | "whitespace" | "any";

export interface LiteralNode {
  literal: string;
}

export interface RepeatNode {
  repeat: {
    type: CharClassType | RegexNode | RegexNode[];
    count?: number;
    min?: number;
    max?: number;
  };
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
  | RepeatNode
  | CaptureNode
  | BoundaryNode;

export type RegexDSL = RegexNode[];
