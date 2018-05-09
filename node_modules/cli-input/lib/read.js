var readline
  , rl
  , rlopts
  , history;

var Mute = process.env.NODE_ENV === 'test-mute'
  ? require('mute-stream') : require('./mute');

var errors = {
  cancel: new Error('cancelled'),
  timeout: new Error('timed out')
}

errors.cancel.cancel = true;
errors.timeout.timeout = true;

function getReadline() {
  var ver = process.version.replace(/^v/, '');
  var vers = ver.split('.');
  var minor = parseInt(vers[1]);
  // use readline version imported from v0.11.x
  if(minor < 11 && !process.env.CLI_INPUT_NO_READLINE_PATCH) {
    readline = require('./patch')();
  }else{
    readline = require('readline');
  }
}

function open(opts) {
  //console.log('opening rl interface %j', history);
  getReadline();
  close();
  opts = opts || {};
  opts.input = opts.input || process.stdin
  opts.output = opts.output || process.stdout
  opts.terminal = !!(opts.terminal || opts.output.isTTY)
  rl = readline.createInterface(opts)
  if(history) {
    rl.history = history.slice(0);
  }
  rlopts = opts;
  return rl;
}

function close() {
  if(rl) {
    rl.close();
    rl.removeAllListeners();
    rl = null;
  }
}

function read (opts, cb) {
  var input = opts.input || process.stdin
  var output = opts.output || process.stdout
  opts.rl = opts.rl || {};
  var prompt = (opts.prompt || '');
  var silent = opts.silent
  var timeout = opts.timeout
    , rlopts
    , m;

  var def = '' + opts.default || '';

  var terminal = !!(opts.terminal || output.isTTY)
  var mrl;

  if(!rl) {
    open(opts.rl);
  }

  if(silent) {
    m = new Mute(
      {
        replace: opts.replace,
        prompt: prompt,
        length: opts.length || prompt.length
      })
    m.pipe(output, {end: false})
    output = m;
    history = rl.history;
    rl.close();
    mrl = readline.createInterface(
      {input: input, output: output, terminal: terminal});
    rl = mrl;
  }else{
    history = rl.history;
  }

  rl.setPrompt(prompt, opts.length || prompt.length);
  rl.prompt();

  if(silent) {
    output.mute()
  }else if(opts.value) {
    rl.line = '' + opts.value;
    rl.cursor = opts.value.length;
    //console.log('has value %s', opts.value);
    //console.log('has value length %s', opts.value.length);
    //rl.cursor = 0;
    rl._refreshLine();
    // value is always a one shot deal
    opts.value = null;
  }

  var timer;

  rl.on('line', onLine);
  rl.on('error', onError);

  function onsigint() {
    if(rl) rl.close()
    onError(errors.cancel);
    //process.emit('SIGINT');
  }

  //rl.on('SIGINIT', onsigint);
  process.on('SIGINT', onsigint);

  if(timeout) {
    timer = setTimeout(function () {
      onError(errors.timeout)
    }, timeout)
  }

  if(opts.emitter) {
    opts.emitter.emit('ready', opts, rl);
  }

  function done (err, line) {
    rl.removeListener('line', onLine);
    rl.removeListener('error', onError);

    process.removeListener('SIGINT', onsigint);

    // keep reference before closing
    // so we can pass to the callback
    var interface = rl;

    clearTimeout(timer);
    if(silent) {
      mrl.close();
      //rl.resume();
      //opts.rl.output = process.stdout;
      output.unmute()
      output.end()
      close();
    }

    // get *undefined* string from mute stream on no input
    if(silent && line == "undefined") line = '';

    if(err) return cb(err, null, interface);
    cb(null, line, interface);
  }

  function onError (err) {
    done(err);
  }

  function onLine (line) {
    if(silent) {
      output.unmute()
      //output.write('\r\n')
    }

    // truncate the \n at the end.
    line = line.replace(/\r?\n$/, '')

    if(!line && opts.default) {
      line = opts.default;
    }

    done(null, line);
  }
}

read.open = open;
read.errors = errors;
read.rl = rl;

module.exports = read;
