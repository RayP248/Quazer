import { Err } from "../error-handling/error";
import { newToken, reserved_lu, Token, TokenKind } from "./tokens";

export type regexHandler = (lex: lexer, regex: RegExp) => any;

export interface regexPatterns {
  regex: RegExp;
  handler: regexHandler;
}

export interface lexer {
  patterns: regexPatterns[];
  tokens: Token[];
  source: string;
  pos: number;
  line: Record<string, number>;
  column: Record<string, number>;
  advanceN(n: number): void;
  push(token: Token): void;
  at(): string;
  remainder(): string;
  at_eof(): boolean;
}

export class Lexer implements lexer {
  patterns: regexPatterns[];
  tokens: Token[];
  source: string;
  pos: number;
  line: Record<string, number>;
  column: Record<string, number>;

  constructor(
    patterns: regexPatterns[],
    tokens: Token[],
    source: string,
    pos: number
  ) {
    this.patterns = patterns;
    this.tokens = tokens;
    this.source = source;
    this.pos = pos;
    this.line = { start: 1, end: 1 };
    this.column = { start: 1, end: 1 };
  }

  advanceN(n: number): void {
    for (let i = 0; i < n; i++) {
      if (this.source[this.pos] === "\n") {
        this.line.start++;
        this.line.end++;
        this.column.start = 1;
        this.column.end = 1;
      } else {
        this.column.start++;
        this.column.end++;
      }
      this.pos++;
    }
  }

  push(token: Token): void {
    this.tokens.push(token);
  }

  at(): string {
    return this.source[this.pos];
  }

  remainder(): string {
    return this.source.slice(this.pos);
  }

  at_eof(): boolean {
    return this.pos >= this.source.length;
  }
}

export function tokenize(source: string): Token[] {
  const lexerInstance = createLexer(source);

  while (!lexerInstance.at_eof()) {
    let matched = false;
    for (const { regex, handler } of lexerInstance.patterns) {
      const match = regex.exec(lexerInstance.remainder());
      if (match && match.index === 0) {
        handler(lexerInstance, regex);
        matched = true;
        break;
      }
    }

    if (!matched) {
      new Err(newToken(TokenKind.UNKNOWN, lexerInstance.remainder(), lexerInstance.line, lexerInstance.column), `Unrecognized token near ${lexerInstance.remainder()}`).throw();
    }
  }

  lexerInstance.push(newToken(TokenKind.EOF, 'EOF', lexerInstance.line, lexerInstance.column));
  return lexerInstance.tokens;
}

function defaultHandler(kind: TokenKind, value: string): regexHandler {
  return (lex, regex) => {
    const startColumn = lex.column.start;
    lex.advanceN(value.length);
    lex.push(
      newToken(kind, value, lex.line, {
        start: startColumn,
        end: startColumn + value.length - 1,
      })
    );
  };
}

function createLexer(source: string): lexer {
  const lexerInstance: lexer = new Lexer([
    { regex: new RegExp("[a-zA-Z_][a-zA-Z0-9_]*"), handler: symbolHandler },
    { regex: new RegExp("[0-9]+(\\.[0-9]+)?"), handler: numberHandler },
    { regex: new RegExp("\"[^\"]*\""), handler: stringHandler },
    { regex: new RegExp("#.*"), handler: skipHandler },
    { regex: new RegExp("\\s+"), handler: skipHandler },
    { regex: new RegExp("\\["), handler: defaultHandler(TokenKind.OPEN_BRACKET, '[') },
    { regex: new RegExp("\\]"), handler: defaultHandler(TokenKind.CLOSE_BRACKET, ']') },
    { regex: new RegExp("\\{"), handler: defaultHandler(TokenKind.OPEN_CURLY, '{') },
    { regex: new RegExp("\\}"), handler: defaultHandler(TokenKind.CLOSE_CURLY, '}') },
    { regex: new RegExp("\\("), handler: defaultHandler(TokenKind.OPEN_PAREN, '(') },
    { regex: new RegExp("\\)"), handler: defaultHandler(TokenKind.CLOSE_PAREN, ')') },
    { regex: new RegExp("=="), handler: defaultHandler(TokenKind.EQUALS, '==') },
    { regex: new RegExp("!="), handler: defaultHandler(TokenKind.NOT_EQUALS, '!=') },
    { regex: new RegExp("="), handler: defaultHandler(TokenKind.ASSIGNMENT, '=') },
    { regex: new RegExp("!"), handler: defaultHandler(TokenKind.NOT, '!') },
    { regex: new RegExp("<="), handler: defaultHandler(TokenKind.LESS_EQUALS, '<=') },
    { regex: new RegExp("<"), handler: defaultHandler(TokenKind.LESS, '<') },
    { regex: new RegExp(">="), handler: defaultHandler(TokenKind.GREATER_EQUALS, '>=') },
    { regex: new RegExp(">"), handler: defaultHandler(TokenKind.GREATER, '>') },
    { regex: new RegExp("\\|\\|"), handler: defaultHandler(TokenKind.OR, '||') },
    { regex: new RegExp("&&"), handler: defaultHandler(TokenKind.AND, '&&') },
    { regex: new RegExp("\\.\\."), handler: defaultHandler(TokenKind.DOT_DOT, '..') },
    { regex: new RegExp("\\."), handler: defaultHandler(TokenKind.DOT, '.') },
    { regex: new RegExp(";"), handler: defaultHandler(TokenKind.SEMI_COLON, ';') },
    { regex: new RegExp(":"), handler: defaultHandler(TokenKind.COLON, ':') },
    { regex: new RegExp("\\?"), handler: defaultHandler(TokenKind.QUESTION, '?') },
    { regex: new RegExp(","), handler: defaultHandler(TokenKind.COMMA, ',') },
    { regex: new RegExp("\\+\\+"), handler: defaultHandler(TokenKind.PLUS_PLUS, '++') },
    { regex: new RegExp("--"), handler: defaultHandler(TokenKind.MINUS_MINUS, '--') },
    { regex: new RegExp("\\+="), handler: defaultHandler(TokenKind.PLUS_EQUALS, '+=') },
    { regex: new RegExp("-="), handler: defaultHandler(TokenKind.MINUS_EQUALS, '-=') },
    { regex: new RegExp("\\+"), handler: defaultHandler(TokenKind.PLUS, '+') },
    { regex: new RegExp("->"), handler: defaultHandler(TokenKind.ARROW, '->') },
    { regex: new RegExp("-"), handler: defaultHandler(TokenKind.DASH, '-') },
    { regex: new RegExp("/"), handler: defaultHandler(TokenKind.SLASH, '/') },
    { regex: new RegExp("\\*"), handler: defaultHandler(TokenKind.STAR, '*') },
    { regex: new RegExp("%"), handler: defaultHandler(TokenKind.PERCENT, '%') },
  ], [], source, 0);

  return lexerInstance;
}

function numberHandler(lex: lexer, regex: RegExp) {
  const match = regex.exec(lex.remainder());
  if (match) {
    lex.push(newToken(TokenKind.NUMBER, match[0], lex.line, lex.column));
    lex.advanceN(match[0].length);
  }
}

function skipHandler(lex: lexer, regex: RegExp) {
  const match = regex.exec(lex.remainder());
  if (match) {
    lex.advanceN(match[0].length);
  }
}

function stringHandler(lex: lexer, regex: RegExp) {
  const match = regex.exec(lex.remainder());
  if (match) {
    const stringLiteral = match[0];
    lex.push(newToken(TokenKind.STRING, stringLiteral, lex.line, lex.column));
    lex.advanceN(stringLiteral.length);
  }
}

function symbolHandler(lex: lexer, regex: RegExp) {
  const match = regex.exec(lex.remainder());
  if (match) {
    const value = match[0];

    if (reserved_lu.hasOwnProperty(value)) {
      lex.push(newToken(reserved_lu[value], value, lex.line, lex.column));
    } else {
      lex.push(newToken(TokenKind.IDENTIFIER, value, lex.line, lex.column));
    }

    lex.advanceN(value.length);
  }
}
