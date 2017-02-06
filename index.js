#!/usr/bin/env node

var fs = require('fs')
var Playlist = require('./src/playlist')

/**
 * Main method.
 * Invoked when run from the command line.
 */
function main () {
  var input = process.argv[2] || 'input.txt'
  var output = process.argv[3] || 'output.txt'

  var str = fs.readFileSync(input, 'utf8').toString()
  var playlist = new Playlist(str)

  playlist.dispatch().then(function (str) {
    fs.writeFile(output, str, function (err) {
      if (err) { return }
      console.log('Wrote to ' + output)
    })
  })
}

if (require.main === module) {
  main()
}
