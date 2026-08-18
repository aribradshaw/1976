/**
 * Small deterministic pseudo-random number generator for simulations.
 *
 * Simulation code should receive an instance instead of calling Math.random so
 * a campaign can be replayed from its seed and exercised in tests.
 */
export interface RandomSource {
  next(): number;
  nextInt(minInclusive: number, maxInclusive: number): number;
  chance(probability: number): boolean;
  pick<T>(items: readonly T[]): T;
  fork(namespace: string): SeededRng;
}

export class SeededRng implements RandomSource {
  private state: number;
  readonly seed: number;

  constructor(seed: number | string) {
    this.seed = normalizeSeed(seed);
    this.state = this.seed;
  }

  /** Returns a deterministic value in the half-open range [0, 1). */
  next(): number {
    // Mulberry32: compact, fast, and adequate for a game simulation. This is
    // intentionally not suitable for security-sensitive randomness.
    let value = (this.state += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }

  nextInt(minInclusive: number, maxInclusive: number): number {
    if (!Number.isInteger(minInclusive) || !Number.isInteger(maxInclusive) || minInclusive > maxInclusive) {
      throw new RangeError('nextInt requires an ordered pair of integer bounds.');
    }

    return minInclusive + Math.floor(this.next() * (maxInclusive - minInclusive + 1));
  }

  chance(probability: number): boolean {
    if (!Number.isFinite(probability) || probability < 0 || probability > 1) {
      throw new RangeError('chance requires a probability between 0 and 1.');
    }

    return this.next() < probability;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new RangeError('Cannot pick from an empty collection.');
    }

    return items[this.nextInt(0, items.length - 1)];
  }

  /** Creates an independent deterministic stream for a named sub-system. */
  fork(namespace: string): SeededRng {
    return new SeededRng(`${this.seed}:${namespace}`);
  }
}

function normalizeSeed(seed: number | string): number {
  if (typeof seed === 'number') {
    if (!Number.isFinite(seed)) {
      throw new RangeError('A simulation seed must be finite.');
    }

    return (Math.floor(seed) >>> 0) || 0x9e3779b9;
  }

  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) || 0x9e3779b9;
}
