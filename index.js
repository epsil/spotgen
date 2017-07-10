#!/usr/bin/env node

var fs = require('fs')
var Parser = require('./src/parser')
var WebScraper = require('./src/web')

/**
 * Main method.
 * Invoked when run from the command line.
 */
function main () {
  var web = new WebScraper('https://www.last.fm/user/epsilon47/library')
  web.dispatch()

  var input = process.argv[2] || 'input.txt'
  var output = process.argv[3] || 'output.spotify.txt'

  var str = fs.readFileSync(input, 'utf8').toString()
  var generator = Parser(str)

  generator.dispatch().then(function (str) {
    fs.writeFile(output, str, function (err) {
      if (err) { return }
      console.log('Wrote to ' + output)
    })
  })
}

if (require.main === module) {
  main()
}
