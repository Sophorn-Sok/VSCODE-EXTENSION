import * as vscode from 'vscode';
import { TerminalCapture } from './types';

/**
 * Monitors the integrated terminal for finished commands using VS Code's
 * (stable) Terminal Shell Integration API, and forwards captured output to
 * `onCommandFinished` for failure detection. Falls back to a no-op if the
 * active shell doesn't support shell integration — this listener never
 * throws into the extension host.
 */
export function registerTerminalListener(
  onCommandFinished: (capture: TerminalCapture) => void
): vscode.Disposable {
  return vscode.window.onDidEndTerminalShellExecution(async (event) => {
    try {
      const exitCode = event.exitCode;
      const commandLine = event.execution.commandLine?.value;
      const text = await readExecutionOutput(event.execution);
      onCommandFinished({ text, exitCode, command: commandLine });
    } catch {
      // Shell integration may not be available for this terminal/shell.
      // Silently skip rather than crashing the extension host.
    }
  });
}

async function readExecutionOutput(execution: { read(): AsyncIterable<string> }): Promise<string> {
  let text = '';
  for await (const chunk of execution.read()) {
    text += chunk;
  }
  return text;
}
