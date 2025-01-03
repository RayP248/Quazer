export interface Stmt {
  line: Record<string, number>;
  column: Record<string, number>;
  stmt?(): () => {};
}

export interface Expr extends Stmt {
  expr?(): () => {};
}

export interface Type extends Stmt {
  _type?(): () => {};
}
