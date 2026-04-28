import { onCleanup } from '@opentf/web';
import { EXAMPLE_REGISTRY } from '../data/examples';
import DSLEditor from './DSLEditor';
import CompilationPreview from './CompilationPreview';
import TestBench from './TestBench';
import SampleLibraryModal from './SampleLibraryModal';
import CompilerWorker from '../compiler.worker?worker';

export default function RegexBuilder() {
  let selectedExample = $state(EXAMPLE_REGISTRY[0]);
  let dslText = $state(JSON.stringify(EXAMPLE_REGISTRY[0].dsl, null, 2));
  let manualTestString = $state('');
  let isLibraryOpen = $state(false);
  let isCopied = $state(false);
  let workerResult = $state(null);
  let isCompiling = $state(false);

  // Persistent Worker Reference
  let worker = $state(null);

  $effect(() => {
    const w = new CompilerWorker();
    
    w.onmessage = (e) => {
      if (e.data.success) {
        workerResult = e.data.result;
      } else {
        workerResult = { error: e.data.error };
      }
      isCompiling = false;
    };

    worker = w;

    onCleanup(() => {
      if (worker) worker.terminate();
    });
  });

  $effect(() => {
    try {
      const dsl = JSON.parse(dslText);
      if (worker) {
        isCompiling = true;
        worker.postMessage({
          dsl,
          testCases: selectedExample.testCases,
        });
      }
    } catch (e) {
      workerResult = { error: 'Invalid JSON format' };
      isCompiling = false;
    }
  });

  const compiledRegex = $derived(() => {
    if (workerResult && 'pattern' in workerResult) {
      return `/${workerResult.pattern}/${workerResult.flags || ''}`;
    }
    return null;
  });

  const testResults = $derived(() => (workerResult && workerResult.testResults ? workerResult.testResults : []));

  const passedCount = $derived(() => (workerResult ? workerResult.passedCount : 0));

  const manualMatch = $derived(() => {
    if (!workerResult || workerResult.error) return false;
    try {
      const re = new RegExp(workerResult.pattern, workerResult.flags);
      re.lastIndex = 0;
      return re.test(manualTestString);
    } catch (e) {
      return false;
    }
  });

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

  const resetDSL = () => {
    dslText = JSON.stringify(selectedExample.dsl, null, 2);
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Left Column */}
      <div className="w-1/2 h-full border-r border-[#27272a]">
        <DSLEditor
          value={dslText}
          error={workerResult ? workerResult.error : null}
          issues={workerResult ? workerResult.issues : null}
          onChange={(val) => (dslText = val)}
          onOpenLibrary={() => (isLibraryOpen = true)}
          onReset={resetDSL}
        />
      </div>

      {/* Right Column */}
      <div className="w-1/2 h-full bg-[#09090b] overflow-y-auto custom-scrollbar">
        <div className="p-6 flex flex-col gap-6">
          <CompilationPreview
            result={workerResult}
            compiledRegex={compiledRegex}
            isCopied={isCopied}
            isCompiling={isCompiling}
            onCopy={copyToClipboard}
          />

          <TestBench
            manualTestString={manualTestString}
            onManualInput={(val) => (manualTestString = val)}
            manualMatch={manualMatch}
            testResults={testResults}
            passedCount={passedCount}
            result={workerResult}
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
