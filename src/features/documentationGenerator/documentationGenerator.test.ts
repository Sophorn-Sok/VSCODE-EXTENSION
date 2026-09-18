import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { generateDocumentation } from './documentationGenerator';
import { AIProvider } from '../../core/AIProvider';
import { ApiEndpoint } from '../apiExplorer/types';
import { FolderTreeNode } from '../architectureVisualization/types';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'dev-companion-docgen-'));
}

function fakeProvider(): AIProvider {
  return {
    name: 'fake',
    complete: jest.fn().mockResolvedValue({ text: 'AI-generated doc.', model: 'fake' }),
    isAvailable: jest.fn().mockResolvedValue(true)
  };
}

describe('generateDocumentation', () => {
  it('produces API docs that reflect exactly the F2 endpoints passed in, without re-scanning for them', async () => {
    const root = makeTmpDir();
    // No route-declaration source in the workspace at all — if generateDocumentation
    // were re-scanning for endpoints instead of consuming the given F2 data, it
    // would find zero routes here regardless of what's passed in.
    fs.writeFileSync(path.join(root, 'unrelated.ts'), 'export function noop() {}');

    const endpoints: ApiEndpoint[] = [
      { method: 'GET', path: '/api/ping', filePath: 'ping.ts', line: 1, framework: 'express', bodyFields: [] }
    ];

    const result = await generateDocumentation({ aiProvider: fakeProvider(), rootDir: root, endpoints });

    expect(result.apiDocumentationMarkdown).toContain('GET /api/ping');
  });

  it('produces an architecture guide that reflects exactly the F3 folder tree passed in, without re-traversing', async () => {
    const root = makeTmpDir();
    // The real directory structure on disk is completely different from the
    // folderTree passed in below — proving the architecture guide's folder
    // structure section comes from the given F3 data, not a fresh scan.
    fs.mkdirSync(path.join(root, 'real-dir-not-in-tree'));

    const folderTree: FolderTreeNode = {
      name: 'fake-root',
      relativePath: '',
      type: 'directory',
      children: [{ name: 'imaginary-dir', relativePath: 'imaginary-dir', type: 'directory', children: [] }]
    };

    const result = await generateDocumentation({ aiProvider: fakeProvider(), rootDir: root, endpoints: [], folderTree });

    expect(result.architectureGuideMarkdown).toContain('imaginary-dir');
    expect(result.architectureGuideMarkdown).not.toContain('real-dir-not-in-tree');
  });

  it('generates function and class docs by parsing the workspace source itself', async () => {
    const root = makeTmpDir();
    fs.writeFileSync(path.join(root, 'math.ts'), 'export function add(a: number, b: number) { return a + b; }');

    const result = await generateDocumentation({ aiProvider: fakeProvider(), rootDir: root, endpoints: [] });

    expect(result.architectureGuideMarkdown).toContain('add(a: number, b: number)');
    expect(result.architectureGuideMarkdown).toContain('AI-generated doc.');
  });

  it('computes a summary count derived from the same inputs', async () => {
    const root = makeTmpDir();
    fs.writeFileSync(path.join(root, 'math.ts'), 'export function add() {}\nexport class Calc {}');

    const endpoints: ApiEndpoint[] = [
      { method: 'GET', path: '/a', filePath: 'a.ts', line: 1, framework: 'express', bodyFields: [] }
    ];

    const result = await generateDocumentation({ aiProvider: fakeProvider(), rootDir: root, endpoints });

    expect(result.summaryCount).toEqual({
      routesDocumented: 1,
      controllersDocumented: 1,
      functionsDocumented: 1,
      classesDocumented: 1
    });
  });

  it('still produces usable output when folderTree is omitted (partial results preserved)', async () => {
    const root = makeTmpDir();

    const result = await generateDocumentation({ aiProvider: fakeProvider(), rootDir: root, endpoints: [] });

    expect(result.architectureGuideMarkdown).toContain('No folder hierarchy data available');
  });

  it('still writes usable docs when the AIProvider is unreachable (e.g. Ollama down)', async () => {
    const root = makeTmpDir();
    fs.writeFileSync(path.join(root, 'math.ts'), 'export function add(a: number, b: number) { return a + b; }');
    const endpoints: ApiEndpoint[] = [
      { method: 'GET', path: '/api/ping', filePath: 'ping.ts', line: 1, framework: 'express', bodyFields: [] }
    ];
    const unreachableProvider: AIProvider = {
      name: 'ollama',
      complete: jest.fn().mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:11434')),
      isAvailable: jest.fn().mockResolvedValue(false)
    };

    const result = await generateDocumentation({ aiProvider: unreachableProvider, rootDir: root, endpoints });

    // Static analysis (endpoints, parsed function signatures) is unaffected —
    // only the AI-generated prose degrades to a fallback note.
    expect(result.apiDocumentationMarkdown).toContain('GET /api/ping');
    expect(result.architectureGuideMarkdown).toContain('add(a: number, b: number)');
    expect(result.architectureGuideMarkdown).toContain('AI documentation unavailable');
  });
});
