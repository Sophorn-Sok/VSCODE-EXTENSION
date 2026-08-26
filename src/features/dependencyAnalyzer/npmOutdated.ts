import { CommandRunner, OutdatedPackage } from './types';
import { defaultCommandRunner } from './commandRunner';

interface NpmOutdatedEntry {
  current?: string;
  wanted?: string;
  latest?: string;
}

/**
 * Detects outdated npm packages (current vs. latest version) via
 * `npm outdated --json`.
 */
export async function getOutdatedPackages(
  cwd: string,
  runCommand: CommandRunner = defaultCommandRunner
): Promise<OutdatedPackage[]> {
  const { stdout } = await runCommand('npm outdated --json', cwd);
  if (!stdout.trim()) {
    return [];
  }

  let parsed: Record<string, NpmOutdatedEntry>;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    return [];
  }

  return Object.entries(parsed).map(([name, info]) => ({
    name,
    current: info.current ?? 'missing',
    wanted: info.wanted ?? '',
    latest: info.latest ?? ''
  }));
}
