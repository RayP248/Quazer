import { Token } from "../lexer/tokens";
import { Expr, Type } from "./ast";
import { BlockStmt, Parameter } from "./statements";

// Literal Expressions
export interface NumberExpr extends Expr {
  value: number;
  line: Record<string, number>;
  column: Record<string, number>;
  expr?(): () => {};
}

export interface StringExpr extends Expr {
  value: string;
  line: Record<string, number>;
  column: Record<string, number>;
  expr?(): () => {};
}

export interface SymbolExpr extends Expr {
  value: string;
  line: Record<string, number>;
  column: Record<string, number>;
  expr?(): () => {};
}

// Complex Expressions
export interface BinaryExpr extends Expr {
  left: Expr;
  operator: Token;
  right: Expr;
  line: Record<string, number>;
  column: Record<string, number>;
  expr?(): () => {};
}

export interface PrefixExpr extends Expr {
  operator: Token;
  rightExpr: Expr;
  line: Record<string, number>;
  column: Record<string, number>;
  expr?(): () => {};
}

export interface AssignmentExpr extends Expr {
  assigne: Expr;
  operator: Token;
  val: Expr;
  line: Record<string, number>;
  column: Record<string, number>;
  expr?(): () => {};
}

export interface StructInstantiationExpr extends Expr {
  structName: string;
  properties: Map<string, Expr>;
  line: Record<string, number>;
  column: Record<string, number>;
  expr?(): () => {};
}

export interface ArrayLiteralExpr extends Expr {
  elements: Expr[];
  line: Record<string, number>;
  column: Record<string, number>;
  expr?(): () => {};
}

export interface MemberExpr extends Expr {
  member: Expr;
  property: string | Expr;
  line: Record<string, number>;
  column: Record<string, number>;
  expr?(): () => {};
}

export interface CallExpr extends Expr {
  method: Expr;
  args: Expr[];
  line: Record<string, number>;
  column: Record<string, number>;
  expr?(): () => {};
}

export interface FnExpr extends Expr {
  params: Parameter[];
  returnType: Type;
  body: BlockStmt;
}

export interface ObjectExpr extends Expr {
  properties: Map<string, Expr>;
  line: Record<string, number>;
  column: Record<string, number>;
  expr?(): () => {};
}
