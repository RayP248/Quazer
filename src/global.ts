import * as fs from 'fs';

export const file = "./examples/02.lang";
export const src = fs.readFileSync(file, 'utf8');
