import * as vscode from 'vscode';

interface FeatureItem {
  id: string;
  label: string;
  command: string;
  description: string;
  icon: string;
}

const FEATURES: FeatureItem[] = [
  {
    id: 'api',
    label: 'Scan API Endpoints',
    command: 'devCompanion.scanApiEndpoints',
    description: 'Express / NestJS routes + cURL',
    icon: 'symbol-method'
  },
  {
    id: 'architecture',
    label: 'Visualize Architecture',
    command: 'devCompanion.visualizeArchitecture',
    description: 'Folder diagram, export SVG/PNG',
    icon: 'type-hierarchy'
  },
  {
    id: 'deps',
    label: 'Analyze Dependencies',
    command: 'devCompanion.analyzeDependencies',
    description: 'Outdated packages and audit',
    icon: 'package'
  },
  {
    id: 'docs',
    label: 'Generate Documentation',
    command: 'devCompanion.generateDocumentation',
    description: 'API + architecture markdown',
    icon: 'book'
  },
  {
    id: 'tests',
    label: 'Generate Unit Tests',
    command: 'devCompanion.generateTests',
    description: 'From the current file or selection',
    icon: 'beaker'
  },
  {
    id: 'errors',
    label: 'Explain Last Terminal Error',
    command: 'devCompanion.explainLastTerminalError',
    description: 'Re-run the last failure explanation',
    icon: 'terminal'
  },
  {
    id: 'settings',
    label: 'Open Settings',
    command: 'devCompanion.openSettings',
    description: 'Model, Ollama URL, API base URL',
    icon: 'gear'
  }
];

class SidebarProvider implements vscode.TreeDataProvider<FeatureItem> {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<FeatureItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: FeatureItem): vscode.TreeItem {
    const item = new vscode.TreeItem(element.label, vscode.TreeItemCollapsibleState.None);
    item.id = element.id;
    item.description = element.description;
    item.tooltip = `${element.label} — ${element.description}`;
    item.iconPath = new vscode.ThemeIcon(element.icon);
    item.command = { command: element.command, title: element.label };
    item.contextValue = 'devCompanion.feature';
    return item;
  }

  getChildren(): FeatureItem[] {
    if (!vscode.workspace.workspaceFolders?.length) {
      return [];
    }
    return FEATURES;
  }
}

export function activateSidebar(context: vscode.ExtensionContext): void {
  const provider = new SidebarProvider();
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('devCompanion.sidebar', provider),
    vscode.workspace.onDidChangeWorkspaceFolders(() => provider.refresh())
  );
}
