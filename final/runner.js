const fs = require('fs');
const { lexer }   = require('./lexer');
const { parser }  = require('./parser');
const { codegen } = require('./codegen');

function runner(input) {
  const tokens = lexer(input);        
  const ast    = parser([...tokens]);  
  const jsCode = codegen(ast);         

  eval(jsCode);                        
}

const code = fs.readFileSync('main.hr', 'utf-8');
runner(code);