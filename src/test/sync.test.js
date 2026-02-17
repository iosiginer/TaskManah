import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase as null (not configured) before importing sync
vi.mock('../utils/supabase', () => ({ supabase: null }));

import { fetchTasks, addTask, updateTask, deleteTask, subscribeToTasks, migrateLocalTasks } from '../utils/sync';
import * as storage from '../utils/storage';

describe('sync layer (Supabase not configured)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('fetchTasks', () => {
    it('returns tasks from localStorage when no userId', async () => {
      storage.set('tasks', [{ id: '1', title: 'Local task' }]);
      const tasks = await fetchTasks(null);
      expect(tasks).toEqual([{ id: '1', title: 'Local task' }]);
    });

    it('returns tasks from localStorage when Supabase is null', async () => {
      storage.set('tasks', [{ id: '2', title: 'Cached task' }]);
      const tasks = await fetchTasks('user-123');
      expect(tasks).toEqual([{ id: '2', title: 'Cached task' }]);
    });

    it('returns empty array when no tasks exist', async () => {
      const tasks = await fetchTasks(null);
      expect(tasks).toEqual([]);
    });
  });

  describe('addTask', () => {
    it('does not throw when Supabase is null', async () => {
      await expect(addTask({ id: '1', title: 'Test' }, 'user-123')).resolves.not.toThrow();
    });

    it('does not throw with no userId', async () => {
      await expect(addTask({ id: '1', title: 'Test' }, null)).resolves.not.toThrow();
    });
  });

  describe('updateTask', () => {
    it('does not throw when Supabase is null', async () => {
      await expect(updateTask({ id: '1', title: 'Updated' }, 'user-123')).resolves.not.toThrow();
    });
  });

  describe('deleteTask', () => {
    it('does not throw when Supabase is null', async () => {
      await expect(deleteTask('task-1', 'user-123')).resolves.not.toThrow();
    });
  });

  describe('subscribeToTasks', () => {
    it('returns a no-op unsubscribe function when Supabase is null', () => {
      const unsub = subscribeToTasks('user-123', vi.fn());
      expect(typeof unsub).toBe('function');
      expect(() => unsub()).not.toThrow();
    });

    it('returns a no-op unsubscribe function with no userId', () => {
      const unsub = subscribeToTasks(null, vi.fn());
      expect(typeof unsub).toBe('function');
    });
  });

  describe('migrateLocalTasks', () => {
    it('does not throw when Supabase is null', async () => {
      storage.set('tasks', [{ id: '1', title: 'Local' }]);
      await expect(migrateLocalTasks('user-123')).resolves.not.toThrow();
    });

    it('does not throw with no userId', async () => {
      await expect(migrateLocalTasks(null)).resolves.not.toThrow();
    });
  });
});
