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
  let isLinkCopied = $state(false);
  let workerResult = $state(null);
  let isCompiling = $state(false);

  // Persistent Worker Reference
  let worker = $state(null);

  // Worker Initialization
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

  // Handle Hash Sync (Initial load)
  $effect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#dsl=')) {
      try {
        const content = hash.replace('#dsl=', '');
        const [encodedDsl, query] = content.split('&');
        
        const decodedDsl = decodeURIComponent(atob(encodedDsl));
        if (decodedDsl !== dslText) {
          dslText = decodedDsl;
        }

        if (query) {
          const searchParams = new URLSearchParams(query);
          if (searchParams.has('test')) {
            const testVal = decodeURIComponent(searchParams.get('test'));
            if (testVal !== manualTestString) {
              manualTestString = testVal;
            }
          }
        }
      } catch (e) {
        console.error('Failed to parse DSL from URL', e);
      }
    }
  });

  // Compile Trigger (Depends on dslText and worker)
  $effect(() => {
    if (!worker) return;
    
    // Explicitly track dependencies for the framework
    const currentDslText = dslText;
    const currentManualTest = manualTestString;
    
    try {
      const dsl = JSON.parse(currentDslText);
      isCompiling = true;
      
      // Determine test cases to run
      // If we are on a custom/shared dsl, we can't use the 'selectedExample' test cases reliably
      // But for now we pass the current manual test if we want to update the summary
      worker.postMessage({
        dsl,
        testCases: selectedExample.testCases,
      });
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
    const res = workerResult;
    const testStr = manualTestString;
    
    if (!res || res.error || !('pattern' in res)) return false;
    try {
      const re = new RegExp(res.pattern, res.flags);
      re.lastIndex = 0;
      return re.test(testStr);
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

  const copyLinkToClipboard = () => {
    try {
      const encodedDsl = btoa(encodeURIComponent(dslText));
      const testParam = manualTestString ? `&test=${encodeURIComponent(manualTestString)}` : '';
      const shareHash = `#dsl=${encodedDsl}${testParam}`;
      const shareUrl = `${window.location.origin}${window.location.pathname}${shareHash}`;
      
      navigator.clipboard.writeText(shareUrl);
      
      isLinkCopied = true;
      setTimeout(() => (isLinkCopied = false), 2000);
    } catch (e) {
      console.error('Failed to generate share link', e);
    }
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
            onCopyLink={copyLinkToClipboard}
            isLinkCopied={isLinkCopied}
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
