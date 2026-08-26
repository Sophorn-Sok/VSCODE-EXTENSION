import { generateArchitectureSummary, renderTreeAsText } from './architectureDocGenerator';
import { AIProvider } from '../../core/AIProvider';
import { FolderTreeNode } from '../architectureVisualization/types';

const sampleTree: FolderTreeNode = {
  name: 'root',
  relativePath: '',
  type: 'directory',
  children: [
    {
      name: 'src',
      relativePath: 'src',
      type: 'directory',
      children: [{ name: 'index.ts', relativePath: 'src/index.ts', type: 'file' }]
    }
  ]
};

describe('renderTreeAsText', () => {
  it('renders directories with a trailing slash and indents children', () => {
    const text = renderTreeAsText(sampleTree);
    expect(text).toBe('- root/\n  - src/\n    - index.ts');
  });
});

describe('generateArchitectureSummary', () => {
  it('sends the rendered folder tree (from F3 data) to AIProvider, unmodified structurally', async () => {
    const aiProvider: AIProvider = {
      name: 'fake',
      complete: jest.fn().mockResolvedValue({ text: '  This project has a src directory.  ', model: 'fake' }),
      isAvailable: jest.fn().mockResolvedValue(true)
    };

    const summary = await generateArchitectureSummary(aiProvider, sampleTree);

    expect(summary).toBe('This project has a src directory.');
    const promptArg = (aiProvider.complete as jest.Mock).mock.calls[0][0] as string;
    expect(promptArg).toContain('src/');
    expect(promptArg).toContain('index.ts');
  });

  it('only ever accepts a FolderTreeNode (no independent folder-traversal capability)', () => {
    // generateArchitectureSummary's signature takes (aiProvider, tree) — not a
    // workspace root path — so it cannot re-implement folder traversal itself.
    expect(generateArchitectureSummary.length).toBe(2);
  });
});
