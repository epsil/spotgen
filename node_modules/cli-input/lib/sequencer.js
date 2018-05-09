var assert = require('assert')
  , EOL = require('os').EOL
  , util = require('util');

var SequenceResult = function(options) {
  options = options || {};
  for(var k in options) {
    this[k] = options[k];
  }
}

SequenceResult.prototype.isPromptEqual = function() {
  return this.seq && this.prompt
    && this.seq.msg && this.prompt.msg
    && this.seq.msg === this.prompt.msg;
}

SequenceResult.prototype.write = function(cb) {
  var scope = this;
  var str = this.seq.input;
  var evt = this.item && this.item.type ? this.item.type : 'value';

  // told to listen for a particular event
  if(this.seq.evt) {
    evt = this.seq.evt;
  }

  this.ps.once(evt, function(res, options, ps) {
    if(typeof cb === 'function') {
      // cater for assertions on callback with a different
      // set of arguments
      scope.raw = [].slice.call(arguments, 0);
      cb(scope, evt, res, options, ps);
    }
  })

  this.rl.write(str + EOL);

  // duplicate content to output stream so result files
  // contain data that matches the entire sequence (not just the prompts)
  if(this.file) {
    this.file.write(str + EOL);
  }
}

var Sequencer = function(options) {
  options = options || {};
  this.ps = options.ps;
  delete options.ps;
  this.output = options.output;
  delete options.output;
  assert(this.ps, 'you must specify a prompt instance to create a sequence');
  this.prefix = util.format('%s %s ',
    this.ps.options.name, this.ps.options.delimiter);
}

Sequencer.prototype.multiline = function(seq, cb) {
  var ps = this.ps;

  var str = seq.input || '';
  var lines = str.split(EOL);
  var newlines = [], chars = [];
  var final;

  ps.multiline(function(err, list, raw) {
    if(typeof cb === 'function') {
      if(final) {
        list.pop();
        list.push(final);
        raw += final;
      }
      cb(err, list, raw);
    }
  });

  // no newlines
  if(lines.length === 1) {
    chars = lines[0].split('');
    lines.pop();
  // trailing newlines
  }else if(lines.length && !lines[lines.length - 1]) {
    //console.log('got trailing new line');
    var i = lines.length - 1;
    while(!lines[i]) {
      newlines.push('');
      lines.pop();
      i--;
    }
  // trailing characters
  }else{
    chars = lines[lines.length - 1].split('');
    lines.pop();
  }

  function writeChars(chars) {
    final = chars.join('');
  }

  // write lines
  lines.forEach(function(line) {
    line = line === EOL ? line : line + EOL
    ps.readline.write(line);
  })

  // write trailing characters
  writeChars(chars);

  // simulate Ctrl^D (EOF)
  ps.readline.input.emit('keypress', seq.key || '\u0004');
}

Sequencer.prototype.run = function(sequence, set, options, cb) {
  if(typeof options === 'function') {
    cb = options;
    options = null;
  }
  options = options || {};

  var ps = this.ps;
  var input = ps.input;
  var output = ps.output;
  var file = this.output;
  var prefix = this.prefix;
  var index = 0;

  ps.on('ready', function onready(opts, rl) {

    //console.dir(index);

    //console.log('ready callled');
    var seq = sequence[index];
    if(seq.msg && prefix) {
      if(seq.msg.indexOf(prefix) !== 0) {
        seq.msg = prefix + seq.msg;
      }
    }
    if(!seq || seq.multiline) return false;

    var res = new SequenceResult(
      {
        ps: ps,
        index: index,
        sequence: sequence,
        input: input,
        output: output,
        file: file,
        seq: seq,
        item: set ? set[index] : null,
        set: set,
        opts: opts,
        rl: rl,
        prompt: {
          msg: opts.raw,
          len: opts.length
        }
      }
    );

    index++;

    if((!set || ps.infinite) && index === sequence.length) {
      ps.removeListener('ready', onready);
    }

    // write out the desired input
    res.write(seq.cb);

    return res;
  })

  // show a select menu
  if(options.select) {
    ps.select(options.select, function(err, res, index, line) {
      if(typeof cb === 'function') {
        cb(err, res, index, line);
      }
    });
  }else if(set) {
    // running a set of prompts
    ps.run(set, function(err, res) {
      if(typeof cb === 'function') {
        cb(err, res);
      }
    });
  }else{
    // infinite mode, just run
    ps.run();
  }
}

module.exports = Sequencer;
