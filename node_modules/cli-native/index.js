var native = {
  to: function(str, delimiter, json) {
    if(typeof(str) != 'string') return str;
    if(str === 'true') return true;
    if(str === 'false') return false;
    if(str === 'null') return null;
    if(str === 'undefined') return undefined;
    var num = Number(str);
    if(!isNaN(num)) return num;
    if(str && json && /^["{\[]/.test(str)) {
      return JSON.parse(str);
    }
    if(str && delimiter && ~str.indexOf(delimiter)) {
      var arr = str.split(delimiter);
      for(var i = 0;i < arr.length;i++) {
        arr[i] = native.to(arr[i], delimiter, json);
      }
      return arr;
    }
    return str;
  },
  from: function(val, delimiter, json) {
    if(delimiter && Array.isArray(val)) return val.join(delimiter);
    if(json && val && (typeof val == 'object')) return JSON.stringify(val);
    return '' + val;
  }
}

module.exports = native;
