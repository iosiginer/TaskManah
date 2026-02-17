import { useState, useCallback, useEffect, useRef } from 'react';
import Header from './components/Header';
import TaskCard from './components/TaskCard';
import TaskForm from './components/TaskForm';
import ConfirmDialog from './components/ConfirmDialog';
import Toast from './components/Toast';
import Auth from './components/Auth';
import { CATEGORIES } from './utils/constants';
import { generateId, getNextOccurrence, sortTasks } from './utils/helpers';
import * as storage from './utils/storage';
import { useAuth } from './hooks/useAuth';
import * as sync from './utils/sync';
import './App.css';

function App() {
  const { user, loading: authLoading, signIn, signUp, signOut, isConfigured } = useAuth();
  const [tasks, setTasks] = useState(() => storage.get('tasks', []));
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState(() => storage.get('sortBy', 'dueDate'));
  const [darkMode, setDarkMode] = useState(() => storage.get('darkMode', false));
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState(null);
  const [addButtonDisabled, setAddButtonDisabled] = useState(false);
  const hasMigrated = useRef(false);

  // Fetch tasks from Supabase when user signs in
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const init = async () => {
      // Migrate local tasks to Supabase on first sign-in
      if (!hasMigrated.current) {
        await sync.migrateLocalTasks(user.id);
        hasMigrated.current = true;
      }

      const remoteTasks = await sync.fetchTasks(user.id);
      if (!cancelled) {
        setTasks(remoteTasks);
      }
    };

    init();

    // Subscribe to real-time updates
    const unsubscribe = sync.subscribeToTasks(user.id, (updatedTasks) => {
      if (!cancelled) {
        setTasks(updatedTasks);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [user]);

  // Persist tasks to localStorage (always, for offline access)
  useEffect(() => {
    storage.set('tasks', tasks);
  }, [tasks]);

  // Persist sort preference
  useEffect(() => {
    storage.set('sortBy', sortBy);
  }, [sortBy]);

  // Persist dark mode
  useEffect(() => {
    storage.set('darkMode', darkMode);
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const showToast = useCallback((message, undoFn = null) => {
    setToast({ message, onUndo: undoFn });
  }, []);

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  const handleAddTask = useCallback((taskData) => {
    const newTask = {
      ...taskData,
      id: generateId(),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
    setShowForm(false);
    showToast('Task added');
    sync.addTask(newTask, user?.id);
  }, [showToast, user]);

  const handleEditTask = useCallback((taskData) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskData.id) return t;
        const updated = { ...t, ...taskData };
        sync.updateTask(updated, user?.id);
        return updated;
      })
    );
    setEditingTask(null);
    setShowForm(false);
    showToast('Task updated');
  }, [showToast, user]);

  const handleToggleTask = useCallback((taskId) => {
    setTasks((prev) => {
      let recurringTask = null;
      const updated = prev.map((t) => {
        if (t.id !== taskId) return t;
        const completed = !t.completed;
        if (completed && t.recurrence && t.recurrence !== 'none' && t.dueDate) {
          const nextDate = getNextOccurrence(t.dueDate, t.recurrence);
          if (nextDate) {
            recurringTask = {
              ...t,
              id: generateId(),
              completed: false,
              dueDate: nextDate,
              createdAt: new Date().toISOString(),
              completedAt: null,
            };
          }
        }
        const toggled = { ...t, completed, completedAt: completed ? new Date().toISOString() : null };
        sync.updateTask(toggled, user?.id);
        return toggled;
      });
      if (recurringTask) {
        sync.addTask(recurringTask, user?.id);
        return [recurringTask, ...updated];
      }
      return updated;
    });
    showToast('Task completed');
  }, [showToast, user]);

  const handleDeleteTask = useCallback((taskId) => {
    setConfirmDelete(taskId);
  }, []);

  const confirmDeleteTask = useCallback(() => {
    const taskToDelete = tasks.find((t) => t.id === confirmDelete);
    if (taskToDelete) {
      setTasks((prev) => prev.filter((t) => t.id !== confirmDelete));
      sync.deleteTask(confirmDelete, user?.id);
      showToast('Task deleted', () => {
        setTasks((prev) => [taskToDelete, ...prev]);
        sync.addTask(taskToDelete, user?.id);
        showToast('Task restored');
      });
    }
    setConfirmDelete(null);
  }, [confirmDelete, tasks, showToast, user]);

  const handleOpenForm = useCallback(() => {
    if (addButtonDisabled) return;
    setAddButtonDisabled(true);
    setEditingTask(null);
    setShowForm(true);
    setTimeout(() => setAddButtonDisabled(false), 300);
  }, [addButtonDisabled]);

  const handleOpenEdit = useCallback((task) => {
    setEditingTask(task);
    setShowForm(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    setEditingTask(null);
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut();
    showToast('Signed out');
  }, [signOut, showToast]);

  // Filter and sort tasks
  const activeTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  const filterTasks = (taskList) => {
    let filtered = taskList;
    if (activeCategory !== 'all') {
      filtered = filtered.filter((t) => t.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          (t.title && t.title.toLowerCase().includes(q)) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }
    return sortTasks(filtered, sortBy);
  };

  const filteredActive = filterTasks(activeTasks);
  const filteredCompleted = filterTasks(completedTasks);

  // Show loading spinner while checking auth
  if (authLoading) {
    return (
      <div className="app loading-screen">
        <p className="loading-text">Loading...</p>
      </div>
    );
  }

  // Show auth screen if Supabase is configured but user isn't signed in
  if (isConfigured && !user) {
    return (
      <div className="app" data-testid="auth-screen">
        <Auth onSignIn={signIn} onSignUp={signUp} />
      </div>
    );
  }

  return (
    <div className="app">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((d) => !d)}
        user={user}
        onSignOut={handleSignOut}
      />

      <main className="main-content">
        <nav className="category-tabs" role="tablist" aria-label="Task categories">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              className={`category-tab ${activeCategory === cat.value ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.value)}
              role="tab"
              aria-selected={activeCategory === cat.value}
              aria-label={`Filter by ${cat.label}`}
            >
              {cat.label}
            </button>
          ))}
        </nav>

        <section className="task-section" aria-label="Active tasks">
          {filteredActive.length === 0 ? (
            <div className="empty-state">
              <p className="empty-icon" aria-hidden="true">📋</p>
              <p className="empty-text">
                {searchQuery
                  ? 'No tasks match your search'
                  : activeCategory !== 'all'
                    ? 'No tasks in this category'
                    : 'No tasks yet. Tap + to add one!'}
              </p>
            </div>
          ) : (
            <div className="task-list">
              {filteredActive.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={handleToggleTask}
                  onEdit={handleOpenEdit}
                  onDelete={handleDeleteTask}
                />
              ))}
            </div>
          )}
        </section>

        {filteredCompleted.length > 0 && (
          <section className="task-section" aria-label="Completed tasks">
            <h2 className="section-title">Completed ({filteredCompleted.length})</h2>
            <div className="task-list">
              {filteredCompleted.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={handleToggleTask}
                  onEdit={handleOpenEdit}
                  onDelete={handleDeleteTask}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <button
        className="fab"
        onClick={handleOpenForm}
        disabled={addButtonDisabled}
        aria-label="Add new task"
      >
        +
      </button>

      {showForm && (
        <TaskForm
          task={editingTask}
          onSubmit={editingTask ? handleEditTask : handleAddTask}
          onCancel={handleCloseForm}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          message="Are you sure you want to delete this task? This action cannot be undone."
          onConfirm={confirmDeleteTask}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          onUndo={toast.onUndo}
          onDismiss={dismissToast}
        />
      )}
    </div>
  );
}

export default App;
