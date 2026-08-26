import { AIProvider, AIProviderError, AIProviderUnavailableError, CompletionOptions, CompletionResult } from './AIProvider';

export interface OllamaProviderOptions {
  baseUrl: string;
  model: string;
  /** Milliseconds before a request is aborted. Defaults to 120s for local generation. */
  timeoutMs?: number;
  /** Injectable fetch implementation, primarily for testing. Defaults to global fetch. */
  fetchImpl?: typeof fetch;
}

interface OllamaGenerateResponse {
  model: string;
  response: string;
  done: boolean;
}

/**
 * The ONLY module in this codebase allowed to speak Ollama's HTTP API
 * directly. Every other module must go through the `AIProvider` interface.
 */
export class OllamaProvider implements AIProvider {
  readonly name = 'ollama';
  private readonly baseUrl: string;
  private readonly defaultModel: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: OllamaProviderOptions) {
    this.baseUrl = normalizeOllamaBaseUrl(options.baseUrl);
    this.defaultModel = options.model;
    this.timeoutMs = options.timeoutMs ?? 300_000;
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch;
    if (!this.fetchImpl) {
      throw new AIProviderError(
        'No fetch implementation available. Node.js 18+ is required, or pass options.fetchImpl.'
      );
    }
  }

  async complete(prompt: string, options?: CompletionOptions): Promise<CompletionResult> {
    const model = options?.model ?? this.defaultModel;
    const body = {
      model,
      prompt,
      system: options?.systemPrompt,
      stream: false,
      options: options?.temperature !== undefined ? { temperature: options.temperature } : undefined
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    let response: Response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      });
    } catch (err) {
      if (isAbortError(err)) {
        throw new AIProviderError(
          `Ollama did not finish within ${Math.round(this.timeoutMs / 1000)}s at ${this.baseUrl}. ` +
            'The model may still be loading — wait a moment and try again.',
          err
        );
      }
      throw new AIProviderUnavailableError('ollama', this.baseUrl, err);
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const text = await safeReadText(response);
      throw new AIProviderError(
        `Ollama returned an error (HTTP ${response.status}) at ${this.baseUrl}. ${text ?? ''}`.trim()
      );
    }

    let parsed: OllamaGenerateResponse;
    try {
      parsed = (await response.json()) as OllamaGenerateResponse;
    } catch (err) {
      throw new AIProviderError('Ollama returned a response that could not be parsed as JSON.', err);
    }

    return { text: parsed.response ?? '', model: parsed.model ?? model };
  }

  async isAvailable(): Promise<boolean> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3_000);
    try {
      const response = await this.fetchImpl(`${this.baseUrl}/api/tags`, { signal: controller.signal });
      return response.ok;
    } catch {
      return false;
    } finally {
      clearTimeout(timeout);
    }
  }
}

/**
 * On macOS, `localhost` often resolves to IPv6 (::1) first, while Ollama
 * listens only on IPv4. Node's fetch then fails even though Ollama is up.
 */
export function normalizeOllamaBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/+$/, '');
  try {
    const parsed = new URL(trimmed);
    if (parsed.hostname === 'localhost') {
      parsed.hostname = '127.0.0.1';
      return parsed.toString().replace(/\/+$/, '');
    }
    return trimmed;
  } catch {
    return trimmed;
  }
}

function isAbortError(err: unknown): boolean {
  return (
    (err instanceof Error && err.name === 'AbortError') ||
    (typeof err === 'object' && err !== null && (err as { name?: string }).name === 'AbortError')
  );
}

async function safeReadText(response: Response): Promise<string | undefined> {
  try {
    return await response.text();
  } catch {
    return undefined;
  }
}
