function complex(o) {
  return Array.isArray(o) || (o && (typeof(o) == 'object'));
}

function taint(source) { source.__visited = true; }
function untaint(source) { delete source.__visited; }

module.exports = {
  complex: complex,
  taint: taint,
  untaint: untaint
}
