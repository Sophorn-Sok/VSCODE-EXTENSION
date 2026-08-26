import { buildDiagramData } from './diagramData';
import { FolderTreeNode } from './types';

describe('buildDiagramData', () => {
  it('flattens a nested tree into nodes with correct depth and parent linkage', () => {
    const tree: FolderTreeNode = {
      name: 'root',
      relativePath: '',
      type: 'directory',
      children: [
        {
          name: 'src',
          relativePath: 'src',
          type: 'directory',
          children: [{ name: 'index.ts', relativePath: 'src/index.ts', type: 'file' }]
        },
        { name: 'README.md', relativePath: 'README.md', type: 'file' }
      ]
    };

    const data = buildDiagramData(tree);

    expect(data.nodes).toEqual([
      { id: '.', label: 'root', parentId: undefined, depth: 0, type: 'directory' },
      { id: 'src', label: 'src', parentId: '.', depth: 1, type: 'directory' },
      { id: 'src/index.ts', label: 'index.ts', parentId: 'src', depth: 2, type: 'file' },
      { id: 'README.md', label: 'README.md', parentId: '.', depth: 1, type: 'file' }
    ]);
  });

  it('produces one edge per parent-child relationship', () => {
    const tree: FolderTreeNode = {
      name: 'root',
      relativePath: '',
      type: 'directory',
      children: [{ name: 'a', relativePath: 'a', type: 'directory', children: [] }]
    };

    const data = buildDiagramData(tree);

    expect(data.edges).toEqual([{ from: '.', to: 'a' }]);
  });

  it('handles a root with no children', () => {
    const tree: FolderTreeNode = { name: 'root', relativePath: '', type: 'directory', children: [] };

    const data = buildDiagramData(tree);

    expect(data.nodes).toEqual([{ id: '.', label: 'root', parentId: undefined, depth: 0, type: 'directory' }]);
    expect(data.edges).toEqual([]);
  });
});
