import { AIProvider } from '../../core/AIProvider';
import { ErrorExplanation, TerminalCapture } from './types';

const ROOT_CAUSE_MARKER = 'ROOT CAUSE:';
const SUGGESTED_FIX_MARKER = 'SUGGESTED FIX:';

function buildPrompt(capture: TerminalCapture): string {
  const commandLine = capture.command ? `Command: ${capture.command}\n` : '';
  const exitCodeLine = typeof capture.exitCode === 'number' ? `Exit code: ${capture.exitCode}\n` : '';
  return `A terminal command failed. Explain the root cause in plain language for a developer, then suggest a concrete fix.

${commandLine}${exitCodeLine}
Captured output:
\`\`\`
${capture.text}
\`\`\`

Respond in exactly this format:
${ROOT_CAUSE_MARKER} <one or two plain-language sentences>
${SUGGESTED_FIX_MARKER} <concrete, actionable steps to fix it>`;
}

/**
 * Sends captured terminal failure output to AIProvider and returns a
 * plain-language root-cause explanation plus a suggested fix.
 */
export async function explainError(aiProvider: AIProvider, capture: TerminalCapture): Promise<ErrorExplanation> {
  const { text } = await aiProvider.complete(buildPrompt(capture), {
    systemPrompt: 'You are a senior engineer helping a teammate debug a failed terminal command.'
  });

  return parseExplanation(text);
}

function parseExplanation(raw: string): ErrorExplanation {
  const rootCauseIndex = raw.indexOf(ROOT_CAUSE_MARKER);
  const fixIndex = raw.indexOf(SUGGESTED_FIX_MARKER);

  if (rootCauseIndex === -1 || fixIndex === -1 || fixIndex < rootCauseIndex) {
    return { explanation: raw.trim(), suggestedFix: '', raw };
  }

  const explanation = raw.slice(rootCauseIndex + ROOT_CAUSE_MARKER.length, fixIndex).trim();
  const suggestedFix = raw.slice(fixIndex + SUGGESTED_FIX_MARKER.length).trim();

  return { explanation, suggestedFix, raw };
}
