import { ApiEndpoint } from './types';

export interface CurlGeneratorOptions {
  baseUrl?: string;
}

const METHODS_WITHOUT_BODY = new Set(['GET', 'HEAD']);

/**
 * Generates a cURL command for an endpoint, reflecting method, path, and any
 * detected request body fields (as an empty-value JSON template).
 */
export function generateCurlCommand(endpoint: ApiEndpoint, options: CurlGeneratorOptions = {}): string {
  const baseUrl = (options.baseUrl ?? 'http://localhost:3000').replace(/\/+$/, '');
  const url = `${baseUrl}${endpoint.path}`;
  const parts = ['curl', '-X', endpoint.method, `'${url}'`];

  if (endpoint.bodyFields.length > 0 && !METHODS_WITHOUT_BODY.has(endpoint.method)) {
    const bodyTemplate = Object.fromEntries(endpoint.bodyFields.map((field) => [field.name, '']));
    parts.push('-H', "'Content-Type: application/json'", '-d', `'${JSON.stringify(bodyTemplate)}'`);
  }

  return parts.join(' ');
}
