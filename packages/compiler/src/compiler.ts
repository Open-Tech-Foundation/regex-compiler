import type { RegexDSL, RegexNode, CharClassType, Flags, CompiledRegex, ValidationResult, CharSetType } from "./types";
import { RegexDSLSchema } from "./schema";

function escapeLiteral(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isAtomic(pattern: string): boolean {
  if (pattern.length <= 1) return true;
  if (pattern.startsWith("\\")) {
    if (pattern.length === 2) return true;
    if (/^\\(x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|u\{[0-9a-fA-F]+\}|p\{.*\}|P\{.*\})$/.test(pattern)) return true;
  }

  // Balanced bracket/parenthesis check
  const opener = pattern[0];
  const closer = opener === "[" ? "]" : opener === "(" ? ")" : null;

  if (closer && pattern.endsWith(closer)) {
    let depth = 0;
    for (let i = 0; i < pattern.length; i++) {
      const char = pattern[i];
      const isEscaped = i > 0 && pattern[i - 1] === "\\";
      if (!isEscaped) {
        if (char === opener) depth++;
        if (char === closer) depth--;
      }
      if (depth === 0 && i < pattern.length - 1) return false;
    }
    return depth === 0;
  }

  return false;
}

function mapCharClass(type: CharClassType): string {
  switch (type) {
    case "digit": return "\\d";
    case "nonDigit": return "\\D";
    case "word": return "\\w";
    case "nonWord": return "\\W";
    case "whitespace": return "\\s";
    case "nonWhitespace": return "\\S";
    case "tab": return "\\t";
    case "newline": return "\\n";
    case "carriageReturn": return "\\r";
    case "any": return ".";
    default: return "";
  }
}

function compileFlags(flags?: Flags): string {
  if (!flags) return "";
  let f = "";
  if (flags.global) f += "g";
  if (flags.ignoreCase) f += "i";
  if (flags.multiline) f += "m";
  if (flags.dotAll) f += "s";
  if (flags.unicode) f += "u";
  if (flags.sticky) f += "y";
  if (flags.indices) f += "d";
  if (flags.unicodeSets) f += "v";
  return f;
}

function compileCharSet(node: CharSetType): string {
  if ("chars" in node) {
    return `${node.exclude ? "^" : ""}${node.chars}`;
  }
  if ("intersection" in node) {
    return (node.intersection as CharSetType[])
      .map(n => `[${compileCharSet(n)}]`)
      .join("&&");
  }
  if ("subtraction" in node) {
    const { left, right } = node.subtraction;
    return `[${compileCharSet(left)}]--[${compileCharSet(right)}]`;
  }
  return "";
}

function compileNode(node: RegexNode): string {
  if ("literal" in node) {
    return escapeLiteral(node.literal);
  }

  if ("hex" in node) {
    return `\\x${node.hex}`;
  }

  if ("unicode" in node) {
    return node.unicode.length > 4 
      ? `\\u{${node.unicode}}` 
      : `\\u${node.unicode}`;
  }

  if ("charSet" in node) {
    return `[${compileCharSet(node.charSet)}]`;
  }

  if ("unicodeProperty" in node) {
    const { property, exclude } = node.unicodeProperty;
    return `\\${exclude ? "P" : "p"}{${property}}`;
  }

  if ("startOfLine" in node && node.startOfLine) {
    return "^";
  }

  if ("endOfLine" in node && node.endOfLine) {
    return "$";
  }

  if ("wordBoundary" in node && node.wordBoundary) {
    return "\\b";
  }

  if ("nonWordBoundary" in node && node.nonWordBoundary) {
    return "\\B";
  }

  if ("choice" in node) {
    const options = node.choice.map(option => 
      option.map(compileNode).join("")
    );
    return `(?:${options.join("|")})`;
  }

  if ("capture" in node) {
    const { name, pattern } = node.capture;
    const compiledPattern = Array.isArray(pattern)
      ? pattern.map(compileNode).join("")
      : compileNode(pattern);
    
    if (name) {
      return `(?<${name}>${compiledPattern})`;
    }
    return `(${compiledPattern})`;
  }

  if ("group" in node) {
    const { pattern } = node.group;
    const compiledPattern = Array.isArray(pattern)
      ? pattern.map(compileNode).join("")
      : compileNode(pattern);
    return `(?:${compiledPattern})`;
  }

  if ("lookaround" in node) {
    const { type, pattern } = node.lookaround;
    const compiledPattern = Array.isArray(pattern)
      ? pattern.map(compileNode).join("")
      : compileNode(pattern);
    
    switch (type) {
      case "positiveLookahead": return `(?=${compiledPattern})`;
      case "negativeLookahead": return `(?!${compiledPattern})`;
      case "positiveLookbehind": return `(?<=${compiledPattern})`;
      case "negativeLookbehind": return `(?<!${compiledPattern})`;
    }
  }

  if ("backreference" in node) {
    const ref = node.backreference;
    if (typeof ref === "number") {
      return `\\${ref}`;
    }
    return `\\k<${ref}>`;
  }

  if ("repeat" in node) {
    const { type, count, min, max, optional, oneOrMore, zeroOrMore, lazy } = node.repeat;
    let base = "";
    if (typeof type === "string") {
      base = mapCharClass(type as CharClassType);
    } else {
      base = Array.isArray(type)
        ? type.map(compileNode).join("")
        : compileNode(type as RegexNode);
    }
      
    if (!isAtomic(base)) {
      base = `(?:${base})`;
    }

    let quantifier = "";
    if (optional) quantifier = "?";
    else if (oneOrMore) quantifier = "+";
    else if (zeroOrMore) quantifier = "*";
    else if (count !== undefined) {
      if (count === 0) quantifier = "{0}";
      else if (count > 1) quantifier = `{${count}}`;
    }
    else if (min !== undefined && max !== undefined) quantifier = `{${min},${max}}`;
    else if (min !== undefined) quantifier = `{${min},}`;

    if (lazy && quantifier) {
      quantifier += "?";
    }

    return `${base}${quantifier}`;
  }

  return "";
}

export function validateDSL(input: any): ValidationResult {
  const result = RegexDSLSchema.safeParse(input);
  if (!result.success) {
    return {
      success: false,
      error: result.error.issues.map(e => `${e.path.join(".")}: ${e.message}`).join("; ")
    };
  }
  return {
    success: true,
    data: result.data
  };
}

export function compileToJS(input: any): CompiledRegex | { error: string } {
  const validation = validateDSL(input);
  if (!validation.success) {
    return { error: validation.error! };
  }

  const dsl = validation.data as RegexDSL;
  return {
    pattern: dsl.nodes.map(compileNode).join(""),
    flags: compileFlags(dsl.flags)
  };
}
