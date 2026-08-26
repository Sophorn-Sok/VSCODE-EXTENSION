export interface TestGenerationRequest {
  /** The selected function/method, or the whole file, as source text. */
  sourceCode: string;
  /** Path (or bare file name) of the source file the code came from. */
  sourceFilePath: string;
}

export interface TestGenerationResult {
  /** Path for the new test file, following Jest's `*.test.ts` convention. */
  testFilePath: string;
  /** Full generated test file content. */
  content: string;
}
