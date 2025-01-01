import { Token, TokenKind } from "../lexer/tokens";
import { BlockStmt } from '../ast/statements';
import { Stmt } from "../ast/ast";
import { parse_stmt } from "./stmt";
import { createTokenLookups } from "./lookups";

export interface parser {
  tokens: Token[];
  pos: number;
}

function createParser(tokens: Token[]): parser {
  createTokenLookups();
  return {
    tokens,
    pos: 0,
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
    startLine: body[0]?.startLine,
    endLine: body[body.length - 1]?.endLine,
    startColumn: body[0]?.startColumn,
    endColumn: body[body.length - 1]?.endColumn,
    line: body[0]?.line,
    column: body[0]?.column
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

export function expectError(p: parser, expectedKind: TokenKind, err: any): Token {
  const token = currToken(p);
  const kind = token.kind;

  if (kind !== expectedKind) {
    if (err) {
      console.error(err);
    } else {
      console.error(`Expected ${TokenKind[expectedKind]} but got ${TokenKind[kind]} instead.`);
    }
    process.exit(1);
  }

  return advance(p);
}

export function expect(p: parser, expectedKind: TokenKind): Token {
  return expectError(p, expectedKind, undefined);
}
