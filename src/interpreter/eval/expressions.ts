import {
  BinaryExpr,
  PrefixExpr,
  NumberExpr,
  SymbolExpr,
  CallExpr,
  ArrayLiteralExpr,
  StructInstantiationExpr,
  MemberExpr,
  FnExpr,
  AssignmentExpr,
} from "../../ast/expressions";
import { Err, ErrorCode } from "../../error-handling/error";
import { TokenKind } from "../../lexer/tokens";
import { checkType } from "../../type-checker/check-type";
import { Environment } from "../environment";
import { evaluate } from "../interpreter";
import {
  ArrayVal,
  FnVal,
  MKArray,
  MKBoolean,
  MKNull,
  MKNumber,
  MKString,
  NativeFnVal,
  NumberVal,
  Param,
  RuntimeVal,
  StringVal,
  StructDefVal,
  StructVal,
} from "../values";
import util from "util";

export function evalBinaryExpr(
  expr: BinaryExpr,
  env: Environment,
  returned: boolean
): RuntimeVal {
  let rhs: RuntimeVal;
  let lhs: RuntimeVal;
  if (expr.right.kind != "NumberExpr" && expr.right.kind != "SymbolExpr") {
    rhs = evaluate(expr.right, env);
  } else {
    if (expr.right.kind === "NumberExpr") {
      rhs = MKNumber((expr.right as NumberExpr).value, returned);
    } else if (expr.right.kind === "SymbolExpr") {
      rhs = env.lookupVar((expr.right as SymbolExpr).value, expr);
    } else {
      new Err(
        expr,
        "Invalid binary operation. Right-hand side is not a number or symbol.",
        ErrorCode.InvalidBinaryOperation,
        "expressions.ts : evalBinaryExpr() : before : if (expr.right.kind === 'NumberExpr')"
      ).throw();
      rhs = MKNull();
    }
  }

  if (expr.left.kind != "NumberExpr" && expr.left.kind != "SymbolExpr") {
    lhs = evaluate(expr.left, env);
  } else {
    if (expr.left.kind === "NumberExpr") {
      lhs = MKNumber((expr.left as NumberExpr).value, returned);
    } else if (expr.left.kind === "SymbolExpr") {
      lhs = env.lookupVar((expr.left as SymbolExpr).value, expr);
    } else {
      new Err(
        expr,
        "Invalid binary operation. Left-hand side is not a number or symbol.",
        ErrorCode.InvalidBinaryOperation,
        "expressions.ts : evalBinaryExpr()"
      ).throw();
      lhs = MKNull();
    }
  }

  let interpretedVal: RuntimeVal;

  if (
    checkType(
      lhs,
      rhs,
      "number",
      "expressions.ts : evalBinaryExpr() : checkType(lhs, rhs, 'number')"
    )
  ) {
    const left = (lhs as NumberVal).value;
    const right = (rhs as NumberVal).value;
    switch (expr.operator.kind) {
      case TokenKind.PLUS:
        return MKNumber(left + right, returned);
      case TokenKind.DASH:
        return MKNumber(left - right, returned);
      case TokenKind.STAR:
        return MKNumber(left * right, returned);
      case TokenKind.SLASH:
        return MKNumber(left / right, returned);
      case TokenKind.PERCENT:
        return MKNumber(left % right, returned);
      case TokenKind.GREATER:
        return MKBoolean(left > right, returned);
      case TokenKind.GREATER_EQUALS:
        return MKBoolean(left >= right, returned);
      case TokenKind.LESS:
        return MKBoolean(left < right, returned);
      case TokenKind.LESS_EQUALS:
        return MKBoolean(left <= right, returned);
      case TokenKind.EQUALS:
        return MKBoolean(left == right, returned);
      case TokenKind.NOT_EQUALS:
        return MKBoolean(left != right, returned);
      default:
        new Err(
          expr,
          "Invalid binary operator (not implemented or invalid).",
          ErrorCode.InvalidBinaryOperation,
          "expressions.ts : evalBinaryExpr() : after : switch (expr.operator.kind)"
        ).throw();
    }
    return interpretedVal!;
  }

  new Err(
    expr,
    "Cannot execute binary operation on non-number values.",
    ErrorCode.InvalidBinaryOperation,
    "expressions.ts : evalBinaryExpr() : after : switch (expr.operator.kind)"
  ).throw();
  return MKNull();
}

export function evalPrefixExpr(
  expr: PrefixExpr,
  env: Environment,
  returned: boolean
): RuntimeVal {
  const operator = expr.operator;
  const right = evaluate(expr.rightExpr, env);

  switch (operator.kind) {
    case TokenKind.DASH:
      if (!isNaN(Number((right as NumberVal).value))) {
        const newVal = -1 * Number((right as NumberVal).value);
        return MKNumber(newVal, returned);
      }
  }

  new Err(
    expr,
    "Method not fully implemented. Only supports negation of numbers.",
    ErrorCode.NotImplemented,
    "expressions.ts : evalPrefixExpr() : after : switch (operator.kind)"
  ).throw();
  return MKNull();
}

export function evalCallExpr(
  expr: CallExpr,
  env: Environment,
  returned: boolean
): RuntimeVal {
  const method = evaluate(expr.method, env);
  const args = expr.args.map((arg) => {
    return evaluate(arg, env);
  });
  if (method.type === "function") {
    const fn = method as FnVal;
    const scope = new Environment(env);

    fn.params.forEach((param, index) => {
      const condition = checkType(
        param,
        args[index],
        param.type,
        "expressions.ts : evalCallExpr() : if (method.type === 'function') : fn.params.forEach() : checkType(param, args[index], param.type)"
      );
      if (condition) {
        scope.declareVar(
          param.name,
          args[index],
          expr,
          param.type,
          false,
          false
        );
      } else {
        new Err(
          expr.args[index],
          `Cannot pass value of type '${args[index].type}' to parameter of type '${param.type}'`,
          ErrorCode.TypeMismatch,
          "expressions.ts : evalCallExpr()"
        ).throw();
      }
    });

    const result = evaluate(fn.body, scope);
    if (
      checkType(
        result,
        fn.returnType,
        fn.returnType.type,
        "expressions.ts : evalCallExpr() : if (method.type === 'function') : checkType(result, MKNull(), fn.returnType)"
      )
    ) {
      return result;
    } else {
      new Err(
        expr,
        `Function '${fn.name}' does not return a value of type '${fn.returnType.type}'. It returns a value of type '${result.type}'.`,
        ErrorCode.TypeMismatch,
        "expressions.ts : evalCallExpr() : if (method.type === 'function') : else : new Err"
      ).throw();
    }
  } else if (method?.type === "native-fn") {
    return (method as NativeFnVal).call(...args);
  } else {
    new Err(
      expr,
      "Cannot call a non-function value.",
      ErrorCode.InvalidCall,
      "expressions.ts : evalCallExpr()"
    ).throw();
  }
  return MKNull();
}

export function evalArrayLiteralExpr(
  expr: ArrayLiteralExpr,
  env: Environment,
  returned: boolean
): RuntimeVal {
  const elements = expr.elements.map((element) => evaluate(element, env));
  return { type: "array", elements, returned } as ArrayVal;
}

export function evalStructInstantiationExpr(
  expr: StructInstantiationExpr,
  env: Environment,
  returned: boolean
): RuntimeVal {
  const properties = new Map<string, RuntimeVal>();
  for (const [key, value] of expr.properties.entries()) {
    properties.set(key, evaluate(value, env));
  }

  const structInstance = env.lookupVar(expr.structName, expr) as StructDefVal;
  for (const [key, value] of structInstance.properties.entries()) {
    if (!properties.has(key)) {
      new Err(
        expr,
        `Property '${key}' is missing in struct instantiation.`,
        ErrorCode.MissingProp,
        "expressions.ts : evalStructInstantiationExpr() : for (const [key, value] of structInstance.properties.entries()) : if (!properties.has(key))"
      ).throw();
    }
    if (
      checkType(
        properties.get(key)!,
        value,
        value.type,
        "expressions.ts : evalStructInstantiationExpr() : for (const [key, value] of structInstance.properties.entries()) : if (!properties.has(key))"
      )
    ) {
      continue;
    } else {
      new Err(
        expr,
        `Property '${key}' has type '${
          properties.get(key)!.type
        }' but should have type '${value.type}'.`,
        ErrorCode.TypeMismatch,
        "expressions.ts : evalStructInstantiationExpr() : for (const [key, value] of structInstance.properties.entries()) : if (!properties.has(key))"
      ).throw();
      return MKNull();
    }
  }

  const struct = {
    type: "struct",
    structName: expr.structName,
    properties,
    returned,
  } as StructVal;
  return struct;
}

export function evalMemberExpr(
  expr: MemberExpr,
  env: Environment,
  returned: boolean
): RuntimeVal {
  const member = evaluate(expr.member, env);
  const prop = expr.property;
  const proplook = member["properties"]
    ? member["properties"]
    : member["methods"];
  if (proplook.has(prop)) {
    return proplook.get(prop);
  }
  new Err(
    expr,
    `Property '${prop}' not found in struct.`,
    ErrorCode.MissingProp,
    "expressions.ts : evalMemberExpr()"
  ).throw();
  return MKNull();
}

export function evalFnExpr(
  expr: FnExpr,
  env: Environment,
  returned: boolean
): RuntimeVal {
  const params = expr.params.map((param) => {
    return {
      name: param.name,
      type: param.type ? param.type.name : null,
    } as Param;
  });
  const returnType = expr.returnType;
  const body = expr.body;

  const fn = {
    type: "function",
    params,
    body,
    decEnv: env,
    returnType: { type: returnType.name },
  } as FnVal;
  return fn;
}

export function evalAssignmentExpr(
  expr: AssignmentExpr,
  env: Environment,
  returned: boolean
): RuntimeVal {
  let value = evaluate(expr.val, env);
  switch (expr.operator.kind) {
    case TokenKind.ASSIGNMENT:
      env.assignVar((expr.assigne as SymbolExpr).value, value, expr);
      break;
    case TokenKind.PLUS_EQUALS:
      const currVal = env.lookupVar((expr.assigne as SymbolExpr).value, expr);
      if (
        checkType(
          currVal,
          value,
          "number",
          "expressions.ts : evalAssignmentExpr() : switch expr.operator.kind : case TokenKind.PLUS_EQUALS"
        )
      ) {
        const newVal =
          (currVal as NumberVal).value + (value as NumberVal).value;
        env.assignVar(
          (expr.assigne as SymbolExpr).value,
          MKNumber(newVal, returned),
          expr
        );
        value = MKNumber(newVal, returned);
      } else if (
        checkType(
          currVal,
          value,
          "string",
          "expressions.ts : evalAssignmentExpr() : switch expr.operator.kind : case TokenKind.PLUS_EQUALS : else if of : if (currVal.type == 'number' && value.type == 'number')"
        )
      ) {
        const newVal =
          (currVal as StringVal).value.toString() +
          (value as StringVal).value.toString();
        env.assignVar(
          (expr.assigne as SymbolExpr).value,
          MKString(newVal, returned),
          expr
        );
        value = MKString(newVal, returned);
      } else {
        new Err(
          expr,
          "Cannot add non-number or non-string values.",
          ErrorCode.TypeMismatch,
          "expressions.ts : evalAssignmentExpr() : case TokenKind.PLUS_EQUALS"
        ).throw();
      }
      break;
  }
  return value;
}
