import { AIProvider, AIProviderError } from './AIProvider';
import { OllamaProvider } from './OllamaProvider';
import { DevCompanionConfig } from './config';

/**
 * The single factory point allowed to know about concrete provider
 * implementations. Feature modules call this once (or receive an `AIProvider`
 * via dependency injection) and never import `OllamaProvider` themselves.
 */
export function createAIProvider(config: DevCompanionConfig): AIProvider {
  switch (config.provider) {
    case 'ollama':
      return new OllamaProvider({ baseUrl: config.ollama_url, model: config.model });
    default:
      throw new AIProviderError(
        `Unsupported provider "${config.provider}". Only "ollama" is supported in this release.`
      );
  }
}
