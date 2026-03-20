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

module.exports = { lexer };