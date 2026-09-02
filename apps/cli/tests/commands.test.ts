import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const bin = join(__dirname, '..', 'bin', 'package-cli.mjs');

function run(args: string[]): { status: number; stdout: string; stderr: string } {
  try {
    const stdout = execFileSync('node', [bin, ...args], { encoding: 'utf8' });
    return { status: 0, stdout, stderr: '' };
  } catch (err) {
    const e = err as { status: number | null; stdout: Buffer; stderr: Buffer };
    return {
      status: e.status ?? -1,
      stdout: e.stdout?.toString() ?? '',
      stderr: e.stderr?.toString() ?? '',
    };
  }
}

describe('bin scaffold', () => {
  it('exposes a package-cli.mjs executable', () => {
    expect(existsSync(bin)).toBe(true);
  });

  it('--version prints the version', () => {
    const { status, stdout } = run(['--version']);
    expect(status).toBe(0);
    expect(stdout.trim()).toBe('0.0.0');
  });

  it('--help mentions the docs subcommand group', () => {
    const { status, stdout } = run(['--help']);
    expect(status).toBe(0);
    expect(stdout).toContain('docs');
  });

  it('docs --help mentions every subcommand', () => {
    const { status, stdout } = run(['docs', '--help']);
    expect(status).toBe(0);
    for (const cmd of ['ls', 'cat', 'grep', 'find', 'path', 'symbols']) {
      expect(stdout).toContain(cmd);
    }
  });
});

describe('per-subcommand stubs', () => {
  it('ls <path> parses the path and exits 2 (not implemented)', () => {
    const { status, stderr } = run(['docs', 'ls', '/']);
    expect(status).toBe(2);
    expect(stderr).toContain('ls is not implemented yet');
  });

  it('ls without <path> exits 2 (commander rejects missing required arg)', () => {
    const { status, stderr } = run(['docs', 'ls']);
    expect(status).toBeGreaterThan(0);
    expect(stderr).toMatch(/missing.*argument|required/i);
  });

  it('cat <symbol> parses the symbol and exits 2 (not implemented)', () => {
    const { status, stderr } = run(['docs', 'cat', 'Buffer']);
    expect(status).toBe(2);
    expect(stderr).toContain('cat is not implemented yet');
  });

  it('grep <pattern> parses and exits 2 (not implemented)', () => {
    const { status, stderr } = run(['docs', 'grep', 'resize']);
    expect(status).toBe(2);
    expect(stderr).toContain('grep is not implemented yet');
  });

  it('find <query> parses and exits 2 (not implemented)', () => {
    const { status, stderr } = run(['docs', 'find', 'Buffer']);
    expect(status).toBe(2);
    expect(stderr).toContain('find is not implemented yet');
  });

  it('path <name> parses and exits 2 (not implemented)', () => {
    const { status, stderr } = run(['docs', 'path', 'Buffer']);
    expect(status).toBe(2);
    expect(stderr).toContain('path is not implemented yet');
  });

  it('symbols takes no args and exits 2 (not implemented)', () => {
    const { status, stderr } = run(['docs', 'symbols']);
    expect(status).toBe(2);
    expect(stderr).toContain('symbols is not implemented yet');
  });

  it('symbols rejects extra args (commander enforces arity)', () => {
    const { status, stderr } = run(['docs', 'symbols', 'extra']);
    expect(status).toBeGreaterThan(0);
    expect(stderr).toMatch(/unknown argument|too many/i);
  });
});

describe('global flag', () => {
  it('--corpus <path> is accepted on the root command', () => {
    const { status, stderr } = run(['--corpus', '/tmp/corpus', 'docs', 'symbols']);
    expect(status).toBe(2);
    expect(stderr).toContain('symbols is not implemented yet');
  });
});
