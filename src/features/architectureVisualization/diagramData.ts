import { DiagramData, DiagramEdge, DiagramNode, FolderTreeNode } from './types';

/**
 * Flattens a folder-hierarchy tree into node/edge diagram data for a webview
 * to render (e.g. as an SVG or canvas tree diagram).
 */
export function buildDiagramData(tree: FolderTreeNode): DiagramData {
  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];

  const visit = (node: FolderTreeNode, parentId: string | undefined, depth: number) => {
    const id = node.relativePath || '.';
    nodes.push({ id, label: node.name, parentId, depth, type: node.type });
    if (parentId !== undefined) {
      edges.push({ from: parentId, to: id });
    }
    node.children?.forEach((child) => visit(child, id, depth + 1));
  };

  visit(tree, undefined, 0);
  return { nodes, edges };
}
