function codegen(node) {
  switch (node.type) {

    // pura program — har statement ka code jodo
    case 'Program':
      return node.body.map(codegen).join('\n');

    case 'Declaration':
      return `let ${node.name} = ${node.value ? codegenExpr(node.value) : 'undefined'};`;

    case 'Assignment':
      return `${node.name} = ${codegenExpr(node.value)};`;

    // "console.log"
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

    // number ya string 
    case 'Literal':
      if (typeof node.value === 'string') return JSON.stringify(node.value);
      return String(node.value);

    // variable naam 
    case 'Identifier':
      return node.name;

    // do cheezein ke beech operation
    case 'BinaryExpr':
      return `(${codegenExpr(node.left)} ${node.op} ${codegenExpr(node.right)})`;

    default:
      throw new Error(`Yeh expression type nahi samjha: ${node.type}`);
  }
}

module.exports = { codegen, codegenExpr };