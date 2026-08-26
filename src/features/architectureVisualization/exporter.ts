import * as fs from 'fs';
import * as path from 'path';
import { DiagramData } from './types';
import { renderDiagramAsSvg } from './svgRenderer';

/**
 * Writes diagram data to disk as SVG (rendered here, dependency-free) or PNG.
 * Rasterizing to PNG happens client-side in the webview's `<canvas>` (via
 * `canvas.toDataURL('image/png')`) since that avoids a native imaging
 * dependency in the extension host; this function only needs the resulting
 * buffer to write it out.
 */
export function exportDiagramAsSvg(data: DiagramData, filePath: string): void {
  const svg = renderDiagramAsSvg(data);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, svg, 'utf8');
}

export function exportDiagramAsPng(pngBuffer: Buffer, filePath: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, pngBuffer);
}
