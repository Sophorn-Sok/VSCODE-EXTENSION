import * as fs from 'fs';
import * as path from 'path';
import { walkFiles } from '../../core/fsWalk';
import { ApiEndpoint, ApiScanResult, ScanError } from './types';
import { parseExpressRoutes } from './expressParser';
import { parseNestJsRoutes } from './nestjsParser';

const SOURCE_EXTENSIONS = ['.ts', '.js'];

/**
 * Scans a workspace for HTTP API endpoints. A failure reading or parsing any
 * single file is recorded as a scan error and does not abort the scan —
 * endpoints already found in other files are always preserved.
 */
export function scanWorkspaceForEndpoints(rootDir: string): ApiScanResult {
  const files = walkFiles(rootDir, { extensions: SOURCE_EXTENSIONS });
  const endpoints: ApiEndpoint[] = [];
  const errors: ScanError[] = [];

  for (const absoluteFilePath of files) {
    const relativeFilePath = path.relative(rootDir, absoluteFilePath).replace(/\\/g, '/');
    try {
      const text = fs.readFileSync(absoluteFilePath, 'utf8');
      endpoints.push(...parseExpressRoutes(text, relativeFilePath));
      endpoints.push(...parseNestJsRoutes(text, relativeFilePath));
    } catch (err) {
      errors.push({ filePath: relativeFilePath, message: (err as Error).message });
    }
  }

  return { endpoints, errors };
}
