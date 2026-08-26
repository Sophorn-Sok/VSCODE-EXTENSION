import { parseExpressRoutes } from './expressParser';

describe('parseExpressRoutes', () => {
  it('detects app.METHOD route declarations', () => {
    const source = `
const app = express();
app.get('/api/users', (req, res) => res.json([]));
app.post("/api/users", (req, res) => res.status(201).send());
`;
    const endpoints = parseExpressRoutes(source, 'routes.ts');

    expect(endpoints).toHaveLength(2);
    expect(endpoints[0]).toMatchObject({ method: 'GET', path: '/api/users', framework: 'express' });
    expect(endpoints[1]).toMatchObject({ method: 'POST', path: '/api/users' });
  });

  it('detects router.METHOD declarations with template-literal-free backtick paths', () => {
    const source = 'router.delete(`/api/users/:id`, handler);';
    const endpoints = parseExpressRoutes(source, 'router.ts');

    expect(endpoints).toEqual([
      expect.objectContaining({ method: 'DELETE', path: '/api/users/:id', filePath: 'router.ts' })
    ]);
  });

  it('records the 1-indexed line number of the route declaration', () => {
    const source = '\n\napp.get(\'/health\', handler);\n';
    const endpoints = parseExpressRoutes(source, 'app.ts');

    expect(endpoints[0].line).toBe(3);
  });

  it('ignores non-route .get() calls on paths that do not start with "/"', () => {
    const source = "const value = cache.get('someKey');";
    const endpoints = parseExpressRoutes(source, 'cache.ts');

    expect(endpoints).toHaveLength(0);
  });

  it('extracts destructured req.body fields for the matched route', () => {
    const source = `
app.post('/api/users', (req, res) => {
  const { name, email } = req.body;
  createUser(name, email);
});
`;
    const endpoints = parseExpressRoutes(source, 'users.ts');

    expect(endpoints[0].bodyFields.map((f) => f.name).sort()).toEqual(['email', 'name']);
  });

  it('extracts req.body.field member-access fields for the matched route', () => {
    const source = `
app.put('/api/users/:id', (req, res) => {
  const name = req.body.name;
  const age = req.body.age;
});
`;
    const endpoints = parseExpressRoutes(source, 'users.ts');

    expect(endpoints[0].bodyFields.map((f) => f.name).sort()).toEqual(['age', 'name']);
  });

  it('does not leak body fields from a later route into an earlier one', () => {
    const source = `
app.post('/api/users', (req, res) => {
  const { name } = req.body;
});
app.post('/api/orders', (req, res) => {
  const { total } = req.body;
});
`;
    const endpoints = parseExpressRoutes(source, 'routes.ts');

    expect(endpoints[0].bodyFields.map((f) => f.name)).toEqual(['name']);
    expect(endpoints[1].bodyFields.map((f) => f.name)).toEqual(['total']);
  });
});
