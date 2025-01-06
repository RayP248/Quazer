import { Token } from "../lexer/tokens.ts";
import { Expr, Stmt, Type } from "./ast.ts";

export interface BlockStmt extends Stmt {
  body: Stmt[];
  closecurly?: any;
  stmt?(): () => {};
}

export interface PackageStmt extends Stmt {
  name: string;
  stmt?(): () => {};
}

export interface ImportStmt extends Stmt {
  import: string;
  stmt?(): () => {};
}

export interface ExpressionStmt extends Stmt {
  expression: Expr;
  stmt?(): () => {};
}

export interface VarDeclStmt extends Stmt {
  expression: Expr;
  varname: string;
  isPub: boolean;
  isConst: boolean;
  assignedVal: Expr;
  explicitType: Type;
  stmt?(): () => {};
}

export interface StructDeclStmt extends Stmt {
  structName: string;
  isPub: boolean;
  properties: Map<string, StructProperty>;
  methods: Map<string, StructMethod>;
  stmt?(): () => {};
}

export interface StructMethod extends Stmt {
  isStatic: boolean;
  // type: Type;
  stmt?(): () => {};
}

export interface StructProperty extends Stmt {
  isStatic: boolean;
  type: Type;
  stmt?(): () => {};
}

export interface FnDeclStmt extends Stmt {
  name: string;
  isPub: boolean;
  params: Parameter[];
  returnStmt: ReturnStmt;
  returnType: Type;
  body: BlockStmt;
  stmt?(): () => {};
}

export interface Parameter extends Stmt {
  name: string;
  type: Type;
}

export interface ReturnStmt extends Stmt {
  returnExpression: Stmt;
  stmt?(): () => {};
}

export interface IfStmt extends Stmt {
  condition: Expr;
  body: BlockStmt;
  alternate: IfStmt | BlockStmt;
  stmt?(): () => {};
}
