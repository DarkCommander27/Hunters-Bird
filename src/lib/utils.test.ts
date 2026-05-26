import { describe, expect, it } from 'vitest';
import { formatConfidence, formatDate, formatTime } from './utils';

describe('utils', () => {
  it('formats confidence scores as rounded percentages', () => {
    expect(formatConfidence(0.456)).toBe('46%');
  });

  it('formats dates using the app locale', () => {
    const timestamp = new Date(2024, 0, 15, 12, 30).getTime();

    expect(formatDate(timestamp)).toBe('Jan 15, 2024');
  });

  it('formats times using the app locale', () => {
    const timestamp = new Date(2024, 0, 15, 12, 5).getTime();

    expect(formatTime(timestamp)).toBe('12:05 PM');
  });
});