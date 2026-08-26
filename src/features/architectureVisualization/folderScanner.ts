import { walkDirectoryTree, WalkTreeOptions } from '../../core/fsWalk';
import { FolderTreeNode } from './types';

/**
 * Builds the folder-hierarchy model for a project, excluding common
 * non-source directories (node_modules, .git, etc.) by default. Delegates to
 * the shared `core/fsWalk` traversal so F2 and F3 don't duplicate directory
 * exclusion or symlink-loop handling.
 */
export function scanFolderHierarchy(rootDir: string, options?: WalkTreeOptions): FolderTreeNode {
  return walkDirectoryTree(rootDir, options);
}
