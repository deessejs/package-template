import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const bin = join(__dirname, '..', 'bin', 'package-cli.mjs');

describe('Phase 0 scaffold', () => {
  it('exposes a package-cli.mjs executable', () => {
    expect(existsSync(bin)).toBe(true);
  });

  it('prints the version with --version', () => {
    const out = execFileSync('node', [bin, '--version'], { encoding: 'utf8' });
    expect(out.trim()).toBe('0.0.0');
  });

  it('prints a help screen with --help', () => {
    const out = execFileSync('node', [bin, '--help'], { encoding: 'utf8' });
    expect(out).toContain('Usage:');
    expect(out).toContain('package-cli');
  });

  it('errors on the placeholder "docs" subcommand', () => {
    let caught = false;
    try {
      execFileSync('node', [bin, 'docs'], { encoding: 'utf8', stdio: 'pipe' });
    } catch (err) {
      caught = true;
      const e = err as { stderr: Buffer; status: number | null };
      expect(e.status).toBe(2);
      expect(e.stderr.toString()).toContain('not implemented');
    }
    expect(caught).toBe(true);
  });
});

describe('source layout', () => {
  it('index.ts is a runnable stub', () => {
    const src = join(__dirname, '..', 'src', 'index.ts');
    expect(existsSync(src)).toBe(true);
    expect(readFileSync(src, 'utf8')).toContain('commander');
  });
});
