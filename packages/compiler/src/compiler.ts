import { RegexDSL, RegexNode, CharClassType } from "./types";

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

  if ("repeat" in node) {
    const { type, count, min, max, optional, oneOrMore, zeroOrMore } = node.repeat;
    let base = "";
    if (typeof type === "string") {
      base = mapCharClass(type as CharClassType);
    } else {
      base = Array.isArray(type)
        ? type.map(compileNode).join("")
        : compileNode(type as RegexNode);
      
      // Wrap in non-capturing group if it's more than one character and not already a group
      if (base.length > 1 && !base.startsWith("(") && !base.startsWith("\\")) {
        base = `(?:${base})`;
      }
    }

    if (optional) return `${base}?`;
    if (oneOrMore) return `${base}+`;
    if (zeroOrMore) return `${base}*`;
    
    if (count !== undefined) {
      return `${base}{${count}}`;
    }
    if (min !== undefined && max !== undefined) {
      return `${base}{${min},${max}}`;
    }
    if (min !== undefined) {
      return `${base}{${min},}`;
    }
    return base;
  }

  return "";
}

export function compileToJS(dsl: RegexDSL): string {
  if (!Array.isArray(dsl)) return "";
  return dsl.map(compileNode).join("");
}
