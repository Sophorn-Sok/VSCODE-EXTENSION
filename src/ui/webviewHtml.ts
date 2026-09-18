export function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/'/g, '&#39;');
}

/**
 * Shared shell for extension webviews: VS Code theme tokens, CSP, and
 * a small set of layout primitives so each feature does not invent CSS.
 */
export function wrapWebviewHtml(options: { title: string; body: string; script?: string }): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; script-src 'unsafe-inline';" />
  <title>${escapeHtml(options.title)}</title>
  <style>
    :root { color-scheme: light dark; }
    * { box-sizing: border-box; }
    body {
      font-family: var(--vscode-font-family, sans-serif);
      color: var(--vscode-editor-foreground);
      background: var(--vscode-editor-background);
      padding: 16px 20px 28px;
      font-size: 13px;
      margin: 0;
      line-height: 1.45;
    }
    h2 { font-weight: 600; margin: 0 0 4px; font-size: 16px; }
    .subtitle { opacity: 0.7; margin: 0 0 16px; }
    .toolbar { display: flex; gap: 8px; flex-wrap: wrap; margin: 0 0 16px; }
    .cards { display: flex; gap: 10px; flex-wrap: wrap; margin: 0 0 16px; }
    .card {
      min-width: 140px;
      flex: 1;
      background: var(--vscode-editorWidget-background, rgba(127,127,127,0.08));
      border: 1px solid var(--vscode-panel-border, #444);
      border-radius: 6px;
      padding: 10px 12px;
    }
    .card .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; opacity: 0.65; }
    .card .value { font-size: 20px; font-weight: 600; margin-top: 4px; }
    .errors, .warn, .ai, .block {
      border-radius: 6px;
      padding: 10px 12px;
      margin-bottom: 16px;
    }
    .errors {
      background: rgba(248, 81, 73, 0.12);
      border: 1px solid rgba(248, 81, 73, 0.4);
    }
    .warn {
      background: rgba(210, 153, 34, 0.12);
      border: 1px solid rgba(210, 153, 34, 0.4);
    }
    .ai, .block {
      background: var(--vscode-textCodeBlock-background, rgba(127,127,127,0.12));
      border: 1px solid var(--vscode-panel-border, #444);
    }
    .errors ul, .warn ul { margin: 4px 0 0; padding-left: 18px; }
    table { width: 100%; border-collapse: collapse; }
    th {
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      opacity: 0.6;
      padding: 6px 10px;
      border-bottom: 1px solid var(--vscode-panel-border, #444);
    }
    td {
      padding: 8px 10px;
      border-bottom: 1px solid var(--vscode-panel-border, #333);
      vertical-align: top;
    }
    tr:hover td { background: var(--vscode-list-hoverBackground); }
    button {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 4px;
      padding: 4px 10px;
      font-size: 12px;
      cursor: pointer;
    }
    button:hover { background: var(--vscode-button-hoverBackground); }
    button.secondary {
      background: var(--vscode-button-secondaryBackground, transparent);
      color: var(--vscode-button-secondaryForeground, inherit);
      border: 1px solid var(--vscode-panel-border, #555);
    }
    .empty { opacity: 0.6; padding: 24px 0; }
    .severity-critical, .severity-high { color: #f85149; font-weight: 600; }
    .severity-moderate { color: #d29922; font-weight: 600; }
    .severity-low, .severity-info { opacity: 0.8; }
    pre, code {
      font-family: var(--vscode-editor-font-family, monospace);
      font-size: 12px;
    }
    pre {
      white-space: pre-wrap;
      margin: 0;
    }
    .diagram-wrap {
      overflow: auto;
      border: 1px solid var(--vscode-panel-border, #444);
      border-radius: 6px;
      padding: 8px;
      background: var(--vscode-editorWidget-background, transparent);
    }
    .diagram-wrap svg { display: block; max-width: none; }
    .diagram-wrap .diagram-bg { fill: var(--vscode-editor-background); }
    .diagram-wrap .edge { stroke: var(--vscode-foreground); opacity: 0.45; }
    .diagram-wrap .legend-label { fill: var(--vscode-foreground); }
  </style>
</head>
<body>
  ${options.body}
  ${options.script ? `<script>${options.script}</script>` : ''}
</body>
</html>`;
}
