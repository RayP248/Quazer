import { reserved_lu, Token, tokenKindString } from "../lexer/tokens";
import { Expr, Stmt } from "../ast/ast.ts";
import Module from "node:module";

const require = Module.createRequire(import.meta.url);
export enum ErrorCode {
  UnrecognizedToken,
  UnknownTokenKind,
  NoNud,
  NoLed,
  CannotCreatePrimaryExpr,
  Expected__Got__,
  AssignedValueOrExplicitTypeExpected,
  AssignedValueExpected,
  NotImplemented,
  DuplicateProperty,
  ExpectedInstanceOf,
  VarDoesNotExist,
  CannotReassignConstant,
  InvalidBinaryOperation,
  InvalidCall,
  TypeMismatch,
  MissingProp,
  InvalidCallbackType,
  ModuleNotFound,
  InvalidCondition,
}

export class Err extends Error {
  private token: Token | Expr | Stmt;
  private errorCode: ErrorCode;
  private origination: string;

  constructor(
    token: Token | Expr | Stmt,
    message: string,
    errorCode: ErrorCode,
    origination: string
  ) {
    super(message);
    this.token = token;
    this.errorCode = errorCode;
    this.origination = origination;
  }

  public throw() {
    const { src, file } = require("../main.ts");
    const RESET = "\x1b[0m";
    const RED = "\x1b[31m";
    const GREEN = "\x1b[32m";
    const YELLOW = "\x1b[33m";
    const BLUE = "\x1b[34m";
    const LIGHT_GREEN = "\x1b[92m";
    const CYAN = "\x1b[36m";
    const PURPLE = "\x1b[35m";
    const DARK_GREEN = "\x1b[38;2;0;100;0m";
    const ORANGE = "\x1b[38;2;255;165;0m";
    const FUNCTION_NAME = "\x1b[38;2;220;220;170m";

    const line = `${this.token.line.start}-${this.token.line.end}`;
    const column = `${this.token.column.start}-${this.token.column.end}`;

    const replacements = [
      (elem: string) => {
        return elem.replace(
          /((\-)*[0-9]+(\.[0-9]+)*)/g,
          `${LIGHT_GREEN}$1${RESET}`
        );
      },
      (elem: string) => {
        return elem.replace(
          /\b(let|const|class|new|import|from|fn|if|else|foreach|while|for|export|typeof|in|pub|return|struct|package)\b/g,
          `${BLUE}$1${RESET}`
        );
      },
      (elem: string) => {
        return elem.replace(
          /((?!fn\b)\s+[a-zA-Z_]+)(\()/g,
          `${FUNCTION_NAME}$1${RESET}$2`
        );
      },
      (elem: string) => {
        return elem.replace(
          /(([a-zA-Z_]+):(\s+)([a-zA-Z_\[\]]+))/g,
          `${CYAN}$2${RESET}:$3${GREEN}$4${RESET}`
        );
      },
      (elem: string) => {
        return elem.replace(
          /((\->)(\s+)(\b[a-zA-Z_]+\b))/g,
          `${RESET}$2$3${GREEN}$4${RESET}`
        );
      },
      (elem: string) => {
        return elem.replace(/\b([a-zA-Z_\[\]]+)\b/g, `${CYAN}$1${RESET}`);
      },
      (elem: string) => {
        return elem.replace(
          /([\[\]\{\}\(\)]+)(?![0-9;]+m)/g,
          `${PURPLE}$1${RESET}`
        );
      },
      (elem: string) => {
        return elem.replace(/(#.*)/g, (match) => {
          // Strip existing color codes
          const stripped = match.replace(/\x1b\[[0-9;]*m/g, "");
          return `${DARK_GREEN}${stripped}${RESET}`;
        });
      },
      (elem: string) => {
        return elem.replace(/"([^"]*)"/g, (match) => {
          const stripped = match.replace(/\x1b\[[0-9;]*m/g, "");
          return `${ORANGE}${stripped}${RESET}`;
        });
      },
    ];

    function map(array: string[]) {
      let transformedArray = array;
      for (let i = 0; i < replacements.length; i++) {
        transformedArray = transformedArray.map(replacements[i]);
      }
      return transformedArray;
    }

    function replaceSingle(str: string) {
      let transformedStr = str;
      for (let i = 0; i < replacements.length; i++) {
        transformedStr = replacements[i](transformedStr);
      }
      return transformedStr;
    }

    let sourceLine = "";
    if (typeof line === "string") {
      const [startLine, endLine] = line.split("-").map(Number);
      const lines = src.split("\n");
      let contextLines = lines.slice(Math.max(0, startLine - 5), startLine - 1);
      contextLines = map(contextLines);
      sourceLine = contextLines
        .map(
          (line, index) =>
            `|     ${startLine - contextLines.length + index} | ${line}`
        )
        .join("\n");
      let singleLine = lines[startLine - 1] || "";
      singleLine = replaceSingle(singleLine);
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
      case ErrorCode.Expected__Got__:
        hint = "Do you have a missing symbol somewhere?";
        break;
      case ErrorCode.AssignedValueOrExplicitTypeExpected:
        hint =
          "Do you have an assigned value or explicit type in variable declaration statement?";
        break;
      case ErrorCode.AssignedValueExpected:
        hint =
          "Do you have an assigned value to a constant variable in variable declaration statement?";
        break;
      case ErrorCode.NotImplemented:
        hint = "This feature is not implemented yet.";
        break;
      case ErrorCode.DuplicateProperty:
        hint = "Do you have a duplicate property in your object?";
        break;
      case ErrorCode.ExpectedInstanceOf:
        hint = "Do you have an instance of the expected class?";
        break;
      case ErrorCode.VarDoesNotExist:
        hint = "Are you trying to access a variable that does not exist?";
        break;
      case ErrorCode.CannotReassignConstant:
        hint = "Are you trying to reassign a value to a constant?";
        break;
      case ErrorCode.InvalidBinaryOperation:
        hint = "Do you have an invalid binary operation?";
        break;
      case ErrorCode.InvalidCall:
        hint =
          "Are you trying to call a function that does not exist or is not a function?";
        break;
      case ErrorCode.TypeMismatch:
        hint = "Do you have a type mismatch somewhere?";
        break;
      case ErrorCode.MissingProp:
        hint =
          "Do you have a missing property from the strcut it's based off of in your struct?";
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
|   ---> ${file} : ${line} : ${column} from ${this.origination}
${sourceLine}
|     ${RED}${underline}${RESET}
|   ${YELLOW}hint${RESET}: ${GREEN}${hint}${RESET}
 --------------------------------------------------\n
`
    );
    process.exit(1);
  }
}
