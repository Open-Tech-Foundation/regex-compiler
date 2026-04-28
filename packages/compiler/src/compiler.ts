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

function compileNode(node: any): string {
  if (typeof node === "string") {
    return escapeLiteral(node);
  }

  if (node.type !== undefined) {
    return mapCharClass(node.type);
  }

  if (node.hex !== undefined) {
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
    const { repeat: type, count, min, max, optional, oneOrMore, zeroOrMore, lazy } = node;
    let base = Array.isArray(type)
      ? type.map(compileNode).join("")
      : compileNode(type as RegexNode);
      
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
  const issues: { path: string; message: string }[] = [];

  if (!result.success) {
    issues.push(...result.error.issues.map(e => {
      let message = e.message;
      if (message === "Invalid input" && e.path[0] === "nodes" && e.path.length === 2) {
        const node = input.nodes[e.path[1] as number];
        if (node && typeof node === 'object') {
          const keys = Object.keys(node);
          message = `Unrecognized or invalid node structure. Found keys: ${keys.join(", ")}`;
        }
      }
      return { path: e.path.join("."), message };
    }));
  }

  // Second pass: Logical validation (backreferences, duplicate names, etc.)
  if (input && Array.isArray(input.nodes)) {
    const names = new Set<string>();
    let totalCaptures = 0;

    function walk(nodes: any[], path: string, pass: 1 | 2) {
      nodes.forEach((node, i) => {
        const currentPath = `${path}.${i}`;
        if (!node || typeof node !== 'object') return;

        if (pass === 1 && node.capture) {
          totalCaptures++;
          if (node.capture.name) {
            if (names.has(node.capture.name)) {
              issues.push({ path: `${currentPath}.capture.name`, message: `Duplicate capture group name: "${node.capture.name}"` });
            }
            names.add(node.capture.name);
          }
        }

        if (pass === 2 && node.backreference) {
          const ref = node.backreference;
          if (typeof ref === 'number') {
            if (ref < 1 || ref > totalCaptures) {
              issues.push({ path: `${currentPath}.backreference`, message: `Invalid backreference: Group ${ref} does not exist.` });
            }
          } else if (typeof ref === 'string') {
            if (!names.has(ref)) {
              issues.push({ path: `${currentPath}.backreference`, message: `Invalid backreference: Named group "${ref}" does not exist.` });
            }
          }
        }

        // Recursion
        if (node.capture) walk(Array.isArray(node.capture.pattern) ? node.capture.pattern : [node.capture.pattern], `${currentPath}.capture.pattern`, pass);
        if (node.group) walk(Array.isArray(node.group.pattern) ? node.group.pattern : [node.group.pattern], `${currentPath}.group.pattern`, pass);
        if (node.repeat) walk(Array.isArray(node.repeat.type) ? node.repeat.type : [node.repeat.type], `${currentPath}.repeat.type`, pass);
        if (node.lookaround) walk(Array.isArray(node.lookaround.pattern) ? node.lookaround.pattern : [node.lookaround.pattern], `${currentPath}.lookaround.pattern`, pass);
        if (node.choice) {
          node.choice.forEach((c: any, j: number) => walk(c, `${currentPath}.choice.${j}`, pass));
        }
      });
    }

    walk(input.nodes, "nodes", 1); // Pass 1: Collect
    walk(input.nodes, "nodes", 2); // Pass 2: Verify
  }

  if (issues.length > 0) {
    return {
      success: false,
      error: issues.map(i => `${i.path}: ${i.message}`).join("; "),
      issues
    };
  }

  return {
    success: true,
    data: result.data
  };
}

export function compileToJS(input: any): CompiledRegex | { error: string; issues: { path: string; message: string }[] } {
  const validation = validateDSL(input);
  if (!validation.success) {
    return { 
      error: validation.error!,
      issues: validation.issues || []
    };
  }

  const { nodes, flags } = validation.data;
  const pattern = nodes.map(compileNode).join("");
  const flagStr = Object.entries(flags || {})
    .filter(([_, value]) => value)
    .map(([key]) => {
      switch (key) {
        case "global": return "g";
        case "ignoreCase": return "i";
        case "multiline": return "m";
        case "dotAll": return "s";
        case "unicode": return "u";
        case "sticky": return "y";
        case "indices": return "d";
        case "unicodeSets": return "v";
        default: return "";
      }
    })
    .join("");

  return { pattern, flags: flagStr };
}
