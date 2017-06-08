#!/usr/bin/env node

'use strict';

const fs = require('fs');
const parser = require('./src/parser');

/**
 * Main method.
 * Invoked when run from the command line.
 */
function main() {
  const input = process.argv[2] || 'input.txt';
  const output = process.argv[3] || 'output.txt';

  const str = fs.readFileSync(input, 'utf8').toString();
  const generator = parser(str);

  function cont(data) {
    function callback(err) {
      if (err) { return; }
      console.log('Wrote to ' + output);
    }
    fs.writeFile(output, data, callback);
  }

  generator.dispatch().then(cont);
}

if (require.main === module) {
  main();
}
