import { Token, TokenKind } from "../lexer/tokens";
import { BlockStmt } from '../ast/statements';
import { Stmt } from "../ast/ast";
import { parse_stmt } from "./stmt";
import { createTokenLookups } from "./lookups";
import { Err, ErrorCode } from "../error-handling/error";

export interface parser {
  tokens: Token[];
  pos: number;
  line: Record<string, number>;
  column: Record<string, number>;
}

function createParser(tokens: Token[]): parser {
  createTokenLookups();
  return {
    tokens,
    pos: 0,
    line: { start: 1, end: 1 },
    column: { start: 1, end: 1 },
  };
}

export function parse(tokens: Token[]): BlockStmt {
  const body: Stmt[] = [];
  const p: parser = createParser(tokens);

  while (hasTokens(p)) {
    body.push(parse_stmt(p));
  }

  return {
    body,
    line: { start: body[0]?.line.start, end: body[body.length - 1]?.line.end },
    column: {
      start: body[0]?.column.start,
      end: body[body.length - 1]?.column.end,
    },
  };
}

// Helper functions
export function currToken(p: parser): Token {
  return p.tokens[p.pos];
}

export function currKind(p: parser): TokenKind {
  return currToken(p).kind;
}

export function advance(p: parser): Token {
  const tk = currToken(p);
  p.pos++;
  return tk;
}

export function hasTokens(p: parser): boolean {
  return p.pos < p.tokens.length && currKind(p) != TokenKind.EOF;
}

export function expectError(
  p: parser,
  expectedKind: TokenKind,
  err: any
): Token {
  const token = currToken(p);
  const kind = token.kind;

  if (kind !== expectedKind) {
    if (err) {
      new Err(token, err, ErrorCode.Expected__Got__).throw();
    } else {
      new Err(
        token,
        `Expected ${TokenKind[expectedKind]} but got ${TokenKind[kind]} instead.`,
        ErrorCode.Expected__Got__
      ).throw();
    }
    process.exit(1);
  }

  return advance(p);
}

export function expect(p: parser, expectedKind: TokenKind): Token {
  return expectError(p, expectedKind, undefined);
}
