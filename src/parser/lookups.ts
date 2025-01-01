import { Expr, Stmt } from "../ast/ast";
import { NumberExpr, StringExpr, SymbolExpr } from "../ast/expressions";
import { TokenKind } from "../lexer/tokens";
import { advance, currKind, parser } from "./parser";
import { parse_binary_expr, parse_primary_expr } from "./expr";

export enum BindingPower {
  Default,
  Comma,
  Assignment,
  Logical,
  Relational,
  Additive,
  Multiplicative,
  Unary,
  Call,
  Member,
  Primary
}

type StmtHandler = (p: parser) => Stmt;
type NudHandler = (p: parser) => Expr;
type LedHandler = (p: parser, left: Expr, bp: BindingPower) => Expr;

type StmtLookup = { [key in TokenKind]?: StmtHandler };
type NudLookup = { [key in TokenKind]?: NudHandler };
type LedLookup = { [key in TokenKind]?: LedHandler };
type BpLookup = { [key in TokenKind]?: BindingPower };

export const bp_lu: BpLookup = {};
export const nud_lu: NudLookup = {};
export const led_lu: LedLookup = {};
export const stmt_lu: StmtLookup = {};

export function led(kind: TokenKind, bp: BindingPower, ledFn: LedHandler) {
  bp_lu[kind] = bp;
  led_lu[kind] = ledFn;
}

export function nud(kind: TokenKind, bp: BindingPower, nudFn: NudHandler) {
  bp_lu[kind] = BindingPower.Primary;
  nud_lu[kind] = nudFn;
}

export function stmt(kind: TokenKind, stmtFn: StmtHandler) {
  bp_lu[kind] = BindingPower.Default;
  stmt_lu[kind] = stmtFn;
}

export function createTokenLookups() {
  //Logical
  led(TokenKind.AND, BindingPower.Logical, parse_binary_expr);
  led(TokenKind.OR, BindingPower.Logical, parse_binary_expr);
  led(TokenKind.DOT_DOT, BindingPower.Logical, parse_binary_expr);

  //Relational
  led(TokenKind.LESS, BindingPower.Relational, parse_binary_expr);
  led(TokenKind.LESS_EQUALS, BindingPower.Relational, parse_binary_expr);
  led(TokenKind.GREATER, BindingPower.Relational, parse_binary_expr);
  led(TokenKind.GREATER_EQUALS, BindingPower.Relational, parse_binary_expr);
  led(TokenKind.EQUALS, BindingPower.Relational, parse_binary_expr);
  led(TokenKind.NOT_EQUALS, BindingPower.Relational, parse_binary_expr);

  //Additive & Multiplicative
  led(TokenKind.PLUS, BindingPower.Additive, parse_binary_expr);
  led(TokenKind.DASH, BindingPower.Additive, parse_binary_expr);
  led(TokenKind.STAR, BindingPower.Multiplicative, parse_binary_expr);
  led(TokenKind.SLASH, BindingPower.Multiplicative, parse_binary_expr);
  led(TokenKind.PERCENT, BindingPower.Multiplicative, parse_binary_expr);

  //Literals & Symbols
  nud(TokenKind.NUMBER, BindingPower.Primary, parse_primary_expr as NudHandler);
  nud(TokenKind.STRING, BindingPower.Primary, parse_primary_expr as NudHandler);
  nud(TokenKind.IDENTIFIER, BindingPower.Primary, parse_primary_expr as NudHandler);
}
