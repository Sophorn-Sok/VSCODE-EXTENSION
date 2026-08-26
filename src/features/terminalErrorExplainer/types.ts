export interface TerminalCapture {
  /** Raw text captured from the terminal (command output, or the tail of it). */
  text: string;
  /** Process exit code, when known. */
  exitCode?: number;
  /** The command that was run, when known. */
  command?: string;
}

export interface DetectedFailure {
  matched: boolean;
  /** Which signature tripped detection, e.g. "stack-trace", "non-zero-exit". */
  signature?: string;
}

export interface ErrorExplanation {
  explanation: string;
  suggestedFix: string;
  /** Raw AI response, kept for cases where the expected markers aren't found. */
  raw: string;
}
