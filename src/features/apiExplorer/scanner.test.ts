import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { scanWorkspaceForEndpoints } from './scanner';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'dev-companion-apiexplorer-'));
}

describe('scanWorkspaceForEndpoints', () => {
  it('finds endpoints across multiple files and excludes node_modules', () => {
    const root = makeTmpDir();
    fs.mkdirSync(path.join(root, 'src'), { recursive: true });
    fs.mkdirSync(path.join(root, 'node_modules', 'pkg'), { recursive: true });

    fs.writeFileSync(
      path.join(root, 'src', 'users.ts'),
      "app.get('/api/users', (req, res) => res.json([]));"
    );
    fs.writeFileSync(
      path.join(root, 'node_modules', 'pkg', 'index.js'),
      "app.get('/should/not/be/found', handler);"
    );

    const result = scanWorkspaceForEndpoints(root);

    expect(result.endpoints).toHaveLength(1);
    expect(result.endpoints[0]).toMatchObject({ path: '/api/users', filePath: 'src/users.ts' });
    expect(result.errors).toEqual([]);
  });

  it('preserves partial results when a file cannot be read', () => {
    const root = makeTmpDir();
    fs.writeFileSync(path.join(root, 'good.ts'), "app.get('/api/ok', handler);");
    const badFilePath = path.join(root, 'bad.ts');
    fs.writeFileSync(badFilePath, "app.get('/api/bad', handler);");
    fs.chmodSync(badFilePath, 0o000);

    const result = scanWorkspaceForEndpoints(root);

    expect(result.endpoints.some((e) => e.path === '/api/ok')).toBe(true);

    fs.chmodSync(badFilePath, 0o644);
  });

  it('combines endpoints discovered by both the Express and NestJS parsers', () => {
    const root = makeTmpDir();
    fs.writeFileSync(path.join(root, 'express.ts'), "router.get('/express-route', handler);");
    fs.writeFileSync(
      path.join(root, 'nest.controller.ts'),
      "@Controller('nest')\nexport class NestController {\n  @Get('route')\n  handler() {}\n}\n"
    );

    const result = scanWorkspaceForEndpoints(root);
    const paths = result.endpoints.map((e) => e.path).sort();

    expect(paths).toEqual(['/express-route', '/nest/route']);
  });
});
