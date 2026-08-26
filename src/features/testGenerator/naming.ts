/**
 * Derives a Jest-convention `*.test.ts` (or `.tsx`/`.js`/`.jsx`) path from a
 * source file path, e.g. `src/utils/math.ts` -> `src/utils/math.test.ts`.
 */
export function deriveTestFilePath(sourceFilePath: string): string {
  const normalized = sourceFilePath.replace(/\\/g, '/');
  const lastSlash = normalized.lastIndexOf('/');
  const dir = lastSlash >= 0 ? normalized.slice(0, lastSlash + 1) : '';
  const fileName = lastSlash >= 0 ? normalized.slice(lastSlash + 1) : normalized;

  const match = fileName.match(/^(.*)\.(tsx|ts|jsx|js)$/);
  if (!match) {
    return `${dir}${fileName}.test.ts`;
  }
  const [, base, ext] = match;
  if (base.endsWith('.test') || base.endsWith('.spec')) {
    return `${dir}${fileName}`;
  }
  return `${dir}${base}.test.${ext}`;
}
