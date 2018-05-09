var enumerable = process.env.CLI_TOOLKIT_DEBUG ? true : false;

function define(obj, name, value, writable, enumerate) {
  writable = writable !== undefined ? writable : false;
  enumerate = enumerate !== undefined ? enumerate : enumerable;
  Object.defineProperty(obj, name,
    {
      enumerable: enumerate,
      configurable: false,
      writable: writable,
      value: value
    }
  );
}

module.exports = define;
