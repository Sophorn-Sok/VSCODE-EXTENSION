import { DiagramData } from './types';

const NODE_WIDTH = 150;
const NODE_HEIGHT = 26;
const ROW_HEIGHT = 34;
const DEPTH_INDENT = 170;
const PADDING = 20;

/**
 * Renders diagram data as a dependency-free, deterministic SVG string — a
 * simple indented tree layout, one row per node in traversal order.
 */
export function renderDiagramAsSvg(data: DiagramData): string {
  const positions = new Map<string, { x: number; y: number }>();
  data.nodes.forEach((node, index) => {
    positions.set(node.id, { x: PADDING + node.depth * DEPTH_INDENT, y: PADDING + index * ROW_HEIGHT });
  });

  const width = PADDING * 2 + (Math.max(0, ...data.nodes.map((n) => n.depth)) + 1) * DEPTH_INDENT;
  const height = PADDING * 2 + data.nodes.length * ROW_HEIGHT;

  const edgeLines = data.edges
    .map((edge) => {
      const from = positions.get(edge.from);
      const to = positions.get(edge.to);
      if (!from || !to) {
        return '';
      }
      const x1 = from.x + 10;
      const y1 = from.y + NODE_HEIGHT;
      const x2 = to.x + 10;
      const y2 = to.y;
      return `<path class="edge" d="M ${x1} ${y1} L ${x1} ${(y1 + y2) / 2} L ${x2} ${(y1 + y2) / 2} L ${x2} ${y2}" fill="none" stroke="#888" stroke-width="1"/>`;
    })
    .join('\n  ');

  const nodeShapes = data.nodes
    .map((node) => {
      const pos = positions.get(node.id)!;
      const fill = node.type === 'directory' ? '#4a90d9' : '#c9c9c9';
      const nodeClass = node.type === 'directory' ? 'node-directory' : 'node-file';
      return [
        `<rect class="${nodeClass}" x="${pos.x}" y="${pos.y}" width="${NODE_WIDTH}" height="${NODE_HEIGHT}" rx="4" fill="${fill}" />`,
        `<text class="node-label" x="${pos.x + 8}" y="${pos.y + NODE_HEIGHT / 2 + 4}" font-family="sans-serif" font-size="12" fill="#111">${escapeXml(node.label)}</text>`
      ].join('\n  ');
    })
    .join('\n  ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect class="diagram-bg" width="${width}" height="${height}" fill="#ffffff" />
  ${edgeLines}
  ${nodeShapes}
</svg>
`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
