#!/usr/bin/env node
/* global document:true, window:true */

var fs = require('fs')
var jsdom = require('jsdom').jsdom
document = jsdom()
window = document.defaultView
var Generator = require('./lib/generator')

var help = 'Usage:\n' +
    '\n' +
    '    spotgen input.txt output.spotify.txt\n' +
    '\n' +
    'input.txt is a text file containing a generator string.\n' +
    'output.spotify.txt will contain the generator\'s output,\n' +
    'a list of Spotify URIs which can be imported into Spotify.\n' +
    '\n' +
    'You can also pass a generator string as a single argument.\n' +
    'In that case, the Spotify URIs are written to standard output:\n' +
    '\n' +
    '    spotgen "#artist Bowery Electric"\n' +
    '    spotgen "#similar Beach House\\n#similar Hooverphonic"\n' +
    '    spotgen http://www.last.fm/user/username/library\n' +
    '\n' +
    'Make sure to surround the string with quotes (") if it contains spaces.\n' +
    'Line breaks can be expressed as \\n.\n' +
    '\n' +
    'To import the playlist into Spotify:\n' +
    '\n' +
    '1.  Copy the output of the generator:\n' +
    '    Choose Edit -> Copy (Ctrl + C).\n' +
    '2.  Create a new playlist in Spotify:\n' +
    '    Choose File -> New Playlist (Ctrl + N).\n' +
    '3.  Paste into the playlist:\n' +
    '    Select the playlist and choose Edit -> Paste (Ctrl + V).'

/**
 * Main method.
 * Invoked when run from the command line.
 */
function main () {
  var input = process.argv[2]
  var output = process.argv[3]
  var str = input
  if (typeof input === 'string' &&
      input.match(/(^-*h(elp)?$)|(^\/\?$)/gi)) {
    console.log(help)
    return
  }
  if (!input) {
    input = input || 'input.txt'
    output = output || 'output.spotify.txt'
  }
  if (!output) {
    // help out primitive shells (e.g., Windows') with newlines
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
