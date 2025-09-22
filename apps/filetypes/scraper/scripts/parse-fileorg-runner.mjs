#!/usr/bin/env node

// Polyfill File for Node.js 18 compatibility with undici
import { Blob } from 'node:buffer';
global.File = class File extends Blob {
  constructor(chunks, name, options) {
    super(chunks, options);
    this.name = name;
    this.lastModified = options?.lastModified || Date.now();
  }
};

// Now import and run the actual script
await import('./parse-fileorg.mjs');