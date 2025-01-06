import { Expr, Stmt, Type } from "../ast/ast";
import {
  BlockStmt,
  ExpressionStmt,
  FnDeclStmt,
  IfStmt,
  ImportStmt,
  PackageStmt,
  Parameter,
  ReturnStmt,
  StructDeclStmt,
  StructMethod,
  StructProperty,
  VarDeclStmt,
} from "../ast/statements";
import { Err, ErrorCode } from "../error-handling/error";
import { Token, TokenKind } from "../lexer/tokens";
import { parse_expr } from "./expr";
import { BindingPower, stmt_lu } from "./lookups";
import {
  advance,
  currKind,
  currToken,
  expect,
  expectError,
  hasTokens,
  parser,
} from "./parser";
import { parse_type } from "./types";

export function parse_stmt(p: parser): Stmt {
  const stmt_fn = stmt_lu[currKind(p)];

  if (stmt_fn) {
    return stmt_fn(p);
  }

  const expression = parse_expr(p, BindingPower.Default);
  expect(
    p,
    TokenKind.SEMI_COLON,
    "stmt.ts : parse_stmt() : expect TokenKind.SEMI_COLON"
  );

  return {
    kind: "ExpressionStmt",
    expression,
    line: expression.line,
    column: expression.column,
  } as ExpressionStmt;
}

export function parse_package_stmt(p: parser): Stmt {
  const keyword = advance(p);
  const name = expect(
    p,
    TokenKind.IDENTIFIER,
    "stmt.ts : parse_package_stmt() : name : expect TokenKind.IDENTIFIER"
  ).value;
  expect(
    p,
    TokenKind.SEMI_COLON,
    "stmt.ts : parse_package_stmt() : expect TokenKind.SEMI_COLON"
  );
  return {
    kind: "PackageStmt",
    name,
    line: {
      start: keyword.line.start,
      end: currToken(p).line.end,
    },
    column: {
      start: keyword.column.start,
      end: currToken(p).column.end,
    },
  } as PackageStmt;
}

export function parse_import_stmt(p: parser): Stmt {
  const keyword = advance(p);
  const name = expect(
    p,
    TokenKind.IDENTIFIER,
    "stmt.ts : parse_import_stmt() : name : expect TokenKind.IDENTIFIER"
  ).value;
  const froms: string[] = [];
  while (currKind(p) == TokenKind.FROM) {
    if (currKind(p) == TokenKind.FROM) {
      advance(p);
      const from = expect(
        p,
        TokenKind.IDENTIFIER,
        "stmt.ts : parse_import_stmt() : while (currKind(p) == TokenKind.FROM || currKind(p) == TokenKind.IDENTIFIER) : from : expect TokenKind.IDENTIFIER"
      ).value;
      froms.push(from);
    }
  }
  expect(
    p,
    TokenKind.SEMI_COLON,
    "stmt.ts : parse_import_stmt() : expect TokenKind.SEMI_COLON"
  );
  return {
    kind: "ImportStmt",
    import: (froms.length > 0 ? `${froms.reverse().join(":")}:` : "") + name,
    line: {
      start: keyword.line.start,
      end: currToken(p).line.end,
    },
    column: {
      start: keyword.column.start,
      end: currToken(p).column.end,
    },
  } as ImportStmt;
}

export function parse_var_decl_stmt(p: parser): Stmt {
  let keyword = advance(p);
  let pub: Token;
  if (keyword.kind == TokenKind.PUB) {
    pub = keyword;
    keyword = advance(p);
  }
  let explicitType: Type;
  let assignedVal: Expr;
  const isConst = keyword.kind === TokenKind.CONST;
  const varname = expectError(
    p,
    TokenKind.IDENTIFIER,
    "Expected an identifier after " +
      (isConst ? "`const`" : "`let`") +
      " keyword in variable declaration statement.",
    "stmt.ts : parse_var_decl_stmt() : varname"
  ).value;
  if (currKind(p) === TokenKind.COLON) {
    advance(p);
    explicitType = parse_type(p, BindingPower.Default);
  }
  if (currKind(p) != TokenKind.SEMI_COLON) {
    expect(
      p,
      TokenKind.ASSIGNMENT,
      "stmt.ts : parse_var_decl_stmt() : if (currKind(p) != TokenKind.SEMI_COLON) : expect TokenKind.ASSIGNMENT"
    );
    assignedVal = parse_expr(p, BindingPower.Assignment);
  } else if (!explicitType!) {
    new Err(
      currToken(p),
      "Expected either an assigned value or explicit type in variable declaration statement.",
      ErrorCode.AssignedValueOrExplicitTypeExpected,
      "stmt.ts : parse_var_decl_stmt() : if (!explicitType!) : new Err()"
    ).throw();
  }

  const semicolon = expect(
    p,
    TokenKind.SEMI_COLON,
    "stmt.ts : parse_var_decl_stmt() : expect TokenKind.SEMI_COLON"
  );

  if (isConst && !assignedVal!) {
    new Err(
      currToken(p),
      "Expected an assigned value after `const` keyword in variable declaration statement.",
      ErrorCode.AssignedValueExpected,
      "stmt.ts : parse_var_decl_stmt() : if (isConst && !assignedVal!) : new Err()"
    ).throw();
  }
  return {
    kind: "VarDeclStmt",
    explicitType: explicitType!,
    varname,
    isPub: pub! ? true : false,
    isConst,
    assignedVal: assignedVal!,
    line: {
      start: (pub! ? pub : keyword).line.start,
      end: semicolon.line.end,
    } as Record<string, number>,
    column: {
      start: (pub! ? pub : keyword).column.start,
      end: semicolon.column.end,
    } as Record<string, number>,
  } as VarDeclStmt;
}

export function parse_struct_decl_stmt(p: parser): Stmt {
  let struct = advance(p);
  let pub: Token;
  if (struct.kind == TokenKind.PUB) {
    pub = struct;
    struct = advance(p);
  }
  const properties: Map<string, StructProperty> = new Map();
  const methods: Map<string, StructMethod> = new Map();
  const structName = expect(
    p,
    TokenKind.IDENTIFIER,
    "stmt.ts : parse_struct_decl_stmt() : structName : expect TokenKind.IDENTIFIER"
  ).value;

  expect(
    p,
    TokenKind.OPEN_CURLY,
    "stmt.ts : parse_struct_decl_stmt() : expect TokenKind.OPEN_CURLY"
  );

  while (hasTokens(p) && currKind(p) != TokenKind.CLOSE_CURLY) {
    let isStatic: boolean;
    let propertyNameTk: Token;
    let propertyName: string;
    if (currKind(p) == TokenKind.STATIC) {
      isStatic = true;
      expect(
        p,
        TokenKind.STATIC,
        "stmt.ts : parse_struct_decl_stmt() : while (hasTokens(p) && currKind(p) != TokenKind.CLOSE_CURLY) : isStatic : expect TokenKind.STATIC"
      );
    }
    //Property
    if (currKind(p) == TokenKind.IDENTIFIER) {
      propertyNameTk = expect(
        p,
        TokenKind.IDENTIFIER,
        "stmt.ts : parse_struct_decl_stmt() : while (hasTokens(p) && currKind(p) != TokenKind.CLOSE_CURLY) : propertyNameTk : expect TokenKind.IDENTIFIER"
      );
      propertyName = propertyNameTk.value;
      expectError(
        p,
        TokenKind.COLON,
        "Expected a colon (`:`) after property name.",
        "stmt.ts : parse_struct_decl_stmt() : while (hasTokens(p) && currKind(p) != TokenKind.CLOSE_CURLY) : propertyName : expectError TokenKind.COLON"
      );
      const structType = parse_type(p, BindingPower.Default);
      const semicolon = expect(
        p,
        TokenKind.SEMI_COLON,
        "stmt.ts : parse_struct_decl_stmt() : while (hasTokens(p) && currKind(p) != TokenKind.CLOSE_CURLY) : semicolon : expect TokenKind.SEMI_COLON"
      );

      if (properties.has(propertyName)) {
        new Err(
          propertyNameTk,
          `Property \`${propertyName}\` already exists in struct \`${structName}\`.`,
          ErrorCode.DuplicateProperty,
          "stmt.ts : parse_struct_decl_stmt() : while (hasTokens(p) && currKind(p) != TokenKind.CLOSE_CURLY) : if (properties.has(propertyName)) : new Err()"
        ).throw();
      }
      properties.set(propertyName, {
        kind: "StructProperty",
        isStatic: isStatic! ? true : false,
        type: structType,
        line: {
          start: propertyNameTk.line.start,
          end: semicolon.line.end,
        },
        column: {
          start: propertyNameTk.column.start,
          end: semicolon.column.end,
        },
      } as StructProperty);
      continue;
    }

    new Err(
      currToken(p),
      "Cannot currently handle methods inside struct declaration.",
      ErrorCode.NotImplemented,
      "stmt.ts : parse_struct_decl_stmt() : while (hasTokens(p) && currKind(p) != TokenKind.CLOSE_CURLY) : new Err()"
    ).throw();
  }

  const closecurly = expect(
    p,
    TokenKind.CLOSE_CURLY,
    "stmt.ts : parse_struct_decl_stmt() : expect TokenKind.CLOSE_CURLY"
  );
  return {
    kind: "StructDeclStmt",
    properties,
    methods,
    structName,
    isPub: pub! ? true : false,
    line: {
      start: (pub! ? pub : struct).line.start,
      end: closecurly.line.end,
    },
    column: {
      start: (pub! ? pub : struct).column.start,
      end: closecurly.column.end,
    },
  } as StructDeclStmt;
}

export function parse_params_list(p: parser): Parameter[] {
  const params: Parameter[] = [];
  while (hasTokens(p) && currKind(p) != TokenKind.CLOSE_PAREN) {
    const paramNameTk = expect(
      p,
      TokenKind.IDENTIFIER,
      "stmt.ts : parse_params_list() : while (hasTokens(p) && currKind(p) != TokenKind.CLOSE_PAREN) : paramNameTk : expect TokenKind.IDENTIFIER"
    );
    const paramName = paramNameTk.value;
    let paramType: Type;
    if (currKind(p) == TokenKind.COLON) {
      advance(p);
      paramType = parse_type(p, BindingPower.Default);
    }
    if (currKind(p) != TokenKind.CLOSE_PAREN) {
      expect(
        p,
        TokenKind.COMMA,
        "stmt.ts : parse_params_list() : while (hasTokens(p) && currKind(p) != TokenKind.CLOSE_PAREN) : expect TokenKind.COMMA"
      );
    }
    params.push({
      kind: "Parameter",
      name: paramName,
      type: paramType! ? paramType : null,
      line: {
        start: paramNameTk.line.start,
        end: (paramType! ? paramType : paramNameTk).line.end,
      },
      column: {
        start: paramNameTk.column.start,
        end: (paramType! ? paramType : paramNameTk).column.end,
      },
    } as Parameter);
  }
  return params;
}

export function parse_block_stmt(p: parser): BlockStmt {
  const body: Stmt[] = [];
  const opencurly = expect(
    p,
    TokenKind.OPEN_CURLY,
    "stmt.ts : parse_block_stmt() : expect TokenKind.OPEN_CURLY"
  );
  while (hasTokens(p) && currKind(p) != TokenKind.CLOSE_CURLY) {
    body.push(parse_stmt(p));
  }
  const closecurly = expect(
    p,
    TokenKind.CLOSE_CURLY,
    "stmt.ts : parse_block_stmt() : expect TokenKind.CLOSE_CURLY"
  );
  return {
    kind: "BlockStmt",
    body,
    closecurly,
    line: {
      start: opencurly.line.start,
      end: closecurly.line.end,
    },
    column: {
      start: opencurly.column.start,
      end: closecurly.column.end,
    },
  } as BlockStmt;
}

export function parse_fn_params_body(p: parser) {
  let params: Parameter[];
  let returnType: Type;
  expect(
    p,
    TokenKind.OPEN_PAREN,
    "stmt.ts : parse_fn_params_body() : expect TokenKind.OPEN_PAREN"
  );
  params = parse_params_list(p);
  expect(
    p,
    TokenKind.CLOSE_PAREN,
    "stmt.ts : parse_fn_params_body() : expect TokenKind.CLOSE_PAREN"
  );
  if (currKind(p) == TokenKind.ARROW) {
    advance(p);
    returnType = parse_type(p, BindingPower.Default);
  } else {
    returnType = {
      kind: "Type",
      name: "void",
      overlying: "symbol",
      line: currToken(p).line,
      column: currToken(p).column,
    } as Type;
  }
  const body = parse_block_stmt(p);
  const closecurly = body.closecurly;
  const returnStmt = body.body[body.body.length - 1]
    ? body.body[body.body.length - 1].kind == "ReturnStmt"
      ? (body.body[body.body.length - 1] as ReturnStmt)
      : null
    : null;
  return [params, returnType, body, returnStmt, closecurly];
}

export function parse_fn_decl_stmt(p: parser): Stmt {
  let fn = advance(p);
  let pub: Token;
  if (fn.kind == TokenKind.PUB) {
    pub = fn;
    fn = advance(p);
  }
  const name = expect(
    p,
    TokenKind.IDENTIFIER,
    "stmt.ts : parse_fn_decl_stmt() : name : expect TokenKind.IDENTIFIER"
  ).value;
  const [params, returnType, body, returnStmt, closecurly] =
    parse_fn_params_body(p);

  return {
    kind: "FnDeclStmt",
    name,
    params,
    returnType,
    body,
    returnStmt,
    isPub: pub! ? true : false,
    line: {
      start: (pub! ? pub : fn).line.start,
      end: (closecurly as Token).line.end,
    } as Record<string, number>,
    column: {
      start: (pub! ? pub : fn).column.start,
      end: (closecurly as Token).column.end,
    } as Record<string, number>,
  } as FnDeclStmt;
}

export function parse_return_stmt(p: parser): Stmt {
  const keyword = advance(p);
  const expression = parse_expr(p, BindingPower.Default);
  const semicolon = expect(
    p,
    TokenKind.SEMI_COLON,
    "stmt.ts : parse_return_stmt() : semicolon : expect TokenKind.SEMI_COLON"
  );
  return {
    kind: "ReturnStmt",
    returnExpression: expression,
    line: {
      start: keyword.line.start,
      end: semicolon.line.end,
    },
    column: {
      start: keyword.column.start,
      end: semicolon.column.end,
    },
  } as ReturnStmt;
}

export function parse_if_stmt(p: parser): IfStmt {
  const keyword = advance(p);
  const condition = parse_expr(p, BindingPower.Assignment);
  expect(
    p,
    TokenKind.COMMA,
    "stmt.ts : parse_if_stmt() : expect TokenKind.COMMA"
  );
  expect(
    p,
    TokenKind.THEN,
    "stmt.ts : parse_if_stmt() : expect TokenKind.THEN"
  );
  const body = parse_block_stmt(p);
  let alternate: BlockStmt | IfStmt;
  if (currKind(p) == TokenKind.ELSE) {
    advance(p);
    if (currKind(p) == TokenKind.IF) {
      alternate = parse_if_stmt(p);
    } else {
      alternate = parse_block_stmt(p);
    }
  }
  return {
    kind: "IfStmt",
    condition,
    body: (() => {
      const newBody = { ...body };
      delete newBody.closecurly;
      return newBody;
    })(),
    alternate: alternate!,
    line: {
      start: keyword.line.start,
      end: body.closecurly.line.end,
    },
    column: {
      start: keyword.column.start,
      end: body.closecurly.column.end,
    },
  } as IfStmt;
}
