import { generateFunctionDoc } from './functionDocGenerator';
import { AIProvider } from '../../core/AIProvider';
import { FunctionSignature } from './types';

function fakeProvider(responseText: string): AIProvider {
  return {
    name: 'fake',
    complete: jest.fn().mockResolvedValue({ text: responseText, model: 'fake' }),
    isAvailable: jest.fn().mockResolvedValue(true)
  };
}

const sampleFn: FunctionSignature = {
  name: 'add',
  params: ['a: number', 'b: number'],
  returnType: 'number',
  filePath: 'math.ts',
  line: 1,
  isExported: true,
  code: 'function add(a, b) { return a + b; }'
};

describe('generateFunctionDoc', () => {
  it('returns the trimmed AI response', async () => {
    const provider = fakeProvider('  Adds two numbers together.  ');
    const doc = await generateFunctionDoc(provider, sampleFn);
    expect(doc).toBe('Adds two numbers together.');
  });

  it('includes the function name, params, and source in the prompt', async () => {
    const provider = fakeProvider('doc');
    await generateFunctionDoc(provider, sampleFn);

    const promptArg = (provider.complete as jest.Mock).mock.calls[0][0] as string;
    expect(promptArg).toContain('add(a: number, b: number)');
    expect(promptArg).toContain('math.ts');
    expect(promptArg).toContain('return a + b;');
  });

  it('falls back to a note instead of throwing when the AIProvider call fails', async () => {
    const provider: AIProvider = {
      name: 'ollama',
      complete: jest.fn().mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:11434')),
      isAvailable: jest.fn().mockResolvedValue(false)
    };

    const doc = await generateFunctionDoc(provider, sampleFn);

    expect(doc).toContain('AI documentation unavailable');
    expect(doc).toContain('ECONNREFUSED');
  });
});
