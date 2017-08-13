var _ = require('lodash')
var sort = require('./sort')

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
 * Group entries and interleave them.
 * @param {Function} fn - A grouping function.
 * Takes an entry as input and returns a grouping key,
 * a string, as output.
 * @return {Queue} - Itself.
 */
Queue.prototype.alternate = function (fn) {
  this.groupBy(fn)
  return this.interleave()
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
 * @return {boolean} - `true` if the queue contains `entry`,
 * `false` otherwise.
 */
Queue.prototype.contains = function (obj) {
  return this.indexOf(obj) >= 0
}

/**
 * Remove duplicate entries.
 * If a track occurs more than once, the version with
 * the highest Spotify popularity is preferred.
 * @return {Promise | Queue} - Itself.
 */
Queue.prototype.dedup = function () {
  var self = this
  var result = new Queue()
  return self.forEachPromise(function (entry) {
    if (!result.contains(entry)) {
      result.add(entry)
      return Promise.resolve(entry)
    } else {
      var idx = self.indexOf(entry)
      var other = result.get(idx)
      if (entry.equals(other)) {
        return Promise.resolve(other)
      } else {
        return other.getPopularity().then(function (otherPopularity) {
          return entry.getPopularity().then(function (entryPopularity) {
            if (entryPopularity > otherPopularity) {
              Queue.set(idx, entry)
            }
          })
        })
      }
    }
  }).then(function () {
    self.queue = result.toArray()
    return self
  })
}

/**
 * Dispatch all entries in sequence.
 * Ensure that only one entry is dispatched at a time.
 * @return {Promise | Queue} A queue of results.
 */
Queue.prototype.dispatch = function () {
  return this.forEachPromise(function (entry) {
    return entry.dispatch()
  })
}

/**
 * Filter the queue by a predicate.
 * @param {Function} fn - A predicate function.
 * Takes the current entry as input and returns
 * `true` if it passes the test, `false` otherwise.
 * @return {Queue} - A new queue.
 */
Queue.prototype.filter = function (fn) {
  return new Queue(this.toArray().filter(fn))
}

/**
 * Transform a nested queue into a flat queue.
 * `[1, [2, [3, [4]], 5]] => [1, 2, 3, 4, 5]`.
 * @return {Queue} - Itself.
 */
Queue.prototype.flatten = function () {
  this.queue = _.flattenDeep(this.toArray())
  return this
}

/**
 * Iterate over the queue.
 * @param {Function} fn - An iterator function.
 * Takes the current entry as input and returns
 * the modified value as output.
 * @return {Queue} - A new queue.
 */
Queue.prototype.forEach = function (fn) {
  return new Queue(this.queue.forEach(fn))
}

/**
 * Similar to Queue.forEach(), but with promises.
 * Each iteration must return a promise
 * (e.g., by invoking a promise-returning method).
 *
 * The execution is strictly sequential to prevent overloading
 * the server. (If parallel execution is needed, use a library
 * function like Promise.all() instead.)
 *
 * @param {Function} fn - An iterator function.
 * Takes an entry as input and returns a promise.
 * @return {Promise | Queue} A promise that invokes
 * each promise in sequence. The promise's value is
 * a queue of the values of each invoked promise.
 */
Queue.prototype.forEachPromise = function (fn) {
  var result = new Queue()
  var ready = Promise.resolve(null)
  this.queue.forEach(function (entry) {
    ready = ready.then(function () {
      return fn(entry)
    }).then(function (value) {
      result.add(value)
    }).catch(function () { })
  })
  return ready.then(function () {
    return result
  })
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
  this.groupBy(fn)
  return this.flatten()
}

/**
 * Group entries.
 * @param {Function} fn - A grouping function.
 * Takes an entry as input and returns a grouping key,
 * a string, as output.
 * @return {Queue} - Itself.
 */
Queue.prototype.groupBy = function (fn) {
  var result = _.groupBy(this.queue, fn)
  this.queue = _.forEach(result, _.identity)
  return this
}

/**
 * Get the index of an entry.
 * @param {Object} obj - The entry to find.
 * @return The index of `obj`, or `-1` if not found.
 * The indices start at 0.
 */
Queue.prototype.indexOf = function (obj) {
  return _.findIndex(this.queue, function (entry) {
    return entry === obj ||
      (entry && entry.similarTo &&
       obj && obj.similarTo &&
       entry.similarTo(obj))
  })
}

/**
 * Interleave a nested queue into a flat queue.
 * @return {Queue} - Itself.
 */
Queue.prototype.interleave = function () {
  this.queue = _.compact(_.flatten(_.zip.apply(null, this.toArray())))
  return this
}

/**
 * Whether the playlist is empty.
 * @return {boolean} - `true` if empty, `false` otherwise.
 */
Queue.prototype.isEmpty = function () {
  return this.size() <= 0
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
 * Reverse the order of the queue.
 * @return {Queue} - Itself.
 */
Queue.prototype.reverse = function () {
  this.queue.reverse()
  return this
}

/**
 * Set a playlist entry.
 * @param {integer} idx - The index of the entry.
 * The indices start at 0. If out of bounds,
 * the entry is added at the end.
 * @param {Object} entry - The entry to add.
 */
Queue.prototype.set = function (idx, entry) {
  if (idx < 0 || idx >= this.size()) {
    this.add(entry)
  } else {
    this.queue[idx] = entry
  }
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
  sort(this.queue, fn)
  return this
}

/**
 * Remove the first element from the queue.
 * @return {Object} - The first element, or `undefined`
 * if the queue is empty.
 */
Queue.prototype.shift = function () {
  return this.queue.shift()
}

/**
 * Shuffle the elements in the queue.
 * Uses the Fisher-Yates algorithm.
 * @return {Queue} - Itself.
 */
Queue.prototype.shuffle = function () {
  this.queue = _.shuffle(this.toArray())
  return this
}

/**
 * Convert queue to array.
 * @return {Array} An array of playlist entries.
 */
Queue.prototype.toArray = function () {
  var result = []
  for (var i in this.queue) {
    var entry = this.queue[i]
    if (entry instanceof Queue) {
      entry = entry.toArray()
    }
    result.push(entry)
  }
  return result
}

module.exports = Queue
