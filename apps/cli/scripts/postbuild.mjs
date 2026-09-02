import { chmodSync, } from 'node:fs';
import { dirname, join, } from 'node:path';
import { fileURLToPath, } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const bin = join(__dirname, '..', 'bin', 'package-cli.mjs');
chmodSync(bin, 0o755);