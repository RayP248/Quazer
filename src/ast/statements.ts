import { Expr, Stmt } from './ast.ts';

export interface BlockStmt extends Stmt {
  body: Stmt[];
  stmt(): () => {};
  line: number;
  column: number;
}

export interface ExpressionStmt extends Stmt {
  expression: Expr;
  stmt(): () => {};
  line: number;
  column: number;
}
