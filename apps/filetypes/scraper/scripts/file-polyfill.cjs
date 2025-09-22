// Polyfill File for Node.js 18 compatibility with undici
const { Blob } = require('node:buffer');

if (!global.File) {
  global.File = class File extends Blob {
    constructor(chunks, name, options) {
      super(chunks, options);
      this.name = name;
      this.lastModified = options?.lastModified || Date.now();
    }
  };
}