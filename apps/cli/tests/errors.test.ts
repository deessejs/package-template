import { describe, expect, it } from 'vitest';
import { ExitCode, InternalError, UserError, exitWithError } from '../src/errors.js';

describe('errors', () => {
  it('ExitCode is the documented 0/1/2 triple', () => {
    expect(ExitCode.Success).toBe(0);
    expect(ExitCode.UserError).toBe(1);
    expect(ExitCode.InternalError).toBe(2);
  });

  it('UserError carries exit code 1', () => {
    const err = new UserError('bad input');
    expect(err).toBeInstanceOf(Error);
    expect(err.exit).toBe(1);
    expect(err.message).toBe('bad input');
  });

  it('InternalError carries exit code 2', () => {
    const err = new InternalError('corpus unreadable');
    expect(err).toBeInstanceOf(Error);
    expect(err.exit).toBe(2);
    expect(err.message).toBe('corpus unreadable');
  });

  it('exitWithError prints [error] prefix and exits with UserError code', () => {
    const orig = process.exit;
    const origErr = console.error;
    let captured = { code: -1, message: '' };
    process.exit = ((code?: number) => {
      captured.code = code ?? -1;
      throw new Error('__exit__');
    }) as never;
    console.error = (msg: string) => {
      captured.message += msg;
    };
    try {
      try {
        exitWithError(new UserError('nope'));
      } catch (e) {
        expect((e as Error).message).toBe('__exit__');
      }
      expect(captured.code).toBe(1);
      expect(captured.message).toBe('[error] nope');
    } finally {
      process.exit = orig;
      console.error = origErr;
    }
  });

  it('exitWithError wraps a plain Error as InternalError', () => {
    const orig = process.exit;
    let captured = { code: -1, message: '' };
    process.exit = ((code?: number) => {
      captured.code = code ?? -1;
      throw new Error('__exit__');
    }) as never;
    const origErr = console.error;
    console.error = (msg: string) => {
      captured.message = msg;
    };
    try {
      try {
        exitWithError(new Error('boom'));
      } catch {
        // expected
      }
      expect(captured.code).toBe(2);
      expect(captured.message).toBe('[error] boom');
    } finally {
      process.exit = orig;
      console.error = origErr;
    }
  });
});
