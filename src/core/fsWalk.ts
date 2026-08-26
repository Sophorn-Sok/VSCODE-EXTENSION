import * as fs from 'fs';
import * as path from 'path';

/**
 * Shared filesystem traversal used by both the API Explorer (F2, flat file
 * list) and Architecture Visualization (F3, folder tree). Lives in `core`
 * rather than either feature directory so neither imports the other.
 */
export const DEFAULT_EXCLUDED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'out',
  'build',
  '.next',
  '.nuxt',
  'coverage',
  '.vscode-test',
  '.turbo',
  '.cache',
  'vendor',
  '__pycache__',
  '.venv',
  'venv',
  '.idea',
  '.DS_Store'
]);

export interface WalkOptions {
  excludedDirs?: Set<string>;
  /** Only include files with these extensions (including the dot), e.g. ['.ts', '.js']. */
  extensions?: string[];
  /** Hard cap to keep large monorepos fast; excess files are simply not visited. */
  maxFiles?: number;
}

/**
 * Returns a flat list of absolute file paths under `rootDir`, skipping
 * excluded directories and symlinks (to avoid symlink-loop hangs) so it stays
 * fast on large projects.
 */
export function walkFiles(rootDir: string, options: WalkOptions = {}): string[] {
  const excludedDirs = options.excludedDirs ?? DEFAULT_EXCLUDED_DIRS;
  const extensions = options.extensions;
  const maxFiles = options.maxFiles ?? 50_000;
  const results: string[] = [];

  const visit = (dir: string) => {
    if (results.length >= maxFiles) {
      return;
    }
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (results.length >= maxFiles) {
        return;
      }
      if (entry.isSymbolicLink()) {
        continue;
      }
      if (entry.isDirectory()) {
        if (excludedDirs.has(entry.name)) {
          continue;
        }
        visit(path.join(dir, entry.name));
      } else if (entry.isFile()) {
        if (!extensions || extensions.includes(path.extname(entry.name))) {
          results.push(path.join(dir, entry.name));
        }
      }
    }
  };

  visit(rootDir);
  return results;
}

export interface FolderTreeNode {
  name: string;
  /** Path relative to the scan root, using forward slashes. */
  relativePath: string;
  type: 'directory' | 'file';
  children?: FolderTreeNode[];
}

export interface WalkTreeOptions {
  excludedDirs?: Set<string>;
  /** Hard cap on total nodes visited, to stay fast on very large trees. */
  maxNodes?: number;
}

/**
 * Builds a folder-hierarchy tree rooted at `rootDir`, excluding common
 * non-source directories by default.
 */
export function walkDirectoryTree(rootDir: string, options: WalkTreeOptions = {}): FolderTreeNode {
  const excludedDirs = options.excludedDirs ?? DEFAULT_EXCLUDED_DIRS;
  const maxNodes = options.maxNodes ?? 20_000;
  let visited = 0;

  const build = (dir: string, relativePath: string): FolderTreeNode => {
    const name = path.basename(dir) || dir;
    const node: FolderTreeNode = { name, relativePath, type: 'directory', children: [] };
    visited++;

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return node;
    }

    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      if (visited >= maxNodes) {
        break;
      }
      if (entry.isSymbolicLink()) {
        continue;
      }
      const entryRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        if (excludedDirs.has(entry.name)) {
          continue;
        }
        node.children!.push(build(path.join(dir, entry.name), entryRelativePath));
        visited++;
      } else if (entry.isFile()) {
        node.children!.push({ name: entry.name, relativePath: entryRelativePath, type: 'file' });
        visited++;
      }
    }

    return node;
  };

  return build(rootDir, '');
}
