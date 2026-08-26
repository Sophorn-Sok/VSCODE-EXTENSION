import { generateCurlCommand } from './curlGenerator';
import { ApiEndpoint } from './types';

function endpoint(overrides: Partial<ApiEndpoint>): ApiEndpoint {
  return {
    method: 'GET',
    path: '/api/users',
    filePath: 'users.ts',
    line: 1,
    framework: 'express',
    bodyFields: [],
    ...overrides
  };
}

describe('generateCurlCommand', () => {
  it('generates a simple GET command with the default base URL', () => {
    const command = generateCurlCommand(endpoint({}));
    expect(command).toBe("curl -X GET 'http://localhost:3000/api/users'");
  });

  it('respects a custom base URL and strips trailing slashes', () => {
    const command = generateCurlCommand(endpoint({}), { baseUrl: 'https://api.example.com/' });
    expect(command).toBe("curl -X GET 'https://api.example.com/api/users'");
  });

  it('adds a JSON body payload for POST endpoints with detected body fields', () => {
    const command = generateCurlCommand(
      endpoint({ method: 'POST', bodyFields: [{ name: 'name' }, { name: 'email' }] })
    );

    expect(command).toContain('-X POST');
    expect(command).toContain("-H 'Content-Type: application/json'");
    expect(command).toContain(JSON.stringify({ name: '', email: '' }));
  });

  it('never adds a body payload for GET or HEAD requests, even with detected fields', () => {
    const command = generateCurlCommand(endpoint({ method: 'GET', bodyFields: [{ name: 'name' }] }));
    expect(command).not.toContain('-d');
  });

  it('does not add a body flag when there are no detected fields', () => {
    const command = generateCurlCommand(endpoint({ method: 'POST', bodyFields: [] }));
    expect(command).not.toContain('-d');
  });
});
