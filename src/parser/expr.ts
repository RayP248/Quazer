import { Expr, Type } from "../ast/ast";
import {
  ArrayLiteralExpr,
  AssignmentExpr,
  BinaryExpr,
  CallExpr,
  FnExpr,
  MemberExpr,
  NumberExpr,
  ObjectExpr,
  PrefixExpr,
  StringExpr,
  StructInstantiationExpr,
  SymbolExpr,
} from "../ast/expressions";
import { Err, ErrorCode } from "../error-handling/error";
import { Token, TokenKind, tokenKindString } from "../lexer/tokens";
import { BindingPower, bp_lu, led_lu, nud_lu } from "./lookups";
import {
  advance,
  currKind,
  currToken,
  expect,
  hasTokens,
  parser,
} from "./parser";
import { parse_fn_params_body } from "./stmt";

export function parse_expr(p: parser, bp: BindingPower): Expr {
  let tkKind = currKind(p);
  const nud_fn = nud_lu[tkKind];
  if (!nud_fn) {
    new Err(
      currToken(p),
      `No nud function for token kind ${tokenKindString(tkKind)}`,
      ErrorCode.NoNud,
      "expr.ts : parse_expr() : if (!nud_fn) : nud_fn = " + nud_fn
    ).throw();
  }

  let left = nud_fn!(p);

  while (bp_lu[currKind(p)]! > bp) {
    tkKind = currKind(p);
    const led_fn = led_lu[tkKind];
    if (!led_fn) {
      new Err(
        currToken(p),
        `No led function for token kind ${tokenKindString(tkKind)}`,
        ErrorCode.NoLed,
        "expr.ts : parse_expr() : while (bp_lu[currKind(p)]! > bp) : led_fn = " +
          led_fn
      ).throw();
    }

    left = led_fn!(p, left, bp_lu[currKind(p)]!);
  }

  return left;
}

export function parse_primary_expr(p: parser): Expr | undefined {
  switch (currKind(p)) {
    case TokenKind.NUMBER:
      const numberToken = advance(p);
      const number = parseFloat(numberToken.value);
      return {
        kind: "NumberExpr",
        value: number,
        line: numberToken.line,
        column: numberToken.column,
      } as NumberExpr;
    case TokenKind.STRING:
      const stringToken = advance(p);
      const string = stringToken.value;
      return {
        kind: "StringExpr",
        value: string,
        line: stringToken.line,
        column: stringToken.column,
      } as StringExpr;
    case TokenKind.IDENTIFIER:
      const identifierToken = advance(p);
      const identifier = identifierToken.value;
      if (currKind(p) === TokenKind.OPEN_CURLY) {
        return parse_struct_instantiation(
          p,
          {
            kind: "SymbolExpr",
            value: identifier,
            line: identifierToken.line,
            column: identifierToken.column,
          } as SymbolExpr,
          BindingPower.Default
        );
      }
      return {
        kind: "SymbolExpr",
        value: identifier,
        line: identifierToken.line,
        column: identifierToken.column,
      } as SymbolExpr;
    case TokenKind.OPEN_CURLY:
      const opencurly = advance(p);
      const [properties, closecurly] = parse_properties(p);
      return {
        kind: "ObjectExpr",
        properties,
        line: { start: opencurly.line.start, end: closecurly.line.end },
        column: { start: opencurly.column.start, end: closecurly.column.end },
      } as ObjectExpr;
    default:
      new Err(
        currToken(p),
        `Cannot create primary expression from ${tokenKindString(currKind(p))}`,
        ErrorCode.CannotCreatePrimaryExpr,
        "expr.ts : parse_primary_expr() : switch (currKind(p)) : default"
      ).throw();
  }
}

export function parse_properties(p: parser): [Map<string, Expr>, Token] {
  const properties = new Map<string, Expr>();
  while (hasTokens(p) && currKind(p) != TokenKind.CLOSE_CURLY) {
    const propertyNameTk = expect(
      p,
      TokenKind.IDENTIFIER,
      "expr.ts : parse_properties() : while (hasTokens(p) && currKind(p) != TokenKind.CLOSE_CURLY) : propertyNameTk : expect TokenKind.IDENTIFIER"
    );
    const propertyName = propertyNameTk.value;
    expect(
      p,
      TokenKind.COLON,
      "expr.ts : parse_properties() : while (hasTokens(p) && currKind(p) != TokenKind.CLOSE_CURLY) : expect TokenKind.COLON"
    );
    const expr = parse_expr(p, BindingPower.Logical);
    properties.set(propertyName, expr);
    if (currKind(p) != TokenKind.CLOSE_CURLY) {
      expect(
        p,
        TokenKind.COMMA,
        "expr.ts : parse_properties() : if (currKind(p) != TokenKind.CLOSE_CURLY) : expect TokenKind.COMMA"
      );
    }
  }
  const closecurly = expect(
    p,
    TokenKind.CLOSE_CURLY,
    "expr.ts : parse_properties() : closecurly : expect TokenKind.CLOSE_CURLY"
  );

  return [properties, closecurly];
}

export function parse_binary_expr(
  p: parser,
  left: Expr,
  bp: BindingPower
): Expr {
  const operator = advance(p);
  const right = parse_expr(p, bp);
  return {
    kind: "BinaryExpr",
    left,
    operator,
    right,
    line: { start: left.line.start, end: right.line.end },
    column: { start: left.column.start, end: right.column.end },
  } as BinaryExpr;
}

export function parse_prefix_expr(p: parser): Expr {
  const operatorToken = advance(p);
  const rhs = parse_expr(p, BindingPower.Unary);
  return {
    kind: "PrefixExpr",
    operator: operatorToken,
    rightExpr: rhs,
    line: { start: operatorToken.line.start, end: rhs.line.end },
    column: { start: operatorToken.column.start, end: rhs.column.end },
  } as PrefixExpr;
}

export function parse_assignment_expr(
  p: parser,
  left: Expr,
  bp: BindingPower
): Expr {
  const operator = advance(p);
  const right = parse_expr(p, bp);
  return {
    kind: "AssignmentExpr",
    operator,
    val: right,
    assigne: left,
    line: { start: left.line.start, end: right.line.end },
    column: { start: left.column.start, end: right.column.end },
  } as AssignmentExpr;
}

export function parse_grouping_expr(p: parser): Expr {
  advance(p);
  const expr = parse_expr(p, BindingPower.Default);
  const newExpr = expr;
  expect(
    p,
    TokenKind.CLOSE_PAREN,
    "expr.ts : parse_grouping_expr() : expect TokenKind.CLOSE_PAREN"
  );
  newExpr.column.start--;
  newExpr.column.end++;
  return newExpr;
}

export function parse_struct_instantiation(
  p: parser,
  left: Expr,
  bp: BindingPower
): Expr {
  const structName = (left as SymbolExpr).value;
  const properties = new Map<string, Expr>();
  expect(
    p,
    TokenKind.OPEN_CURLY,
    "expr.ts : parse_struct_instantiation() : expect TokenKind.OPEN_CURLY"
  );

  while (hasTokens(p) && currKind(p) != TokenKind.CLOSE_CURLY) {
    const propertyNameTk = expect(
      p,
      TokenKind.IDENTIFIER,
      "expr.ts : parse_struct_instantiation() : propertyNameTk : expect TokenKind.IDENTIFIER"
    );
    const propertyName = propertyNameTk.value;
    expect(
      p,
      TokenKind.COLON,
      "expr.ts : parse_struct_instantiation() : expect TokenKind.COLON"
    );
    const expr = parse_expr(p, BindingPower.Logical);

    properties.set(propertyName, expr);
    if (currKind(p) != TokenKind.CLOSE_CURLY) {
      expect(
        p,
        TokenKind.COMMA,
        "expr.ts : parse_struct_instantiation() : if(currKind(p) != TokenKind.CLOSE_CURLY) : expect TokenKind.COMMA"
      );
    }
  }
  const closecurly = expect(
    p,
    TokenKind.CLOSE_CURLY,
    "expr.ts : parse_struct_instantiation() : closecurly : expect TokenKind.CLOSE_CURLY"
  );
  return {
    kind: "StructInstantiationExpr",
    structName,
    properties,
    line: { start: left.line.start, end: closecurly.line.end },
    column: { start: left.column.start, end: closecurly.column.end },
  } as StructInstantiationExpr;
}
/*
export function parse_array_instantiation(p: parser): Expr {
  let underlyingType: Type = parse_type(p, BindingPower.Default) as Type; // Advance past the type
  let contents: Expr[] = [];
  let size: Expr;

  expect(p, TokenKind.OPEN_CURLY); // Advance past '{'
  while (hasTokens(p) && currKind(p) != TokenKind.CLOSE_CURLY) {
    contents.push(parse_expr(p, BindingPower.Logical));

    if (currKind(p) != TokenKind.CLOSE_CURLY) {
      expect(p, TokenKind.COMMA);
    }
  }
  expect(p, TokenKind.CLOSE_CURLY); // Advance past '}'

  expect(p, TokenKind.OPEN_BRACKET);
  if (currKind(p) != TokenKind.CLOSE_BRACKET) {
    size = parse_expr(p, BindingPower.Default);
  }
  expect(p, TokenKind.CLOSE_BRACKET);

  return {
    underlying: underlyingType!,
    size: size!,
    contents,
  } as ArrayInstantiationExpr;
}
*/

export function parse_array_literal_expr(p: parser): ArrayLiteralExpr {
  const elements: Expr[] = [];
  const openbrack = expect(
    p,
    TokenKind.OPEN_BRACKET,
    "expr.ts : parse_array_literal_expr() : openbrack : expect TokenKind.OPEN_BRACKET"
  );
  while (hasTokens(p) && currKind(p) != TokenKind.CLOSE_BRACKET) {
    elements.push(parse_expr(p, BindingPower.Logical));
    if (currKind(p) != TokenKind.CLOSE_BRACKET) {
      expect(
        p,
        TokenKind.COMMA,
        "expr.ts : parse_array_literal_expr() : while (hasTokens(p) && currKind(p) != TokenKind.CLOSE_BRACKET) : if (currKind(p) != TokenKind.CLOSE_BRACKET) : expect TokenKind.COMMA"
      );
    }
  }
  const closebrack = expect(
    p,
    TokenKind.CLOSE_BRACKET,
    "expr.ts : parse_array_literal_expr() : closebrack : expect TokenKind.CLOSE_BRACKET"
  );
  return {
    kind: "ArrayLiteralExpr",
    elements,
    line: { start: openbrack.line.start, end: closebrack.line.end },
    column: { start: openbrack.column.start, end: closebrack.column.end },
  } as ArrayLiteralExpr;
}

export function parse_call_expr(p: parser, left: Expr, bp: BindingPower): Expr {
  advance(p);
  const args: Expr[] = [];

  while (hasTokens(p) && currKind(p) != TokenKind.CLOSE_PAREN) {
    args.push(parse_expr(p, BindingPower.Assignment));
    if (!currToken(p).isOneOfMany(TokenKind.EOF, TokenKind.CLOSE_PAREN)) {
      expect(
        p,
        TokenKind.COMMA,
        "expr.ts : parse_call_expr() : while (hasTokens(p) && currKind(p) != TokenKind.CLOSE_PAREN) : if (currToken(p).isOneOfMany(TokenKind.EOF, TokenKind.CLOSE_PAREN)) : expect TokenKind.COMMA"
      );
    }
  }

  const closeparen = expect(
    p,
    TokenKind.CLOSE_PAREN,
    "expr.ts : parse_call_expr() : closeparen : expect TokenKind.CLOSE_PAREN"
  );

  return {
    kind: "CallExpr",
    method: left,
    args,
    line: { start: left.line.start, end: closeparen.line.end },
    column: { start: left.column.start, end: closeparen.column.end },
  } as CallExpr;
}

export function parse_member_expr(
  p: parser,
  left: Expr,
  bp: BindingPower
): Expr {
  const isComputed = advance(p).kind === TokenKind.OPEN_BRACKET;

  if (isComputed) {
    const rhs = parse_expr(p, bp);
    const closebrack = expect(
      p,
      TokenKind.CLOSE_BRACKET,
      "expr.ts : parse_member_expr() : if (isComputed) : expect TokenKind.CLOSE_BRACKET"
    );
    return {
      kind: "MemberExpr",
      member: left,
      property: rhs,
      line: { start: left.line.start, end: closebrack.line.end },
      column: { start: left.column.start, end: closebrack.column.end },
    } as MemberExpr;
  }

  const property = expect(
    p,
    TokenKind.IDENTIFIER,
    "expr.ts : parse_member_expr() : property : expect TokenKind.IDENTIFIER"
  );
  return {
    kind: "MemberExpr",
    member: left,
    property: property.value,
    line: { start: left.line.start, end: property.line.end },
    column: { start: left.column.start, end: property.column.end },
  } as MemberExpr;
}

export function parse_fn_expr(p: parser) {
  const fn = expect(
    p,
    TokenKind.FN,
    "expr.ts : parse_fn_expr() : fn : expect TokenKind.FN"
  );
  const [params, returnType, body, returnStmt, closecurly] =
    parse_fn_params_body(p);

  return {
    kind: "FnExpr",
    params,
    returnType,
    body,
    returnStmt,
    line: { start: fn.line.start, end: closecurly.line.end },
    column: { start: fn.column.start, end: closecurly.column.end },
  } as FnExpr;
}
