import { AIProvider } from '../../core/AIProvider';
import { DependencyAnalysisSummary, OutdatedPackage, Vulnerability } from './types';

export function buildSummary(
  outdated: OutdatedPackage[],
  vulnerabilities: Vulnerability[],
  totalInstalledPackages: number
): DependencyAnalysisSummary {
  return {
    totalInstalledPackages,
    outdatedCount: outdated.length,
    criticalVulnerabilityCount: vulnerabilities.filter((v) => v.severity === 'critical').length
  };
}

/**
 * AI-generated summary of findings with suggested next steps, via AIProvider.
 */
export async function generateFindingsSummary(
  aiProvider: AIProvider,
  outdated: OutdatedPackage[],
  vulnerabilities: Vulnerability[]
): Promise<string> {
  const prompt = buildPrompt(outdated, vulnerabilities);
  const { text } = await aiProvider.complete(prompt, {
    systemPrompt: 'You are a senior engineer summarizing a dependency health report for a teammate.'
  });
  return text.trim();
}

function buildPrompt(outdated: OutdatedPackage[], vulnerabilities: Vulnerability[]): string {
  const outdatedList = outdated.length
    ? outdated.map((p) => `- ${p.name}: ${p.current} -> ${p.latest}`).join('\n')
    : '(none)';
  const vulnList = vulnerabilities.length
    ? vulnerabilities.map((v) => `- ${v.name} (${v.severity})${v.range ? `, affected range ${v.range}` : ''}`).join('\n')
    : '(none)';

  return `Summarize this dependency health report for a developer and suggest concrete next steps.

Outdated packages:
${outdatedList}

Vulnerabilities:
${vulnList}

Keep the summary concise (a short paragraph plus a few bullet-point next steps).`;
}
