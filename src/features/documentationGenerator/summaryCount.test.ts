import { computeSummaryCount } from './summaryCount';
import { ApiEndpoint } from '../apiExplorer/types';
import { ClassSignature, FunctionSignature } from './types';

describe('computeSummaryCount', () => {
  it('counts routes, distinct controller files, functions, and classes', () => {
    const endpoints: ApiEndpoint[] = [
      { method: 'GET', path: '/a', filePath: 'a.controller.ts', line: 1, framework: 'nestjs', bodyFields: [] },
      { method: 'POST', path: '/b', filePath: 'a.controller.ts', line: 2, framework: 'nestjs', bodyFields: [] },
      { method: 'GET', path: '/c', filePath: 'c.controller.ts', line: 1, framework: 'nestjs', bodyFields: [] }
    ];
    const functions: FunctionSignature[] = [
      { name: 'f1', params: [], filePath: 'x.ts', line: 1, isExported: true, code: '' }
    ];
    const classes: ClassSignature[] = [{ name: 'X', filePath: 'x.ts', line: 1, isExported: true, methods: [] }];

    expect(computeSummaryCount(endpoints, functions, classes)).toEqual({
      routesDocumented: 3,
      controllersDocumented: 2,
      functionsDocumented: 1,
      classesDocumented: 1
    });
  });

  it('handles all-empty inputs', () => {
    expect(computeSummaryCount([], [], [])).toEqual({
      routesDocumented: 0,
      controllersDocumented: 0,
      functionsDocumented: 0,
      classesDocumented: 0
    });
  });
});
