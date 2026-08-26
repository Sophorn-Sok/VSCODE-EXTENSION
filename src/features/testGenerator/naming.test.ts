import { deriveTestFilePath } from './naming';

describe('deriveTestFilePath', () => {
  it('inserts .test before the extension', () => {
    expect(deriveTestFilePath('src/utils/math.ts')).toBe('src/utils/math.test.ts');
  });

  it('handles tsx files', () => {
    expect(deriveTestFilePath('src/components/Button.tsx')).toBe('src/components/Button.test.tsx');
  });

  it('handles bare file names with no directory', () => {
    expect(deriveTestFilePath('math.js')).toBe('math.test.js');
  });

  it('handles files with no recognized extension by appending .test.ts', () => {
    expect(deriveTestFilePath('README')).toBe('README.test.ts');
  });

  it('is idempotent for files already ending in .test.ts', () => {
    expect(deriveTestFilePath('src/math.test.ts')).toBe('src/math.test.ts');
  });

  it('is idempotent for files already ending in .spec.ts', () => {
    expect(deriveTestFilePath('src/math.spec.ts')).toBe('src/math.spec.ts');
  });

  it('normalizes Windows-style path separators', () => {
    expect(deriveTestFilePath('src\\utils\\math.ts')).toBe('src/utils/math.test.ts');
  });
});
