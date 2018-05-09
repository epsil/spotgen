var EOL = require('os').EOL
  , events = require('events')
  , util = require('util')
  , path = require('path')
  , async = require('async')
  , utils = require('cli-util')
  , merge = utils.merge
  , native = require('cli-native')
  , read = require('./lib/read')
  , history = require('./lib/history')
  , sets = require('./lib/sets')
  , definitions = sets.definitions
  , PromptDefinition = require('./lib/definition');

function noop(){};

var schema;
try{
  schema = require('async-validate');
}catch(e){}

var types = {
  binary: 'binary',
  password: 'password'
}

/**
 *  Create a prompt.
 */
function Prompt(options, rl) {
  options = options || {};

  this.rl = rl || {};
  this.rl.completer = this.rl.completer || options.completer;
  this.rl.input = options.input || process.stdin;
  this.rl.output = options.output || process.stdout;
  this.rl.terminal = !!(options.terminal || this.rl.output.isTTY);

  this.readline = read.open(this.rl);

  // no not store these in the options
  // to prevent cyclical reference on merge
  this.input = options.input || this.rl.input;
  this.output = options.output || this.rl.output;
  delete options.input;
  delete options.output;

  this.formats = options.formats || {};

  // format for default values
  this.formats.default = this.formats.default || '(%s) ';

  // format for select options
  this.formats.option = this.formats.select || '%s) %s';

  this.name = options.name || path.basename(process.argv[1]);
  this.fmt = (options.format === '' ? '' :
    (options.format || ':name :delimiter :health :location :status :message :default'));

  options.validator = options.validator !== undefined
    ? options.validator : {};

  // default prompt
  options.prompt = options.prompt || '>';

  // default replacement character for silent
  options.replace = options.replace || '*';

  // determine if a prompt should be re-displayed at the end of a run
  options.infinite = options.infinite !== undefined ? options.infinite : false;

  // convert to native types
  options.native = options.native !== undefined ? options.native : null;

  // when running in infinite mode, restore to default prompt at end of run
  options.restore = options.restore !== undefined ? options.restore : true;

  // when a validation error occurs repeat the last prompt
  // until we get a valid value
  options.repeat = options.repeat !== undefined ? options.repeat : true;

  // trim leading and trailing whitespace from input lines
  options.trim = options.trim !== undefined ? options.trim : false;

  // split values into array
  options.split = options.split !== undefined ? options.split : null;

  // delimiter that comes after the name
  options.delimiter = options.delimiter || '⚡';

  // color callback functions
  options.colors = options.colors || {};

  // history has cyclical references
  if(options.history) {
    this.history = options.history;
    delete options.history;
  }

  this.keys = this.fmt.split(' ').map(function(value) {
    return value.replace(/^:/, '');
  })

  this.options = options;
  this._use = {};
}

util.inherits(Prompt, events.EventEmitter);

Prompt.prototype.use = function(props) {
  this._use = merge(props, this._use);
}

Prompt.prototype.transform = function(k, v, options) {
  var fmts = merge(this.formats, {}, {copy: true});
  fmts = merge(options.formats || {}, fmts, {copy: true});
  if(fmts[k] && v) {
    v = util.format(fmts[k], v);
  }
  return v;
}

Prompt.prototype.replace = function(format, source, options) {
  var s = '' + format, k, v;
  var items = {}, keys = this.keys;
  function clean(s) {
    // strip extraneous keys
    for(var i = 0;i < keys.length;i++) {
      s = s.replace(new RegExp(':' + keys[i], 'g'), '');
    }
    // strip multiple whitespace
    s = s.replace(/ +/g, ' ');
    return s;
  }

  var highlights = this.rl.output
    && this.rl.output.isTTY && this._use.colors !== false;
  var prefixed = this.options.colors && this.options.colors.prefix;
  var name = source.name
    , delimiter = source.delimiter;

  if(prefixed) {
    if(highlights) {
      prefixed = this.options.colors.prefix(name, delimiter);
    }
    delete source.name;
    delete source.delimiter;
  }

  var replaces = false;

  for(k in source) {
    v = source[k];
    if(typeof v === 'function') {
      v = v(k, options);
    }
    replaces = Array.isArray(options.parameters) && k === 'message';
    // store them for processing later
    items[k] = {k: k, v: v}

    // parameter replacment
    if(replaces) {
      items[k].v = util.format(v, options.parameters);
      if(highlights && typeof this.options.colors.parameters === 'function') {
        items[k].c =
          util.format(v, this.options.colors.parameters(options.parameters));
      }
    }

    // get colorized values
    if(highlights
      && typeof this.options.colors[k] === 'function' && !replaces) {
      items[k].c = this.options.colors[k](v);
    }
  }

  // build up plain string so we can get the length
  var raw = '' + format;
  for(k in items) {
    v = items[k].v;
    v = this.transform(k, v, options);
    raw = raw.replace(new RegExp(':' + k, 'gi'), v ? v : '');
  }
  raw = clean(raw);

  // now build up a colorized version
  s = '' + format;
  for(k in items) {
    v = items[k].c || items[k].v;
    v = this.transform(k, v, options);
    s = s.replace(new RegExp(':' + k, 'gi'), v ? v : '');
  }
  s = clean(s);

  if(prefixed && prefixed.value && prefixed.color) {
    raw = prefixed.value + raw;
    s = prefixed.color + s;
  }

  return {prompt: s, raw: raw};
}

Prompt.prototype.format = function(options) {
  var source = options.data || {};
  source.name = source.name || this.name;
  source.date = new Date();
  source.message = options.message;
  source.delimiter = options.delimiter || this.options.delimiter;
  source.default = options.default;
  return this.replace(options.format || this.fmt, source, options);
}

Prompt.prototype.merge = function(options) {
  var o = merge(this.options, {}, {copy: true}), fmt;
  o = merge(options, o, {copy: true});
  if(typeof this.options.prompt === 'function') {
    o.prompt = this.options.prompt(options, o, this);
  }else{
    fmt = this.format(o);
    o.raw = fmt.raw;
    // plain prompt length with no color (ANSI)
    // store string length so we can workaround
    // #3860, fix available from 0.11.3 node
    o.length = fmt.raw.length;
    o.prompt = fmt.prompt;
  }
  if(o.silent && !o.replace) {
    o.replace = this.options.replace;
  }
  return o;
}

Prompt.prototype.getDefaultPrompt = function() {
  return {
    key: 'default',
    prompt: this.options.prompt
  }
}

/**
 *  Pause the prompt when running a set or in infinite mode
 *  prevents the next call to run() from being executed until
 *  resume() is called.
 */
Prompt.prototype.pause = function pause() {
  this._paused = true;
  this.emit('pause', this);
}

/**
 *  Determine if this prompt is paused.
 */
Prompt.prototype.isPaused = function isPaused() {
  return this._paused;
}

/**
 *  Close the readline interface.
 */
Prompt.prototype.close = function close() {
  this.readline.close();
}

/**
 *  Resume a paused prompt.
 */
Prompt.prototype.resume = function resume(options, cb) {
  if(!this._paused) return;
  var scope = this;
  this._paused = false;
  options = options || {};
  if(options.infinite || this.options.infinite) {
    this.exec(options || this.getDefaultPrompt(), cb);
  }
  this.emit('resume', this);
}

/**
 *  Display a prompt with the specified options.
 */
Prompt.prototype.prompt = function(options, cb) {
  this.exec(options, cb);
}

/**
 *  Display a prompt from a set.
 */
Prompt.prototype.run = function(prompts, opts, cb) {
  if(typeof prompts === 'function') {
    cb = prompts;
    prompts = null;
  }
  if(typeof opts === 'function') {
    cb = opts;
    opts = null;
  }
  cb = typeof cb === 'function' ? cb : noop;
  opts = opts || {};
  var scope = this, options = this.options;
  prompts = prompts || [scope.getDefaultPrompt()];
  var map = {};
  async.concatSeries(prompts, function(item, callback) {
    scope.exec(item, function(err, result) {
      if(item.key) {
        map[item.key] = result;
      }
      callback(err, result);
    });
  }, function(err, result) {
    if(err && err.cancel) return scope.emit('cancel', prompts, scope);
    if(err && err.timeout) return scope.emit('timeout', prompts, scope);
    if(err && err.paused) return scope.emit('paused', prompts, scope);
    if(err) {
      scope.emit('error', prompts, scope);
    }
    var res = {list: result, map: map};

    function done() {
      //console.dir('run complete');
      scope.emit('complete', res);
      cb(null, res);
      if((opts.infinite || scope.options.infinite) && !scope._paused) {
        return scope.run(prompts, opts, cb);
      }
    }

    if(opts.schema && res && res.map) {
      scope.validate(res.map, opts.schema, function(errors, fields) {
        if(errors && errors.length) {
          return scope.emit('error', errors[0], errors, fields, res, scope);
        }
        done();
      })
    }else{
      done();
    }
  })
}

/**
 *  Default implementation for formatting option values.
 *
 *  @param index The index into the options list.
 *  @param value The value for the option.
 *  @param default A default value for the list.
 */
Prompt.prototype.option = function(index, value, def) {
  if(!def || def !== value) {
    return util.format(this.formats.option, index + 1, value);
  }else if(def === value){
    return util.format(this.formats.option, index + 1, value)
    + ' ' + util.format(this.formats.default, 'default');
  }
}

/**
 *  Select from a list of options.
 *
 *  Display numbers are 1 based.
 */
Prompt.prototype.select = function(options, cb) {
  if(typeof options === 'function') {
    cb = options;
    options = null;
  }
  options = options || {};
  var scope = this, i, s, map = [];
  var output = options.output || this.output;
  var list = options.list || [];
  var validate = options.validate !== undefined
    ? options.validate : true;
  var formatter = typeof options.formatter === 'function'
    ? options.formatter : this.option.bind(this);
  var prompt = options.prompt || definitions.option.clone();

  var defaultOption = options.default;
  var defaultIndex = -1, def;

  if(defaultOption !== undefined) {
    if(typeof defaultOption === 'number') {
      def = list[defaultOption];
      if(def) {
        defaultIndex = defaultOption;
        defaultOption = def;
      }
    }else if(typeof defaultOption === 'string') {
      defaultIndex = list.indexOf(defaultOption);
      if(defaultIndex === -1) {
        defaultOption = undefined;
      }
    }
  }

  if(defaultOption && defaultIndex > -1) {
    prompt.required = false;
  }

  // print list
  for(i = 0;i < list.length;i++) {
    s = formatter(i, list[i], defaultOption);
    map.push({display: i + 1, index: i, value: list[i]});
    output.write(s + EOL);
  }

  // show prompt
  function show() {
    scope.exec(prompt, function(err, res) {
      if(err) return cb(err);
      var int = parseInt(res)
        , oint = int
        , val = !isNaN(int) ? map[--int] : null
        , invalid = isNaN(int) || !val;

      if(!res && defaultOption && defaultIndex > -1) {
        val = map[defaultIndex];
        if(val) {
          int = defaultIndex;
          invalid = false;
        }
      }

      if(validate && invalid) {
        scope.emit('invalid', res, oint, options, scope);
      }
      if(options.repeat || prompt.repeat && (validate && invalid)) {
        return show();
      }
      if(!invalid) cb(err, val, int, res);
    });
  }
  show();
}

/**
 *  Collect multiline into a string.
 */
Prompt.prototype.multiline = function(options, cb, lines, vpos) {
  if(typeof options === 'function') {
    cb = options;
    options = null;
  }
  options = options || {};
  lines = lines || [];
  var raw;

  var scope = this
    , readline = this.readline
    , rl = require('readline')
    , line = ''
    , input = this.input
    , output = this.output
    , key = options.key || '\u0004'
    , newline = options.newline !== undefined ? options.newline : true
    , prompt = options.prompt || {blank: true};

  if(typeof key !== 'function') {
    key = (function(key, input) {
      return key === input;
    }).bind(this, key);
  }

  // disable history for multiline
  var history = readline.history;
  readline.history = [];

  function onkeypress(c, props) {
    props = props || {};

    // handle exit key
    if(key(c)) {
      input.removeListener('keypress', onkeypress);
      if(newline) {
        output.write(EOL);
      }

      // handle trailing lines with no newline
      if(line !== undefined && !~line.indexOf(EOL)) {
        lines.push(line);
      }

      raw = lines.join(EOL);

      // restore history
      readline.history = history;

      //console.log('final lines');
      //console.dir(lines);
      //console.dir(raw);

      // parse as JSON
      if(options.json) {
        try {
          lines = JSON.parse(raw);
        }catch(e) {
          return cb(e, lines, raw);
        }
      }

      return cb(null, lines, raw);
    }
  }

  vpos = vpos || 0;

  // this is a hack and uses the readline internals
  // but saves us duplicating all the logic for *where*
  // to insert the current character
  var insert = readline._insertString;
  readline._insertString = function(c) {
    insert.call(readline, c);
    line = readline.line;
  }

  var delLeft = readline._deleteLeft;
  readline._deleteLeft = function() {
    var ln = lines[vpos];

    // backspace at beginning of line
    if(!readline.line && vpos && !ln) {
      if(ln === undefined) ln = lines[vpos-1];
      if(ln !== undefined) {
        --vpos;
        readline.line = ln;
        rl.moveCursor(readline.input, ln.length, -1);
        readline.cursor = ln.length;
        readline._refreshLine();
        return lines.pop();
      }
    }else if(vpos < lines.length && vpos >= 0) {
      // here we are not on the last line
      // and the default implementation would
      // clearScreenDown() which removes subsequent lines

      ln = readline.line;
      var pos = readline.cursor;
      var beg = ln.substr(0, pos - 1);
      var end = ln.substr(pos);
      ln = beg + end;

      rl.clearLine(readline.output, 0);
      readline.line = ln;
      lines[vpos] = ln;

      rl.cursorTo(readline.input, 0);
      readline.output.write(ln);
      readline.cursor = pos - 1;
    }else{
      delLeft.call(readline);
    }
  }

  // support navigating up/down with cursor keys
  var previous = readline._historyPrev;
  var next = readline._historyNext;
  readline._historyPrev = function() {
    if(vpos === 0) return;
    var cl = readline.line;
    var nl = lines[--vpos] || line || '';
    var x = 0, pos = readline.cursor;
    if(nl.length < pos) {
      x = nl.length - pos;
    }
    rl.moveCursor(readline.input, x, -1);
    readline.line = nl;
    readline.cursor = pos + x;
  }

  readline._historyNext = function() {
    if(!lines.length || vpos >= lines.length) return;
    var cl = readline.line;
    var nl = lines[++vpos] || line || '';
    var x = 0, pos = readline.cursor;
    if(nl.length < pos) {
      x = nl.length - pos;
    }
    rl.moveCursor(readline.input, x, 1);
    readline.line = nl;
  }

  input.on('keypress', onkeypress);

  prompt.expand = false;

  // must re-assign the prompt for recursive calls to respect
  // our configuration
  options.prompt = prompt;

  scope.exec(prompt, function online(err, val) {
    input.removeListener('keypress', onkeypress);
    if(err) return cb(err);
    lines.push(val);
    scope.multiline(options, cb, lines, ++vpos);
  });
}

/**
 *  Validate against a schema.
 */
Prompt.prototype.validate = function(source, descriptor, cb) {
  if(!schema) return cb();
  var validator = new schema(descriptor);
  validator.validate(source, this.options.validator,
    function onvalidate(errors, fields) {
      cb(errors, fields);
    }
  );
}

/**
 *  @private
 */
Prompt.prototype.exec = function(options, cb) {
  if(typeof options === 'function') {
    cb = options;
    options = null;
  }
  options = options || {};
  options = this.merge(options);
  cb = typeof cb === 'function' ? cb : noop;
  var scope = this;
  var opts = {}, k;
  var trim = options.trim;
  for(k in options) opts[k] = options[k];
  opts.rl = this.rl;
  opts.emitter = this;
  this.emit('before', opts, options, scope);
  if(options.blank) {
    opts.prompt = '';
    opts.length = 0;
  }
  read(opts, function(err, value, rl) {
    if(err) return cb(err);
    //console.log('got read value "%s" (%s)', value, typeof value);
    var val = (value || '').trim();

    if(!val) {
      scope.emit('empty', options, scope);
    }

    // required and repeat, prompt until we get a value
    if(!val && options.required && options.repeat) {
      return scope.exec(options, cb);
    }

    if(options.native && val) {
      val =
        native.to(val, options.native.delimiter, options.native.json);
    }

    if(!trim && typeof val === 'string') {
      val = value;
    }

    if((typeof options.split === 'string' || options.split instanceof RegExp)
      && val && typeof val === 'string') {
      val = val.split(options.split);
      val = val.filter(function(part) {
        return part;
      });
    }

    //console.log('emitting value %j', options.key);
    //console.log('emitting value %s', cb);

    if(options.history === false && rl.history) {
      rl.history.shift();
    }

    if(options.type === types.binary) {
      var accept = options.accept
        , reject = options.reject;
      if(accept.test(val)) {
        val = {result: val, accept: true}
        scope.emit('accepted', val, scope);
      }else if(reject.test(val)) {
        val = {result: val, accept: false}
        scope.emit('rejected', val, scope);
      }else{
        val = {result: val, accept: null}
        scope.emit('unacceptable', val, options, scope);
        if(options.repeat) return scope.exec(options, cb);
      }
    }

    if(options.type === types.password && options.equal) {
      if(!options.pass1) {
        options.pass1 = val;
        options.default = options.confirmation;
        // gather password confirmation
        return scope.exec(options, cb);
      }else{
        options.pass2 = val;
        if(options.pass1 !== options.pass2) {
          scope.emit('mismatch',
            options.pass1, options.pass2, options, scope);
          delete options.pass1;
          delete options.pass2;
          delete options.default;
          return scope.exec(options, cb);
        }
      }
    }

    if(options.type === undefined) {
      // convert to command array for items with no type
      if(typeof val === 'string' && options.expand !== false) {
        val = val.split(/\s+/);
      }
      //console.dir('emitting value with cb: ' + cb);
      scope.emit('value', val, options, scope);
      if(scope.options.infinite && !scope._paused && cb === noop) {
        return scope.exec(options, cb);
      }
    }else{
      scope.emit(options.type, val, options, scope);
    }

    // validate  on a schema assigned to the prompt
    if(schema && options.schema && options.key) {
      var source = {}
        , descriptor = {type: 'object', fields: {}}
      source[options.key] = value;
      descriptor.fields[options.key] = options.schema;
      scope.validate(source, descriptor, function(errors, fields) {
        if(errors && errors.length) {
          if(options.repeat) {
            scope.emit('error', errors[0], options, cb);
            return scope.exec(options, cb);
          }
          return cb(errors[0], value);
        }
        cb(null, val);
      });
    }else{
      cb(null, val);
    }
  });
}


function prompt(options) {
  return new Prompt(options);
}

prompt.read = read;
prompt.errors = read.errors,
prompt.sets = sets;
prompt.PromptDefinition = PromptDefinition;
prompt.history = history;
prompt.History = history.History;
prompt.HistoryFile = history.HistoryFile;
module.exports = prompt;
