import { Expr } from "../ast/ast";
import { BinaryExpr, NumberExpr, StringExpr, SymbolExpr } from "../ast/expressions";
import { Err } from "../error-handling/error";
import { TokenKind, tokenKindString } from "../lexer/tokens";
import { BindingPower, bp_lu, led_lu, nud_lu } from "./lookups";
import { advance, currKind, currToken, parser } from "./parser";
import util from 'util';

export function parse_expr(p: parser, bp: BindingPower): Expr {
  let tkKind = currKind(p);
  const nud_fn = nud_lu[tkKind];
  if (!nud_fn) {
    new Err(currToken(p), `No nud function for token kind ${tokenKindString(tkKind)}`).throw();
  }

  let left = nud_fn!(p);

  while (bp_lu[currKind(p)]! > bp) {
    tkKind = currKind(p);
    const led_fn = led_lu[tkKind];
    if (!led_fn) {
      new Err(currToken(p), `No led function for token kind ${tokenKindString(tkKind)}`).throw();
    }

    left = led_fn!(p, left, bp);
  }

  return left;
}

export function parse_primary_expr(p: parser): Expr | undefined {
  switch (currKind(p)) {
    case TokenKind.NUMBER:
      const number = parseFloat(advance(p).value);
      return { value: number, startLine: p.line, endLine: p.line, startColumn: p.column, endColumn: p.column, line: p.line, column: p.column } as NumberExpr;
    case TokenKind.STRING:
      return { value: advance(p).value, startLine: p.line, endLine: p.line, startColumn: p.column, endColumn: p.column, line: p.line, column: p.column } as StringExpr;
    case TokenKind.IDENTIFIER:
      return { value: advance(p).value, startLine: p.line, endLine: p.line, startColumn: p.column, endColumn: p.column, line: p.line, column: p.column } as SymbolExpr;
    default:
      new Err(currToken(p), `Cannot create primary expression from ${tokenKindString(currKind(p))}`).throw();
  }
}

export function parse_binary_expr(p: parser, left: Expr, bp: BindingPower): Expr {
  const operator = advance(p);
  const right = parse_expr(p, bp);
  console.log(`Binary expression:`,  util.inspect(left, false, null, true), util.inspect(operator, false, null, true), util.inspect(right, false, null, true));
  return {
    left,
    operator,
    right,
    startLine: left.startLine,
    endLine: right.endLine,
    startColumn: left.startColumn,
    endColumn: right.endColumn
  } as BinaryExpr;
}
