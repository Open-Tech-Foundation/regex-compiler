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
  return str
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
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
    const escaped = node.chars.replace(/[\\\]]/g, '\\$&');
    return `${node.exclude ? '^' : ''}${escaped}`;
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
    const { property, value, exclude } = node.unicodeProperty;
    const content = value ? `${property}=${value}` : property;
    ctx.pattern += `\\${exclude ? 'P' : 'p'}{${content}}`;
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

  if ('or' in node) {
    node.or.forEach((option: any[], i: number) => {
      if (i > 0) ctx.pattern += '|';
      option.forEach((item, j) => {
        compileNodeInternal(item, `${path}.or.${i}.${j}`, ctx);
      });
    });
    ctx.mappings.push({ path, start, end: ctx.pattern.length });
    return;
  }

  if ('capture' in node) {
    const { name, pattern } = node.capture;
    ctx.pattern += name ? `(?<${name}>` : '(';
    pattern.forEach((item: any, i: number) => compileNodeInternal(item, `${path}.capture.pattern.${i}`, ctx));
    ctx.pattern += ')';
    ctx.mappings.push({ path, start, end: ctx.pattern.length });
    return;
  }

  if ('group' in node) {
    const { pattern } = node.group;
    ctx.pattern += '(?:';
    pattern.forEach((item: any, i: number) => compileNodeInternal(item, `${path}.group.pattern.${i}`, ctx));
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
    pattern.forEach((item: any, i: number) =>
      compileNodeInternal(item, `${path}.lookaround.pattern.${i}`, ctx),
    );
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
      quantifier = count === 1 ? '' : `{${count}}`;
    } else if (min !== undefined && max !== undefined) {
      if (min === 0 && max === 1) quantifier = '?';
      else if (min === max) quantifier = `{${min}}`;
      else quantifier = `{${min},${max}}`;
    } else if (min !== undefined) {
      if (min === 0) quantifier = '*';
      else if (min === 1) quantifier = '+';
      else quantifier = `{${min},}`;
    }

    if (lazy && quantifier && count === undefined) {
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
    function flattenIssues(issue: any): any[] {
      if (issue.code === 'invalid_union' && issue.errors) {
        return issue.errors.flatMap((issuesArray: any) => 
          (Array.isArray(issuesArray) ? issuesArray : issuesArray.issues || []).flatMap((subIssue: any) => {
            const flattened = flattenIssues(subIssue);
            return flattened.map(f => {
              let combinedPath = f.path || [];
              if (issue.path && issue.path.length > 0 && (combinedPath.length === 0 || combinedPath[0] !== issue.path[0])) {
                combinedPath = [...issue.path, ...combinedPath];
              }
              return { ...f, path: combinedPath };
            });
          })
        );
      }
      return [issue];
    }

    const allIssues = result.error.issues.flatMap(flattenIssues);
    const unrecognizedNodes = new Set<string>();

    allIssues.forEach((deepest) => {
      let pathParts = deepest.path || [];

      let node: any = input;
      let objectPathParts = [];
      let lastValidNode = node;
      for (const p of pathParts) {
        if (node && typeof node === 'object' && p in node) {
          node = node[p];
          objectPathParts.push(p);
          lastValidNode = node;
        } else if (Array.isArray(node) && typeof p === 'number' && node[p] !== undefined) {
          node = node[p];
          objectPathParts.push(p);
          lastValidNode = node;
        } else {
          break;
        }
      }

      const validKeys = [
        'type', 'hex', 'unicode', 'charSet', 'unicodeProperty', '$', 
        'or', 'capture', 'group', 'lookaround', 'backreference', 
        'repeat', 'pattern'
      ];

      let isUnrecognized = false;
      let hasMultipleKeys = false;
      let presentValidKeys: string[] = [];

      let lastNonNumericKey = null;
      for (let i = objectPathParts.length - 1; i >= 0; i--) {
        if (typeof objectPathParts[i] === 'string' && isNaN(parseInt(objectPathParts[i] as string))) {
          lastNonNumericKey = objectPathParts[i];
          break;
        }
      }
      const isRegexNodeContext = !lastNonNumericKey || ['pattern', 'repeat', 'or'].includes(lastNonNumericKey as string);

      if (isRegexNodeContext && lastValidNode && typeof lastValidNode === 'object' && !('flags' in lastValidNode) && !Array.isArray(lastValidNode)) {
        const nodeKeys = Object.keys(lastValidNode);
        presentValidKeys = nodeKeys.filter(k => validKeys.includes(k));
        
        if (presentValidKeys.length === 0) {
          isUnrecognized = true;
        } else if (presentValidKeys.length > 1) {
          hasMultipleKeys = true;
        }
      }

      let path = pathParts.join('.');
      path = path.length > 0 ? `root.${path}` : 'root';

      if (hasMultipleKeys) {
        const basePath = objectPathParts.join('.');
        const fullBasePath = basePath.length > 0 ? `root.${basePath}` : 'root';
        if (!unrecognizedNodes.has(fullBasePath)) {
          unrecognizedNodes.add(fullBasePath);
          issues.push({ path: fullBasePath, message: `Multiple structural keys found: ${presentValidKeys.join(', ')}. A regex node can only have one structural key.` });
        }
        return; // Skip other errors for this invalid node
      }

      if (isUnrecognized) {
        const basePath = objectPathParts.join('.');
        const fullBasePath = basePath.length > 0 ? `root.${basePath}` : 'root';
        if (!unrecognizedNodes.has(fullBasePath)) {
          unrecognizedNodes.add(fullBasePath);
          const nodeKeys = Object.keys(lastValidNode);
          const knownPropertyKeys = ['count', 'min', 'max', 'optional', 'oneOrMore', 'zeroOrMore', 'lazy', 'name', 'flags'];
          const trulyInvalidKeys = nodeKeys.filter(k => !validKeys.includes(k) && !knownPropertyKeys.includes(k));
          
          if (trulyInvalidKeys.length > 0) {
            const keysStr = trulyInvalidKeys.map(k => `"${k}"`).join(', ');
            const msg = `Unrecognized key${trulyInvalidKeys.length > 1 ? 's' : ''}: ${keysStr}`;
            issues.push({ path: fullBasePath, message: msg });
          } else {
            issues.push({ path: fullBasePath, message: `Unrecognized or invalid node structure` });
          }
        }
        
        if (deepest.code === 'unrecognized_keys') {
          return; // Skip redundant Zod unrecognized_keys errors since we just logged the structural error
        }

        if (objectPathParts.length < pathParts.length) {
           return; // Skip missing sub-keys on unrecognized nodes
        }
      }

      // Filter union noise: missing discriminant keys
      if (objectPathParts.length < pathParts.length) {
        const missingKey = pathParts[objectPathParts.length];
        if (lastValidNode && typeof lastValidNode === 'object' && !Array.isArray(lastValidNode)) {
          if ([...validKeys, 'flags'].includes(missingKey as string)) {
             return; // Skip union noise
          }
        }
      }

      // Filter union noise: branch complains about unrecognized keys that are actually valid structural keys
      if (deepest.code === 'unrecognized_keys' && deepest.keys) {
        const complainsAboutValidKey = deepest.keys.some((k: string) => validKeys.includes(k) || k === 'flags');
        if (complainsAboutValidKey) {
          return; // This is from a branch that doesn't expect the key the user provided
        }
      }

      const message = `${deepest.message}`;
      issues.push({ path, message });
    });
  }

  // Filter and deduplicate issues
  if (issues.length > 0) {
    let filtered = [];
    const seen = new Set();
    for (const issue of issues) {
      const key = `${issue.path}|${issue.message}`;
      if (!seen.has(key)) {
        seen.add(key);
        filtered.push(issue);
      }
    }

    const hasDeeperIssues = filtered.some((i) => i.path !== 'root');
    if (hasDeeperIssues) {
      // Drop all 'root' issues that are just generic type mismatches from other union branches
      filtered = filtered.filter((i) => !(i.path === 'root' && i.message.includes('Invalid input: expected')));
    }

    // Drop generic type mismatches if there's a more specific error at the exact same path or a child path
    filtered = filtered.filter((i) => {
      if (i.message.includes('Invalid input: expected')) {
        const hasSpecificErrorAtOrBelowPath = filtered.some(
          (other) => (other.path === i.path || other.path.startsWith(i.path + '.')) && !other.message.includes('Invalid input: expected')
        );
        return !hasSpecificErrorAtOrBelowPath;
      }
      return true;
    });

    issues.length = 0;
    issues.push(...filtered);
  }

  if (result.success) {
    const data = result.data;
    let nodesToWalk: any[] = [];
    let flags: Flags = {};

    if (Array.isArray(data)) {
      data.forEach((item) => {
        if (typeof item === 'object' && item !== null && 'flags' in item) {
          flags = { ...flags, ...item.flags };
        } else {
          nodesToWalk.push(item);
        }
      });
    } else if (typeof data === 'string') {
      nodesToWalk = [data];
    } else if (typeof data === 'object') {
      if ('pattern' in data) {
        nodesToWalk = Array.isArray(data.pattern) ? data.pattern : [data.pattern];
        flags = data.flags || {};
      } else {
        const { flags: nodeFlags, ...node } = data;
        nodesToWalk = [node];
        flags = nodeFlags || {};
      }
    }

    if (flags.unicode && flags.unicodeSets) {
      issues.push({
        path: 'flags',
        message: 'Cannot use both unicode (u) and unicodeSets (v) flags.',
      });
    }

    const names = new Set<string>();
    let totalCaptures = 0;
    const anchorState = { start: false, end: false };

    function walk(nodes: any[], path: string, pass: 1 | 2, context: { inLookbehind?: boolean } = {}) {
      nodes.forEach((node, i) => {
        const currentPath = `${path}.${i}`;
        if (!node) return;

        if (pass === 1) {
          if (typeof node === 'object') {
            if (node.capture) {
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

            if ('charSet' in node) {
              if (('intersection' in node.charSet || 'subtraction' in node.charSet) && !flags.unicodeSets) {
                issues.push({
                  path: currentPath,
                  message: 'Character set intersection/subtraction requires the unicodeSets (v) flag.',
                });
              }

              if ('chars' in node.charSet) {
                const chars = node.charSet.chars;
                const rangeRegex = /(.)-(.)/g;
                let match;
                while ((match = rangeRegex.exec(chars)) !== null) {
                  if (match[1].charCodeAt(0) > match[2].charCodeAt(0)) {
                    issues.push({
                      path: `${currentPath}.charSet.chars`,
                      message: `Range out of order in character set: ${match[0]}`,
                    });
                  }
                }
              }
            }

            if ('$' in node) {
              if (node.$ === 'start') {
                if (anchorState.start || anchorState.end) {
                  issues.push({
                    path: currentPath,
                    message: 'Multiple start anchors or start anchor after end anchor.',
                  });
                }
                anchorState.start = true;
              }
              if (node.$ === 'end') {
                anchorState.end = true;
              }
            }

            if (node.lookaround) {
              if (context.inLookbehind && node.lookaround.type === 'positiveLookahead') {
                issues.push({
                  path: currentPath,
                  message: 'Nested lookahead inside lookbehind is not recommended/supported.',
                });
              }
              if (Array.isArray(node.lookaround.pattern) && node.lookaround.pattern.length === 0) {
                issues.push({ path: currentPath, message: 'Lookaround pattern cannot be empty.' });
              }
            }
          }
        }

        if (pass === 2 && typeof node === 'object' && node.backreference !== undefined) {
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

        if (typeof node === 'object') {
          if (node.capture)
            walk(
              node.capture.pattern,
              `${currentPath}.capture.pattern`,
              pass,
              context,
            );
          if (node.group)
            walk(
              node.group.pattern,
              `${currentPath}.group.pattern`,
              pass,
              context,
            );
          if (node.repeat)
            walk(
              Array.isArray(node.repeat.type) ? node.repeat.type : [node.repeat.type],
              `${currentPath}.repeat.type`,
              pass,
              context,
            );
          if (node.lookaround)
            walk(
              node.lookaround.pattern,
              `${currentPath}.lookaround.pattern`,
              pass,
              { inLookbehind: node.lookaround.type.endsWith('Lookbehind') },
            );
          if (node.or) {
            node.or.forEach((c: any, j: number) => walk(c, `${currentPath}.or.${j}`, pass, context));
          }
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
