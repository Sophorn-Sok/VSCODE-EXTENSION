import { AIProvider } from '../../core/AIProvider';
import { FunctionSignature } from './types';

/**
 * Generates an AI-written doc comment/description for a single function
 * signature. Kept to one AI call per function so callers can control
 * concurrency and surface progress.
 */
export async function generateFunctionDoc(aiProvider: AIProvider, fn: FunctionSignature): Promise<string> {
  const prompt = `Write concise developer documentation for this function. Describe what it does, its parameters, and its return value. Output 2-5 sentences or a short bullet list — no code fences, no restating the raw code.

Function: ${fn.name}(${fn.params.join(', ')})${fn.returnType ? `: ${fn.returnType}` : ''}
File: ${fn.filePath}

Source:
${fn.code}`;

  const { text } = await aiProvider.complete(prompt, {
    systemPrompt: 'You are a technical writer generating clear, accurate function documentation.'
  });
  return text.trim();
}
