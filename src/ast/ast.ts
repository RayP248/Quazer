import { ValueType } from "../interpreter/values";

export interface Stmt {
  line: Record<string, number>;
  column: Record<string, number>;
  expression?: any;
  kind: any;
  stmt?(): () => {};
}

export interface Expr extends Stmt {
  expr?(): () => {};
}

export interface Type extends Stmt {
  _type?(): () => {};
  name: ValueType;
  overlying: "array" | "symbol";
}
