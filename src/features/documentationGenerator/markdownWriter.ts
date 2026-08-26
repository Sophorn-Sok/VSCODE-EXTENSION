import * as fs from 'fs';
import * as path from 'path';

export function writeMarkdownFile(content: string, filePath: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}
