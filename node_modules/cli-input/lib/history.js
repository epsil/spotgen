var EOL = require('os').EOL
  , fs = require('fs')
  , assert = require('assert')
  , path = require('path')
  , touch = require('touch')
  , util = require('util')
  , events = require('events')
  , utils = require('cli-util')
  , uniq = utils.uniq
  , merge = utils.merge;

var stores = {}
  , property = 'history';

function noop(){};

var HistoryFile = function(parent, options) {
  var scope = this;
  options = options || {};

  options.flush = options.flush !== undefined ? options.flush : true;
  options.duplicates = options.duplicates !== undefined
    ? options.duplicates : false;
  options.limit = options.limit === 'number' ? options.limit : 2048;

  // flush on process close
  if(options.exit === true) {
    // overrides flush on modification
    options.flush = false;
    process.on('exit', function onexit() {
      var res = fs.writeFileSync(scope.file, scope.getLines(0));
      scope.emit('exit', res, scope);
    })
  }

  options.mode = options.mode || 0600;
  options.interpreter = options.interpreter ||
    {
      replace: true,    // replace expanded items
      remove: true      // remove the history command itself
    }

  var mirrors = options.mirrors || {};

  this.file = options.file;
  this.options = options;
  this._parent = parent;
  this._history = [];
  this._stream = fs.createWriteStream(
    this.file, {flags: 'a+', mode: this.options.mode});
  this._stats = null;
  this._mirror = mirrors.target
    ? this.mirror(mirrors.target, mirrors.field) : null;
  this._success();
  this.reset();
}

util.inherits(HistoryFile, events.EventEmitter);

HistoryFile.prototype.length = function() {
  return this._history.length;
}

HistoryFile.prototype.size = HistoryFile.prototype.length;

// intepreter

HistoryFile.prototype.interpret = function(cmd, options) {
  options = options || {};
  var val = false;
  var defs = merge(this.options.interpreter, {});
  options = merge(options, defs);
  if(!cmd || typeof cmd !== 'string') return false;

  var re = {
    is: /^!/,
    last: /^!!$/,
    index: /^!((-?)([0-9]))+/
  }
  if(!re.is.test(cmd)) return false;

  // must shift first
  if(options.remove) {
    this._history.shift();
  }

  if(re.last.test(cmd)) {
    val = this.start();
    ind = 0;
  }else if(re.index.test(cmd)) {
    var num = parseInt(cmd.replace(re.index, "$1"))
    ind = parseInt(cmd.replace(re.index, "$3"))
    var negated = cmd.replace(re.index, "$2");
    if(!isNaN(ind)) {
      // history indices are 1 based
      ind--;

      // got a valid index
      if(ind > -1 && ind < this.size()) {
        if(!negated) {
          ind = this.size() - ++ind;
          val = this._history[ind];
        }
        val = this._history[ind];
      }
    }
  }

  // update item in list with the expanded value
  if(options.replace && ind > -1 && ind < this.size()) {
    this._history[ind] = val;
  }

  return val;
}

// mirroring

/**
 *  Configure this instance to mirror the array on another object.
 *
 *  The target must have an existing named property that is an array.
 *
 *  @param target The target object.
 *  @param field A field name, default is history.
 */
HistoryFile.prototype.mirror = function(target, field) {
  if(target === null) {
    this._mirror = null;
    return null;
  }
  field = field || property;
  if(target && target.hasOwnProperty(field) && Array.isArray(target[field])) {
    this._mirror = {target: target, field: field};
    this._mirror.target[this._mirror.field] = this._history;
    return this._mirror;
  }
  return null;
}

// positional functions
HistoryFile.prototype.end = function() {
  this._position = this._history.length ? this._history.length - 1 : 0;
  return !this._history.length ? false : this._history[this._position];
}

HistoryFile.prototype.start = function() {
  this._position = 0;
  return !this._history.length ? false : this._history[this._position];
}

HistoryFile.prototype.position = function() {
  return this._position;
}

// TODO: rename to seek()
HistoryFile.prototype.move = function(index) {
  if(index > -1 && index < this._history.length) {
    this._position = index;
    return this._history[index];
  }
  return false;
}

HistoryFile.prototype.next = function() {
  var pos = this._position + 1;
  if(pos < this._history.length) {
    this._position = pos;
    return this._history[pos];
  }
  return false;
}

HistoryFile.prototype.previous = function() {
  var pos = this._position - 1;
  if(pos > -1 && this._history.length) {
    this._position = pos;
    return this._history[pos];
  }
  return false;
}

HistoryFile.prototype.reset = function() {
  if(!this._history.length) {
    this._position = 0;
  }else{
    this._position = this._history.length - 1;
  }
  return this._position;
}

/**
 *  Get the underlying history array.
 */
HistoryFile.prototype.history = function() {
  return this._history;
}

/**
 *  Get the parent History instance.
 */
HistoryFile.prototype.parent = function() {
  return this._parent;
}

/**
 *  Get the underlying file stats.
 */
HistoryFile.prototype.stats = function(cb) {
  var scope = this;
  if(typeof cb === 'function') {
    fs.stat(this.file, function(err, stats) {
      if(err) return cb(err, scope);
      stats.file = scope.file;
      scope._stats = stats;
      return cb(err, scope);
    });
  }
  return this._stats;
}

/**
 *  Read lines into an array.
 *
 *  @param lines A string or buffer.
 *
 *  @return An array of lines.
 */
HistoryFile.prototype.readLines = function(lines) {
  if(!lines) return [];
  if(lines instanceof Buffer) lines = '' + lines;
  if(typeof lines === 'string') {
    lines = lines.split('\n');
    lines = lines.filter(function(line) {
      line = line.replace(/\r$/, '');
      line = line.trim();
      return line;
    })
  }
  if(!this.options.duplicates) {
    lines = uniq(lines);
  }
  lines = this._filter(lines);
  if(lines.length > this.options.limit) {
    lines = lines.slice(lines.length - this.options.limit);
  }
  return lines;
}

/**
 *  Get a string of lines from the underlying array of lines.
 *
 *  Includes a trailing newline.
 *
 *  @param checkpoint The start index into the history array.
 *  @param length The end index into the history array.
 */
HistoryFile.prototype.getLines = function(checkpoint, length) {
  var cp = checkpoint !== undefined ? checkpoint : this._checkpoint;
  var len = length !== undefined ? length : this._history.length;
  var lines = this._history.slice(cp, len)
  lines = this._filter(lines);
  // add trailing newline
  if(lines[lines.length - 1]) {
    lines.push('');
  }
  return lines.join(EOL);
}


/**
 *  Import into this history store.
 *
 *  If content is a callback function all data is read from disc,
 *  otherwise content should be a string or array to import.
 *
 *  When content is specified the and this instance is flushing
 *  the file is written to disc.
 *
 *  If content is specified but no callback then the internal representation
 *  is updated but content is not flushed to disc.
 *
 *  @param content String or array to import.
 *  @param cb A callback function invoked when the history
 *  has been synced to disc or on error.
 */
HistoryFile.prototype.import = function(content, cb) {
  var scope = this;
  // no content so read the file and import the data
  if(typeof content === 'function') {
    cb = content;
    return fs.readFile(this.file, function(err, content) {
      if(err) return cb(err, null, scope);
      scope.stats(function(err) {
        if(err) return cb(err);
        scope._assign(scope.readLines(content), {overwrite: true});
        scope._success();
        cb(null, content, scope);
      })
    })
  }
  // got string content, convert to an array
  if(Array.isArray(content)) content = this.readLines(content.slice(0));
  if(typeof content === 'string') content = this.readLines(content);
  assert(Array.isArray(content),
    'invalid history content type, must be array or string');

  // update internal representation
  this._assign(content, {overwrite: true});
  this._checkpoint = 0;
  // write out if we have callback
  if(typeof cb === 'function') {
    this._sync(cb);
  }
}

/**
 *  Determine if the stored checkpoint is synchronized
 *  with the history array.
 *
 *  @return A boolean indicating if the internal checkpoint is at
 *  the end of the history array.
 */
HistoryFile.prototype.isFlushed = function() {
  return this._checkpoint === this._history.length;
}

/**
 *  Read the history file from disc and load it into
 *  this instance.
 *
 *  @param cb A callback function invoked when the history
 *  has been read from disc or on error.
 */
HistoryFile.prototype.read = function(cb) {
  var scope = this;
  cb = typeof cb === 'function' ? cb : noop;
  return this.import(function(err) {
    if(err && err.code === 'ENOENT' && create) {
      return touch(file, function(err) {
        if(err) return cb(err, scope);
        scope.read(options, cb);
      });
    }
    cb(err, scope);
  });
}

/**
 *  Add a line to this history store.
 *
 *  @param line The line to append.
 *  @param options The append options.
 *  @param cb A callback function invoked when the history
 *  has been synced to disc or on error.
 */
HistoryFile.prototype.add = function(line, options, cb) {
  if(typeof options === 'function') {
    cb = options;
    options = null;
  }
  options = options || {};
  cb = typeof cb === 'function' ? cb : noop;
  var scope = this
    , flush = options.flush || this.options.flush;
  if(!this.options.duplicates && ~this._history.indexOf(line)) {
    return cb(null, scope);
  }
  assert(typeof line === 'string' || Array.isArray(line),
    'history entry must be array or string');

  if(Array.isArray(line)) {
    line = line.map(function(item) {
      return '' + item;
    })
    this._assign(this._filter(line))
  }else if(typeof line === 'string') {
    if(!this._matches(line)) {
      return cb(null, scope);
    }
    line = '' + line;
    line = line.replace(/\r?\n$/, '');
    this._assign(line);
  }

  var over = this._history.length > this.options.limit;
  if(!over) {
    this._write(flush, cb);
  }else{
    this._history.shift();
    this._sync(cb);
  }
}

HistoryFile.prototype._assign = function(data, opts) {
  if(!Array.isArray(data)) {
    data = [data];
  }
  opts = opts || {};
  if(opts.overwrite) {
    this._history = [].concat(data);
  }else{
    this._history = this._history.concat(data);
  }
  this.end();
}

/**
 *  Remove the last history item.
 *
 *  If this store is not set to flush to disc then this method
 *  acts like peek.
 *
 *  Truncates the history file when flushing to disc.
 *
 *  @param options The options.
 *  @param cb A callback function invoked when the history
 *  has been synced to disc or on error.
 */
HistoryFile.prototype.pop = function(options, cb) {
  if(typeof options === 'function') {
    cb = options;
    options = null;
  }
  options = options || {};
  var scope = this
    , flush = options.flush || this.options.flush;
  var item = this._history.pop();
  var contents = this.getLines();
  var len = Buffer.byteLength(item + EOL);
  cb = typeof cb === 'function' ? cb : noop;
  if(!flush) {
    // not flushing to disc, so this acts more like peek()
    this._history.push(item);
    return cb(null, item, scope);
  }
  var length = this._stats.size - len;
  fs.ftruncate(this._stream.fd, length, function(err) {
    if(err) {
      // TODO: we need to re-initialize from the state on disc
    }else{
      //scope._checkpoint = scope._history.length;
      scope._success();
    }
    cb(err, item, scope);
  })
}

HistoryFile.prototype._success = function() {
  this._checkpoint = this._history.length;
}

/**
 *  Remove all history items.
 *
 *  @param cb A callback function invoked when the history
 *  has been synced to disc or on error.
 */
HistoryFile.prototype.clear = function(cb) {
  var scope = this;
  fs.writeFile(this.file, '', function(err) {
    /* istanbul ignore if */
    if(err) return cb(err, scope);
    scope._assign([], {overwrite: true});
    scope._success();
    cb(null, scope);
  })
}

/**
 *  Closes the underlying stream.
 *
 *  @param cb A callback function invoked when the
 *  stream has finished or on error.
 */
HistoryFile.prototype.close = function(cb) {
  /* istanbul ignore else */
  if(this._stream) {
    this._stream.once('finish', cb);
    this._stream.end();
    this._stream = null;
  }
}

/**
 *  Write entire array to disc.
 *
 *  @param cb A callback function invoked when the
 *  write completes or on error.
 */
HistoryFile.prototype._sync = function(cb) {
  this._checkpoint = 0;
  this._write(this.getLines(), cb);
}

/**
 *  @private
 *
 *  Write to disc and update the internal stats upon successful write.
 */
HistoryFile.prototype._write = function(flush, cb) {
  var scope = this
    , contents = typeof flush === 'string' || flush instanceof Buffer
      ? flush : null;
  if(!flush || this._checkpoint === this._history.length) return cb(null, scope);
  var append = !contents;
  if(append) {
    contents = this.getLines();
  }
  function write(stream, cb) {
    stream.write(contents, function onwrite(err) {
      if(err) return cb(err, scope);
      scope.stats(function(err) {
        if(err) return cb(err, scope);
        //scope._checkpoint = scope._history.length;
        scope._success();
        cb(null, scope);
      });
    });
  }
  if(!append) {
    var st = fs.createWriteStream(this.file, {flags: 'w+'});
    write.call(scope, st, function(err) {
      st.end();
      if(err) return cb(err, scope);
      cb(null, scope);
    });
  }else{
    write.call(scope, this._stream, cb);
  }
}

/**
 *  @private
 *
 *  Filter lines that match an ignore pattern.
 *
 *  @param lines Array of lines.
 *
 *  @return Filtered array of lines or the original array
 *  if no ignore patterns are configured.
 */
HistoryFile.prototype._filter = function(lines) {
  if(!this.options.ignores) return lines;
  var scope = this;
  return lines.filter(function(line) {
    return scope._matches(line);
  })
}

HistoryFile.prototype._matches = function(line) {
  if(!this.options.ignores) return line;
  var ignores = this.options.ignores || [];
  if(ignores instanceof RegExp) {
    ignores = [ignores];
  }
  var i, re;
  for(i = 0;i < ignores.length;i++) {
    re = ignores[i];
    if((re instanceof RegExp) && re.test(line)) {
      return false;
    }
  }
  return line;
}

var History = function(options) {
  options = options || {};
  options.create = options.create !== undefined ? options.create : true;
  this.options = options;
}

util.inherits(History, events.EventEmitter);

History.prototype.load = function(options, cb) {
  var scope = this;
  if(typeof options === 'function') {
    cb = options;
    options = null;
  }
  options = options || {};
  var file = options.file || this.options.file
    , create = options.create !== undefined
      ? options.create : this.options.create;
  var opts = merge(this.options, {});
  opts = merge(options, opts);
  assert(file, 'cannot load history with no file');
  file = path.normalize(file);
  if(stores[file] && !opts.force) {
    return cb(null, stores[file]);
  }

  var store = new HistoryFile(this, opts);
  stores[file] = store;
  store.read(function(err) {
    cb(err, store, scope);
  })
}

/**
 *  Get a history store by file path or all stores.
 */
History.prototype.store = function(file) {
  if(file) return stores[file];
  return stores;
}

function history(options, cb) {
  var h = new History(options);
  if(cb) {
    assert(options && options.file,
      'must specify a file to load into the history');
    h.load(options, cb);
  }
  return h;
}

history.History = History;
history.HistoryFile = HistoryFile;

module.exports = history;
