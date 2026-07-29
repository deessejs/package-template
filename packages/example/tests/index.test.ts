import { describe, it, expect } from 'vitest';
import { helloWorld } from '../src/index.js';

describe('helloWorld', () => {
  it('should return "Hello, World!"', () => {
    expect(helloWorld()).toBe('Hello, World!');
  });
});
