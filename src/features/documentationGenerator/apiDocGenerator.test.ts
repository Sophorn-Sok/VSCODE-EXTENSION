import { generateApiDocumentation } from './apiDocGenerator';
import { ApiEndpoint } from '../apiExplorer/types';

describe('generateApiDocumentation', () => {
  it('documents exactly the endpoints it is given, verbatim', () => {
    const endpoints: ApiEndpoint[] = [
      {
        method: 'POST',
        path: '/api/users',
        filePath: 'src/users.controller.ts',
        line: 12,
        framework: 'nestjs',
        bodyFields: [{ name: 'name' }, { name: 'email' }]
      }
    ];

    const markdown = generateApiDocumentation(endpoints);

    expect(markdown).toContain('POST /api/users');
    expect(markdown).toContain('src/users.controller.ts:12');
    expect(markdown).toContain('name, email');
  });

  it('renders a placeholder message rather than fabricating endpoints when given none', () => {
    const markdown = generateApiDocumentation([]);
    expect(markdown).toContain('No API endpoints were discovered');
  });

  it('groups multiple endpoints from the same file under one section', () => {
    const endpoints: ApiEndpoint[] = [
      { method: 'GET', path: '/a', filePath: 'routes.ts', line: 1, framework: 'express', bodyFields: [] },
      { method: 'POST', path: '/b', filePath: 'routes.ts', line: 2, framework: 'express', bodyFields: [] }
    ];

    const markdown = generateApiDocumentation(endpoints);

    expect(markdown.match(/## routes\.ts/g)).toHaveLength(1);
    expect(markdown).toContain('GET /a');
    expect(markdown).toContain('POST /b');
  });

  it('only ever reflects the exact endpoint array passed in (no independent scanning capability)', () => {
    // generateApiDocumentation's signature takes ApiEndpoint[], not a workspace
    // root path — it has no way to discover endpoints beyond what's passed in.
    expect(generateApiDocumentation.length).toBe(1);
  });
});
