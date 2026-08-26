import { ApiEndpoint } from '../apiExplorer/types';
import { ClassSignature, DocumentationSummaryCount, FunctionSignature } from './types';

export function computeSummaryCount(
  endpoints: ApiEndpoint[],
  functions: FunctionSignature[],
  classes: ClassSignature[]
): DocumentationSummaryCount {
  return {
    routesDocumented: endpoints.length,
    controllersDocumented: new Set(endpoints.map((e) => e.filePath)).size,
    functionsDocumented: functions.length,
    classesDocumented: classes.length
  };
}
