import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { walkFiles, walkDirectoryTree } from './fsWalk';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'dev-companion-fswalk-'));
}

describe('walkFiles', () => {
  it('finds files recursively while excluding node_modules and .git by default', () => {
    const root = makeTmpDir();
    fs.mkdirSync(path.join(root, 'src', 'nested'), { recursive: true });
    fs.mkdirSync(path.join(root, 'node_modules', 'pkg'), { recursive: true });
    fs.mkdirSync(path.join(root, '.git'), { recursive: true });
    fs.writeFileSync(path.join(root, 'src', 'a.ts'), '');
    fs.writeFileSync(path.join(root, 'src', 'nested', 'b.ts'), '');
    fs.writeFileSync(path.join(root, 'node_modules', 'pkg', 'index.js'), '');
    fs.writeFileSync(path.join(root, '.git', 'HEAD'), '');

    const files = walkFiles(root).map((f) => path.relative(root, f));

    expect(files.sort()).toEqual([path.join('src', 'a.ts'), path.join('src', 'nested', 'b.ts')].sort());
  });

  it('filters by extension when provided', () => {
    const root = makeTmpDir();
    fs.writeFileSync(path.join(root, 'a.ts'), '');
    fs.writeFileSync(path.join(root, 'b.md'), '');

    const files = walkFiles(root, { extensions: ['.ts'] }).map((f) => path.basename(f));

    expect(files).toEqual(['a.ts']);
  });

  it('does not throw and returns partial results when a subdirectory is unreadable', () => {
    const root = makeTmpDir();
    fs.writeFileSync(path.join(root, 'a.ts'), '');
    const restrictedDir = path.join(root, 'restricted');
    fs.mkdirSync(restrictedDir);
    fs.writeFileSync(path.join(restrictedDir, 'b.ts'), '');
    fs.chmodSync(restrictedDir, 0o000);

    let files: string[] = [];
    expect(() => {
      files = walkFiles(root);
    }).not.toThrow();
    expect(files.some((f) => f.endsWith('a.ts'))).toBe(true);

    fs.chmodSync(restrictedDir, 0o755); // restore so tmp cleanup can remove it
  });
});

describe('walkDirectoryTree', () => {
  it('builds a nested tree excluding default directories', () => {
    const root = makeTmpDir();
    fs.mkdirSync(path.join(root, 'src'), { recursive: true });
    fs.mkdirSync(path.join(root, 'node_modules'), { recursive: true });
    fs.writeFileSync(path.join(root, 'src', 'index.ts'), '');
    fs.writeFileSync(path.join(root, 'README.md'), '');

    const tree = walkDirectoryTree(root);

    const childNames = tree.children!.map((c) => c.name).sort();
    expect(childNames).toEqual(['README.md', 'src']);

    const srcNode = tree.children!.find((c) => c.name === 'src')!;
    expect(srcNode.type).toBe('directory');
    expect(srcNode.children!.map((c) => c.name)).toEqual(['index.ts']);
  });

  it('sets relativePath using forward slashes regardless of platform', () => {
    const root = makeTmpDir();
    fs.mkdirSync(path.join(root, 'a', 'b'), { recursive: true });
    fs.writeFileSync(path.join(root, 'a', 'b', 'c.ts'), '');

    const tree = walkDirectoryTree(root);
    const aNode = tree.children!.find((c) => c.name === 'a')!;
    const bNode = aNode.children!.find((c) => c.name === 'b')!;
    const cNode = bNode.children!.find((c) => c.name === 'c.ts')!;

    expect(cNode.relativePath).toBe('a/b/c.ts');
  });
});
