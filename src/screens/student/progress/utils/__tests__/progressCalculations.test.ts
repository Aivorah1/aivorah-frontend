import { completionPercentage } from '../../../learning-paths/subjectProgress';

describe('completionPercentage', () => {
  test('divides completed by total normally', () => {
    expect(completionPercentage(2, 4)).toBe(50);
  });

  test('zero total topics has no percentage', () => {
    expect(completionPercentage(2, 0)).toBeNull();
    expect(completionPercentage(0, 0)).toBeNull();
  });

  test('caps at 100% when completed exceeds total (stale/mismatched curriculum denominator)', () => {
    expect(completionPercentage(5, 4)).toBe(100);
  });

  test('zero completed against a real total is a real 0%', () => {
    expect(completionPercentage(0, 10)).toBe(0);
  });
});
