import { getOutdatedPackages } from './npmOutdated';

describe('getOutdatedPackages', () => {
  it('parses npm outdated --json output into OutdatedPackage entries', async () => {
    const runCommand = jest.fn().mockResolvedValue({
      stdout: JSON.stringify({
        lodash: { current: '4.17.20', wanted: '4.17.21', latest: '4.17.21' }
      }),
      stderr: ''
    });

    const result = await getOutdatedPackages('/repo', runCommand);

    expect(result).toEqual([{ name: 'lodash', current: '4.17.20', wanted: '4.17.21', latest: '4.17.21' }]);
    expect(runCommand).toHaveBeenCalledWith('npm outdated --json', '/repo');
  });

  it('returns an empty array when there is nothing outdated (empty stdout)', async () => {
    const runCommand = jest.fn().mockResolvedValue({ stdout: '', stderr: '' });

    await expect(getOutdatedPackages('/repo', runCommand)).resolves.toEqual([]);
  });

  it('returns an empty array rather than throwing on malformed JSON', async () => {
    const runCommand = jest.fn().mockResolvedValue({ stdout: 'not json', stderr: '' });

    await expect(getOutdatedPackages('/repo', runCommand)).resolves.toEqual([]);
  });

  it('defaults missing fields sensibly (e.g. a package missing from node_modules)', async () => {
    const runCommand = jest.fn().mockResolvedValue({
      stdout: JSON.stringify({ 'left-pad': { wanted: '1.0.0', latest: '1.0.0' } }),
      stderr: ''
    });

    const result = await getOutdatedPackages('/repo', runCommand);

    expect(result).toEqual([{ name: 'left-pad', current: 'missing', wanted: '1.0.0', latest: '1.0.0' }]);
  });
});
