import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { exportDiagramAsSvg, exportDiagramAsPng } from './exporter';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'dev-companion-exporter-'));
}

describe('exportDiagramAsSvg', () => {
  it('writes a valid SVG file, creating parent directories as needed', () => {
    const root = makeTmpDir();
    const outputPath = path.join(root, 'nested', 'diagram.svg');

    exportDiagramAsSvg({ nodes: [{ id: '.', label: 'root', depth: 0, type: 'directory' }], edges: [] }, outputPath);

    const content = fs.readFileSync(outputPath, 'utf8');
    expect(content).toContain('<svg');
    expect(content).toContain('root');
  });
});

describe('exportDiagramAsPng', () => {
  it('writes the given buffer to disk as-is', () => {
    const root = makeTmpDir();
    const outputPath = path.join(root, 'diagram.png');
    const fakePngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

    exportDiagramAsPng(fakePngBuffer, outputPath);

    expect(fs.readFileSync(outputPath)).toEqual(fakePngBuffer);
  });
});
