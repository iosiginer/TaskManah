import { describe, it, expect, beforeEach } from 'vitest';
import { get, set, remove, keys } from '../utils/storage';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('get', () => {
    it('returns defaultValue when key does not exist', () => {
      expect(get('nonexistent', 'default')).toBe('default');
    });

    it('returns null as default when no defaultValue provided', () => {
      expect(get('nonexistent')).toBeNull();
    });

    it('retrieves stored object', () => {
      localStorage.setItem('taskflow_test', JSON.stringify({ a: 1 }));
      expect(get('test')).toEqual({ a: 1 });
    });

    it('retrieves stored array', () => {
      localStorage.setItem('taskflow_items', JSON.stringify([1, 2, 3]));
      expect(get('items')).toEqual([1, 2, 3]);
    });

    it('retrieves stored string', () => {
      localStorage.setItem('taskflow_str', JSON.stringify('hello'));
      expect(get('str')).toBe('hello');
    });

    it('returns defaultValue for corrupted JSON', () => {
      localStorage.setItem('taskflow_bad', 'not-valid-json{{{');
      expect(get('bad', [])).toEqual([]);
    });

    it('returns defaultValue for corrupted data with default null', () => {
      localStorage.setItem('taskflow_bad', '{broken');
      expect(get('bad')).toBeNull();
    });
  });

  describe('set', () => {
    it('stores a value', () => {
      set('key1', { hello: 'world' });
      expect(JSON.parse(localStorage.getItem('taskflow_key1'))).toEqual({ hello: 'world' });
    });

    it('stores an array', () => {
      set('arr', [1, 2, 3]);
      expect(JSON.parse(localStorage.getItem('taskflow_arr'))).toEqual([1, 2, 3]);
    });

    it('overwrites existing value', () => {
      set('key1', 'first');
      set('key1', 'second');
      expect(JSON.parse(localStorage.getItem('taskflow_key1'))).toBe('second');
    });

    it('stores boolean false', () => {
      set('bool', false);
      expect(get('bool')).toBe(false);
    });
  });

  describe('remove', () => {
    it('removes an existing key', () => {
      set('toRemove', 'value');
      remove('toRemove');
      expect(localStorage.getItem('taskflow_toRemove')).toBeNull();
    });

    it('does not throw when removing non-existent key', () => {
      expect(() => remove('nonexistent')).not.toThrow();
    });
  });

  describe('keys', () => {
    it('returns empty array when no taskflow keys exist', () => {
      expect(keys()).toEqual([]);
    });

    it('returns only taskflow-prefixed keys', () => {
      localStorage.setItem('taskflow_a', '1');
      localStorage.setItem('taskflow_b', '2');
      localStorage.setItem('other_key', '3');
      const result = keys();
      expect(result).toContain('a');
      expect(result).toContain('b');
      expect(result).not.toContain('other_key');
      expect(result).toHaveLength(2);
    });

    it('returns keys without the prefix', () => {
      localStorage.setItem('taskflow_myKey', '1');
      expect(keys()).toContain('myKey');
    });
  });
});
