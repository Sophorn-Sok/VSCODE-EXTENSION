import { detectFailure } from './errorPatterns';

describe('detectFailure', () => {
  it('matches a non-zero exit code even with no recognizable text signature', () => {
    expect(detectFailure({ text: 'command finished', exitCode: 1 })).toEqual({
      matched: true,
      signature: 'non-zero-exit'
    });
  });

  it('does not match a zero exit code with benign text', () => {
    expect(detectFailure({ text: 'Build succeeded', exitCode: 0 })).toEqual({ matched: false });
  });

  it('detects a JS stack trace', () => {
    const text = 'TypeError: Cannot read properties of undefined\n    at foo (index.js:10:5)';
    const result = detectFailure({ text });
    expect(result.matched).toBe(true);
    expect(['js-error-type', 'stack-trace']).toContain(result.signature);
  });

  it('detects npm ERR! output', () => {
    const result = detectFailure({ text: 'npm ERR! code ELIFECYCLE\nnpm ERR! errno 1' });
    expect(result).toEqual({ matched: true, signature: 'npm-error' });
  });

  it('detects TypeScript compiler errors', () => {
    const result = detectFailure({ text: "src/index.ts(4,5): error TS2322: Type 'string' is not assignable." });
    expect(result).toEqual({ matched: true, signature: 'typescript-error' });
  });

  it('detects Python tracebacks', () => {
    const result = detectFailure({ text: 'Traceback (most recent call last):\n  File "app.py", line 3, in <module>' });
    expect(result).toEqual({ matched: true, signature: 'python-traceback' });
  });

  it('detects Go panics', () => {
    const result = detectFailure({ text: 'panic: runtime error: index out of range [3] with length 3' });
    expect(result).toEqual({ matched: true, signature: 'go-panic' });
  });

  it('detects Rust panics', () => {
    const result = detectFailure({ text: "thread 'main' panicked at 'index out of bounds', src/main.rs:5:5" });
    expect(result).toEqual({ matched: true, signature: 'rust-panic' });
  });

  it('returns no match for plain informational output', () => {
    expect(detectFailure({ text: 'Compiled successfully in 342ms' })).toEqual({ matched: false });
  });

  it('prefers exit-code-driven detection to report a specific signature when both are present', () => {
    const result = detectFailure({ text: 'npm ERR! missing script: build', exitCode: 1 });
    expect(result).toEqual({ matched: true, signature: 'npm-error' });
  });
});
