import { onCleanup } from "@opentf/web";
import * as monaco from 'monaco-editor';

export default function Editor({ value, onChange }) {
  const containerRef = $ref();
  let editor = null;

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
        padding: { top: 16, bottom: 16 }
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

  return (
    <div 
      ref={containerRef} 
      style="width: 100%; height: 100%; border-radius: 0.5rem; overflow: hidden;"
    />
  );
}
