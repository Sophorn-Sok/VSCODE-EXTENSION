import * as vscode from 'vscode';
import * as path from 'path';
import { AIProvider } from '../../core/AIProvider';
import { generateTests } from './testGenerator';

/**
 * Wires the "Generate Unit Tests" command: right-click a selected function,
 * method, or file in the editor/explorer to send its source to AIProvider
 * and write the result to a new `*.test.ts` file next to it.
 */
export function activateTestGenerator(context: vscode.ExtensionContext, aiProvider: AIProvider): void {
  const disposable = vscode.commands.registerCommand('devCompanion.generateTests', async (uri?: vscode.Uri) => {
    const editor = vscode.window.activeTextEditor;

    let sourceCode: string | undefined;
    let sourceFilePath: string | undefined;

    if (editor && (!uri || editor.document.uri.fsPath === uri.fsPath)) {
      const selection = editor.selection;
      sourceCode = selection && !selection.isEmpty ? editor.document.getText(selection) : editor.document.getText();
      sourceFilePath = vscode.workspace.asRelativePath(editor.document.uri);
    } else if (uri) {
      const document = await vscode.workspace.openTextDocument(uri);
      sourceCode = document.getText();
      sourceFilePath = vscode.workspace.asRelativePath(uri);
    }

    if (!sourceCode || !sourceFilePath) {
      vscode.window.showErrorMessage('Dev Companion AI: select a function/file, or right-click a file, to generate tests.');
      return;
    }

    try {
      const result = await vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title: 'Dev Companion AI: generating tests…' },
        () => generateTests(aiProvider, { sourceCode: sourceCode!, sourceFilePath: sourceFilePath! })
      );

      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      const outputPath = workspaceRoot ? path.join(workspaceRoot, result.testFilePath) : result.testFilePath;
      const outputUri = vscode.Uri.file(outputPath);

      await vscode.workspace.fs.writeFile(outputUri, Buffer.from(result.content, 'utf8'));
      const document = await vscode.workspace.openTextDocument(outputUri);
      await vscode.window.showTextDocument(document);
    } catch (err) {
      vscode.window.showErrorMessage(`Dev Companion AI: test generation failed — ${(err as Error).message}`);
    }
  });

  context.subscriptions.push(disposable);
}
