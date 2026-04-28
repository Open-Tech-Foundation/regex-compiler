import { compileToJS } from '../packages/compiler/src/compiler';

self.onmessage = (e) => {
  const { dsl, testCases } = e.data;
  try {
    const result = compileToJS(dsl);
    if (result.error) {
      self.postMessage({ success: true, result });
      return;
    }

    const testResults = (testCases || []).map((tc) => {
      let isMatch = false;
      const pattern = result.pattern;
      const flags = result.flags;
      try {
        const re = new RegExp(pattern, flags);
        re.lastIndex = 0;
        isMatch = re.test(tc.input);
      } catch (e) {
        isMatch = false;
      }
      return {
        ...tc,
        isMatch,
        isCorrect: isMatch === tc.expected,
      };
    });

    const passedCount = testResults.filter((r) => r.isCorrect).length;

    self.postMessage({
      success: true,
      result: { ...result, testResults, passedCount },
    });
  } catch (error) {
    self.postMessage({ success: false, error: error.message });
  }
};
