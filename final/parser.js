function parser(tokens) {
  let pos = 0;

  function peek() {
    return tokens[pos];
  }

  function consume() {
    return tokens[pos++];
  }

  function expect(type, value) {
    const t = consume();
    if (!t) throw new Error(`Expected "${value || type}" but input khatam ho gaya`);
    if (value && t.value !== value) throw new Error(`Expected "${value}" but mila "${t.value}"`);
    return t;
  }

  function parseProgram() {
    const body = [];
    while (pos < tokens.length) {
      body.push(parseStatement());
    }
    return { type: 'Program', body };
  }

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

  function parseDeclaration() {
    consume(); 
    const name = consume().value; 

    let value = null;
    if (peek() && peek().value === '=') {
      consume(); // '=' kha jao
      value = parseExpression(); // dayi taraf ka expression
    }

    return { type: 'Declaration', name, value };
  }

  function parsePrint() {
    consume(); // 'bol' kha jao
    const value = parseExpression();
    return { type: 'PrintStatement', value };
  }

  function parseAssignment() {
    const name = consume().value; // variable naam
    consume(); // '=' kha jao
    const value = parseExpression();
    return { type: 'Assignment', name, value };
  }

  function parseIf() {
    consume(); 
    expect('PUNCT', '(');
    const condition = parseExpression(); 
    expect('PUNCT', ')');
    expect('PUNCT', '{');
    const consequent = parseBlock(); 
    expect('PUNCT', '}');

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

    while (peek() && peek().value !== '}') {

      if (peek().value === 'nahi je') {
        consume(); 
        const test = parseExpression(); // value jo match karni hai
        expect('PUNCT', ':');

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

module.exports = { parser };