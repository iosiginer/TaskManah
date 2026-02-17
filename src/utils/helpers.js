/**
 * Generate a unique ID using crypto API with timestamp fallback.
 */
export function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 11);
}

/**
 * Format a date string (YYYY-MM-DD) into a human-readable format.
 * Returns empty string for falsy input.
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  if (isNaN(date.getTime())) return '';
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Get today's date as YYYY-MM-DD in local timezone.
 */
export function getTodayStr() {
  const now = new Date();
  return now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0');
}

/**
 * Check if a date string is before today (overdue).
 * Returns false for falsy/invalid input.
 */
export function isOverdue(dateStr) {
  if (!dateStr) return false;
  const today = getTodayStr();
  return dateStr < today;
}

/**
 * Check if a date string is today.
 * Returns false for falsy/invalid input.
 */
export function isToday(dateStr) {
  if (!dateStr) return false;
  return dateStr === getTodayStr();
}

/**
 * Get the next occurrence date for a recurring task.
 * @param {string} currentDate - YYYY-MM-DD
 * @param {string} recurrence - 'daily' | 'weekly' | 'monthly' | 'yearly'
 * @returns {string} YYYY-MM-DD of next occurrence
 */
export function getNextOccurrence(currentDate, recurrence) {
  if (!currentDate || !recurrence || recurrence === 'none') return null;
  const date = new Date(currentDate + 'T00:00:00');
  if (isNaN(date.getTime())) return null;

  switch (recurrence) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      return null;
  }

  return date.getFullYear() + '-' +
    String(date.getMonth() + 1).padStart(2, '0') + '-' +
    String(date.getDate()).padStart(2, '0');
}

/**
 * Sort tasks by the given criterion.
 * @param {Array} tasks
 * @param {'dueDate' | 'priority' | 'created'} sortBy
 * @returns {Array} sorted copy
 */
export function sortTasks(tasks, sortBy = 'dueDate') {
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sorted = [...tasks];

  switch (sortBy) {
    case 'dueDate':
      sorted.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      });
      break;
    case 'priority':
      sorted.sort((a, b) => {
        const pa = priorityOrder[a.priority] ?? 3;
        const pb = priorityOrder[b.priority] ?? 3;
        return pa - pb;
      });
      break;
    case 'created':
      sorted.sort((a, b) => {
        if (!a.createdAt && !b.createdAt) return 0;
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return b.createdAt.localeCompare(a.createdAt);
      });
      break;
    default:
      break;
  }

  return sorted;
}

/**
 * Truncate a string to maxLen characters, adding ellipsis if needed.
 */
export function truncate(str, maxLen = 100) {
  if (!str) return '';
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '…';
}
