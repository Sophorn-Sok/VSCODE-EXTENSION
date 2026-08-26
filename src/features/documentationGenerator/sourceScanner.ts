import * as fs from 'fs';
import * as path from 'path';
import { walkFiles } from '../../core/fsWalk';
import { extractSignatures } from './signatureExtractor';
import { ExtractedSignatures } from './types';

const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

/**
 * Scans workspace source files and extracts function/class signatures for
 * documentation generation. A parse failure on one file is skipped rather
 * than aborting the scan, so partial results are always preserved.
 */
export function scanWorkspaceSignatures(rootDir: string): ExtractedSignatures {
  const files = walkFiles(rootDir, { extensions: SOURCE_EXTENSIONS });
  const functions: ExtractedSignatures['functions'] = [];
  const classes: ExtractedSignatures['classes'] = [];

  for (const absoluteFilePath of files) {
    if (absoluteFilePath.endsWith('.test.ts') || absoluteFilePath.endsWith('.test.js') || absoluteFilePath.endsWith('.spec.ts')) {
      continue;
    }
    const relativeFilePath = path.relative(rootDir, absoluteFilePath).replace(/\\/g, '/');
    try {
      const text = fs.readFileSync(absoluteFilePath, 'utf8');
      const extracted = extractSignatures(text, relativeFilePath);
      functions.push(...extracted.functions);
      classes.push(...extracted.classes);
    } catch {
      // Skip files that fail to read/parse; keep signatures found elsewhere.
    }
  }

  return { functions, classes };
}
