import { CommandRunner, Vulnerability, VulnerabilitySeverity } from './types';
import { defaultCommandRunner } from './commandRunner';

interface NpmAuditVulnerabilityEntry {
  severity?: string;
  range?: string;
  fixAvailable?: boolean | Record<string, unknown>;
}

interface NpmAuditReport {
  vulnerabilities?: Record<string, NpmAuditVulnerabilityEntry>;
  metadata?: {
    dependencies?: {
      total?: number;
    };
  };
}

export interface AuditReport {
  vulnerabilities: Vulnerability[];
  totalInstalledPackages: number;
}

const KNOWN_SEVERITIES: VulnerabilitySeverity[] = ['info', 'low', 'moderate', 'high', 'critical'];

/**
 * Detects known vulnerabilities with severity via `npm audit --json`. Also
 * surfaces `metadata.dependencies.total` from the same report as the total
 * installed package count, avoiding a second, slower npm invocation.
 */
export async function getAuditReport(cwd: string, runCommand: CommandRunner = defaultCommandRunner): Promise<AuditReport> {
  const { stdout } = await runCommand('npm audit --json', cwd);
  if (!stdout.trim()) {
    return { vulnerabilities: [], totalInstalledPackages: 0 };
  }

  let parsed: NpmAuditReport;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    return { vulnerabilities: [], totalInstalledPackages: 0 };
  }

  const vulnerabilities = Object.entries(parsed.vulnerabilities ?? {}).map(([name, info]) => ({
    name,
    severity: KNOWN_SEVERITIES.includes(info.severity as VulnerabilitySeverity)
      ? (info.severity as VulnerabilitySeverity)
      : 'info',
    range: info.range,
    fixAvailable: Boolean(info.fixAvailable)
  }));

  return {
    vulnerabilities,
    totalInstalledPackages: parsed.metadata?.dependencies?.total ?? 0
  };
}
