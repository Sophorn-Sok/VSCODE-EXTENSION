import * as ts from 'typescript';
import { ClassSignature, ExtractedSignatures, FunctionSignature } from './types';

/**
 * Parses a single TypeScript/JavaScript source file and extracts top-level
 * function and class signatures, for AI-written documentation generation.
 * Purely syntactic (no type-checker), so it works file-by-file without a
 * full project/tsconfig.
 */
export function extractSignatures(sourceText: string, filePath: string): ExtractedSignatures {
  const scriptKind = filePath.endsWith('.tsx')
    ? ts.ScriptKind.TSX
    : filePath.endsWith('.jsx')
      ? ts.ScriptKind.JSX
      : filePath.endsWith('.js')
        ? ts.ScriptKind.JS
        : ts.ScriptKind.TS;

  const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, scriptKind);

  const functions: FunctionSignature[] = [];
  const classes: ClassSignature[] = [];

  const lineOf = (node: ts.Node) => sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
  const isExported = (node: ts.Node) => {
    if (!ts.canHaveModifiers(node)) {
      return false;
    }
    return (ts.getModifiers(node) ?? []).some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
  };

  const toFunctionSignature = (node: ts.FunctionLikeDeclarationBase, name: string): FunctionSignature => ({
    name,
    params: node.parameters.map((p) => p.getText(sourceFile)),
    returnType: node.type?.getText(sourceFile),
    filePath,
    line: lineOf(node),
    isExported: isExported(node),
    code: node.getText(sourceFile)
  });

  ts.forEachChild(sourceFile, (node) => {
    if (ts.isFunctionDeclaration(node) && node.name) {
      functions.push(toFunctionSignature(node, node.name.text));
      return;
    }

    if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        if (
          ts.isIdentifier(decl.name) &&
          decl.initializer &&
          (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer))
        ) {
          functions.push(toFunctionSignature(decl.initializer, decl.name.text));
        }
      }
      return;
    }

    if (ts.isClassDeclaration(node) && node.name) {
      const methods: FunctionSignature[] = [];
      for (const member of node.members) {
        if (ts.isMethodDeclaration(member) && member.name && ts.isIdentifier(member.name)) {
          methods.push(toFunctionSignature(member, member.name.text));
        }
      }
      classes.push({
        name: node.name.text,
        filePath,
        line: lineOf(node),
        isExported: isExported(node),
        methods
      });
    }
  });

  return { functions, classes };
}
