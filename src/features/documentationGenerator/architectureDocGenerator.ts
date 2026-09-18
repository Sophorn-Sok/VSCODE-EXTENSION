import { AIProvider } from '../../core/AIProvider';
import { FolderTreeNode } from '../architectureVisualization/types';

/**
 * Generates an AI-written architecture summary from F3 (Architecture
 * Visualization)'s already-collected folder-hierarchy data. Deliberately
 * takes a `FolderTreeNode` — not a workspace root — so it is structurally
 * incapable of re-implementing folder traversal itself.
 */
export async function generateArchitectureSummary(aiProvider: AIProvider, tree: FolderTreeNode): Promise<string> {
  const treeText = renderTreeAsText(tree);

  const prompt = `Write a concise architecture summary for a developer new to this codebase, based on the folder structure below. Describe the apparent purpose of the main top-level directories and how the project appears to be organized. Output plain prose and bullet points — no code fences.

Folder structure:
${treeText}`;

  try {
    const { text } = await aiProvider.complete(prompt, {
      systemPrompt: 'You are a technical writer generating an architecture overview from a project folder structure.'
    });
    return text.trim();
  } catch (err) {
    return `_AI summary unavailable: ${(err as Error).message}_`;
  }
}

export function renderTreeAsText(node: FolderTreeNode, depth = 0): string {
  const indent = '  '.repeat(depth);
  const label = node.type === 'directory' ? `${node.name}/` : node.name;
  const line = `${indent}- ${label}`;
  const childLines = (node.children ?? []).map((child) => renderTreeAsText(child, depth + 1));
  return [line, ...childLines].join('\n');
}
