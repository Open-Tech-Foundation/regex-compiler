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

  // Handle multiple error markers
  $effect(() => {
    if (!editor) return;
    const model = editor.getModel();
    if (!model) return;

    if (!issues || issues.length === 0) {
      monaco.editor.setModelMarkers(model, 'dsl-validation', []);
      return;
    }

    const markers = issues
      .map((issue) => {
        const matches = model.findMatches(`"${issue.path.split('.').pop()}"`, false, false, true, null, true);
        if (matches.length > 0) {
          const match = matches[0];
          return {
            startLineNumber: match.range.startLineNumber,
            startColumn: match.range.startColumn,
            endLineNumber: match.range.endLineNumber,
            endColumn: match.range.startColumn + 100,
            message: issue.message,
            severity: monaco.MarkerSeverity.Error,
          };
        }
        return null;
      })
      .filter((m) => m !== null);

    setTimeout(() => {
      monaco.editor.setModelMarkers(model, 'dsl-validation', markers);
    }, 0);
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
