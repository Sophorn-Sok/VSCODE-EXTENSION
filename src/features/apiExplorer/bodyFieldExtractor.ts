import { RequestBodyField } from './types';

/**
 * Best-effort request-body field detection from a window of source text
 * around a route handler: destructured `req.body`, member access on
 * `req.body`, and destructured NestJS `@Body()` parameters.
 */
export function extractBodyFields(windowText: string): RequestBodyField[] {
  const fields = new Set<string>();

  const destructureMatch = windowText.match(/(?:const|let|var)\s*\{\s*([^}]+)\}\s*=\s*req\.body/);
  if (destructureMatch) {
    addFieldNames(fields, destructureMatch[1]);
  }

  const memberAccessRegex = /req\.body\.([A-Za-z_$][\w$]*)/g;
  let memberMatch: RegExpExecArray | null;
  while ((memberMatch = memberAccessRegex.exec(windowText))) {
    fields.add(memberMatch[1]);
  }

  const nestBodyDestructure = windowText.match(/@Body\(\)\s*\{\s*([^}]+)\}/);
  if (nestBodyDestructure) {
    addFieldNames(fields, nestBodyDestructure[1]);
  }

  return Array.from(fields).map((name) => ({ name }));
}

function addFieldNames(fields: Set<string>, rawFieldList: string): void {
  for (const part of rawFieldList.split(',')) {
    const name = part.split(':')[0].split('=')[0].trim();
    if (/^[A-Za-z_$][\w$]*$/.test(name)) {
      fields.add(name);
    }
  }
}
