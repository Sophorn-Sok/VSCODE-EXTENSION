export function clamp(value: number, min: number, max: number): number {
  if (min > max) {
    throw new Error('min must not be greater than max');
  }
  return Math.min(Math.max(value, min), max);
}

export class Average {
  private total = 0;
  private count = 0;

  add(value: number): void {
    this.total += value;
    this.count += 1;
  }

  value(): number {
    if (this.count === 0) {
      return 0;
    }
    return this.total / this.count;
  }
}
