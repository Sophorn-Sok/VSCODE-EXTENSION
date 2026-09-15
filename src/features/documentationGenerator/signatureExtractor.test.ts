import { extractSignatures } from './signatureExtractor';

describe('extractSignatures', () => {
  it('extracts a top-level function declaration signature', () => {
    const source = `export function add(a: number, b: number): number {\n  return a + b;\n}`;
    const { functions } = extractSignatures(source, 'math.ts');

    expect(functions).toHaveLength(1);
    expect(functions[0]).toMatchObject({
      name: 'add',
      params: ['a: number', 'b: number'],
      returnType: 'number',
      isExported: true,
      filePath: 'math.ts',
      line: 1
    });
  });

  it('extracts an arrow function assigned to a const', () => {
    const source = `const multiply = (a: number, b: number) => a * b;`;
    const { functions } = extractSignatures(source, 'math.ts');

    expect(functions).toHaveLength(1);
    expect(functions[0]).toMatchObject({ name: 'multiply', isExported: false });
  });

  it('extracts a class with its methods', () => {
    const source = `export class Calculator {\n  add(a: number, b: number): number {\n    return a + b;\n  }\n  reset(): void {}\n}`;
    const { classes } = extractSignatures(source, 'calc.ts');

    expect(classes).toHaveLength(1);
    expect(classes[0]).toMatchObject({ name: 'Calculator', isExported: true });
    expect(classes[0].methods.map((m) => m.name)).toEqual(['add', 'reset']);
  });

  it('returns empty arrays for a file with no functions or classes', () => {
    const result = extractSignatures('export const x = 1;', 'plain.ts');
    expect(result.functions).toEqual([]);
    expect(result.classes).toEqual([]);
  });

  it('includes the function source snippet as `code`', () => {
    const source = `function greet(name: string) {\n  return 'hi ' + name;\n}`;
    const { functions } = extractSignatures(source, 'greet.ts');

    expect(functions[0].code).toContain("return 'hi ' + name;");
  });

  it('extracts a function nested inside a namespace block', () => {
    const source = `namespace MyUtils {\n  export function greet(name: string) {\n    return 'hi ' + name;\n  }\n}`;
    const { functions } = extractSignatures(source, 'utils.ts');

    expect(functions).toHaveLength(1);
    expect(functions[0]).toMatchObject({ name: 'greet', isExported: true });
  });
});