import { Type } from "../ast/ast";
import { Token, TokenKind, tokenKindString } from "../lexer/tokens";
import { BindingPower, bp_lu, led_lu } from "./lookups";
import { advance, currKind, currToken, expect, parser } from "./parser";
import { ArrayType, SymbolType } from "../ast/types";
import { Err, ErrorCode } from "../error-handling/error";

type type_NudHandler = (p: parser) => Type;
type type_LedHandler = (p: parser, left: Type, bp: BindingPower) => Type;

type type_NudLookup = { [key in TokenKind]?: type_NudHandler };
type type_LedLookup = { [key in TokenKind]?: type_LedHandler };
type type_BpLookup = { [key in TokenKind]?: BindingPower };

export const type_bp_lu: type_BpLookup = {};
export const type_nud_lu: type_NudLookup = {};
export const type_led_lu: type_LedLookup = {};

export function type_led(
  kind: TokenKind,
  bp: BindingPower,
  ledFn: type_LedHandler
) {
  type_bp_lu[kind] = bp;
  type_led_lu[kind] = ledFn;
}

export function type_nud(kind: TokenKind, nudFn: type_NudHandler) {
  type_nud_lu[kind] = nudFn;
}

export function createTkTypeLookups() {
  type_nud(TokenKind.IDENTIFIER, parse_symbol_type);
}

export function parse_symbol_type(p: parser): Type {
  const typeTk = expect(p, TokenKind.IDENTIFIER);
  const type = typeTk.value;
  let closeBrack: Token;
  return currToken(p).kind == TokenKind.OPEN_BRACKET
    ? ({
        underlying: (() => {
          advance(p); // Skip the '['
          closeBrack = expect(p, TokenKind.CLOSE_BRACKET); // Skip the ']' and store for pos
          return parse_type(p, BindingPower.Default);
        })(),
        line: { start: typeTk.line.start, end: closeBrack.line.end },
        column: { start: typeTk.column.start, end: closeBrack.column.end },
      } as ArrayType)
    : ({
        name: type,
        line: typeTk.line,
        column: typeTk.column,
      } as SymbolType);
}

export function parse_type(p: parser, bp: BindingPower): Type {
  let tkKind = currKind(p);
  const nud_fn = type_nud_lu[tkKind];
  if (!nud_fn) {
    new Err(
      currToken(p),
      `No type_nud function for token kind ${tokenKindString(tkKind)}`,
      ErrorCode.NoNud
    ).throw();
  }

  let left = nud_fn!(p);

  while (type_bp_lu[currKind(p)]! > bp) {
    tkKind = currKind(p);
    const led_fn = type_led_lu[tkKind];
    if (!led_fn) {
      new Err(
        currToken(p),
        `No type_led function for token kind ${tokenKindString(tkKind)}`,
        ErrorCode.NoLed
      ).throw();
    }

    left = led_fn!(p, left, type_bp_lu[currKind(p)]!);
  }

  return left;
}
