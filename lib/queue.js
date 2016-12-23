/**
 * Create a queue of playlist entries.
 * @constructor
 * @param {Array} [arr] - An array of playlist entries.
 */
function Queue (arr) {
  /**
   * Array of entries.
   */
  this.queue = []

  if (arr) {
    this.queue = arr
  }
}

/**
 * Add an entry to the end of the queue.
 * @param {Track | Album | Artist} entry -
 * The entry to add.
 */
Queue.prototype.add = function (entry) {
  this.queue.push(entry)
}

/**
 * Concatenate with another queue.
 * @param {Queue} queue - Another queue to append to this queue.
 * @return {Queue} - A new queue containing all the entries
 * from this queue followed by all the entries from the other queue.
 */
Queue.prototype.concat = function (queue) {
  return new Queue(this.toArray().concat(queue.toArray()))
}

/**
 * Whether the queue contains an entry.
 * @param {Track | Album | Artist} entry -
 * The entry to check for.
 * @return {boolean} - `true` is the queue contains `entry`,
 * `false` otherwise.
 */
Queue.prototype.contains = function (obj) {
  for (var i in this.queue) {
    var entry = this.queue[i]
    if ((entry && entry.equals &&
         obj && obj.equals &&
         entry.equals(obj)) ||
        entry === obj) {
      return true
    }
  }
  return false
}

/**
 * Remove duplicate entries.
 * @return {Queue} - Itself.
 */
Queue.prototype.dedup = function () {
  var result = new Queue()
  this.queue.forEach(function (entry) {
    if (!result.contains(entry)) {
      result.add(entry)
    }
  })
  this.queue = result.toArray()
  return this
}

/**
 * Dispatch all entries in sequence.
 * Ensure that only one entry is dispatched at a time.
 * @return {Promise | Queue} A queue of results.
 */
Queue.prototype.dispatch = function () {
  return this.resolveAll(function (entry) {
    return entry.dispatch()
  })
}

/**
 * Transform a nested queue into a flat queue.
 * @return {Queue} - Itself.
 */
Queue.prototype.flatten = function () {
  var result = []
  for (var i in this.queue) {
    var entry = this.queue[i]
    if (entry instanceof Queue) {
      entry = entry.flatten()
      result = result.concat(entry.queue)
    } else {
      result.push(entry)
    }
  }
  this.queue = result
  return this
}

/**
 * Iterate over the queue.
 * @param {Function} fn - An iterator function.
 * Takes the current entry as input and returns
 * the modified value as output.
 * @return {Queue} - Itself.
 */
Queue.prototype.forEach = function (fn) {
  this.queue.forEach(fn)
  return this
}

/**
 * Get a playlist entry.
 * @param {integer} idx - The index of the entry.
 * The indices start at 0.
 */
Queue.prototype.get = function (idx) {
  return this.queue[idx]
}

/**
 * Group entries.
 * @param {Function} fn - A grouping function.
 * Takes an entry as input and returns a grouping key,
 * a string, as output.
 * @return {Queue} - Itself.
 */
Queue.prototype.group = function (fn) {
  var map = []
  var result = []
  for (var i in this.queue) {
    var entry = this.queue[i]
    var key = fn(entry)

    if (!map[key]) {
      map[key] = []
    }
    map[key].push(entry)
  }
  for (var k in map) {
    result = result.concat(map[k])
  }
  this.queue = result
  return this
}

/**
 * Map a function over the queue.
 * @param {Function} fn - An iterator function.
 * Takes the current entry as input and returns
 * the modified value as output.
 * @return {Queue} - A new queue.
 */
Queue.prototype.map = function (fn) {
  return new Queue(this.toArray().map(fn))
}

/**
 * Resolve all entries in sequence.
 * Ensure that only one entry is resolved at a time.
 * @param {Function} fn - A resolving function.
 * Takes an entry as input and invokes a Promise-returning
 * method on it.
 * @return {Promise | Queue} A queue of results.
 */
Queue.prototype.resolveAll = function (fn) {
  // we could have used Promise.all(), but we choose to roll our
  // own, sequential implementation to avoid overloading the server
  var result = new Queue()
  var ready = Promise.resolve(null)
  this.queue.forEach(function (entry) {
    ready = ready.then(function () {
      return fn(entry)
    }).then(function (value) {
      result.add(value)
    }, function () { })
  })
  return ready.then(function () {
    return result
  })
}

/**
 * The playlist size.
 * @return {integer} - The number of entries.
 */
Queue.prototype.size = function () {
  return this.queue.length
}

/**
 * Slice a queue.
 * @param {integer} start - The index of the first element.
 * @param {integer} end - The index of the last element (not included).
 * @return {Queue} - A new queue containing all elements
 * from `start` (inclusive) to `end` (exclusive).
 */

Queue.prototype.slice = function (start, end) {
  return new Queue(this.toArray().slice(start, end))
}

/**
 * Sort the queue.
 * @param {Function} fn - A sorting function.
 * Takes two entries as input and returns
 * `-1` if the first entry is less than the second,
 * `1` if the first entry is greater than the second, and
 * `0` if the entries are equal.
 * @return {Queue} - Itself.
 */
Queue.prototype.sort = function (fn) {
  this.queue = this.queue.sort(fn)
  return this
}

/**
 * Convert queue to array.
 * @return {Array} An array of playlist entries.
 */
Queue.prototype.toArray = function () {
  return this.queue
}

module.exports = Queue
