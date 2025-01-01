import { Stmt } from "../ast/ast";
import { ExpressionStmt } from "../ast/statements";
import { TokenKind } from "../lexer/tokens";
import { parse_expr } from "./expr";
import { BindingPower, stmt_lu } from "./lookups";
import { currKind, expect, parser } from "./parser";

//TODO: ADD IMPROVED ERROR HANDLING (LINE, COLUMN, CODE SNIPP, ETC)

export function parse_stmt(p: parser): Stmt {
  const stmt_fn = stmt_lu[currKind(p)];

  if (stmt_fn) {
    return stmt_fn(p);
  }

  const expression = parse_expr(p, BindingPower.Default);
  expect(p, TokenKind.SEMI_COLON);

  return {
    expression,
    startLine: expression.startLine,
    endLine: expression.endLine,
    startColumn: expression.startColumn,
    endColumn: expression.endColumn,
    line: expression.line,
    column: expression.column
  } as ExpressionStmt;
}
