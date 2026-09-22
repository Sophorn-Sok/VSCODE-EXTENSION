import { ApiEndpoint } from './types';
import { extractBodyFields, extractQueryFields } from './bodyFieldExtractor';

/**
 * Matches Express/Koa-router-style `app.get('/path', ...)`,
 * `router.post("/path", ...)` calls. Requires the path literal to start with
 * "/" to avoid false positives on unrelated `.get(key)`-style calls (e.g.
 * Map/cache lookups).
 */
const ROUTE_PATTERN = /(?:^|[^.\w$])[A-Za-z_$][\w$]*\.(get|post|put|patch|delete|options|head)\s*\(\s*(['"`])(\/[^'"`]*)\2/i;

const MAX_BODY_WINDOW_LINES = 40;

export function parseExpressRoutes(text: string, filePath: string): ApiEndpoint[] {
  const lines = text.split(/\r?\n/);
  const matches: Array<{ line: number; method: string; path: string }> = [];

  lines.forEach((lineText, idx) => {
    const match = ROUTE_PATTERN.exec(lineText);
    if (match) {
      matches.push({ line: idx + 1, method: match[1].toUpperCase(), path: match[3] });
    }
  });

  return matches.map((match, i) => {
    const nextMatchLine = matches[i + 1]?.line;
    const windowEnd = nextMatchLine ? Math.max(match.line, nextMatchLine - 1) : Math.min(lines.length, match.line + MAX_BODY_WINDOW_LINES);
    const windowText = lines.slice(match.line - 1, windowEnd).join('\n');

    return {
      method: match.method as ApiEndpoint['method'],
      path: match.path,
      filePath,
      line: match.line,
      framework: 'express',
      bodyFields: extractBodyFields(windowText),
      queryFields: extractQueryFields(windowText)
    };
  });
}
