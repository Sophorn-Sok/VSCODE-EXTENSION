import * as vscode from 'vscode';
import { ErrorExplanation } from './types';
import { escapeHtml, wrapWebviewHtml } from '../../ui/webviewHtml';

interface ExplanationEntry {
  command: string | undefined;
  explanation: ErrorExplanation;
}

/**
 * Shows terminal-error explanations in a webview so they stay readable,
 * without stealing focus from the terminal the user is working in.
 */
export class ErrorExplanationPanel implements vscode.Disposable {
  private panel: vscode.WebviewPanel | undefined;
  private readonly history: ExplanationEntry[] = [];

  show(command: string | undefined, explanation: ErrorExplanation): void {
    this.history.unshift({ command, explanation });
    this.render();
  }

  showError(message: string): void {
    this.history.unshift({
      command: undefined,
      explanation: { explanation: message, suggestedFix: '', raw: message }
    });
    this.render();
  }

  dispose(): void {
    this.panel?.dispose();
  }

  private render(): void {
    const view = this.ensurePanel();
    view.webview.html = this.buildHtml();
    view.reveal(vscode.ViewColumn.Beside, true);
  }

  private ensurePanel(): vscode.WebviewPanel {
    if (this.panel) {
      return this.panel;
    }
    this.panel = vscode.window.createWebviewPanel(
      'devCompanionTerminalErrors',
      'Dev Companion AI: Terminal Errors',
      { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
      { enableScripts: false, retainContextWhenHidden: true }
    );
    this.panel.onDidDispose(() => {
      this.panel = undefined;
    });
    return this.panel;
  }

  private buildHtml(): string {
    const latest = this.history[0];
    if (!latest) {
      return wrapWebviewHtml({
        title: 'Terminal Errors',
        body: '<h2>Terminal Errors</h2><p class="empty">No terminal failure has been explained yet.</p>'
      });
    }

    const previous =
      this.history.length > 1
        ? `<h2 style="margin-top:24px">Earlier</h2>${this.history
            .slice(1, 8)
            .map(
              (entry) => `<div class="block">
            <strong>${escapeHtml(entry.command ?? '(unknown command)')}</strong>
            <pre>${escapeHtml(entry.explanation.explanation)}</pre>
          </div>`
            )
            .join('')}`
        : '';

    return wrapWebviewHtml({
      title: 'Terminal Errors',
      body: `
  <h2>Terminal error</h2>
  <p class="subtitle">${escapeHtml(latest.command ?? '(unknown command)')}</p>
  <div class="block">
    <strong>Root cause</strong>
    <pre>${escapeHtml(latest.explanation.explanation || '(no explanation returned)')}</pre>
  </div>
  <div class="ai">
    <strong>Suggested fix</strong>
    <pre>${escapeHtml(latest.explanation.suggestedFix || '(no fix returned)')}</pre>
  </div>
  ${previous}`
    });
  }
}
