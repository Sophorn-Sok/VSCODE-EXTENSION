import { AIProvider } from '../../core/AIProvider';
import { mapWithConcurrency } from '../../core/concurrency';
import { ApiEndpoint } from '../apiExplorer/types';
import { FolderTreeNode } from '../architectureVisualization/types';
import { generateApiDocumentation } from './apiDocGenerator';
import { generateArchitectureSummary, renderTreeAsText } from './architectureDocGenerator';
import { generateFunctionDoc } from './functionDocGenerator';
import { generateClassDoc } from './classDocGenerator';
import { scanWorkspaceSignatures } from './sourceScanner';
import { computeSummaryCount } from './summaryCount';
import { ClassSignature, DocumentationSummaryCount, FunctionSignature } from './types';

export interface GenerateDocumentationOptions {
  aiProvider: AIProvider;
  /** Workspace root, used only to parse source files for function/class docs. */
  rootDir: string;
  /** F2's already-discovered endpoints — consumed as data, never re-scanned. */
  endpoints: ApiEndpoint[];
  /** F3's already-collected folder tree — consumed as data, never re-traversed. */
  folderTree?: FolderTreeNode;
  /** Max concurrent AI calls for per-function/per-class doc generation. */
  concurrency?: number;
}

export interface GenerateDocumentationResult {
  apiDocumentationMarkdown: string;
  architectureGuideMarkdown: string;
  summaryCount: DocumentationSummaryCount;
}

export async function generateDocumentation(
  options: GenerateDocumentationOptions
): Promise<GenerateDocumentationResult> {
  const concurrency = options.concurrency ?? 2;

  const apiDocumentationMarkdown = generateApiDocumentation(options.endpoints);
  const { functions, classes } = scanWorkspaceSignatures(options.rootDir);

  const [functionDocs, classDocs, architectureSummary] = await Promise.all([
    mapWithConcurrency(functions, concurrency, async (fn) => ({
      fn,
      doc: await generateFunctionDoc(options.aiProvider, fn)
    })),
    mapWithConcurrency(classes, concurrency, async (cls) => ({
      cls,
      doc: await generateClassDoc(options.aiProvider, cls)
    })),
    options.folderTree ? generateArchitectureSummary(options.aiProvider, options.folderTree) : Promise.resolve('')
  ]);

  const architectureGuideMarkdown = buildArchitectureGuideMarkdown(
    architectureSummary,
    options.folderTree,
    classDocs,
    functionDocs
  );

  const summaryCount = computeSummaryCount(options.endpoints, functions, classes);

  return { apiDocumentationMarkdown, architectureGuideMarkdown, summaryCount };
}

function buildArchitectureGuideMarkdown(
  architectureSummary: string,
  folderTree: FolderTreeNode | undefined,
  classDocs: Array<{ cls: ClassSignature; doc: string }>,
  functionDocs: Array<{ fn: FunctionSignature; doc: string }>
): string {
  const lines: string[] = ['# Architecture Guide', ''];

  if (folderTree) {
    lines.push('## Overview', '', architectureSummary || '_No AI summary available._', '');
    lines.push('## Folder Structure', '', '```', renderTreeAsText(folderTree), '```', '');
  } else {
    lines.push(
      '## Overview',
      '',
      '_No folder hierarchy data available. Run "Dev Companion: Visualize Architecture" first for a full architecture summary._',
      ''
    );
  }

  if (classDocs.length > 0) {
    lines.push('## Classes', '');
    for (const { cls, doc } of classDocs) {
      lines.push(`### \`${cls.name}\` (${cls.filePath}:${cls.line})`, '', doc, '');
    }
  }

  if (functionDocs.length > 0) {
    lines.push('## Functions', '');
    for (const { fn, doc } of functionDocs) {
      lines.push(`### \`${fn.name}(${fn.params.join(', ')})\` (${fn.filePath}:${fn.line})`, '', doc, '');
    }
  }

  return lines.join('\n');
}
