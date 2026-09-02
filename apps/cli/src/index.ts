#!/usr/bin/env node
/**
 * Shebang entry. Delegates to `cli.run` so the same code path is used
 * by both the published bin/ and local development via `tsx`.
 */

import { run } from './cli.js';

void run(process.argv);
