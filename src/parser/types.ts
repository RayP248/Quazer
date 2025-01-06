import { Type } from "../ast/ast";
import { Token, TokenKind, tokenKindString } from "../lexer/tokens";
import { BindingPower } from "./lookups";
import { advance, currKind, currToken, expect, parser } from "./parser";
import { ArrayType, SymbolType } from "../ast/types";
import { Err, ErrorCode } from "../error-handling/error";
import { ValueType } from "../interpreter/values";

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
  type_led(
    TokenKind.OPEN_BRACKET,
    BindingPower.Call,
    (p: parser, left: Type, bp: BindingPower): Type => {
      expect(
        p,
        TokenKind.OPEN_BRACKET,
        "types.ts : cretaeTkTypeLookups() : type_led() : 3rd arg : left = " +
          left
      );
      const closebrack = expect(
        p,
        TokenKind.CLOSE_BRACKET,
        "types.ts : cretaeTkTypeLookups() : type_led() : 3rd arg : closebrack : expect TokenKind.CLOSE_BRACKET : left = " +
          left
      );

      return {
        kind: "ArrayType",
        name: left.name,
        overlying: "array",
        line: { start: left.line.start, end: closebrack.line.end },
        column: { start: left.column.start, end: closebrack.column.end },
      } as ArrayType;
    }
  );
}

export function parse_symbol_type(p: parser): Type {
  const typeTk = expect(
    p,
    TokenKind.IDENTIFIER,
    "types.ts : parse_symbol_type() : expect TokenKind.IDENTIFIER"
  );
  const type = typeTk.value;
  return {
    kind: "SymbolType",
    name: type as ValueType,
    overlying: "symbol",
    line: typeTk.line,
    column: typeTk.column,
  } as SymbolType;
}

export function parse_type(p: parser, bp: BindingPower): Type {
  let tkKind = currKind(p);
  const nud_fn = type_nud_lu[tkKind];
  if (!nud_fn) {
    new Err(
      currToken(p),
      `No type_nud function for token kind ${tokenKindString(tkKind)}`,
      ErrorCode.NoNud,
      "types.ts : parse_type() : if (!nud_fn) : nud_fn = " + nud_fn
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
        ErrorCode.NoLed,
        "types.ts : parse_type() : while (type_bp_lu[currKind(p)]! > bp) : led_fn = " +
          led_fn
      ).throw();
    }

    left = led_fn!(p, left, type_bp_lu[currKind(p)]!);
  }

  return left;
}
