import { tokenize } from './lexer/lexer';
import { parse } from './parser/parser';
import * as util from 'util';
import { src } from './global';

//TODO: ADD IMPROVED ERROR HANDLING (LINE, COLUMN, CODE SNIPP, ETC)

function main() {
  const tokens = tokenize(src);

  const ast = parse(tokens);
  console.log(util.inspect(ast, false, null, true));
  //console.log(util.inspect(tokens, false, null, true));
}

main();
