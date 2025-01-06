import { Stmt } from "../ast/ast";
import {
  ArrayLiteralExpr,
  AssignmentExpr,
  BinaryExpr,
  CallExpr,
  FnExpr,
  MemberExpr,
  NumberExpr,
  PrefixExpr,
  StringExpr,
  StructInstantiationExpr,
  SymbolExpr,
} from "../ast/expressions";
import {
  BlockStmt,
  ExpressionStmt,
  FnDeclStmt,
  IfStmt,
  ImportStmt,
  PackageStmt,
  ReturnStmt,
  StructDeclStmt,
  VarDeclStmt,
} from "../ast/statements";
import { Err, ErrorCode } from "../error-handling/error";
import { Environment } from "./environment";
import {
  evalArrayLiteralExpr,
  evalAssignmentExpr,
  evalBinaryExpr,
  evalCallExpr,
  evalFnExpr,
  evalMemberExpr,
  evalPrefixExpr,
  evalStructInstantiationExpr,
} from "./eval/expressions";
import {
  evalBlockStmt,
  evalExpressionStmt,
  evalFnDeclStmt,
  evalIfStmt,
  evalPackageStmt,
  evalReturnStmt,
  evalStructDeclStmt,
  evalVarDeclStmt,
} from "./eval/statements";
import { MKNull, MKNumber, MKString, RuntimeVal } from "./values";

export function evaluate(
  ast: Stmt,
  env: Environment,
  returned: boolean = false
): RuntimeVal {
  let result;
  switch (ast.kind) {
    case "BlockStmt":
      result = evalBlockStmt(ast as BlockStmt, env, returned);
      break;
    case "PackageStmt":
      result = evalPackageStmt(ast as PackageStmt, env, returned);
      break;
    /*case "ImportStmt":
      console.log(ast);
      result = evalImportStmt(ast as ImportStmt, env);
      break;*/
    case "ExpressionStmt":
      result = evalExpressionStmt(ast as ExpressionStmt, env, returned);
      break;
    case "BinaryExpr":
      result = evalBinaryExpr(ast as BinaryExpr, env, returned);
      break;
    case "NumberExpr":
      result = MKNumber((ast as NumberExpr).value, returned);
      break;
    case "SymbolExpr":
      result = env.lookupVar((ast as SymbolExpr).value, ast);
      break;
    case "StringExpr":
      result = MKString((ast as StringExpr).value, returned);
      break;
    case "PrefixExpr":
      result = evalPrefixExpr(ast as PrefixExpr, env, returned);
      break;
    case "CallExpr":
      result = evalCallExpr(ast as CallExpr, env, returned);
      break;
    case "FnDeclStmt":
      result = evalFnDeclStmt(ast as FnDeclStmt, env, returned);
      break;
    case "VarDeclStmt":
      result = evalVarDeclStmt(ast as VarDeclStmt, env, returned);
      break;
    case "ReturnStmt":
      result = evalReturnStmt(ast as ReturnStmt, env);
      break;
    case "ArrayLiteralExpr":
      result = evalArrayLiteralExpr(ast as ArrayLiteralExpr, env, returned);
      break;
    case "StructDeclStmt":
      result = evalStructDeclStmt(ast as StructDeclStmt, env, returned);
      break;
    case "StructInstantiationExpr":
      result = evalStructInstantiationExpr(
        ast as StructInstantiationExpr,
        env,
        returned
      );
      break;
    case "MemberExpr":
      result = evalMemberExpr(ast as MemberExpr, env, returned);
      break;
    case "FnExpr":
      result = evalFnExpr(ast as FnExpr, env, returned);
      break;
    case "IfStmt":
      result = evalIfStmt(ast as IfStmt, env, returned);
      break;
    case "AssignmentExpr":
      result = evalAssignmentExpr(ast as AssignmentExpr, env, returned);
      break;
    default:
      new Err(
        ast,
        `Cannot evaluate ${ast.kind}`,
        ErrorCode.NotImplemented,
        "interpreter.ts : switch ast.kind : default: : new Err"
      ).throw();
      result = MKNull();
  }
  return result;
}
