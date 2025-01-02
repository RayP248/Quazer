import { Token } from "../lexer/tokens";
import { Expr } from "./ast";

// Literal Expressions
export interface NumberExpr extends Expr {
  value: number;
  line: Record<string, number>;
  column: Record<string, number>;
  expr(): () => {};
}

export interface StringExpr extends Expr {
  value: string;
  line: Record<string, number>;
  column: Record<string, number>;
  expr(): () => {};
}

export interface SymbolExpr extends Expr {
  value: string;
  line: Record<string, number>;
  column: Record<string, number>;
  expr(): () => {};
}

// Complex Expressions
export interface BinaryExpr extends Expr {
  left: Expr;
  operator: Token;
  right: Expr;
  line: Record<string, number>;
  column: Record<string, number>;
  expr(): () => {};
}
