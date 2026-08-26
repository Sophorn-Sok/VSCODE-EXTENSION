import { analyzeDependencies } from './analyzer';
import { AIProvider } from '../../core/AIProvider';
import { CommandRunner } from './types';

function runCommandFor(outdatedJson: string, auditJson: string): CommandRunner {
  return jest.fn(async (command: string) => {
    if (command.includes('outdated')) {
      return { stdout: outdatedJson, stderr: '' };
    }
    return { stdout: auditJson, stderr: '' };
  });
}

describe('analyzeDependencies', () => {
  it('combines outdated packages, vulnerabilities, and a summary', async () => {
    const runCommand = runCommandFor(
      JSON.stringify({ lodash: { current: '4.17.20', wanted: '4.17.21', latest: '4.17.21' } }),
      JSON.stringify({
        vulnerabilities: { minimist: { severity: 'critical' } },
        metadata: { dependencies: { total: 42 } }
      })
    );

    const result = await analyzeDependencies('/repo', { runCommand });

    expect(result.outdated).toHaveLength(1);
    expect(result.vulnerabilities).toHaveLength(1);
    expect(result.summary).toEqual({ totalInstalledPackages: 42, outdatedCount: 1, criticalVulnerabilityCount: 1 });
    expect(result.aiSummary).toBeUndefined();
  });

  it('includes an AI-generated summary only when an AIProvider is supplied', async () => {
    const runCommand = runCommandFor('{}', '{}');
    const aiProvider: AIProvider = {
      name: 'fake',
      complete: jest.fn().mockResolvedValue({ text: 'All clear.', model: 'fake' }),
      isAvailable: jest.fn().mockResolvedValue(true)
    };

    const result = await analyzeDependencies('/repo', { runCommand, aiProvider });

    expect(result.aiSummary).toBe('All clear.');
    expect(aiProvider.complete).toHaveBeenCalledTimes(1);
  });

  it('handles no outdated packages and no vulnerabilities', async () => {
    const runCommand = runCommandFor('', '');

    const result = await analyzeDependencies('/repo', { runCommand });

    expect(result.outdated).toEqual([]);
    expect(result.vulnerabilities).toEqual([]);
    expect(result.summary).toEqual({ totalInstalledPackages: 0, outdatedCount: 0, criticalVulnerabilityCount: 0 });
  });
});
