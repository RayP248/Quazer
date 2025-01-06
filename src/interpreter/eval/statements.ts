import { Stmt } from "../../ast/ast";
import {
  BlockStmt,
  FnDeclStmt,
  VarDeclStmt,
  ReturnStmt,
  Parameter,
  StructDeclStmt,
  PackageStmt,
  ImportStmt,
  IfStmt,
} from "../../ast/statements";
import { ArrayType, SymbolType } from "../../ast/types";
import { Err, ErrorCode } from "../../error-handling/error";
import { Environment } from "../environment";
import { evaluate } from "../interpreter";
import {
  FnVal,
  MKNull,
  RuntimeVal,
  ValueType,
  Param,
  StructProp,
  StructDefVal,
  BooleanVal,
} from "../values";

export function evalBlockStmt(
  blockstmt: BlockStmt,
  env: Environment,
  returned: boolean
): RuntimeVal {
  let result: RuntimeVal = MKNull();
  for (const stmt of blockstmt.body) {
    if (stmt.kind === "ReturnStmt") {
      result = evaluate(stmt, env, returned);
      break;
    } else {
      result = evaluate(stmt, env);
    }
  }
  return result;
}

export function evalPackageStmt(
  stmt: PackageStmt,
  env: Environment,
  returned: boolean
): RuntimeVal {
  env.packageName = stmt.name;
  return MKNull();
}

/*export function evalImportStmt(stmt: ImportStmt, env: Environment): RuntimeVal {
  env.import(stmt.import, stmt);
  return MKNull();
}*/

export function evalExpressionStmt(
  expr: Stmt,
  env: Environment,
  returned: boolean
): RuntimeVal {
  return evaluate(expr.expression, env, returned);
}

export function evalVarDeclStmt(
  stmt: VarDeclStmt,
  env: Environment,
  returned: boolean
): RuntimeVal {
  const name = stmt.varname;
  const isPub = stmt.isPub;
  const isConst = stmt.isConst;
  const assignedVal = evaluate(stmt.assignedVal, env, returned) as RuntimeVal;
  const explicitType = stmt.explicitType;
  env.declareVar(
    name,
    assignedVal,
    stmt,
    explicitType
      ? explicitType?.overlying == "array"
        ? {
            overlying: (explicitType as ArrayType)
              .overlying as unknown as ValueType,
            underlying: (explicitType as ArrayType)
              .name as unknown as ValueType,
          }
        : ((explicitType as SymbolType).name as ValueType)
        ? ((explicitType as SymbolType).name as ValueType)
        : null
      : null,
    isPub,
    isConst
  );
  return assignedVal;
}

export function evalFnDeclStmt(
  stmt: FnDeclStmt,
  env: Environment,
  returned: boolean
): RuntimeVal {
  const name = stmt.name;
  const isPub = stmt.isPub;
  const params = stmt.params.map((param: Parameter) => {
    return { name: param.name, type: param.type.name } as Param;
  });
  const returnType = stmt.returnType;
  const body: BlockStmt = stmt.body;

  const fn = {
    type: "function",
    name,
    params,
    body,
    decEnv: env,
    returnType: { type: returnType.name },
  } as FnVal;
  env.declareVar(name, fn, stmt, null, isPub, false);
  return fn;
}

export function evalReturnStmt(stmt: ReturnStmt, env: Environment): RuntimeVal {
  const output = evaluate(stmt.returnExpression, env, true);
  return output;
}

export function evalStructDeclStmt(
  stmt: StructDeclStmt,
  env: Environment,
  returned: boolean
): RuntimeVal {
  const properties = new Map<string, StructProp>();
  for (const [key, value] of stmt.properties.entries()) {
    properties.set(key, {
      name: key,
      type: value.type.name,
      isStatic: value.isStatic,
    } as StructProp);
  }
  const methods = new Map<string, FnVal>();
  //TODO: Implement methods in both parser and interpreter.
  const struct = {
    type: "struct",
    properties,
    methods,
    isStatic: false,
    returned,
  } as StructDefVal;
  env.declareVar(stmt.structName, struct, stmt, null, stmt.isPub, false);
  return struct;
}

export function evalIfStmt(
  stmt: IfStmt,
  env: Environment,
  returned: boolean
): RuntimeVal {
  const condition = evaluate(stmt.condition, env);
  if (condition.type != "boolean") {
    new Err(
      stmt.condition,
      `Condition must be a logical expression, therfore outputting a boolean, instead got ${condition.type}.`,
      ErrorCode.InvalidCondition,
      'eval/statements.ts : evalIfStmt() : if (condition.type != "boolean") : new Err'
    );
  } else {
    if ((condition as BooleanVal).value) {
      return evaluate(stmt.body, env, returned);
    } else {
      return stmt.alternate
        ? evaluate(stmt.alternate, env, returned)
        : MKNull();
    }
  }
  return MKNull();
}
