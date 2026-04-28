import { onCleanup } from '@opentf/web';
import * as monaco from 'monaco-editor';

export default function Editor({ value, onChange, issues }) {
  const containerRef = $ref();
  let editor = $state(null);

  $effect(() => {
    if (containerRef && !editor) {
      editor = monaco.editor.create(containerRef, {
        value: value,
        language: 'json',
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 14,
        scrollBeyondLastLine: false,
        padding: { top: 16, bottom: 16 },
      });

      editor.onDidChangeModelContent(() => {
        const newValue = editor.getValue();
        onChange(newValue);
      });

      onCleanup(() => {
        if (editor) {
          editor.dispose();
          editor = null;
        }
      });
    }
  });

  // Keep the editor in sync with the prop
  $effect(() => {
    if (editor && value !== editor.getValue()) {
      editor.setValue(value);
    }
  });

  // Handle markers (errors/validation)
  $effect(() => {
    if (!editor) return;
    const model = editor.getModel();
    if (!model) return;

    // RESTORED LOGGING FOR RECTIFICATION
    console.log('[Editor] Validation Issues Received:', issues);

    if (!issues || issues.length === 0) {
      monaco.editor.setModelMarkers(model, 'dsl-validation', []);
      return;
    }

    import('jsonc-parser').then(({ parseTree, findNodeAtLocation }) => {
      const text = model.getValue();
      const ast = parseTree(text);
      if (!ast) return;

      const markers = issues.flatMap((issue) => {
        const path = issue.path;
        const parts = path.split('.').filter(p => p !== 'root');
        
        // Convert numeric strings to numbers for findNodeAtLocation
        const locationPath = parts.map(p => isNaN(parseInt(p, 10)) ? p : parseInt(p, 10));

        // Attempt to find the specific node in the AST
        let node = findNodeAtLocation(ast, locationPath);

        // If it's an unrecognized key error (e.g. Unrecognized keys: "repe1at", "m1ax")
        // The path usually points to the parent object. We need to find the specific invalid property nodes.
        const unrecognizedMatch = issue.message.match(/Unrecognized key(?:s)?: (.*)/);
        if (unrecognizedMatch && node && node.type === 'object') {
          const keysStr = unrecognizedMatch[1];
          const keys = [];
          const keyRegex = /"([^"]+)"|'([^']+)'/g;
          let m;
          while ((m = keyRegex.exec(keysStr)) !== null) {
            keys.push(m[1] || m[2]);
          }

          const nodeMarkers = [];
          for (const invalidKey of keys) {
            const propertyNode = node.children.find(child => child.type === 'property' && child.children[0].value === invalidKey);
            if (propertyNode) {
              const targetNode = propertyNode.children[0];
              const startPos = model.getPositionAt(targetNode.offset);
              const endPos = model.getPositionAt(targetNode.offset + targetNode.length);
              
              nodeMarkers.push({
                startLineNumber: startPos.lineNumber,
                startColumn: startPos.column,
                endLineNumber: endPos.lineNumber,
                endColumn: endPos.column,
                message: `Unrecognized key: "${invalidKey}"`,
                severity: monaco.MarkerSeverity.Error,
              });
            }
          }
          return nodeMarkers;
        } else if (node && node.type === 'property') {
           // For specific property errors (e.g. min must be less than max), we usually highlight the key
           node = node.children[0];
        }

        if (node) {
          const startPos = model.getPositionAt(node.offset);
          const endPos = model.getPositionAt(node.offset + node.length);
          
          return [{
            startLineNumber: startPos.lineNumber,
            startColumn: startPos.column,
            endLineNumber: endPos.lineNumber,
            endColumn: endPos.column,
            message: issue.message,
            severity: monaco.MarkerSeverity.Error,
          }];
        }

        return [];
      });

      console.log('[Editor] Final AST-based Markers Generated:', markers);
      monaco.editor.setModelMarkers(model, 'dsl-validation', markers);
    }).catch(err => {
      console.error('Failed to load jsonc-parser', err);
    });
  });

  onCleanup(() => {
    if (editor) {
      editor.dispose();
      editor = null;
    }
  });

  return (
    <div
      ref={containerRef}
      style="width: 100%; height: 100%; border-radius: 0.5rem; overflow: hidden;"
    />
  );
}
