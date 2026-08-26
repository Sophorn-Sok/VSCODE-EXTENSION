import { OllamaProvider } from './OllamaProvider';
import { AIProviderUnavailableError, AIProviderError } from './AIProvider';

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body)
  } as unknown as Response;
}

describe('OllamaProvider', () => {
  it('sends prompts to /api/generate and returns the completion text', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse({ model: 'qwen3:8b', response: 'hello', done: true }));
    const provider = new OllamaProvider({ baseUrl: 'http://localhost:11434', model: 'qwen3:8b', fetchImpl: fetchImpl as unknown as typeof fetch });

    const result = await provider.complete('say hi');

    expect(result).toEqual({ text: 'hello', model: 'qwen3:8b' });
    expect(fetchImpl).toHaveBeenCalledWith(
      'http://127.0.0.1:11434/api/generate',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('strips trailing slashes from the base URL', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse({ model: 'qwen3:8b', response: 'hi', done: true }));
    const provider = new OllamaProvider({ baseUrl: 'http://localhost:11434/', model: 'qwen3:8b', fetchImpl: fetchImpl as unknown as typeof fetch });

    await provider.complete('hi');

    expect(fetchImpl).toHaveBeenCalledWith('http://127.0.0.1:11434/api/generate', expect.anything());
  });

  it('rewrites localhost to 127.0.0.1 so macOS IPv6 does not miss Ollama', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse({ model: 'qwen3:8b', response: 'ok', done: true }));
    const provider = new OllamaProvider({
      baseUrl: 'http://localhost:11434',
      model: 'qwen3:8b',
      fetchImpl: fetchImpl as unknown as typeof fetch
    });

    await provider.complete('hi');

    expect(fetchImpl).toHaveBeenCalledWith('http://127.0.0.1:11434/api/generate', expect.anything());
  });

  it('throws a timeout error instead of "could not reach" when the request is aborted', async () => {
    const abort = Object.assign(new Error('aborted'), { name: 'AbortError' });
    const fetchImpl = jest.fn().mockRejectedValue(abort);
    const provider = new OllamaProvider({
      baseUrl: 'http://127.0.0.1:11434',
      model: 'qwen3:8b',
      timeoutMs: 50,
      fetchImpl: fetchImpl as unknown as typeof fetch
    });

    await expect(provider.complete('hi')).rejects.toThrow(/did not finish/i);
  });

  it('throws AIProviderUnavailableError with an actionable message when the network call fails', async () => {
    const fetchImpl = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    const provider = new OllamaProvider({ baseUrl: 'http://localhost:11434', model: 'qwen3:8b', fetchImpl: fetchImpl as unknown as typeof fetch });

    await expect(provider.complete('hi')).rejects.toThrow(AIProviderUnavailableError);
    await expect(provider.complete('hi')).rejects.toThrow(/could not reach/i);
  });

  it('throws AIProviderError (not a crash) on a non-OK HTTP response', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse({ error: 'model not found' }, false, 404));
    const provider = new OllamaProvider({ baseUrl: 'http://localhost:11434', model: 'qwen3:8b', fetchImpl: fetchImpl as unknown as typeof fetch });

    await expect(provider.complete('hi')).rejects.toThrow(AIProviderError);
  });

  it('isAvailable() returns false rather than throwing when unreachable', async () => {
    const fetchImpl = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    const provider = new OllamaProvider({ baseUrl: 'http://localhost:11434', model: 'qwen3:8b', fetchImpl: fetchImpl as unknown as typeof fetch });

    await expect(provider.isAvailable()).resolves.toBe(false);
  });

  it('isAvailable() returns true when /api/tags responds OK', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse({ models: [] }));
    const provider = new OllamaProvider({ baseUrl: 'http://localhost:11434', model: 'qwen3:8b', fetchImpl: fetchImpl as unknown as typeof fetch });

    await expect(provider.isAvailable()).resolves.toBe(true);
  });
});
