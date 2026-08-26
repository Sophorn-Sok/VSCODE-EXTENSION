/**
 * Minimal `vscode` module mock for Jest. Feature wiring modules (index.ts /
 * *Listener.ts / *Panel.ts files) are thin and intentionally not
 * unit-tested against this mock — the pure logic they call into is tested
 * directly. This mock exists so those wiring files still type-check and can
 * be imported without crashing if a test happens to reach them transitively.
 */

export enum ProgressLocation {
  Notification = 15,
  SourceControl = 1,
  Window = 10
}

export class EventEmitter<T> {
  private listeners: Array<(e: T) => void> = [];
  event = (listener: (e: T) => void) => {
    this.listeners.push(listener);
    return { dispose: () => {} };
  };
  fire(data: T) {
    this.listeners.forEach((l) => l(data));
  }
  dispose() {
    this.listeners = [];
  }
}

export const window = {
  createOutputChannel: jest.fn(() => ({
    appendLine: jest.fn(),
    append: jest.fn(),
    show: jest.fn(),
    clear: jest.fn(),
    dispose: jest.fn()
  })),
  showErrorMessage: jest.fn(),
  showInformationMessage: jest.fn(),
  showWarningMessage: jest.fn(),
  showTextDocument: jest.fn(),
  showSaveDialog: jest.fn(),
  showQuickPick: jest.fn(),
  withProgress: jest.fn((_options: unknown, task: (...args: unknown[]) => unknown) =>
    task({ report: jest.fn() }, { isCancellationRequested: false })
  ),
  onDidStartTerminalShellExecution: jest.fn(() => ({ dispose: jest.fn() })),
  onDidEndTerminalShellExecution: jest.fn(() => ({ dispose: jest.fn() })),
  createWebviewPanel: jest.fn(),
  createStatusBarItem: jest.fn(() => ({
    text: '',
    tooltip: '',
    command: '',
    name: '',
    show: jest.fn(),
    hide: jest.fn(),
    dispose: jest.fn()
  })),
  registerTreeDataProvider: jest.fn(() => ({ dispose: jest.fn() })),
  activeTextEditor: undefined
};

export const workspace = {
  workspaceFolders: undefined,
  getConfiguration: jest.fn(() => ({
    get: jest.fn(),
    inspect: jest.fn()
  })),
  onDidChangeConfiguration: jest.fn(() => ({ dispose: jest.fn() })),
  onDidChangeWorkspaceFolders: jest.fn(() => ({ dispose: jest.fn() })),
  openTextDocument: jest.fn(),
  fs: {
    writeFile: jest.fn(),
    readFile: jest.fn()
  }
};

export const commands = {
  registerCommand: jest.fn(() => ({ dispose: jest.fn() })),
  executeCommand: jest.fn()
};

export const env = {
  clipboard: {
    writeText: jest.fn()
  }
};

export enum ViewColumn {
  Active = -1,
  Beside = -2,
  One = 1
}

export enum StatusBarAlignment {
  Left = 1,
  Right = 2
}

export enum TreeItemCollapsibleState {
  None = 0,
  Collapsed = 1,
  Expanded = 2
}

export enum TextEditorRevealType {
  InCenter = 2
}

export class ThemeColor {
  constructor(public id: string) {}
}

export class ThemeIcon {
  constructor(public id: string) {}
}

export class TreeItem {
  description?: string;
  tooltip?: string;
  iconPath?: ThemeIcon;
  command?: { command: string; title: string };
  contextValue?: string;
  id?: string;
  constructor(
    public label: string,
    public collapsibleState?: TreeItemCollapsibleState
  ) {}
}

export class Uri {
  static file(path: string) {
    return { fsPath: path, scheme: 'file', path };
  }
  static parse(value: string) {
    return { fsPath: value, scheme: 'file', path: value };
  }
}

export class Position {
  constructor(public line: number, public character: number) {}
}

export class Range {
  constructor(public start: Position, public end: Position) {}
}

export class Selection {
  constructor(public anchor: Position, public active: Position) {}
}
