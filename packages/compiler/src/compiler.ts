import { RegexDSL, RegexNode, CharClassType, Flags, CompiledRegex, ValidationResult } from "./types";
import { RegexDSLSchema } from "./schema";

function escapeLiteral(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function mapCharClass(type: CharClassType): string {
  switch (type) {
    case "digit":
      return "\\d";
    case "word":
      return "\\w";
    case "whitespace":
      return "\\s";
    case "any":
      return ".";
    default:
      return "";
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
  return f;
}

function compileNode(node: RegexNode): string {
  if ("literal" in node) {
    return escapeLiteral(node.literal);
  }

  if ("charSet" in node) {
    const { chars, exclude } = node.charSet;
    return `[${exclude ? "^" : ""}${chars}]`;
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
    const { type, count, min, max, optional, oneOrMore, zeroOrMore } = node.repeat;
    let base = "";
    if (typeof type === "string") {
      base = mapCharClass(type as CharClassType);
    } else {
      base = Array.isArray(type)
        ? type.map(compileNode).join("")
        : compileNode(type as RegexNode);
      
      if (base.length > 1 && !base.startsWith("(") && !base.startsWith("\\")) {
        base = `(?:${base})`;
      }
    }

    if (optional) return `${base}?`;
    if (oneOrMore) return `${base}+`;
    if (zeroOrMore) return `${base}*`;
    
    if (count !== undefined) return `${base}{${count}}`;
    if (min !== undefined && max !== undefined) return `${base}{${min},${max}}`;
    if (min !== undefined) return `${base}{${min},}`;
    return base;
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

  const dsl = validation.data!;
  return {
    pattern: dsl.nodes.map(compileNode).join(""),
    flags: compileFlags(dsl.flags)
  };
}
