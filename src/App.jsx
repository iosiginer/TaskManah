import { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import TaskCard from './components/TaskCard';
import TaskForm from './components/TaskForm';
import ConfirmDialog from './components/ConfirmDialog';
import Toast from './components/Toast';
import { CATEGORIES } from './utils/constants';
import { generateId, getNextOccurrence, sortTasks } from './utils/helpers';
import * as storage from './utils/storage';
import './App.css';

function App() {
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

  // Persist tasks
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
  }, [showToast]);

  const handleEditTask = useCallback((taskData) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskData.id ? { ...t, ...taskData } : t))
    );
    setEditingTask(null);
    setShowForm(false);
    showToast('Task updated');
  }, [showToast]);

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
        return { ...t, completed, completedAt: completed ? new Date().toISOString() : null };
      });
      if (recurringTask) {
        return [recurringTask, ...updated];
      }
      return updated;
    });
    showToast('Task completed');
  }, [showToast]);

  const handleDeleteTask = useCallback((taskId) => {
    setConfirmDelete(taskId);
  }, []);

  const confirmDeleteTask = useCallback(() => {
    const taskToDelete = tasks.find((t) => t.id === confirmDelete);
    if (taskToDelete) {
      setTasks((prev) => prev.filter((t) => t.id !== confirmDelete));
      showToast('Task deleted', () => {
        setTasks((prev) => [taskToDelete, ...prev]);
        showToast('Task restored');
      });
    }
    setConfirmDelete(null);
  }, [confirmDelete, tasks, showToast]);

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

  return (
    <div className="app">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((d) => !d)}
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
