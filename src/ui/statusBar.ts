import * as vscode from 'vscode';
import { AIProvider } from '../core/AIProvider';
import { DevCompanionConfig } from '../core/config';

export interface CompanionStatusBar {
  refresh(available: boolean): void;
}

export function activateStatusBar(
  context: vscode.ExtensionContext,
  aiProvider: AIProvider,
  getConfig: () => DevCompanionConfig
): CompanionStatusBar {
  const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 80);
  item.command = 'devCompanion.showStatus';
  item.name = 'Dev Companion AI';
  item.text = '$(sparkle) Dev Companion';
  item.tooltip = 'Dev Companion AI — click for Ollama status';
  item.show();
  context.subscriptions.push(item);

  const refresh = (available: boolean) => {
    const config = getConfig();
    if (available) {
      item.text = '$(sparkle) Dev Companion';
      item.backgroundColor = undefined;
      item.tooltip = `Connected to ${config.provider} (${config.model}) at ${config.ollama_url}`;
    } else {
      item.text = '$(warning) Dev Companion';
      item.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
      item.tooltip = `Cannot reach ${config.provider} at ${config.ollama_url}. Click to retry or open settings.`;
    }
  };

  context.subscriptions.push(
    vscode.commands.registerCommand('devCompanion.showStatus', async () => {
      const config = getConfig();
      const available = await aiProvider.isAvailable();
      refresh(available);
      const status = available ? `connected (${config.model})` : 'unreachable';
      const choice = await vscode.window.showInformationMessage(
        `Dev Companion AI: ${config.provider} is ${status} at ${config.ollama_url}.`,
        'Open Settings',
        'Retry'
      );
      if (choice === 'Open Settings') {
        await vscode.commands.executeCommand('devCompanion.openSettings');
      } else if (choice === 'Retry') {
        refresh(await aiProvider.isAvailable());
      }
    })
  );

  return { refresh };
}
