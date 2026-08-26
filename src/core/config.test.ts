import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { DEFAULTS, loadConfig } from './config';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'dev-companion-config-'));
}

describe('loadConfig', () => {
  it('returns defaults when no config.json exists anywhere', () => {
    const emptyDir = makeTmpDir();
    const config = loadConfig(emptyDir, emptyDir);
    expect(config).toEqual(DEFAULTS);
  });

  it('prefers project-root config.json over extension-root config.json', () => {
    const projectRoot = makeTmpDir();
    const extensionRoot = makeTmpDir();
    fs.writeFileSync(path.join(projectRoot, 'config.json'), JSON.stringify({ model: 'project-model' }));
    fs.writeFileSync(path.join(extensionRoot, 'config.json'), JSON.stringify({ model: 'extension-model' }));

    const config = loadConfig(projectRoot, extensionRoot);

    expect(config.model).toBe('project-model');
  });

  it('falls back to extension-root config.json when project root has none', () => {
    const projectRoot = makeTmpDir();
    const extensionRoot = makeTmpDir();
    fs.writeFileSync(path.join(extensionRoot, 'config.json'), JSON.stringify({ ollama_url: 'http://localhost:9999' }));

    const config = loadConfig(projectRoot, extensionRoot);

    expect(config.ollama_url).toBe('http://localhost:9999');
  });

  it('merges partial config with defaults', () => {
    const projectRoot = makeTmpDir();
    fs.writeFileSync(path.join(projectRoot, 'config.json'), JSON.stringify({ model: 'custom-model' }));

    const config = loadConfig(projectRoot);

    expect(config).toEqual({ ...DEFAULTS, model: 'custom-model' });
  });

  it('falls back to defaults on malformed JSON rather than throwing', () => {
    const projectRoot = makeTmpDir();
    fs.writeFileSync(path.join(projectRoot, 'config.json'), '{ not valid json');

    expect(() => loadConfig(projectRoot)).not.toThrow();
    expect(loadConfig(projectRoot).model).toBe('qwen3:8b');
  });

  it('lets explicit VS Code setting overrides win over config.json', () => {
    const projectRoot = makeTmpDir();
    fs.writeFileSync(path.join(projectRoot, 'config.json'), JSON.stringify({ model: 'from-file', apiBaseUrl: 'http://localhost:4000' }));

    const config = loadConfig(projectRoot, undefined, { model: 'from-settings' });

    expect(config.model).toBe('from-settings');
    expect(config.apiBaseUrl).toBe('http://localhost:4000');
  });

  it('ignores empty override strings so config.json still applies', () => {
    const projectRoot = makeTmpDir();
    fs.writeFileSync(path.join(projectRoot, 'config.json'), JSON.stringify({ model: 'from-file' }));

    const config = loadConfig(projectRoot, undefined, { model: '' });

    expect(config.model).toBe('from-file');
  });
});
