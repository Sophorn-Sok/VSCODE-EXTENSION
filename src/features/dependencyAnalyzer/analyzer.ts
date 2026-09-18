import { AIProvider } from '../../core/AIProvider';
import { getOutdatedPackages } from './npmOutdated';
import { getAuditReport } from './npmAudit';
import { buildSummary, generateFindingsSummary } from './summary';
import { CommandRunner, DependencyAnalysisResult } from './types';

/**
 * Runs the full dependency analysis: outdated packages, known
 * vulnerabilities, a results summary, and (when an AIProvider is supplied) an
 * AI-generated summary with suggested next steps.
 */
export async function analyzeDependencies(
  cwd: string,
  options: { aiProvider?: AIProvider; runCommand?: CommandRunner } = {}
): Promise<DependencyAnalysisResult> {
  const [outdated, auditReport] = await Promise.all([
    getOutdatedPackages(cwd, options.runCommand),
    getAuditReport(cwd, options.runCommand)
  ]);

  const summary = buildSummary(outdated, auditReport.vulnerabilities, auditReport.totalInstalledPackages);

  let aiSummary: string | undefined;
  let aiSummaryError: string | undefined;
  if (options.aiProvider) {
    try {
      aiSummary = await generateFindingsSummary(options.aiProvider, outdated, auditReport.vulnerabilities);
    } catch (err) {
      // The npm-derived report above is already complete and useful on its
      // own — an unreachable AI provider should not discard it.
      aiSummaryError = (err as Error).message;
    }
  }

  return { outdated, vulnerabilities: auditReport.vulnerabilities, summary, aiSummary, aiSummaryError };
}
