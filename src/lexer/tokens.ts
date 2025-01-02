//TODO: ADD IMPROVED ERROR HANDLING (LINE, COLUMN, CODE SNIPP, ETC)

import { Err, ErrorCode } from "../error-handling/error";

export enum TokenKind {
  EOF,
  NUMBER,
  STRING,
  IDENTIFIER,

  OPEN_BRACKET,
  CLOSE_BRACKET,
  OPEN_CURLY,
  CLOSE_CURLY,
  OPEN_PAREN,
  CLOSE_PAREN,

  ASSIGNMENT,
  EQUALS,
  NOT,
  NOT_EQUALS,
  LESS,
  LESS_EQUALS,
  GREATER,
  GREATER_EQUALS,

  OR,
  AND,

  DOT,
  DOT_DOT,
  SEMI_COLON,
  COLON,
  COMMA,
  QUESTION,
  ARROW,

  PLUS_PLUS,
  MINUS_MINUS,
  PLUS_EQUALS,
  MINUS_EQUALS,
  SLASH_EQUALS,
  STAR_EQUALS,

  PLUS,
  DASH,
  SLASH,
  STAR,
  PERCENT,

  // Reserved Keywords
  LET,
  CONST,
  CLASS,
  NEW,
  IMPORT,
  FROM,
  FN,
  IF,
  ELSE,
  FOREACH,
  WHILE,
  FOR,
  EXPORT,
  TYPEOF,
  IN,

  UNKNOWN,
}

export const reserved_lu: Record<string, TokenKind> = {
  let: TokenKind.LET,
  const: TokenKind.CONST,
  class: TokenKind.CLASS,
  new: TokenKind.NEW,
  import: TokenKind.IMPORT,
  from: TokenKind.FROM,
  fn: TokenKind.FN,
  if: TokenKind.IF,
  else: TokenKind.ELSE,
  foreach: TokenKind.FOREACH,
  while: TokenKind.WHILE,
  for: TokenKind.FOR,
  export: TokenKind.EXPORT,
  typeof: TokenKind.TYPEOF,
  in: TokenKind.IN,
};

export interface TokenInterface {
  kind: TokenKind;
  value: string;
  line: Record<string, number>;
  column: Record<string, number>;
  debug(): void;
}

export class Token implements TokenInterface {
  kind: TokenKind;
  value: string;
  line: Record<string, number>;
  column: Record<string, number>;

  constructor(
    kind: TokenKind,
    value: string,
    line: Record<string, number>,
    column: Record<string, number>
  ) {
    this.kind = kind;
    this.value = value;
    this.line = { start: line.start, end: line.start };
    this.column = { start: column.start, end: column.start + value.length };
  }

  debug(): void {
    if (
      this.isOneOfMany(TokenKind.IDENTIFIER, TokenKind.NUMBER, TokenKind.STRING)
    ) {
      console.log(
        `${tokenKindString(this.kind)} (${this.value}), line: ${
          this.line.start
        } - ${this.line.end}, column: ${this.column.start} - ${this.column.end}`
      );
    } else {
      console.log(
        `${tokenKindString(this.kind)} (), line: ${this.line.start} - ${
          this.line.end
        }, column: ${this.column.start} - ${this.column.end}`
      );
    }
  }

  isOneOfMany(...expectedTokens: TokenKind[]): boolean {
    for (const expected of expectedTokens) {
      if (this.kind == expected) {
        return true;
      }
    }
    return false;
  }
}

export function newToken(
  kind: TokenKind,
  value: string,
  line: Record<string, number>,
  column: Record<string, number>
): Token {
  if (value == "") {
    return new Token(kind, value, line, { start: column.start, end: -1 });
  }
  return new Token(kind, value, line, column);
}

export function tokenKindString(kind: TokenKind): string | void {
  switch (kind) {
    case TokenKind.EOF:
      return "EOF";
    case TokenKind.NUMBER:
      return "NUMBER";
    case TokenKind.STRING:
      return "STRING";
    case TokenKind.IDENTIFIER:
      return "IDENTIFIER";
    case TokenKind.OPEN_BRACKET:
      return "OPEN_BRACKET";
    case TokenKind.CLOSE_BRACKET:
      return "CLOSE_BRACKET";
    case TokenKind.OPEN_CURLY:
      return "OPEN_CURLY";
    case TokenKind.CLOSE_CURLY:
      return "CLOSE_CURLY";
    case TokenKind.OPEN_PAREN:
      return "OPEN_PAREN";
    case TokenKind.CLOSE_PAREN:
      return "CLOSE_PAREN";
    case TokenKind.ASSIGNMENT:
      return "ASSIGNMENT";
    case TokenKind.EQUALS:
      return "EQUALS";
    case TokenKind.NOT:
      return "NOT";
    case TokenKind.NOT_EQUALS:
      return "NOT_EQUALS";
    case TokenKind.LESS:
      return "LESS";
    case TokenKind.LESS_EQUALS:
      return "LESS_EQUALS";
    case TokenKind.GREATER:
      return "GREATER";
    case TokenKind.GREATER_EQUALS:
      return "GREATER_EQUALS";
    case TokenKind.OR:
      return "OR";
    case TokenKind.AND:
      return "AND";
    case TokenKind.DOT:
      return "DOT";
    case TokenKind.DOT_DOT:
      return "DOT_DOT";
    case TokenKind.SEMI_COLON:
      return "SEMI_COLON";
    case TokenKind.COLON:
      return "COLON";
    case TokenKind.COMMA:
      return "COMMA";
    case TokenKind.PLUS_PLUS:
      return "PLUS_PLUS";
    case TokenKind.MINUS_MINUS:
      return "MINUS_MINUS";
    case TokenKind.PLUS_EQUALS:
      return "PLUS_EQUALS";
    case TokenKind.MINUS_EQUALS:
      return "MINUS_EQUALS";
    case TokenKind.SLASH_EQUALS:
      return "SLASH_EQUALS";
    case TokenKind.STAR_EQUALS:
      return "STAR_EQUALS";
    case TokenKind.PLUS:
      return "PLUS";
    case TokenKind.DASH:
      return "DASH";
    case TokenKind.SLASH:
      return "SLASH";
    case TokenKind.STAR:
      return "STAR";
    case TokenKind.PERCENT:
      return "PERCENT";
    case TokenKind.LET:
      return "LET";
    case TokenKind.CONST:
      return "CONST";
    case TokenKind.CLASS:
      return "CLASS";
    case TokenKind.NEW:
      return "NEW";
    case TokenKind.IMPORT:
      return "IMPORT";
    case TokenKind.FN:
      return "FN";
    case TokenKind.IF:
      return "IF";
    case TokenKind.ELSE:
      return "ELSE";
    case TokenKind.FOREACH:
      return "FOREACH";
    case TokenKind.WHILE:
      return "WHILE";
    case TokenKind.FOR:
      return "FOR";
    case TokenKind.EXPORT:
      return "EXPORT";
    case TokenKind.TYPEOF:
      return "TYPEOF";
    case TokenKind.IN:
      return "IN";
    default:
      new Err(
        new Token(
          TokenKind.UNKNOWN,
          "",
          { start: 0, end: 0 },
          { start: 0, end: 0 }
        ),
        `Unknown token kind: ${kind}`,
        ErrorCode.UnknownTokenKind
      ).throw();
  }
}
