import { AIProvider } from '../../core/AIProvider';
import { ClassSignature } from './types';

/**
 * Generates an AI-written description for a class, given its name and
 * method signatures (no method bodies, to keep the prompt small).
 */
export async function generateClassDoc(aiProvider: AIProvider, cls: ClassSignature): Promise<string> {
  const methodList = cls.methods
    .map((m) => `- ${m.name}(${m.params.join(', ')})${m.returnType ? `: ${m.returnType}` : ''}`)
    .join('\n');

  const prompt = `Write a concise developer documentation summary for this class: what it represents and what its methods do collectively. Output 2-5 sentences or a short bullet list — no code fences.

Class: ${cls.name}
File: ${cls.filePath}
Methods:
${methodList || '(none)'}`;

  const { text } = await aiProvider.complete(prompt, {
    systemPrompt: 'You are a technical writer generating clear, accurate class documentation.'
  });
  return text.trim();
}
