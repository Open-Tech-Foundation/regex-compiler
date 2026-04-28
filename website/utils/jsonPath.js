/**
 * A simple utility to get line/column of a JSON path.
 * Returns { line, column } or null.
 */
export function getPositionOfPath(jsonString, path) {
  try {
    const parts = path.split('.');
    if (parts[0] === 'root') parts.shift();

    let currentLine = 1;
    let currentCol = 1;
    let index = 0;

    // This is a naive but often effective way to find a path in a formatted JSON string
    // It works best with the standard 2-space indentation.
    
    // For a more robust solution, one would use a proper JSON parser with location info.
    // But let's try a heuristic first.
    
    const lines = jsonString.split('\n');
    let bestLine = 1;

    let currentPathDepth = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const part = parts[currentPathDepth];
      if (!part) break;

      // Check if this line contains the key or is the start of the Nth array element
      const keyPattern = new RegExp(`"${part}"\\s*:`);
      if (keyPattern.test(line)) {
        bestLine = i + 1;
        currentPathDepth++;
        continue;
      }

      // If we are looking for an array index
      if (!isNaN(parseInt(part))) {
         // This is tricky. We need to find the Nth element of the current container.
         // Heuristic: skip N elements.
         // For now, let's just look for the first key of the next part after some lines.
         // This is a placeholder for a better AST-based approach.
      }
    }

    return bestLine;
  } catch (e) {
    return 1;
  }
}

/**
 * A more robust approach using a basic recursive descent to find offsets
 */
export function findPathInJSON(json, path) {
  const parts = path.split('.');
  if (parts[0] === 'root') parts.shift();
  
  let offset = 0;
  
  function walk(obj, currentPathParts) {
    if (currentPathParts.length === 0) return offset;
    
    const part = currentPathParts[0];
    const remaining = currentPathParts.slice(1);
    
    if (Array.isArray(obj)) {
      const idx = parseInt(part);
      if (!isNaN(idx) && obj[idx] !== undefined) {
        // We need the offset of the Nth element. 
        // This requires a parser that gives offsets.
        return null;
      }
    } else if (typeof obj === 'object' && obj !== null) {
      if (part in obj) {
        return null;
      }
    }
    return null;
  }
  
  return null;
}
