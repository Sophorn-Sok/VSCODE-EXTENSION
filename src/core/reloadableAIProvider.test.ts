import { AIProvider } from './AIProvider';
import { ReloadableAIProvider } from './reloadableAIProvider';

function fakeProvider(name: string): AIProvider {
  return {
    name,
    complete: async () => ({ text: name, model: 'm' }),
    isAvailable: async () => name.endsWith('up')
  };
}

describe('ReloadableAIProvider', () => {
  it('delegates to a new inner provider after reload', async () => {
    const created: string[] = [];
    const provider = new ReloadableAIProvider(() => {
      const name = created.length === 0 ? 'first-up' : 'second-up';
      created.push(name);
      return fakeProvider(name);
    });

    expect(provider.name).toBe('first-up');
    await expect(provider.isAvailable()).resolves.toBe(true);

    provider.reload();

    expect(provider.name).toBe('second-up');
    await expect(provider.complete('x')).resolves.toEqual({ text: 'second-up', model: 'm' });
  });
});
