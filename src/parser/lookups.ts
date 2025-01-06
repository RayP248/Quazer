import { Expr, Stmt } from "../ast/ast";
import { TokenKind } from "../lexer/tokens";
import { parser } from "./parser";
import {
  parse_array_literal_expr,
  parse_assignment_expr,
  parse_binary_expr,
  parse_call_expr,
  parse_fn_expr,
  parse_grouping_expr,
  parse_member_expr,
  parse_prefix_expr,
  parse_primary_expr,
  parse_struct_instantiation,
} from "./expr";
import {
  parse_block_stmt,
  parse_fn_decl_stmt,
  parse_if_stmt,
  parse_import_stmt,
  parse_package_stmt,
  parse_return_stmt,
  parse_struct_decl_stmt,
  parse_var_decl_stmt,
} from "./stmt";

export enum BindingPower {
  Default,
  Comma,
  Assignment,
  Logical,
  Relational,
  Additive,
  Multiplicative,
  Unary,
  Call,
  Member,
  Primary,
}

type StmtHandler = (p: parser) => Stmt;
type NudHandler = (p: parser) => Expr;
type LedHandler = (p: parser, left: Expr, bp: BindingPower) => Expr;

type StmtLookup = { [key in TokenKind]?: StmtHandler };
type NudLookup = { [key in TokenKind]?: NudHandler };
type LedLookup = { [key in TokenKind]?: LedHandler };
type BpLookup = { [key in TokenKind]?: BindingPower };

export const bp_lu: BpLookup = {};
export const nud_lu: NudLookup = {};
export const led_lu: LedLookup = {};
export const stmt_lu: StmtLookup = {};

export function led(kind: TokenKind, bp: BindingPower, ledFn: LedHandler) {
  bp_lu[kind] = bp;
  led_lu[kind] = ledFn;
}

export function nud(kind: TokenKind, nudFn: NudHandler) {
  nud_lu[kind] = nudFn;
}

export function stmt(kind: TokenKind, stmtFn: StmtHandler) {
  bp_lu[kind] = BindingPower.Default;
  stmt_lu[kind] = stmtFn;
}

export function createTokenLookups() {
  //Assignment
  led(TokenKind.ASSIGNMENT, BindingPower.Assignment, parse_assignment_expr);
  led(TokenKind.PLUS_EQUALS, BindingPower.Assignment, parse_assignment_expr);
  led(TokenKind.MINUS_EQUALS, BindingPower.Assignment, parse_assignment_expr);
  led(TokenKind.STAR_EQUALS, BindingPower.Assignment, parse_assignment_expr);
  led(TokenKind.SLASH_EQUALS, BindingPower.Assignment, parse_assignment_expr);
  led(TokenKind.PERCENT_EQUALS, BindingPower.Assignment, parse_assignment_expr);

  //Logical
  led(TokenKind.AND, BindingPower.Logical, parse_binary_expr);
  led(TokenKind.OR, BindingPower.Logical, parse_binary_expr);
  led(TokenKind.DOT_DOT, BindingPower.Logical, parse_binary_expr);

  //Relational
  led(TokenKind.LESS, BindingPower.Relational, parse_binary_expr);
  led(TokenKind.LESS_EQUALS, BindingPower.Relational, parse_binary_expr);
  led(TokenKind.GREATER, BindingPower.Relational, parse_binary_expr);
  led(TokenKind.GREATER_EQUALS, BindingPower.Relational, parse_binary_expr);
  led(TokenKind.EQUALS, BindingPower.Relational, parse_binary_expr);
  led(TokenKind.NOT_EQUALS, BindingPower.Relational, parse_binary_expr);

  //Additive & Multiplicative
  led(TokenKind.PLUS, BindingPower.Additive, parse_binary_expr);
  led(TokenKind.DASH, BindingPower.Additive, parse_binary_expr);
  led(TokenKind.STAR, BindingPower.Multiplicative, parse_binary_expr);
  led(TokenKind.SLASH, BindingPower.Multiplicative, parse_binary_expr);
  led(TokenKind.PERCENT, BindingPower.Multiplicative, parse_binary_expr);

  //Literals & Symbols
  nud(TokenKind.NUMBER, parse_primary_expr as NudHandler);
  nud(TokenKind.STRING, parse_primary_expr as NudHandler);
  nud(TokenKind.IDENTIFIER, parse_primary_expr as NudHandler);
  nud(TokenKind.OPEN_CURLY, parse_primary_expr as NudHandler);
  /*led(TokenKind.OPEN_CURLY, BindingPower.Call, (p, left, bp) => {
    function checkIfDefinedStruct(leftS: Expr): boolean {
      const definedStructs = JSON.parse(
        fs.readFileSync(
          getAbsolutePath(
            import.meta.url,
            "../defined-values/defined-structs.json"
          ),
          "utf-8"
        )
      );
      for (const struct in definedStructs) {
        if (struct == (leftS as SymbolExpr).value) {
          return true;
        }
      }
      return false;
    }
    if (checkIfDefinedStruct(left) == true) {
      return parse_struct_instantiation(p, left, bp);
    } else {
      return parse_block_stmt(p);
    }
  });*/

  //Unary/Prefix
  //TODO: Add support for other unary operators (e.g. !, typeof, etc.)
  nud(TokenKind.DASH, parse_prefix_expr as NudHandler);
  nud(TokenKind.OPEN_BRACKET, parse_array_literal_expr);

  //Member / Computed // Call
  led(TokenKind.DOT, BindingPower.Member, parse_member_expr);
  led(TokenKind.OPEN_BRACKET, BindingPower.Member, parse_member_expr);
  led(TokenKind.OPEN_PAREN, BindingPower.Call, parse_call_expr);
  led(TokenKind.OPEN_CURLY, BindingPower.Primary, parse_struct_instantiation);

  //Grouping Expr
  nud(TokenKind.OPEN_PAREN, parse_grouping_expr);
  nud(TokenKind.FN, parse_fn_expr);
  //TODO: Add support for `new` keyword here.

  //Statements
  stmt(TokenKind.OPEN_CURLY, parse_block_stmt);
  stmt(TokenKind.PACKAGE, parse_package_stmt);
  stmt(TokenKind.IMPORT, parse_import_stmt);
  stmt(TokenKind.CONST, parse_var_decl_stmt);
  stmt(TokenKind.LET, parse_var_decl_stmt);
  stmt(TokenKind.PUB, parse_var_decl_stmt);
  stmt(TokenKind.STRUCT, parse_struct_decl_stmt);
  stmt(TokenKind.FN, parse_fn_decl_stmt);
  stmt(TokenKind.RETURN, parse_return_stmt);
  stmt(TokenKind.IF, parse_if_stmt);
}
