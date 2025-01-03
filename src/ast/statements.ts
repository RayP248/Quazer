import { Expr, Stmt, Type } from "./ast.ts";

export interface BlockStmt extends Stmt {
  body: Stmt[];
  stmt?(): () => {};
  line: Record<string, number>;
  column: Record<string, number>;
}

export interface ExpressionStmt extends Stmt {
  expression: Expr;
  stmt?(): () => {};
  line: Record<string, number>;
  column: Record<string, number>;
}

export interface VarDeclStmt extends Stmt {
  expression: Expr;
  varname: string;
  isConst: boolean;
  assignedVal: Expr;
  explicitType: Type;
  stmt?(): () => {};
  line: Record<string, number>;
  column: Record<string, number>;
}
