import type {
  RegexDSL,
  RegexNode,
  CharClassType,
  Flags,
  CompiledRegex,
  ValidationResult,
  CharSetType,
  DSLMapping,
} from './types';
import { RegexDSLSchema } from './schema';

function escapeLiteral(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isAtomic(pattern: string): boolean {
  if (pattern.length <= 1) return true;
  if (pattern.startsWith('\\')) {
    if (pattern.length === 2) return true;
    if (/^\\(x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|u\{[0-9a-fA-F]+\}|p\{.*\}|P\{.*\})$/.test(pattern))
      return true;
  }

  const opener = pattern[0];
  const closer = opener === '[' ? ']' : opener === '(' ? ')' : null;

  if (closer && pattern.endsWith(closer)) {
    let depth = 0;
    for (let i = 0; i < pattern.length; i++) {
      const char = pattern[i];
      const isEscaped = i > 0 && pattern[i - 1] === '\\';
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
    case 'digit':
      return '\\d';
    case 'nonDigit':
      return '\\D';
    case 'word':
      return '\\w';
    case 'nonWord':
      return '\\W';
    case 'whitespace':
      return '\\s';
    case 'nonWhitespace':
      return '\\S';
    case 'tab':
      return '\\t';
    case 'newline':
      return '\\n';
    case 'carriageReturn':
      return '\\r';
    case 'any':
      return '.';
    default:
      return '';
  }
}

function compileCharSet(node: CharSetType): string {
  if ('chars' in node) {
    return `${node.exclude ? '^' : ''}${node.chars}`;
  }
  if ('intersection' in node) {
    return (node.intersection as CharSetType[]).map((n) => `[${compileCharSet(n)}]`).join('&&');
  }
  if ('subtraction' in node) {
    const { left, right } = node.subtraction;
    return `[${compileCharSet(left)}]--[${compileCharSet(right)}]`;
  }
  return '';
}

interface CompileContext {
  pattern: string;
  mappings: DSLMapping[];
}

function compileNodeInternal(node: any, path: string, ctx: CompileContext): void {
  const start = ctx.pattern.length;

  if (typeof node === 'string') {
    ctx.pattern += escapeLiteral(node);
    ctx.mappings.push({ path, start, end: ctx.pattern.length });
    return;
  }

  if (node.type !== undefined) {
    ctx.pattern += mapCharClass(node.type);
    ctx.mappings.push({ path, start, end: ctx.pattern.length });
    return;
  }

  if (node.hex !== undefined) {
    ctx.pattern += `\\x${node.hex}`;
    ctx.mappings.push({ path, start, end: ctx.pattern.length });
    return;
  }

  if ('unicode' in node) {
    ctx.pattern += node.unicode.length > 4 ? `\\u{${node.unicode}}` : `\\u${node.unicode}`;
    ctx.mappings.push({ path, start, end: ctx.pattern.length });
    return;
  }

  if ('charSet' in node) {
    ctx.pattern += `[${compileCharSet(node.charSet)}]`;
    ctx.mappings.push({ path, start, end: ctx.pattern.length });
    return;
  }

  if ('unicodeProperty' in node) {
    const { property, exclude } = node.unicodeProperty;
    ctx.pattern += `\\${exclude ? 'P' : 'p'}{${property}}`;
    ctx.mappings.push({ path, start, end: ctx.pattern.length });
    return;
  }

  if ('$' in node) {
    switch (node.$) {
      case 'start':
        ctx.pattern += '^';
        break;
      case 'end':
        ctx.pattern += '$';
        break;
      case 'boundary':
        ctx.pattern += '\\b';
        break;
      case 'notBoundary':
        ctx.pattern += '\\B';
        break;
    }
    ctx.mappings.push({ path, start, end: ctx.pattern.length });
    return;
  }

  if ('choice' in node) {
    ctx.pattern += '(?:';
    node.choice.forEach((option: any[], i: number) => {
      if (i > 0) ctx.pattern += '|';
      option.forEach((item, j) => {
        compileNodeInternal(item, `${path}.choice.${i}.${j}`, ctx);
      });
    });
    ctx.pattern += ')';
    ctx.mappings.push({ path, start, end: ctx.pattern.length });
    return;
  }

  if ('capture' in node) {
    const { name, pattern } = node.capture;
    ctx.pattern += name ? `(?<${name}>` : '(';
    if (Array.isArray(pattern)) {
      pattern.forEach((item, i) => compileNodeInternal(item, `${path}.capture.pattern.${i}`, ctx));
    } else {
      compileNodeInternal(pattern, `${path}.capture.pattern`, ctx);
    }
    ctx.pattern += ')';
    ctx.mappings.push({ path, start, end: ctx.pattern.length });
    return;
  }

  if ('group' in node) {
    const { pattern } = node.group;
    ctx.pattern += '(?:';
    if (Array.isArray(pattern)) {
      pattern.forEach((item, i) => compileNodeInternal(item, `${path}.group.pattern.${i}`, ctx));
    } else {
      compileNodeInternal(pattern, `${path}.group.pattern`, ctx);
    }
    ctx.pattern += ')';
    ctx.mappings.push({ path, start, end: ctx.pattern.length });
    return;
  }

  if ('lookaround' in node) {
    const { type, pattern } = node.lookaround;
    switch (type) {
      case 'positiveLookahead':
        ctx.pattern += '(?=';
        break;
      case 'negativeLookahead':
        ctx.pattern += '(?!';
        break;
      case 'positiveLookbehind':
        ctx.pattern += '(?<=';
        break;
      case 'negativeLookbehind':
        ctx.pattern += '(?<!';
        break;
    }
    if (Array.isArray(pattern)) {
      pattern.forEach((item, i) =>
        compileNodeInternal(item, `${path}.lookaround.pattern.${i}`, ctx),
      );
    } else {
      compileNodeInternal(pattern, `${path}.lookaround.pattern`, ctx);
    }
    ctx.pattern += ')';
    ctx.mappings.push({ path, start, end: ctx.pattern.length });
    return;
  }

  if ('backreference' in node) {
    const ref = node.backreference;
    ctx.pattern += typeof ref === 'number' ? `\\${ref}` : `\\k<${ref}>`;
    ctx.mappings.push({ path, start, end: ctx.pattern.length });
    return;
  }

  if ('repeat' in node) {
    const { repeat: type, count, min, max, optional, oneOrMore, zeroOrMore, lazy } = node;
    const innerCtx: CompileContext = { pattern: '', mappings: [] };

    if (Array.isArray(type)) {
      type.forEach((item, i) => compileNodeInternal(item, `${path}.repeat.type.${i}`, innerCtx));
    } else {
      compileNodeInternal(type, `${path}.repeat.type`, innerCtx);
    }

    let base = innerCtx.pattern;
    if (!isAtomic(base)) {
      base = `(?:${base})`;
    }

    let quantifier = '';
    if (optional) quantifier = '?';
    else if (oneOrMore) quantifier = '+';
    else if (zeroOrMore) quantifier = '*';
    else if (count !== undefined) {
      quantifier = count === 0 ? '{0}' : count > 1 ? `{${count}}` : '';
    } else if (min !== undefined && max !== undefined) {
      quantifier = `{${min},${max}}`;
    } else if (min !== undefined) {
      quantifier = `{${min},}`;
    }

    if (lazy && quantifier) {
      quantifier += '?';
    }

    // Adjust inner mappings if we added a non-capturing group
    const offset = !isAtomic(innerCtx.pattern) ? 3 : 0; // length of "(?:"
    innerCtx.mappings.forEach((m) => {
      m.start += start + offset;
      m.end += start + offset;
    });

    ctx.pattern += base + quantifier;
    ctx.mappings.push(...innerCtx.mappings);
    ctx.mappings.push({ path, start, end: ctx.pattern.length });
    return;
  }
}

export function validateDSL(input: any): ValidationResult {
  const result = RegexDSLSchema.safeParse(input);
  const issues: { path: string; message: string }[] = [];

  if (!result.success) {
    result.error.issues.forEach((e) => {
      let message = e.message;
      let path = e.path.join('.');

      function findDeepestError(issue: any): any {
        if (issue.code === 'invalid_union' && issue.errors) {
          for (const issuesArray of issue.errors) {
            for (const subIssue of Array.isArray(issuesArray)
              ? issuesArray
              : issuesArray.issues || []) {
              const deeper = findDeepestError(subIssue);
              if (deeper) return deeper;
            }
          }
        }
        if (
          issue.path &&
          issue.path.length > 0 &&
          typeof issue.path[issue.path.length - 1] === 'number'
        ) {
          return issue;
        }
        return null;
      }

      const deepest = findDeepestError(e);
      if (deepest) {
        const idx = deepest.path[0];
        const body = Array.isArray(input) ? input : input.pattern || input.nodes || [];
        const node = body[idx];
        if (node && typeof node === 'object' && !('flags' in node)) {
          message = `Unrecognized or invalid node structure. Found keys: ${Object.keys(node).join(', ')}`;
          path = `root.${idx}`;
        }
      }

      if (message === 'Invalid input' && e.path.length > 0) {
        path = e.path.join('.');
      }

      issues.push({ path, message });
    });
  }

  if (result.success) {
    const data = result.data;
    let nodesToWalk: any[] = [];
    if (Array.isArray(data)) {
      nodesToWalk = data;
    } else if (typeof data === 'string') {
      nodesToWalk = [data];
    } else if (typeof data === 'object') {
      if ('pattern' in data) {
        nodesToWalk = Array.isArray(data.pattern) ? data.pattern : [data.pattern];
      } else {
        const { flags, ...node } = data;
        nodesToWalk = [node];
      }
    }

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
              issues.push({
                path: `${currentPath}.capture.name`,
                message: `Duplicate capture group name: "${node.capture.name}"`,
              });
            }
            names.add(node.capture.name);
          }
        }

        if (pass === 2 && node.backreference) {
          const ref = node.backreference;
          if (typeof ref === 'number') {
            if (ref < 1 || ref > totalCaptures) {
              issues.push({
                path: `${currentPath}.backreference`,
                message: `Invalid backreference: Group ${ref} does not exist.`,
              });
            }
          } else if (typeof ref === 'string') {
            if (!names.has(ref)) {
              issues.push({
                path: `${currentPath}.backreference`,
                message: `Invalid backreference: Named group "${ref}" does not exist.`,
              });
            }
          }
        }

        if (node.capture)
          walk(
            Array.isArray(node.capture.pattern) ? node.capture.pattern : [node.capture.pattern],
            `${currentPath}.capture.pattern`,
            pass,
          );
        if (node.group)
          walk(
            Array.isArray(node.group.pattern) ? node.group.pattern : [node.group.pattern],
            `${currentPath}.group.pattern`,
            pass,
          );
        if (node.repeat)
          walk(
            Array.isArray(node.repeat.type) ? node.repeat.type : [node.repeat.type],
            `${currentPath}.repeat.type`,
            pass,
          );
        if (node.lookaround)
          walk(
            Array.isArray(node.lookaround.pattern)
              ? node.lookaround.pattern
              : [node.lookaround.pattern],
            `${currentPath}.lookaround.pattern`,
            pass,
          );
        if (node.choice) {
          node.choice.forEach((c: any, j: number) => walk(c, `${currentPath}.choice.${j}`, pass));
        }
      });
    }

    walk(nodesToWalk, 'root', 1);
    walk(nodesToWalk, 'root', 2);
  }

  if (issues.length > 0) {
    return {
      success: false,
      error: issues.map((i) => `${i.path}: ${i.message}`).join('; '),
      issues,
    };
  }

  return {
    success: true,
    data: result.data,
  };
}

export function compileToJS(
  input: any,
): CompiledRegex | { error: string; issues: { path: string; message: string }[] } {
  const validation = validateDSL(input);
  if (!validation.success) {
    return {
      error: validation.error!,
      issues: validation.issues || [],
    };
  }

  const data = validation.data;
  let nodes: any[] = [];
  let flags: Flags = {};
  let rootPath = 'root';

  if (Array.isArray(data)) {
    data.forEach((item, i) => {
      if (typeof item === 'object' && item !== null && 'flags' in item) {
        flags = { ...flags, ...item.flags };
      } else {
        nodes.push({ node: item, path: `${rootPath}.${i}` });
      }
    });
  } else if (typeof data === 'string') {
    nodes = [{ node: data, path: rootPath }];
  } else if (typeof data === 'object') {
    if ('pattern' in data) {
      const p = Array.isArray(data.pattern) ? data.pattern : [data.pattern];
      p.forEach((item: any, i: number) => {
        nodes.push({ node: item, path: `${rootPath}.pattern.${i}` });
      });
      flags = data.flags || {};
    } else {
      const { flags: nodeFlags, ...node } = data;
      nodes = [{ node, path: rootPath }];
      flags = nodeFlags || {};
    }
  }

  const ctx: CompileContext = { pattern: '', mappings: [] };
  nodes.forEach((n) => compileNodeInternal(n.node, n.path, ctx));

  const flagStr = Object.entries(flags || {})
    .filter(([_, value]) => value)
    .map(([key]) => {
      switch (key) {
        case 'global':
          return 'g';
        case 'ignoreCase':
          return 'i';
        case 'multiline':
          return 'm';
        case 'dotAll':
          return 's';
        case 'unicode':
          return 'u';
        case 'sticky':
          return 'y';
        case 'indices':
          return 'd';
        case 'unicodeSets':
          return 'v';
        default:
          return '';
      }
    })
    .join('');

  return { pattern: ctx.pattern, flags: flagStr, mappings: ctx.mappings };
}
