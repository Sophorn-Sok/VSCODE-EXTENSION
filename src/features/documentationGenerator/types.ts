export interface FunctionSignature {
  name: string;
  params: string[];
  returnType?: string;
  filePath: string;
  line: number;
  isExported: boolean;
  /** Full source snippet for the function, used as AI prompt context. */
  code: string;
}

export interface ClassSignature {
  name: string;
  filePath: string;
  line: number;
  isExported: boolean;
  methods: FunctionSignature[];
}

export interface ExtractedSignatures {
  functions: FunctionSignature[];
  classes: ClassSignature[];
}

export interface DocumentationSummaryCount {
  routesDocumented: number;
  controllersDocumented: number;
  functionsDocumented: number;
  classesDocumented: number;
}
