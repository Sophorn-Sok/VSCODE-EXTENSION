import { generateClassDoc } from './classDocGenerator';
import { AIProvider } from '../../core/AIProvider';
import { ClassSignature } from './types';

function fakeProvider(responseText: string): AIProvider {
  return {
    name: 'fake',
    complete: jest.fn().mockResolvedValue({ text: responseText, model: 'fake' }),
    isAvailable: jest.fn().mockResolvedValue(true)
  };
}

const sampleClass: ClassSignature = {
  name: 'Calculator',
  filePath: 'calc.ts',
  line: 1,
  isExported: true,
  methods: [
    { name: 'add', params: ['a: number', 'b: number'], returnType: 'number', filePath: 'calc.ts', line: 2, isExported: false, code: '' }
  ]
};

describe('generateClassDoc', () => {
  it('returns the trimmed AI response', async () => {
    const provider = fakeProvider('  Performs arithmetic.  ');
    const doc = await generateClassDoc(provider, sampleClass);
    expect(doc).toBe('Performs arithmetic.');
  });

  it('includes the class name, file, and method list in the prompt', async () => {
    const provider = fakeProvider('doc');
    await generateClassDoc(provider, sampleClass);

    const promptArg = (provider.complete as jest.Mock).mock.calls[0][0] as string;
    expect(promptArg).toContain('Calculator');
    expect(promptArg).toContain('calc.ts');
    expect(promptArg).toContain('add(a: number, b: number): number');
  });

  it('handles a class with no methods', async () => {
    const provider = fakeProvider('doc');
    await generateClassDoc(provider, { ...sampleClass, methods: [] });

    const promptArg = (provider.complete as jest.Mock).mock.calls[0][0] as string;
    expect(promptArg).toContain('(none)');
  });

  it('falls back to a note instead of throwing when the AIProvider call fails', async () => {
    const provider: AIProvider = {
      name: 'ollama',
      complete: jest.fn().mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:11434')),
      isAvailable: jest.fn().mockResolvedValue(false)
    };

    const doc = await generateClassDoc(provider, sampleClass);

    expect(doc).toContain('AI documentation unavailable');
    expect(doc).toContain('ECONNREFUSED');
  });
});
