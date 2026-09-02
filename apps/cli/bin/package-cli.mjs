#!/usr/bin/env node
import('../dist/index.js').catch((err) => {
  console.error('[error]', err.message);
  process.exit(2);
});