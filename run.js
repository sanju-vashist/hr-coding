const fs = require('fs');
const { runner } = require('./compiler');

const code = fs.readFileSync('code.hr', 'utf-8');

runner(code);
