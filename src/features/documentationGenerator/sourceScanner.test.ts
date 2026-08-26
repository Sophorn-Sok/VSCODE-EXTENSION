import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { scanWorkspaceSignatures } from './sourceScanner';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'dev-companion-docgen-scan-'));
}

describe('scanWorkspaceSignatures', () => {
  it('collects functions and classes across multiple files, excluding node_modules', () => {
    const root = makeTmpDir();
    fs.mkdirSync(path.join(root, 'node_modules', 'pkg'), { recursive: true });
    fs.writeFileSync(path.join(root, 'math.ts'), 'export function add(a: number, b: number) { return a + b; }');
    fs.writeFileSync(path.join(root, 'calc.ts'), 'export class Calculator { run() {} }');
    fs.writeFileSync(path.join(root, 'node_modules', 'pkg', 'index.js'), 'function shouldNotAppear() {}');

    const result = scanWorkspaceSignatures(root);

    expect(result.functions.map((f) => f.name)).toEqual(['add']);
    expect(result.classes.map((c) => c.name)).toEqual(['Calculator']);
  });

  it('skips *.test.ts and *.spec.ts files', () => {
    const root = makeTmpDir();
    fs.writeFileSync(path.join(root, 'math.test.ts'), 'function testHelper() {}');
    fs.writeFileSync(path.join(root, 'math.spec.ts'), 'function specHelper() {}');
    fs.writeFileSync(path.join(root, 'math.ts'), 'export function add() {}');

    const result = scanWorkspaceSignatures(root);

    expect(result.functions.map((f) => f.name)).toEqual(['add']);
  });

  it('preserves partial results when a file fails to read', () => {
    const root = makeTmpDir();
    fs.writeFileSync(path.join(root, 'good.ts'), 'export function ok() {}');
    const badFile = path.join(root, 'bad.ts');
    fs.writeFileSync(badFile, 'export function alsoOk() {}');
    fs.chmodSync(badFile, 0o000);

    const result = scanWorkspaceSignatures(root);

    expect(result.functions.some((f) => f.name === 'ok')).toBe(true);

    fs.chmodSync(badFile, 0o644);
  });
});
