import { Expr, Stmt, Type } from "../ast/ast";
import { ExpressionStmt, VarDeclStmt } from "../ast/statements";
import { Err, ErrorCode } from "../error-handling/error";
import { TokenKind } from "../lexer/tokens";
import { parse_expr } from "./expr";
import { BindingPower, stmt_lu } from "./lookups";
import {
  advance,
  currKind,
  currToken,
  expect,
  expectError,
  parser,
} from "./parser";
import { parse_type } from "./types";

export function parse_stmt(p: parser): Stmt {
  const stmt_fn = stmt_lu[currKind(p)];

  if (stmt_fn) {
    return stmt_fn(p);
  }

  const expression = parse_expr(p, BindingPower.Default);
  expect(p, TokenKind.SEMI_COLON);

  return {
    expression,
    line: expression.line,
    column: expression.column,
  } as ExpressionStmt;
}

export function parse_var_decl_stmt(p: parser): Stmt {
  const keyword = advance(p);
  let explicitType: Type;
  let assignedVal: Expr;
  const isConst = keyword.kind === TokenKind.CONST;
  const varname = expectError(
    p,
    TokenKind.IDENTIFIER,
    "Expected an identifier after " +
      (isConst ? "`const`" : "`let`") +
      " keyword in variable declaration statement."
  ).value;
  if (currKind(p) === TokenKind.COLON) {
    advance(p);
    explicitType = parse_type(p, BindingPower.Default);
  }
  if (currKind(p) != TokenKind.SEMI_COLON) {
    expect(p, TokenKind.ASSIGNMENT);
    assignedVal = parse_expr(p, BindingPower.Assignment);
  } else if (!explicitType!) {
    new Err(
      currToken(p),
      "Expected either an assigned value or explicit type in variable declaration statement.",
      ErrorCode.AssignedValueOrExplicitTypeExpected
    ).throw();
  }

  const semicolon = expect(p, TokenKind.SEMI_COLON);

  if (isConst && !assignedVal!) {
    new Err(
      currToken(p),
      "Expected an assigned value after `const` keyword in variable declaration statement.",
      ErrorCode.AssignedValueExpected
    ).throw();
  }

  return {
    explicitType: explicitType!,
    isConst,
    varname,
    assignedVal: assignedVal!,
    line: {
      start: keyword.line.start,
      end: semicolon.line.end,
    } as Record<string, number>,
    column: {
      start: keyword.column.start,
      end: semicolon.column.end,
    } as Record<string, number>,
  } as VarDeclStmt;
}
