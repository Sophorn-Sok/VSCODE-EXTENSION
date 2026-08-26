import { AIProvider } from '../../core/AIProvider';
import { buildTestGenerationPrompt } from './promptBuilder';
import { deriveTestFilePath } from './naming';
import { TestGenerationRequest, TestGenerationResult } from './types';

/**
 * Generates a Jest test file for the given source code via AIProvider.
 * This module has zero VS Code API dependency so it can be unit tested and
 * reused outside the extension host.
 */
export async function generateTests(
  aiProvider: AIProvider,
  request: TestGenerationRequest
): Promise<TestGenerationResult> {
  const prompt = buildTestGenerationPrompt(request);
  const { text } = await aiProvider.complete(prompt, {
    systemPrompt: 'You are an expert TypeScript/JavaScript test engineer who writes precise Jest tests.'
  });

  return {
    testFilePath: deriveTestFilePath(request.sourceFilePath),
    content: stripMarkdownFences(text).trim() + '\n'
  };
}

function stripMarkdownFences(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:[a-zA-Z]*)\n([\s\S]*?)\n?```$/);
  return fenceMatch ? fenceMatch[1] : trimmed;
}
