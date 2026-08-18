import { describe, expect, it } from 'vitest';
import { SeededRng } from '../rng';

describe('SeededRng', () => {
  it('replays the same random sequence for the same seed', () => {
    const first = new SeededRng('carter-ford-1976');
    const second = new SeededRng('carter-ford-1976');

    expect(Array.from({ length: 12 }, () => first.next())).toEqual(
      Array.from({ length: 12 }, () => second.next()),
    );
  });

  it('keeps generated values within documented bounds', () => {
    const rng = new SeededRng(1976);
    for (let index = 0; index < 500; index += 1) {
      expect(rng.next()).toBeGreaterThanOrEqual(0);
      expect(rng.next()).toBeLessThan(1);
      expect(rng.nextInt(-3, 7)).toBeGreaterThanOrEqual(-3);
      expect(rng.nextInt(-3, 7)).toBeLessThanOrEqual(7);
    }
  });
});
