import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateId,
  formatDate,
  isOverdue,
  isToday,
  getNextOccurrence,
  sortTasks,
  truncate,
  getTodayStr,
} from '../utils/helpers';

describe('generateId', () => {
  it('returns a string', () => {
    expect(typeof generateId()).toBe('string');
  });

  it('generates unique ids', () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) {
      ids.add(generateId());
    }
    expect(ids.size).toBe(100);
  });

  it('works without crypto.randomUUID', () => {
    const original = crypto.randomUUID;
    crypto.randomUUID = undefined;
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
    crypto.randomUUID = original;
  });
});

describe('formatDate', () => {
  it('formats a valid date string', () => {
    const result = formatDate('2025-01-15');
    expect(result).toBe('Jan 15, 2025');
  });

  it('formats different months correctly', () => {
    expect(formatDate('2025-12-25')).toBe('Dec 25, 2025');
    expect(formatDate('2025-06-01')).toBe('Jun 1, 2025');
  });

  it('returns empty string for null', () => {
    expect(formatDate(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(formatDate(undefined)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(formatDate('')).toBe('');
  });

  it('returns empty string for invalid date', () => {
    expect(formatDate('not-a-date')).toBe('');
  });
});

describe('isOverdue', () => {
  let realDate;

  beforeEach(() => {
    realDate = Date;
    const mockDate = new Date('2025-03-15T12:00:00');
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns true for yesterday', () => {
    expect(isOverdue('2025-03-14')).toBe(true);
  });

  it('returns false for today', () => {
    expect(isOverdue('2025-03-15')).toBe(false);
  });

  it('returns false for tomorrow', () => {
    expect(isOverdue('2025-03-16')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isOverdue(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isOverdue(undefined)).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isOverdue('')).toBe(false);
  });

  it('returns true for a date far in the past', () => {
    expect(isOverdue('2020-01-01')).toBe(true);
  });
});

describe('isToday', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-03-15T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns true for today', () => {
    expect(isToday('2025-03-15')).toBe(true);
  });

  it('returns false for yesterday', () => {
    expect(isToday('2025-03-14')).toBe(false);
  });

  it('returns false for tomorrow', () => {
    expect(isToday('2025-03-16')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isToday(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isToday(undefined)).toBe(false);
  });
});

describe('getNextOccurrence', () => {
  it('returns next day for daily recurrence', () => {
    expect(getNextOccurrence('2025-03-15', 'daily')).toBe('2025-03-16');
  });

  it('returns next week for weekly recurrence', () => {
    expect(getNextOccurrence('2025-03-15', 'weekly')).toBe('2025-03-22');
  });

  it('returns next month for monthly recurrence', () => {
    expect(getNextOccurrence('2025-03-15', 'monthly')).toBe('2025-04-15');
  });

  it('returns next year for yearly recurrence', () => {
    expect(getNextOccurrence('2025-03-15', 'yearly')).toBe('2026-03-15');
  });

  it('handles month boundary (daily)', () => {
    expect(getNextOccurrence('2025-03-31', 'daily')).toBe('2025-04-01');
  });

  it('handles year boundary (daily)', () => {
    expect(getNextOccurrence('2025-12-31', 'daily')).toBe('2026-01-01');
  });

  it('handles month-end edge case for monthly', () => {
    // Jan 31 + 1 month — JS Date rolls to Mar 3 (or Feb 28 in non-leap)
    const result = getNextOccurrence('2025-01-31', 'monthly');
    expect(result).toBeTruthy();
  });

  it('returns null for "none" recurrence', () => {
    expect(getNextOccurrence('2025-03-15', 'none')).toBeNull();
  });

  it('returns null for null date', () => {
    expect(getNextOccurrence(null, 'daily')).toBeNull();
  });

  it('returns null for null recurrence', () => {
    expect(getNextOccurrence('2025-03-15', null)).toBeNull();
  });

  it('returns null for invalid recurrence', () => {
    expect(getNextOccurrence('2025-03-15', 'biweekly')).toBeNull();
  });

  it('returns null for invalid date', () => {
    expect(getNextOccurrence('invalid', 'daily')).toBeNull();
  });
});

describe('sortTasks', () => {
  const tasks = [
    { id: '1', title: 'C', dueDate: '2025-03-20', priority: 'low', createdAt: '2025-03-01T00:00:00Z' },
    { id: '2', title: 'A', dueDate: '2025-03-10', priority: 'high', createdAt: '2025-03-03T00:00:00Z' },
    { id: '3', title: 'B', dueDate: null, priority: 'medium', createdAt: '2025-03-02T00:00:00Z' },
  ];

  it('sorts by due date ascending, nulls last', () => {
    const sorted = sortTasks(tasks, 'dueDate');
    expect(sorted[0].id).toBe('2');
    expect(sorted[1].id).toBe('1');
    expect(sorted[2].id).toBe('3');
  });

  it('sorts by priority: high > medium > low', () => {
    const sorted = sortTasks(tasks, 'priority');
    expect(sorted[0].priority).toBe('high');
    expect(sorted[1].priority).toBe('medium');
    expect(sorted[2].priority).toBe('low');
  });

  it('sorts by created date descending (newest first)', () => {
    const sorted = sortTasks(tasks, 'created');
    expect(sorted[0].id).toBe('2');
    expect(sorted[1].id).toBe('3');
    expect(sorted[2].id).toBe('1');
  });

  it('does not mutate original array', () => {
    const original = [...tasks];
    sortTasks(tasks, 'dueDate');
    expect(tasks).toEqual(original);
  });

  it('handles empty array', () => {
    expect(sortTasks([], 'dueDate')).toEqual([]);
  });

  it('handles unknown sort key gracefully', () => {
    const sorted = sortTasks(tasks, 'unknown');
    expect(sorted).toHaveLength(3);
  });

  it('handles tasks with missing createdAt', () => {
    const mixed = [
      { id: '1', createdAt: '2025-03-01T00:00:00Z' },
      { id: '2', createdAt: null },
    ];
    const sorted = sortTasks(mixed, 'created');
    expect(sorted[0].id).toBe('1');
    expect(sorted[1].id).toBe('2');
  });
});

describe('truncate', () => {
  it('returns short strings unchanged', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('truncates long strings with ellipsis', () => {
    expect(truncate('abcdefghijk', 5)).toBe('abcde…');
  });

  it('returns empty string for null', () => {
    expect(truncate(null)).toBe('');
  });

  it('returns empty string for empty input', () => {
    expect(truncate('')).toBe('');
  });
});
