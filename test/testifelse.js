function lexer(input) {
  let cursor = 0;
  const tokens = [];

  while (cursor < input.length) {
    let char = input[cursor];

    // whitespace skip karo — koi kaam nahi iska
    if (/\s/.test(char)) {
      cursor++;
      continue;
    }

    // string hai kya? "..." ke beech jo bhi hai
    if (char === '"') {
      let str = '';
      cursor++; // opening " skip karo
      while (cursor < input.length && input[cursor] !== '"') {
        str += input[cursor];
        cursor++;
      }
      cursor++; // closing " skip karo
      tokens.push({ type: 'STRING', value: str });
      continue;
    }

    const remaining = input.slice(cursor);

    if (remaining.startsWith('ya to')) {
      tokens.push({ type: 'KEYWORD', value: 'ya to' });
      cursor += 5;
      continue;
    }
    if (remaining.startsWith('nahi to')) {
      tokens.push({ type: 'KEYWORD', value: 'nahi to' });
      cursor += 7;
      continue;
    }
    if (remaining.startsWith('nahi fer')) {
      tokens.push({ type: 'KEYWORD', value: 'nahi fer' });
      cursor += 8;
      continue;
    }
    if (remaining.startsWith('nahi je')) {
      tokens.push({ type: 'KEYWORD', value: 'nahi je' });
      cursor += 7;
      continue;
    }

    // normal word hai — identifier ya keyword
    if (/[a-zA-Z]/.test(char)) {
      let word = '';
      while (/[a-zA-Z]/.test(input[cursor]) && cursor < input.length) {
        word += input[cursor];
        cursor++;
      }
      // yeh words special hain, baaki sab variable names hain
      if (['ye', 'bol', 'je', 'mukhna', 'bus'].includes(word)) {
        tokens.push({ type: 'KEYWORD', value: word });
      } else {
        tokens.push({ type: 'IDENTIFIER', value: word });
      }
      continue;
    }

    // number hai — decimal bhi handle karo jaise 0.30
    if (/[0-9]/.test(char)) {
      let num = '';
      while (cursor < input.length && /[0-9.]/.test(input[cursor])) {
        num += input[cursor];
        cursor++;
      }
      tokens.push({ type: 'NUMBER', value: parseFloat(num) });
      continue;
    }

    // do-character wale operators: ==, !=, <=, >=
    const twoChar = input.slice(cursor, cursor + 2);
    if (['==', '!=', '<=', '>='].includes(twoChar)) {
      tokens.push({ type: 'OPERATOR', value: twoChar });
      cursor += 2;
      continue;
    }

    // ek-character wale operators aur signs
    if (/[+\-*\/=<>.]/.test(char)) {
      tokens.push({ type: 'OPERATOR', value: char });
      cursor++;
      continue;
    }

    // brackets aur colon
    if ('(){}:'.includes(char)) {
      tokens.push({ type: 'PUNCT', value: char });
      cursor++;
      continue;
    }

    throw new Error(`Yeh character nahi samjha: ${char}`);
  }

  return tokens;
}


function parser(tokens) {
  // pos batata hai abhi kaunsa token dekh rahe hain
  let pos = 0;

  // agle token ko bina aage badhhe dekho
  function peek() {
    return tokens[pos];
  }

  // agle token lo aur aage badho
  function consume() {
    return tokens[pos++];
  }

  // ek specific token expect karo, nahi mila toh error
  function expect(type, value) {
    const t = consume();
    if (!t) throw new Error(`Expected "${value || type}" but input khatam ho gaya`);
    if (value && t.value !== value) throw new Error(`Expected "${value}" but mila "${t.value}"`);
    return t;
  }

  // pura program — statements ki list
  function parseProgram() {
    const body = [];
    while (pos < tokens.length) {
      body.push(parseStatement());
    }
    return { type: 'Program', body };
  }

  // ek statement kya ho sakta hai — decide karo aur parse karo
  function parseStatement() {
    const t = peek();

    if (t.type === 'KEYWORD' && t.value === 'ye')      return parseDeclaration();
    if (t.type === 'KEYWORD' && t.value === 'bol')     return parsePrint();
    if (t.type === 'KEYWORD' && t.value === 'ya to')   return parseIf();
    if (t.type === 'KEYWORD' && t.value === 'je')      return parseSwitch();

    // variable ka naam aaya — assignment hoga
    if (t.type === 'IDENTIFIER') return parseAssignment();

    throw new Error(`Yeh nahi samjha: "${t.value}"`);
  }

  // "ye kamai = 5000" — variable banana
  function parseDeclaration() {
    consume(); // 'ye' kha jao
    const name = consume().value; // variable ka naam lo

    let value = null;
    if (peek() && peek().value === '=') {
      consume(); // '=' kha jao
      value = parseExpression(); // dayi taraf ka expression
    }

    return { type: 'Declaration', name, value };
  }

  // "bol kamai" — kuch print karna hai
  function parsePrint() {
    consume(); // 'bol' kha jao
    const value = parseExpression();
    return { type: 'PrintStatement', value };
  }

  // "kamai = 9000" — pehle se bani variable mein value daalna
  function parseAssignment() {
    const name = consume().value; // variable naam
    consume(); // '=' kha jao
    const value = parseExpression();
    return { type: 'Assignment', name, value };
  }

  // "ya to (...) { } nahi to (...) { } nahi fer { }"
  function parseIf() {
    consume(); // 'ya to' kha jao
    expect('PUNCT', '(');
    const condition = parseExpression(); // condition padhho
    expect('PUNCT', ')');
    expect('PUNCT', '{');
    const consequent = parseBlock(); // andar ke statements
    expect('PUNCT', '}');

    // kitne bhi "nahi to" ho sakte hain
    const alternates = [];
    while (peek() && peek().value === 'nahi to') {
      consume(); // 'nahi to' kha jao
      expect('PUNCT', '(');
      const altCond = parseExpression();
      expect('PUNCT', ')');
      expect('PUNCT', '{');
      const altBody = parseBlock();
      expect('PUNCT', '}');
      alternates.push({ condition: altCond, body: altBody });
    }

    // "nahi fer" ek hi baar aata hai, aur zaroori nahi
    let elseBody = null;
    if (peek() && peek().value === 'nahi fer') {
      consume(); // 'nahi fer' kha jao
      expect('PUNCT', '{');
      elseBody = parseBlock();
      expect('PUNCT', '}');
    }

    return { type: 'IfStatement', condition, consequent, alternates, elseBody };
  }

  // "je (din) { nahi je 1: ... bus   mukhna: ... }"
  function parseSwitch() {
    consume(); // 'je' kha jao
    expect('PUNCT', '(');
    const discriminant = parseExpression(); // jis variable ko check karna hai
    expect('PUNCT', ')');
    expect('PUNCT', '{');

    const cases = [];
    let defaultBody = null;

    // andar 'nahi je' aur 'mukhna' padhte raho jab tak '}' na mile
    while (peek() && peek().value !== '}') {

      // ek case — "nahi je 1: ... bus"
      if (peek().value === 'nahi je') {
        consume(); // 'nahi je' kha jao
        const test = parseExpression(); // value jo match karni hai
        expect('PUNCT', ':');

        // statements padhho jab tak agla case ya closing bracket na aaye
        const body = [];
        while (
          peek() &&
          peek().value !== 'nahi je' &&
          peek().value !== 'mukhna' &&
          peek().value !== 'bus' &&
          peek().value !== '}'
        ) {
          body.push(parseStatement());
        }

        // 'bus' (break) optional hai
        let hasBreak = false;
        if (peek() && peek().value === 'bus') {
          consume();
          hasBreak = true;
        }

        cases.push({ test, body, hasBreak });

      // default case — "mukhna: ..."
      } else if (peek().value === 'mukhna') {
        consume(); // 'mukhna' kha jao
        expect('PUNCT', ':');

        const body = [];
        while (peek() && peek().value !== '}') {
          if (peek().value === 'bus') { consume(); break; }
          body.push(parseStatement());
        }
        defaultBody = body;

      } else {
        break;
      }
    }

    expect('PUNCT', '}');
    return { type: 'SwitchStatement', discriminant, cases, defaultBody };
  }

  // ek block mein statements padhho jab tak '}' na aaye
  function parseBlock() {
    const body = [];
    while (peek() && peek().value !== '}') {
      body.push(parseStatement());
    }
    return body;
  }


  function parseExpression() {
    return parseComparison();
  }

  // ==, !=, <, >, <=, >=
  function parseComparison() {
    let left = parseAddSub();
    while (peek() && peek().type === 'OPERATOR' && ['==', '!=', '<', '>', '<=', '>='].includes(peek().value)) {
      const op = consume().value;
      const right = parseAddSub();
      left = { type: 'BinaryExpr', op, left, right };
    }
    return left;
  }

  // + aur -
  function parseAddSub() {
    let left = parseMulDiv();
    while (peek() && peek().type === 'OPERATOR' && ['+', '-'].includes(peek().value)) {
      const op = consume().value;
      const right = parseMulDiv();
      left = { type: 'BinaryExpr', op, left, right };
    }
    return left;
  }

  // * aur /
  function parseMulDiv() {
    let left = parsePrimary();
    while (peek() && peek().type === 'OPERATOR' && ['*', '/'].includes(peek().value)) {
      const op = consume().value;
      const right = parsePrimary();
      left = { type: 'BinaryExpr', op, left, right };
    }
    return left;
  }

  // sabse chhoti cheez — number, string, variable naam, ya (expr)
  function parsePrimary() {
    const t = peek();

    // bracket wala expression — pehle woh solve karo
    if (t.type === 'PUNCT' && t.value === '(') {
      consume();
      const expr = parseExpression();
      expect('PUNCT', ')');
      return expr;
    }

    if (t.type === 'NUMBER')     { consume(); return { type: 'Literal',    value: t.value }; }
    if (t.type === 'STRING')     { consume(); return { type: 'Literal',    value: t.value }; }
    if (t.type === 'IDENTIFIER') { consume(); return { type: 'Identifier', name:  t.value }; }

    throw new Error(`Expression mein yeh nahi samjha: "${t.value}"`);
  }

  return parseProgram();
}


function codegen(node) {
  switch (node.type) {

    // pura program — har statement ka code jodo
    case 'Program':
      return node.body.map(codegen).join('\n');

    // "ye kamai = 5000" → "let kamai = 5000;"
    case 'Declaration':
      return `let ${node.name} = ${node.value ? codegenExpr(node.value) : 'undefined'};`;

    // "kamai = 9000" → "kamai = 9000;"
    case 'Assignment':
      return `${node.name} = ${codegenExpr(node.value)};`;

    // "bol kamai" → "console.log(kamai);"
    case 'PrintStatement':
      return `console.log(${codegenExpr(node.value)});`;

    // "ya to ... nahi to ... nahi fer" → "if ... else if ... else"
    case 'IfStatement': {
      let code = `if (${codegenExpr(node.condition)}) {\n${node.consequent.map(codegen).join('\n')}\n}`;

      for (const alt of node.alternates) {
        code += ` else if (${codegenExpr(alt.condition)}) {\n${alt.body.map(codegen).join('\n')}\n}`;
      }

      if (node.elseBody) {
        code += ` else {\n${node.elseBody.map(codegen).join('\n')}\n}`;
      }

      return code;
    }

    case 'SwitchStatement': {
      let code = `switch (${codegenExpr(node.discriminant)}) {\n`;

      for (const c of node.cases) {
        code += `  case ${codegenExpr(c.test)}:\n`;
        code += c.body.map(s => '    ' + codegen(s)).join('\n') + '\n';
        if (c.hasBreak) code += '    break;\n';
      }

      if (node.defaultBody) {
        code += `  default:\n`;
        code += node.defaultBody.map(s => '    ' + codegen(s)).join('\n') + '\n';
      }

      return code + '}';
    }

    default:
      throw new Error(`Yeh node type nahi pehchana: ${node.type}`);
  }
}

function codegenExpr(node) {
  switch (node.type) {

    // number ya string — seedha likhdo
    case 'Literal':
      if (typeof node.value === 'string') return JSON.stringify(node.value);
      return String(node.value);

    // variable naam — seedha likhdo
    case 'Identifier':
      return node.name;

    // do cheezein ke beech operation — jaise kamai * 0.30
    case 'BinaryExpr':
      return `(${codegenExpr(node.left)} ${node.op} ${codegenExpr(node.right)})`;

    default:
      throw new Error(`Yeh expression type nahi samjha: ${node.type}`);
  }
}


function runner(input) {
  const tokens = lexer(input);         // Step 1: words todna
  const ast    = parser([...tokens]);  // Step 2: tree banana
  const jsCode = codegen(ast);         // Step 3: JS likhna



  eval(jsCode);                      
}

module.exports = { runner };


const taxCalc = `
ye kamai = 120000

ya to (kamai > 100000) {
  ye tax = kamai * 0.30
  bol "30% tax lagega bhai"
  bol tax
} nahi to (kamai > 50000) {
  ye tax = kamai * 0.20
  bol "20% tax"
  bol tax
} nahi to (kamai > 20000) {
  ye tax = kamai * 0.10
  bol "10% tax"
  bol tax
} nahi fer {
  bol "Koi tax nahi tera"
}
`;



console.log('=== Tax Calculator ===');
runner(taxCalc);

