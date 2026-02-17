import { supabase } from './supabase';
import * as storage from './storage';

/**
 * Convert a task object from the app's camelCase format to the DB's snake_case format.
 */
function toDbRow(task, userId) {
  return {
    id: task.id,
    user_id: userId,
    title: task.title,
    description: task.description || '',
    due_date: task.dueDate || null,
    priority: task.priority || 'medium',
    category: task.category || 'personal',
    recurrence: task.recurrence || 'none',
    completed: task.completed || false,
    completed_at: task.completedAt || null,
    created_at: task.createdAt || new Date().toISOString(),
  };
}

/**
 * Convert a DB row (snake_case) to the app's camelCase task format.
 */
function fromDbRow(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    dueDate: row.due_date || null,
    priority: row.priority,
    category: row.category,
    recurrence: row.recurrence,
    completed: row.completed,
    completedAt: row.completed_at || null,
    createdAt: row.created_at,
  };
}

/**
 * Fetch all tasks for the authenticated user from Supabase.
 * Falls back to localStorage if Supabase is unavailable.
 */
export async function fetchTasks(userId) {
  if (!supabase || !userId) {
    return storage.get('tasks', []);
  }

  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const tasks = (data || []).map(fromDbRow);
    // Cache in localStorage for offline access
    storage.set('tasks', tasks);
    return tasks;
  } catch {
    // Network error — fall back to cached localStorage data
    return storage.get('tasks', []);
  }
}

/**
 * Add a task. Writes to Supabase if authenticated, always writes to localStorage.
 */
export async function addTask(task, userId) {
  if (supabase && userId) {
    try {
      const { error } = await supabase
        .from('tasks')
        .insert(toDbRow(task, userId));
      if (error) throw error;
    } catch {
      // Will sync later; localStorage has the task
    }
  }
}

/**
 * Update a task. Writes to Supabase if authenticated.
 */
export async function updateTask(task, userId) {
  if (supabase && userId) {
    try {
      const { error } = await supabase
        .from('tasks')
        .update(toDbRow(task, userId))
        .eq('id', task.id)
        .eq('user_id', userId);
      if (error) throw error;
    } catch {
      // Will sync later
    }
  }
}

/**
 * Delete a task. Removes from Supabase if authenticated.
 */
export async function deleteTask(taskId, userId) {
  if (supabase && userId) {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', userId);
      if (error) throw error;
    } catch {
      // Will sync later
    }
  }
}

/**
 * Subscribe to real-time changes on the tasks table for a given user.
 * Returns an unsubscribe function.
 */
export function subscribeToTasks(userId, onUpdate) {
  if (!supabase || !userId) return () => {};

  const channel = supabase
    .channel('tasks-realtime')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `user_id=eq.${userId}`,
      },
      () => {
        // Re-fetch all tasks on any change (keeps logic simple)
        fetchTasks(userId).then(onUpdate);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Migrate local tasks to the user's Supabase account on first sign-in.
 * Only migrates tasks that don't already exist in the remote DB.
 */
export async function migrateLocalTasks(userId) {
  if (!supabase || !userId) return;

  const localTasks = storage.get('tasks', []);
  if (localTasks.length === 0) return;

  try {
    // Fetch existing remote task IDs
    const { data: existing } = await supabase
      .from('tasks')
      .select('id')
      .eq('user_id', userId);

    const existingIds = new Set((existing || []).map((t) => t.id));
    const newTasks = localTasks.filter((t) => !existingIds.has(t.id));

    if (newTasks.length > 0) {
      const rows = newTasks.map((t) => toDbRow(t, userId));
      await supabase.from('tasks').insert(rows);
    }
  } catch {
    // Migration failed silently — local tasks remain in localStorage
  }
}
