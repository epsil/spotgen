var util = {}

/**
 * Replace Unicode characters with their ASCII equivalents.
 * @param {string} x - A string.
 * @return {string} - A new string.
 */
util.toAscii = function (str) {
  return str.replace(/[\u2018\u2019\u00b4]/g, "'")
    .replace(/[\u201c\u201d\u2033]/g, '"')
    .replace(/[\u2212\u2022\u00b7\u25aa]/g, '-')
    .replace(/[\u2013\u2015]/g, '-')
    .replace(/\u2014/g, '-')
    // .replace(/[\u2013\u2015]/g, '--')
    // .replace(/\u2014/g, '---')
    .replace(/\u2026/g, '...')
    .replace(/[ ]+\n/g, '\n')
    .replace(/\s*\\\n/g, '\\\n')
    .replace(/\s*\\\n\s*\\\n/g, '\n\n')
    .replace(/\s*\\\n\n/g, '\n\n')
    .replace(/\n-\n/g, '\n')
    .replace(/\n\n\s*\\\n/g, '\n\n')
    .replace(/\n\n\n*/g, '\n\n')
    .replace(/[ ]+$/gm, '')
    .replace(/^\s+|[\s\\]+$/g, '')
}

module.exports = util
