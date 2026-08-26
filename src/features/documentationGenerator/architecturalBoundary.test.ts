import * as fs from 'fs';
import * as path from 'path';

const ALLOWED_CROSS_FEATURE_IMPORTS = new Set([
  '../apiExplorer/types',
  '../apiExplorer/curlGenerator',
  '../architectureVisualization/types'
]);

const FORBIDDEN_SUBSTRINGS = [
  '../apiExplorer/scanner',
  '../apiExplorer/expressParser',
  '../apiExplorer/nestjsParser',
  '../apiExplorer/index',
  "from '../apiExplorer'",
  '../architectureVisualization/folderScanner',
  '../architectureVisualization/diagramData',
  '../architectureVisualization/svgRenderer',
  '../architectureVisualization/exporter',
  '../architectureVisualization/index',
  "from '../architectureVisualization'"
];

/**
 * Enforces the SRS acceptance criterion that F6's output is traceably
 * derived from F2/F3 *data* (their exported types/contracts) and never from
 * re-implementing or re-invoking F2/F3's scanning logic directly.
 */
describe('documentationGenerator architectural boundary', () => {
  const dir = __dirname;
  const sourceFiles = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))
    .map((f) => path.join(dir, f));

  it('only imports F2/F3 data contracts (types) and pure utilities, never their scanners', () => {
    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const importLines = content.match(/^import .*$/gm) ?? [];
      const crossFeatureImports = importLines.filter((line) => /\.\.\/(apiExplorer|architectureVisualization)\//.test(line));

      for (const line of crossFeatureImports) {
        const specifierMatch = line.match(/from\s+'([^']+)'/);
        const specifier = specifierMatch?.[1];
        expect(ALLOWED_CROSS_FEATURE_IMPORTS.has(specifier ?? '')).toBe(true);
      }

      for (const forbidden of FORBIDDEN_SUBSTRINGS) {
        expect(content.includes(forbidden)).toBe(false);
      }
    }
  });

  it('exposes at least one cross-feature import, proving F6 actually consumes F2/F3 data (not built in isolation)', () => {
    const allContent = sourceFiles.map((f) => fs.readFileSync(f, 'utf8')).join('\n');
    expect(allContent).toMatch(/from '\.\.\/apiExplorer\/types'/);
    expect(allContent).toMatch(/from '\.\.\/architectureVisualization\/types'/);
  });
});
