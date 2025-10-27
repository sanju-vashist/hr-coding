function lexer(input) {
  let cursor = 0;
  const tokens = [];

  const keywords = [
    'ye', 'bol', 'jab', 'nahi_toh', 'jab_tak', 
    'kaam', 'wapas_de', 'sahi', 'galat', 'aur', 'ya', 'nahi'
  ];

  while (cursor < input.length) {
    let char = input[cursor];

    // Skip whitespace
    if (/\s/.test(char)) {
      cursor++;
      continue;
    }

    // Comments (// style)
    if (char === '/' && input[cursor + 1] === '/') {
      while (cursor < input.length && input[cursor] !== '\n') {
        cursor++;
      }
      continue;
    }

    // String literals
    if (char === '"' || char === "'") {
      const quote = char;
      let str = '';
      cursor++; // skip opening quote
      while (cursor < input.length && input[cursor] !== quote) {
        str += input[cursor];
        cursor++;
      }
      cursor++; // skip closing quote
      tokens.push({ type: 'STRING', value: str });
      continue;
    }

    // Identifiers or Keywords
    if (/[a-zA-Z_]/.test(char)) {
      let word = '';
      while (/[a-zA-Z0-9_]/.test(input[cursor]) && cursor < input.length) {
        word += input[cursor];
        cursor++;
      }
      if (keywords.includes(word)) {
        tokens.push({ type: 'KEYWORD', value: word });
      } else {
        tokens.push({ type: 'IDENTIFIER', value: word });
      }
      continue;
    }

    // Numbers (including decimals)
    if (/[0-9]/.test(char)) {
      let num = '';
      while (/[0-9.]/.test(input[cursor]) && cursor < input.length) {
        num += input[cursor];
        cursor++;
      }
      tokens.push({ type: 'NUMBER', value: parseFloat(num) });
      continue;
    }

    // Comparison operators
    if (char === '=' && input[cursor + 1] === '=') {
      tokens.push({ type: 'COMPARISON', value: '==' });
      cursor += 2;
      continue;
    }

    if (char === '!' && input[cursor + 1] === '=') {
      tokens.push({ type: 'COMPARISON', value: '!=' });
      cursor += 2;
      continue;
    }

    if (char === '>' || char === '<') {
      let op = char;
      cursor++;
      if (input[cursor] === '=') {
        op += '=';
        cursor++;
      }
      tokens.push({ type: 'COMPARISON', value: op });
      continue;
    }

    // Operators
    if (/[+\-*\/=%]/.test(char)) {
      tokens.push({ type: 'OPERATOR', value: char });
      cursor++;
      continue;
    }

    // Brackets and parentheses
    if (/[\(\)\{\}\[\],]/.test(char)) {
      tokens.push({ type: 'PUNCTUATION', value: char });
      cursor++;
      continue;
    }

    throw new Error(`Unknown character: ${char}`);
  }
  return tokens;
}

// Enhanced Parser
function parser(tokens) {
  const ast = { type: 'Program', body: [] };
  let pos = 0;

  function peek() {
    return tokens[pos];
  }

  function consume() {
    return tokens[pos++];
  }

  function parseExpression() {
    let left = parsePrimary();

    while (pos < tokens.length && 
           (peek()?.type === 'OPERATOR' || peek()?.type === 'COMPARISON')) {
      const op = consume();
      const right = parsePrimary();
      left = {
        type: 'BinaryExpression',
        operator: op.value,
        left: left,
        right: right
      };
    }

    return left;
  }

  function parsePrimary() {
    const token = consume();

    if (token.type === 'NUMBER') {
      return { type: 'Literal', value: token.value };
    }

    if (token.type === 'STRING') {
      return { type: 'Literal', value: `"${token.value}"` };
    }

    if (token.type === 'IDENTIFIER') {
      return { type: 'Identifier', name: token.value };
    }

    if (token.type === 'KEYWORD' && (token.value === 'sahi' || token.value === 'galat')) {
      return { type: 'Literal', value: token.value === 'sahi' };
    }

    if (token.type === 'PUNCTUATION' && token.value === '(') {
      const expr = parseExpression();
      consume(); // consume ')'
      return expr;
    }

    throw new Error(`Unexpected token: ${JSON.stringify(token)}`);
  }

  while (pos < tokens.length) {
    const token = peek();

    // Variable declaration: ye naam = value
    if (token.type === 'KEYWORD' && token.value === 'ye') {
      consume(); // consume 'ye'
      const name = consume().value;
      
      let value = null;
      if (peek()?.type === 'OPERATOR' && peek().value === '=') {
        consume(); // consume '='
        value = parseExpression();
      }

      ast.body.push({
        type: 'Declaration',
        name: name,
        value: value
      });
      continue;
    }

    // Print statement: bol value
    if (token.type === 'KEYWORD' && token.value === 'bol') {
      consume(); // consume 'bol'
      const value = parseExpression();
      ast.body.push({
        type: 'PrintStatement',
        value: value
      });
      continue;
    }

    // If statement: jab (condition) { ... }
    if (token.type === 'KEYWORD' && token.value === 'jab') {
      consume(); // consume 'jab'
      consume(); // consume '('
      const condition = parseExpression();
      consume(); // consume ')'
      consume(); // consume '{'

      const body = [];
      while (peek()?.type !== 'PUNCTUATION' || peek()?.value !== '}') {
        // Recursively parse statements in the body
        const savedPos = pos;
        const subTokens = [];
        let braceCount = 0;
        
        while (pos < tokens.length) {
          if (peek()?.type === 'PUNCTUATION' && peek()?.value === '{') braceCount++;
          if (peek()?.type === 'PUNCTUATION' && peek()?.value === '}') {
            if (braceCount === 0) break;
            braceCount--;
          }
          subTokens.push(consume());
        }

        if (subTokens.length > 0) {
          const subAst = parser(subTokens);
          body.push(...subAst.body);
        }
      }
      consume(); // consume '}'

      let alternate = null;
      if (peek()?.type === 'KEYWORD' && peek()?.value === 'nahi_toh') {
        consume(); // consume 'nahi_toh'
        consume(); // consume '{'
        
        alternate = [];
        while (peek()?.type !== 'PUNCTUATION' || peek()?.value !== '}') {
          const subTokens = [];
          let braceCount = 0;
          
          while (pos < tokens.length) {
            if (peek()?.type === 'PUNCTUATION' && peek()?.value === '{') braceCount++;
            if (peek()?.type === 'PUNCTUATION' && peek()?.value === '}') {
              if (braceCount === 0) break;
              braceCount--;
            }
            subTokens.push(consume());
          }

          if (subTokens.length > 0) {
            const subAst = parser(subTokens);
            alternate.push(...subAst.body);
          }
        }
        consume(); // consume '}'
      }

      ast.body.push({
        type: 'IfStatement',
        condition: condition,
        consequent: body,
        alternate: alternate
      });
      continue;
    }

    // While loop: jab_tak (condition) { ... }
    if (token.type === 'KEYWORD' && token.value === 'jab_tak') {
      consume(); // consume 'jab_tak'
      consume(); // consume '('
      const condition = parseExpression();
      consume(); // consume ')'
      consume(); // consume '{'

      const body = [];
      while (peek()?.type !== 'PUNCTUATION' || peek()?.value !== '}') {
        const subTokens = [];
        let braceCount = 0;
        
        while (pos < tokens.length) {
          if (peek()?.type === 'PUNCTUATION' && peek()?.value === '{') braceCount++;
          if (peek()?.type === 'PUNCTUATION' && peek()?.value === '}') {
            if (braceCount === 0) break;
            braceCount--;
          }
          subTokens.push(consume());
        }

        if (subTokens.length > 0) {
          const subAst = parser(subTokens);
          body.push(...subAst.body);
        }
      }
      consume(); // consume '}'

      ast.body.push({
        type: 'WhileStatement',
        condition: condition,
        body: body
      });
      continue;
    }

    pos++;
  }

  return ast;
}

// Enhanced Code Generator
function codegen(node, indent = 0) {
  const spaces = '  '.repeat(indent);

  switch (node.type) {
    case 'Program':
      return node.body.map(n => codegen(n, indent)).join('\n');

    case 'Declaration':
      if (node.value) {
        return `${spaces}let ${node.name} = ${codegen(node.value)};`;
      }
      return `${spaces}let ${node.name};`;

    case 'PrintStatement':
      return `${spaces}console.log(${codegen(node.value)});`;

    case 'BinaryExpression':
      return `${codegen(node.left)} ${node.operator} ${codegen(node.right)}`;

    case 'Literal':
      return typeof node.value === 'string' ? node.value : String(node.value);

    case 'Identifier':
      return node.name;

    case 'IfStatement':
      let code = `${spaces}if (${codegen(node.condition)}) {\n`;
      code += node.consequent.map(n => codegen(n, indent + 1)).join('\n') + '\n';
      code += `${spaces}}`;
      
      if (node.alternate) {
        code += ` else {\n`;
        code += node.alternate.map(n => codegen(n, indent + 1)).join('\n') + '\n';
        code += `${spaces}}`;
      }
      
      return code;

    case 'WhileStatement':
      let whileCode = `${spaces}while (${codegen(node.condition)}) {\n`;
      whileCode += node.body.map(n => codegen(n, indent + 1)).join('\n') + '\n';
      whileCode += `${spaces}}`;
      return whileCode;

    default:
      throw new Error(`Unknown node type: ${node.type}`);
  }
}

// Runner function
function runner(input) {
  try {
    const tokens = lexer(input);
    const ast = parser([...tokens]);
    const jsCode = codegen(ast);
    
    console.log('=== Generated JavaScript Code ===');
    console.log(jsCode);
    console.log('\n=== Output ===');
    
    eval(jsCode);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// ========================================
// COMPREHENSIVE EXAMPLES
// ========================================

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('   HARYANVI PROGRAMMING LANGUAGE DEMO   ');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Example 1: Hello World
console.log('📝 Example 1: Hello World (Pehla Program)');
console.log('─────────────────────────────────────────');
runner(`
  bol "Khamma Ghani! Haryana se!"
`);

// Example 2: Variables and Math
console.log('\n\n📝 Example 2: Variables aur Mathematics');
console.log('─────────────────────────────────────────');
runner(`
  ye naam = "Vikas"
  ye umar = 25
  ye salary = 50000
  
  bol naam
  bol umar
  bol salary
  
  // Calculation
  ye bonus = salary * 0.1
  bol "Bonus hai:"
  bol bonus
`);

// Example 3: Comparison Operations
console.log('\n\n📝 Example 3: Comparison (Tulaana)');
console.log('─────────────────────────────────────────');
runner(`
  ye marks = 85
  ye passing_marks = 40
  
  bol marks
  bol passing_marks
`);

// Example 4: If-Else (Age Check)
console.log('\n\n📝 Example 4: If-Else - Age Verification');
console.log('─────────────────────────────────────────');
runner(`
  ye umar = 20
  
  jab (umar >= 18) {
    bol "Adult ho, vote de sakta hai!"
  } nahi_toh {
    bol "Abhi bachcha hai, thoda intezaar kar"
  }
`);

// Example 5: Grade Calculator
console.log('\n\n📝 Example 5: Marks ke basis pe Grade');
console.log('─────────────────────────────────────────');
runner(`
  ye marks = 75
  
  jab (marks >= 90) {
    bol "A+ Grade - Shabaash!"
  } nahi_toh {
    jab (marks >= 75) {
      bol "A Grade - Badhiya!"
    } nahi_toh {
      jab (marks >= 60) {
        bol "B Grade - Thik hai"
      } nahi_toh {
        bol "Aur mehnat kar"
      }
    }
  }
`);

// Example 6: Simple Counter Loop
console.log('\n\n📝 Example 6: Simple Counter (1 to 5)');
console.log('─────────────────────────────────────────');
runner(`
  ye count = 1
  
  jab_tak (count <= 5) {
    bol count
    count = count + 1
  }
`);

// Example 7: Multiplication Table
console.log('\n\n📝 Example 7: Pahada (Table of 7)');
console.log('─────────────────────────────────────────');
runner(`
  ye num = 7
  ye i = 1
  
  jab_tak (i <= 10) {
    ye result = num * i
    bol result
    i = i + 1
  }
`);

// Example 8: Even/Odd Checker
console.log('\n\n📝 Example 8: Even ya Odd?');
console.log('─────────────────────────────────────────');
runner(`
  ye number = 42
  ye remainder = number % 2
  
  jab (remainder == 0) {
    bol "Even number hai"
  } nahi_toh {
    bol "Odd number hai"
  }
`);

// Example 9: Temperature Converter
console.log('\n\n📝 Example 9: Temperature Converter (Celsius to Fahrenheit)');
console.log('─────────────────────────────────────────');
runner(`
  ye celsius = 37
  ye fahrenheit = celsius * 9 / 5 + 32
  
  bol "Celsius:"
  bol celsius
  bol "Fahrenheit:"
  bol fahrenheit
`);

// Example 10: Sum of Numbers
console.log('\n\n📝 Example 10: 1 se 10 tak ka sum');
console.log('─────────────────────────────────────────');
runner(`
  ye sum = 0
  ye i = 1
  
  jab_tak (i <= 10) {
    sum = sum + i
    i = i + 1
  }
  
  bol "Total sum hai:"
  bol sum
`);

// Example 11: Factorial Calculator
console.log('\n\n📝 Example 11: Factorial (5!)');
console.log('─────────────────────────────────────────');
runner(`
  ye n = 5
  ye factorial = 1
  ye i = 1
  
  jab_tak (i <= n) {
    factorial = factorial * i
    i = i + 1
  }
  
  bol "Factorial hai:"
  bol factorial
`);

// Example 12: Simple Interest Calculator
console.log('\n\n📝 Example 12: Simple Interest Calculator');
console.log('─────────────────────────────────────────');
runner(`
  ye principal = 10000
  ye rate = 5
  ye time = 2
  
  ye interest = principal * rate * time / 100
  ye total_amount = principal + interest
  
  bol "Principal amount:"
  bol principal
  bol "Interest:"
  bol interest
  bol "Total amount:"
  bol total_amount
`);

console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('         END OF EXAMPLES - धन्यवाद!        ');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

module.exports = { runner, lexer, parser, codegen };