const fs = require('fs');
const { runner } = require('./testifelse');

const code = fs.readFileSync('testcode.hr', 'utf-8');

runner(code);
