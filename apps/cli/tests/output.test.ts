import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { writeRecords, writeWarning } from '../src/output.js';

describe('output', () => {
  let stdoutChunks: string[];
  let stderrCalls: string[];
  let origOut: typeof process.stdout.write;
  let origErr: typeof console.error;

  beforeEach(() => {
    stdoutChunks = [];
    stderrCalls = [];
    origOut = process.stdout.write;
    origErr = console.error;
    process.stdout.write = ((chunk: string | Uint8Array) => {
      stdoutChunks.push(typeof chunk === 'string' ? chunk : chunk.toString());
      return true;
    }) as typeof process.stdout.write;
    // Spy on console.error (which is what writeWarning uses).
    console.error = (...args: unknown[]) => {
      stderrCalls.push(args.map((a) => (typeof a === 'string' ? a : String(a))).join(' '));
    };
  });

  afterEach(() => {
    process.stdout.write = origOut;
    console.error = origErr;
  });

  it('writeRecords writes one record per row, each terminated with \\n', () => {
    writeRecords(['a', 'b', 'c']);
    expect(stdoutChunks).toEqual(['a\n', 'b\n', 'c\n']);
  });

  it('writeRecords accepts any iterable', () => {
    writeRecords(new Set(['x', 'y']));
    expect(stdoutChunks).toEqual(['x\n', 'y\n']);
  });

  it('writeRecords writes nothing for an empty iterable', () => {
    writeRecords([]);
    expect(stdoutChunks).toEqual([]);
  });

  it('writeWarning writes [warn] <message> to stderr', () => {
    writeWarning('something off');
    expect(stderrCalls).toEqual(['[warn] something off']);
    expect(stdoutChunks).toEqual([]);
  });
});
