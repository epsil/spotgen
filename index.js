#!/usr/bin/env node
/* global document:true, window:true */

var fs = require('fs')
var jsdom = require('jsdom').jsdom
document = jsdom()
window = document.defaultView
var Generator = require('./lib/generator')

/**
 * Main method.
 * Invoked when run from the command line.
 */
function main () {
  var input = process.argv[2]
  var output = process.argv[3]
  var str = input
  if (!input) {
    input = input || 'input.txt'
    output = output || 'output.spotify.txt'
  }
  if (!output) {
    str = str.replace(/\\n/gi, '\n')
  } else {
    str = fs.readFileSync(input, 'utf8').toString()
  }
  var generator = new Generator(str)
  generator.generate().then(function (str) {
    if (output) {
      fs.writeFile(output, str, function (err) {
        if (err) { return }
        console.log('Wrote to ' + output.trim())
      })
    } else {
      console.log('\n' + str)
    }
  })
}

if (require.main === module) {
  main()
}

module.exports = Generator
