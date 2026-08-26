import { ApiEndpoint } from '../apiExplorer/types';
import { generateCurlCommand } from '../apiExplorer/curlGenerator';

/**
 * Renders API documentation from F2 (API Explorer)'s already-discovered
 * endpoint data. Deliberately takes `ApiEndpoint[]` — not a workspace root —
 * so it is structurally incapable of re-scanning the workspace itself; it
 * can only document what F2 already found.
 */
export function generateApiDocumentation(endpoints: ApiEndpoint[]): string {
  if (endpoints.length === 0) {
    return '# API Documentation\n\nNo API endpoints were discovered. Run "Dev Companion: Scan API Endpoints" first.\n';
  }

  const byFile = new Map<string, ApiEndpoint[]>();
  for (const endpoint of endpoints) {
    const list = byFile.get(endpoint.filePath) ?? [];
    list.push(endpoint);
    byFile.set(endpoint.filePath, list);
  }

  const lines: string[] = ['# API Documentation', ''];

  for (const [filePath, fileEndpoints] of Array.from(byFile.entries()).sort(([a], [b]) => a.localeCompare(b))) {
    lines.push(`## ${filePath}`, '');
    for (const endpoint of fileEndpoints) {
      lines.push(`### \`${endpoint.method} ${endpoint.path}\``, '');
      lines.push(`- **Framework:** ${endpoint.framework}`);
      lines.push(`- **Source:** ${endpoint.filePath}:${endpoint.line}`);
      if (endpoint.bodyFields.length > 0) {
        lines.push(`- **Request body fields:** ${endpoint.bodyFields.map((f) => f.name).join(', ')}`);
      }
      lines.push('', '```bash', generateCurlCommand(endpoint), '```', '');
    }
  }

  return lines.join('\n');
}
