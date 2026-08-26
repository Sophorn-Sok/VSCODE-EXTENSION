import { explainError } from './explainer';
import { AIProvider } from '../../core/AIProvider';

function fakeProvider(responseText: string): AIProvider {
  return {
    name: 'fake',
    complete: jest.fn().mockResolvedValue({ text: responseText, model: 'fake-model' }),
    isAvailable: jest.fn().mockResolvedValue(true)
  };
}

describe('explainError', () => {
  it('parses ROOT CAUSE and SUGGESTED FIX sections from the AI response', async () => {
    const provider = fakeProvider(
      'ROOT CAUSE: The variable `user` is undefined because the fetch failed silently.\n' +
        'SUGGESTED FIX: Add a null check before accessing `user.name`, and handle the fetch rejection.'
    );

    const result = await explainError(provider, { text: 'TypeError: Cannot read properties of undefined', exitCode: 1 });

    expect(result.explanation).toBe('The variable `user` is undefined because the fetch failed silently.');
    expect(result.suggestedFix).toBe('Add a null check before accessing `user.name`, and handle the fetch rejection.');
  });

  it('falls back to returning the raw text when the expected markers are missing', async () => {
    const provider = fakeProvider('The build failed because of a missing dependency.');

    const result = await explainError(provider, { text: 'some error' });

    expect(result.explanation).toBe('The build failed because of a missing dependency.');
    expect(result.suggestedFix).toBe('');
    expect(result.raw).toBe('The build failed because of a missing dependency.');
  });

  it('includes the captured command and exit code in the prompt when available', async () => {
    const provider = fakeProvider('ROOT CAUSE: x\nSUGGESTED FIX: y');

    await explainError(provider, { text: 'boom', command: 'npm run build', exitCode: 2 });

    const promptArg = (provider.complete as jest.Mock).mock.calls[0][0] as string;
    expect(promptArg).toContain('npm run build');
    expect(promptArg).toContain('Exit code: 2');
    expect(promptArg).toContain('boom');
  });
});
