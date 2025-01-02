import { file, src } from "../global";
import { Token } from "../lexer/tokens";
import { Expr, Stmt } from "../ast/ast.ts";

export enum ErrorCode {
  UnrecognizedToken,
  UnknownTokenKind,
  NoNud,
  NoLed,
  CannotCreatePrimaryExpr,
  Expected__Got__,
}

export class Err extends Error {
  private token: Token | Expr | Stmt;
  private errorCode: ErrorCode;

  constructor(
    token: Token | Expr | Stmt,
    message: string,
    errorCode: ErrorCode
  ) {
    super(message);
    this.token = token;
    this.errorCode = errorCode;
  }

  public throw() {
    const RESET = "\x1b[0m";
    const RED = "\x1b[31m";
    const GREEN = "\x1b[32m";
    const YELLOW = "\x1b[33m";
    const BLUE = "\x1b[34m";
    const LIGHT_GREEN = "\x1b[92m";
    const CYAN = "\x1b[36m";
    const line = `${this.token.line.start}-${this.token.line.end}`;
    const column = `${this.token.column.start}-${this.token.column.end}`;
    let sourceLine = "";
    if (typeof line === "string") {
      const [startLine, endLine] = line.split("-").map(Number);
      const lines = src.split("\n");
      let contextLines = lines.slice(Math.max(0, startLine - 3), startLine - 1);
      contextLines = contextLines.map((elem) =>
        elem.replace(/([0-9]+(\.[0-9]+))/g, `${LIGHT_GREEN}$1${RESET}`)
      );
      sourceLine = contextLines
        .map((line, index) => `|     ${startLine - 2 + index} | ${line}`)
        .join("\n");
      let singleLine = lines[startLine - 1] || "";
      singleLine = singleLine.replace(
        /([0-9]+(\.[0-9]+)*)/g,
        `${LIGHT_GREEN}$1${RESET}`
      );
      sourceLine += `\n|     ${startLine} | ${singleLine}`;
    } else {
      let singleLine = src.split("\n")[line - 1] || "";
      singleLine = singleLine.replace(
        /([0-9]+(\.[0-9]+)*)/g,
        `${LIGHT_GREEN}$1${RESET}`
      );
      sourceLine = `${line} | ${singleLine}`;
    }
    let hint = "";
    switch (this.errorCode) {
      case ErrorCode.UnrecognizedToken:
        hint = "Do you have an invalid symbol somewhere?";
        break;
      case ErrorCode.UnknownTokenKind:
        hint =
          "This error should not happen. Please report this as an issue if you are getting this error.";
        break;
      case ErrorCode.NoNud:
        hint = "Do you have a right side for an expression missing?";
        break;
      case ErrorCode.NoLed:
        hint = "Do you have a left side for an expression missing?";
        break;
      case ErrorCode.CannotCreatePrimaryExpr:
        hint = "Do you have an invalid kind of symbol for an expression?";
        break;
      default:
        hint = "NA";
        break;
    }
    const iszero = this.token.column.end - this.token.column.start == 0;
    let underline =
      " ".repeat(this.token.column.start + 3) +
      "^".repeat(iszero ? 1 : this.token.column.end - this.token.column.start);
    if (iszero) {
      underline += "-".repeat(sourceLine.split(/\|     [0-9]+ \| /)[1].length);
      underline += ">";
    }
    console.error(
      ` --------------------------------------------------
| quazer # ${RED}Error:${RESET} ${this.message.replace(/\n$/, "")}
|   ---> ${file} : ${line} : ${column}
${sourceLine}
|     ${RED}${underline}${RESET}
|   ${YELLOW}hint${RESET}: ${GREEN}${hint}${RESET}
 --------------------------------------------------\n
`
    );
    process.exit(1);
  }
}
