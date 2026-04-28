import { compileToJS } from '../../packages/compiler/src/compiler';
import { EXAMPLE_REGISTRY } from '../data/examples';
import DSLEditor from './DSLEditor';
import CompilationPreview from './CompilationPreview';
import TestBench from './TestBench';
import SampleLibraryModal from './SampleLibraryModal';

export default function RegexBuilder() {
  const selectedExample = $state(EXAMPLE_REGISTRY[0]);
  const dslText = $state(JSON.stringify(EXAMPLE_REGISTRY[0].dsl, null, 2));
  const manualTestString = $state('');
  const isLibraryOpen = $state(false);
  const isCopied = $state(false);

  const compilationResult = $derived(() => {
    try {
      const dsl = JSON.parse(dslText);
      return compileToJS(dsl);
    } catch (e) {
      return { error: 'Invalid JSON format' };
    }
  });

  const compiledRegex = $derived(() => {
    if (compilationResult && 'pattern' in compilationResult) {
      return `/${compilationResult.pattern}/${compilationResult.flags || ''}`;
    }
    return null;
  });

  const checkMatch = (input) => {
    if (!compilationResult || compilationResult.error) return false;
    try {
      const re = new RegExp(compilationResult.pattern, compilationResult.flags);
      return re.test(input);
    } catch (e) {
      return false;
    }
  };

  const testResults = $derived(() => {
    return selectedExample.testCases.map((tc) => {
      const isMatch = checkMatch(tc.input);
      return {
        ...tc,
        isMatch,
        isCorrect: isMatch === tc.expected,
      };
    });
  });

  const manualMatch = $derived(() => checkMatch(manualTestString));

  const loadExample = (example) => {
    selectedExample = example;
    dslText = JSON.stringify(example.dsl, null, 2);
    manualTestString = example.testCases[0].input;
    isLibraryOpen = false;
  };

  const copyToClipboard = () => {
    if (!compiledRegex) return;
    navigator.clipboard.writeText(compiledRegex);
    isCopied = true;
    setTimeout(() => (isCopied = false), 2000);
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Left Column */}
      <div className="w-1/2 h-full border-r border-[#27272a]">
        <DSLEditor
          value={dslText}
          error={compilationResult?.error}
          issues={compilationResult?.issues}
          onChange={(val) => (dslText = val)}
          onOpenLibrary={() => (isLibraryOpen = true)}
        />
      </div>

      {/* Right Column */}
      <div className="w-1/2 h-full bg-[#09090b] overflow-y-auto custom-scrollbar">
        <div className="p-6 flex flex-col gap-6">
          <CompilationPreview
            result={compilationResult}
            compiledRegex={compiledRegex}
            isCopied={isCopied}
            onCopy={copyToClipboard}
          />

          <TestBench
            manualTestString={manualTestString}
            onManualInput={(val) => (manualTestString = val)}
            manualMatch={manualMatch}
            testResults={testResults}
          />
        </div>
      </div>

      {/* Modals */}
      <SampleLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => (isLibraryOpen = false)}
        onLoadExample={loadExample}
      />
    </div>
  );
}
