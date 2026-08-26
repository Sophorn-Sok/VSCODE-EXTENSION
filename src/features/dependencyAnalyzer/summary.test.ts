import { buildSummary, generateFindingsSummary } from './summary';
import { AIProvider } from '../../core/AIProvider';
import { OutdatedPackage, Vulnerability } from './types';

describe('buildSummary', () => {
  it('counts outdated packages and critical vulnerabilities only', () => {
    const outdated: OutdatedPackage[] = [
      { name: 'a', current: '1', wanted: '2', latest: '2' },
      { name: 'b', current: '1', wanted: '2', latest: '2' }
    ];
    const vulnerabilities: Vulnerability[] = [
      { name: 'x', severity: 'critical' },
      { name: 'y', severity: 'high' },
      { name: 'z', severity: 'critical' }
    ];

    expect(buildSummary(outdated, vulnerabilities, 100)).toEqual({
      totalInstalledPackages: 100,
      outdatedCount: 2,
      criticalVulnerabilityCount: 2
    });
  });

  it('handles empty inputs', () => {
    expect(buildSummary([], [], 0)).toEqual({ totalInstalledPackages: 0, outdatedCount: 0, criticalVulnerabilityCount: 0 });
  });
});

describe('generateFindingsSummary', () => {
  it('sends outdated packages and vulnerabilities to AIProvider and returns the trimmed response', async () => {
    const aiProvider: AIProvider = {
      name: 'fake',
      complete: jest.fn().mockResolvedValue({ text: '  Upgrade lodash and patch the critical CVE.  ', model: 'fake' }),
      isAvailable: jest.fn().mockResolvedValue(true)
    };

    const result = await generateFindingsSummary(
      aiProvider,
      [{ name: 'lodash', current: '4.17.20', wanted: '4.17.21', latest: '4.17.21' }],
      [{ name: 'minimist', severity: 'critical' }]
    );

    expect(result).toBe('Upgrade lodash and patch the critical CVE.');
    const promptArg = (aiProvider.complete as jest.Mock).mock.calls[0][0] as string;
    expect(promptArg).toContain('lodash');
    expect(promptArg).toContain('minimist');
    expect(promptArg).toContain('critical');
  });
});
