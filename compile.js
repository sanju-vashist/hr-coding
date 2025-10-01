function lexer(input) {
    let cursor = 0;
    const tokens = [];

    while (cursor < input.length) {
        let char = input[cursor];

        // Skip white spaces
        if (/\s/.test(char)) {
            cursor++;
            continue;
        }

        // Tokenize identifiers or keywords
        if (/[a-zA-Z]/.test(char)) {
            let word = '';
            while (/[a-zA-Z]/.test(input[cursor]) && cursor < input.length) {
                word += input[cursor];
                cursor++;
            }
            if (word === 'ye' || word === 'bol') {
                tokens.push({ type: 'KEYWORD', value: word });
            } else {
                tokens.push({ type: 'IDENTIFIER', value: word });
            }
            continue;
        }

        // Tokenize numbers
        if (/[0-9]/.test(char)) {
            let num = '';
            while (/[0-9]/.test(input[cursor]) && cursor < input.length) {
                num += input[cursor];
                cursor++;
            }
            tokens.push({ type: 'NUMBER', value: parseInt(num) });
            continue;
        }

        // Tokenize operators
        if (/[+\-*\/=]/.test(char)) {
            tokens.push({ type: 'OPERATOR', value: char });
            cursor++;
            continue;
        }

        throw new Error(`Unknown character: ${char}`);
    }
    return tokens;
}

function parser(tokens) {
    const ast = { type: 'Program', body: [] };

    while (tokens.length > 0) {
        const token = tokens.shift();

        if (token.type === 'KEYWORD' && token.value === 'ye') {
            let declaration = {
                type: 'Declaration',
                name: tokens.shift().value,
                value: null
            };

            if (tokens[0] && tokens[0].type === 'OPERATOR' && tokens[0].value === '=') {
                tokens.shift(); // consume '='

                let expression = '';
                while (tokens.length > 0 && tokens[0].type !== 'KEYWORD') {
                    expression += tokens.shift().value + " ";
                }
                declaration.value = expression.trim();
            }
            ast.body.push(declaration);
        } else if (token.type === 'KEYWORD' && token.value === 'bol') {
            // Print statement
            const value = tokens.shift().value;
            ast.body.push({
                type: 'PrintStatement',
                value: value
            });
        }
    }
    return ast;
}

function codegen(node) {
    switch (node.type) {
        case 'Program':
            return node.body.map(codegen).join('\n');

        case 'Declaration':
            return `let ${node.name} = ${node.value};`;

        case 'PrintStatement':
            return `console.log(${node.value});`;
            
        default:
            throw new Error(`Unknown node type: ${node.type}`);
    }
}



// run code 
function runner (input) {
    eval()
}



// 
const code = 'ye a = 10 bol a';
const tokens = lexer(code);
console.log("Tokens:", tokens);

const ast = parser([...tokens]);
console.log("AST:", JSON.stringify(ast, null, 2));

const jsCode = codegen(ast);
console.log("\nGenerated JavaScript Code:\n", jsCode);
