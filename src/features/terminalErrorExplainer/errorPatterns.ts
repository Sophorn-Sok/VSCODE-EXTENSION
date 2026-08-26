import { DetectedFailure, TerminalCapture } from './types';

/**
 * Common failure signatures for build failures and runtime exceptions.
 * Deliberately regex-based and language-agnostic rather than a curated list
 * of frameworks, so it works across Node, TypeScript, Python, Java, Rust,
 * Go, etc. output without OS- or toolchain-specific assumptions.
 */
const FAILURE_SIGNATURES: Array<{ name: string; pattern: RegExp }> = [
  { name: 'stack-trace', pattern: /^\s*at .+\(.+:\d+:\d+\)/m },
  { name: 'js-error-type', pattern: /\b(TypeError|ReferenceError|RangeError|SyntaxError|EvalError|URIError)\b:/ },
  { name: 'unhandled-rejection', pattern: /UnhandledPromiseRejection|Unhandled promise rejection/i },
  { name: 'npm-error', pattern: /npm ERR!/ },
  { name: 'typescript-error', pattern: /error TS\d+:/ },
  { name: 'webpack-error', pattern: /ERROR in /},
  { name: 'python-traceback', pattern: /Traceback \(most recent call last\):/ },
  { name: 'java-exception', pattern: /Exception in thread ".*"|(?:^|\n)\s*at [\w.$]+\([\w.]+:\d+\)/m },
  { name: 'go-panic', pattern: /panic: /},
  { name: 'rust-panic', pattern: /thread '.*' panicked at/ },
  { name: 'segfault', pattern: /Segmentation fault|SIGSEGV/ },
  { name: 'generic-error-line', pattern: /^(?:error|fatal error|fatal):/im }
];

export function detectFailure(capture: TerminalCapture): DetectedFailure {
  if (typeof capture.exitCode === 'number' && capture.exitCode !== 0) {
    const signatureMatch = FAILURE_SIGNATURES.find((sig) => sig.pattern.test(capture.text));
    return { matched: true, signature: signatureMatch?.name ?? 'non-zero-exit' };
  }

  const signatureMatch = FAILURE_SIGNATURES.find((sig) => sig.pattern.test(capture.text));
  if (signatureMatch) {
    return { matched: true, signature: signatureMatch.name };
  }

  return { matched: false };
}
