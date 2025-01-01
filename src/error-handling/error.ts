import { file, src } from "../global";
import { Token } from "../lexer/tokens";
import { Expr, Stmt } from "../ast/ast.ts";

export class Err extends Error {
  private token: Token | Expr | Stmt;

  constructor(token: Token | Expr | Stmt, message: string) {
    super(message);
    this.token = token;
  }

  public throw() {
    const RESET = "\x1b[0m";
    const RED = "\x1b[31m";
    const GREEN = "\x1b[32m";
    const YELLOW = "\x1b[33m";
    const BLUE = "\x1b[34m";
    const line = this.token.line ? this.token.line : this.token.startLine && this.token.endLine ? `${this.token.startLine} - ${this.token.endLine}` : 0;
    const column = this.token.column ? this.token.column : this.token.startColumn && this.token.endColumn ? `${this.token.startColumn} - ${this.token.endColumn}` : 0;
    let sourceLine = '';
    if (typeof line === 'string') {
      const [startLine, endLine] = line.split(' - ').map(Number);
      const lines = src.split('\n').slice(startLine - 1, endLine);
      sourceLine = lines.map((line, index) => `${startLine + index} | ${line}`).join('\n');
    } else {
      const singleLine = src.split('\n')[line - 1] || '';
      sourceLine = `${line} | ${singleLine}`;
    }
    console.error(
` --------------------------------------------------
| quazer # ${RED}Error:${RESET} ${this.message.replace(/\n$/, '')}
|   ---> ${file}:${line}:${column}
|     ${sourceLine}
 --------------------------------------------------\n
`);
    process.exit(1);
  }
}
