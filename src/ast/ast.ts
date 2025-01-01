export interface Stmt {
  endLine: number;
  startLine: number;
  endColumn: number;
  startColumn: number;
  line?: number;
  column?: number;
  stmt(): () => {};
}

export interface Expr extends Stmt {
  expr(): () => {};
}
