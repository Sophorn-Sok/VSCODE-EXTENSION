import * as vscode from 'vscode';
import * as path from 'path';
import { AIProvider } from '../../core/AIProvider';
import { ApiExplorerContract } from '../apiExplorer/types';
import { ArchitectureContract } from '../architectureVisualization/types';
import { generateDocumentation } from './documentationGenerator';
import { writeMarkdownFile } from './markdownWriter';

export type { DocumentationSummaryCount, FunctionSignature, ClassSignature } from './types';
export { generateDocumentation } from './documentationGenerator';

/**
 * Wires the "Generate Documentation" command. Depends only on
 * `ApiExplorerContract` and `ArchitectureContract` — the documented F2->F6
 * and F3->F6 data contracts — never on F2/F3's scanning implementations.
 */
export function activateDocumentationGenerator(
  context: vscode.ExtensionContext,
  aiProvider: AIProvider,
  apiExplorer: ApiExplorerContract,
  architectureVisualizer: ArchitectureContract
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('devCompanion.generateDocumentation', async () => {
      const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!root) {
        vscode.window.showErrorMessage('Dev Companion AI: open a workspace folder to generate documentation.');
        return;
      }

      const missing: string[] = [];
      if (apiExplorer.getEndpoints().length === 0) {
        missing.push('API scan');
      }
      if (!architectureVisualizer.getFolderTree()) {
        missing.push('architecture diagram');
      }
      if (missing.length > 0) {
        const choice = await vscode.window.showWarningMessage(
          `Dev Companion AI: documentation is richer after an ${missing.join(' and ')}. Generate anyway?`,
          'Generate anyway',
          'Cancel'
        );
        if (choice !== 'Generate anyway') {
          return;
        }
      }

      try {
        const result = await vscode.window.withProgress(
          { location: vscode.ProgressLocation.Notification, title: 'Dev Companion AI: generating documentation…' },
          () =>
            generateDocumentation({
              aiProvider,
              rootDir: root,
              endpoints: apiExplorer.getEndpoints(),
              folderTree: architectureVisualizer.getFolderTree()
            })
        );

        const apiDocPath = path.join(root, 'API_Documentation.md');
        const architectureDocPath = path.join(root, 'Architecture_Guide.md');
        writeMarkdownFile(result.apiDocumentationMarkdown, apiDocPath);
        writeMarkdownFile(result.architectureGuideMarkdown, architectureDocPath);

        const architectureDoc = await vscode.workspace.openTextDocument(vscode.Uri.file(architectureDocPath));
        await vscode.window.showTextDocument(architectureDoc, { preview: false });
        const apiDoc = await vscode.workspace.openTextDocument(vscode.Uri.file(apiDocPath));
        await vscode.window.showTextDocument(apiDoc, { preview: false, viewColumn: vscode.ViewColumn.Beside });

        vscode.window.showInformationMessage(
          `Dev Companion AI: documented ${result.summaryCount.routesDocumented} route(s), ` +
            `${result.summaryCount.controllersDocumented} controller file(s), ` +
            `${result.summaryCount.functionsDocumented} function(s), and ${result.summaryCount.classesDocumented} class(es).`
        );
      } catch (err) {
        vscode.window.showErrorMessage(`Dev Companion AI: documentation generation failed — ${(err as Error).message}`);
      }
    })
  );
}
