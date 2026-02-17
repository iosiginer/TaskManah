import { useSwipe } from '../hooks/useSwipe';
import { formatDate, isOverdue, isToday, truncate } from '../utils/helpers';

const PRIORITY_LABELS = { high: 'High', medium: 'Med', low: 'Low' };

export default function TaskCard({ task, onToggle, onEdit, onDelete }) {
  const { elementRef, onTouchStart, onTouchMove, onTouchEnd } = useSwipe(
    () => onDelete(task.id)
  );

  const overdue = !task.completed && isOverdue(task.dueDate);
  const today = !task.completed && isToday(task.dueDate);

  return (
    <div
      className={`task-card ${task.completed ? 'task-completed' : ''} ${overdue ? 'task-overdue' : ''} ${today ? 'task-today' : ''}`}
      ref={elementRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      role="article"
      aria-label={`Task: ${task.title}${task.completed ? ', completed' : ''}${overdue ? ', overdue' : ''}`}
    >
      <div className="task-card-swipe-bg" aria-hidden="true">
        <span>Delete</span>
      </div>
      <div className="task-card-content">
        <div className="task-card-header">
          <button
            className={`task-checkbox ${task.completed ? 'checked' : ''}`}
            onClick={() => onToggle(task.id)}
            aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
            aria-pressed={task.completed}
          >
            {task.completed && <span className="checkmark">✓</span>}
          </button>
          <div className="task-card-info">
            <h3 className="task-title" title={task.title}>
              {truncate(task.title, 80)}
            </h3>
            {task.description && (
              <p className="task-description">{truncate(task.description, 120)}</p>
            )}
          </div>
          <span className={`priority-badge priority-${task.priority || 'medium'}`}>
            {PRIORITY_LABELS[task.priority] || 'Med'}
          </span>
        </div>
        <div className="task-card-footer">
          <div className="task-meta">
            {task.dueDate && (
              <span className={`task-due ${overdue ? 'overdue' : ''} ${today ? 'today' : ''}`}>
                {overdue ? 'Overdue: ' : today ? 'Today' : ''}{!today ? formatDate(task.dueDate) : ''}
              </span>
            )}
            {task.category && task.category !== 'other' && (
              <span className="task-category">{task.category}</span>
            )}
            {task.recurrence && task.recurrence !== 'none' && (
              <span className="task-recurrence">↻ {task.recurrence}</span>
            )}
          </div>
          <div className="task-actions">
            <button
              className="btn-icon"
              onClick={() => onEdit(task)}
              aria-label={`Edit task: ${task.title}`}
            >
              ✎
            </button>
            <button
              className="btn-icon btn-icon-danger"
              onClick={() => onDelete(task.id)}
              aria-label={`Delete task: ${task.title}`}
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
