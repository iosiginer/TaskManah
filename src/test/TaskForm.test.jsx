import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskForm from '../components/TaskForm';

describe('TaskForm', () => {
  const handlers = {
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2025-03-15T12:00:00'));
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('new task (no task prop)', () => {
    it('renders with "New Task" heading', () => {
      render(<TaskForm task={null} {...handlers} />);
      expect(screen.getByText('New Task')).toBeInTheDocument();
    });

    it('renders empty title field', () => {
      render(<TaskForm task={null} {...handlers} />);
      const input = screen.getByLabelText('Title *');
      expect(input.value).toBe('');
    });

    it('has disabled submit button when title is empty', () => {
      render(<TaskForm task={null} {...handlers} />);
      const submitBtn = screen.getByText('Add Task');
      expect(submitBtn).toBeDisabled();
    });

    it('enables submit button when title has text', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<TaskForm task={null} {...handlers} />);
      await user.type(screen.getByLabelText('Title *'), 'New task');
      expect(screen.getByText('Add Task')).not.toBeDisabled();
    });

    it('calls onSubmit with form data', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<TaskForm task={null} {...handlers} />);
      await user.type(screen.getByLabelText('Title *'), 'Test task');
      fireEvent.click(screen.getByText('Add Task'));
      expect(handlers.onSubmit).toHaveBeenCalledTimes(1);
      const submitted = handlers.onSubmit.mock.calls[0][0];
      expect(submitted.title).toBe('Test task');
      expect(submitted.priority).toBe('medium');
    });

    it('calls onCancel when cancel is clicked', () => {
      render(<TaskForm task={null} {...handlers} />);
      fireEvent.click(screen.getByText('Cancel'));
      expect(handlers.onCancel).toHaveBeenCalled();
    });

    it('does not submit with whitespace-only title', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<TaskForm task={null} {...handlers} />);
      await user.type(screen.getByLabelText('Title *'), '   ');
      expect(screen.getByText('Add Task')).toBeDisabled();
    });
  });

  describe('editing task', () => {
    const existingTask = {
      id: 'task-1',
      title: 'Buy groceries',
      description: 'Milk and eggs',
      dueDate: '2025-03-20',
      priority: 'high',
      category: 'shopping',
      recurrence: 'weekly',
    };

    it('renders with "Edit Task" heading', () => {
      render(<TaskForm task={existingTask} {...handlers} />);
      expect(screen.getByText('Edit Task')).toBeInTheDocument();
    });

    it('pre-fills the title', () => {
      render(<TaskForm task={existingTask} {...handlers} />);
      expect(screen.getByLabelText('Title *').value).toBe('Buy groceries');
    });

    it('pre-fills the description', () => {
      render(<TaskForm task={existingTask} {...handlers} />);
      expect(screen.getByLabelText('Description').value).toBe('Milk and eggs');
    });

    it('pre-fills the priority', () => {
      render(<TaskForm task={existingTask} {...handlers} />);
      expect(screen.getByLabelText('Priority').value).toBe('high');
    });

    it('pre-fills the category', () => {
      render(<TaskForm task={existingTask} {...handlers} />);
      expect(screen.getByLabelText('Category').value).toBe('shopping');
    });

    it('pre-fills the recurrence', () => {
      render(<TaskForm task={existingTask} {...handlers} />);
      expect(screen.getByLabelText('Repeat').value).toBe('weekly');
    });

    it('shows "Save Changes" button', () => {
      render(<TaskForm task={existingTask} {...handlers} />);
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });

    it('submits with updated data including the task id', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<TaskForm task={existingTask} {...handlers} />);
      const titleInput = screen.getByLabelText('Title *');
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated title');
      fireEvent.click(screen.getByText('Save Changes'));
      expect(handlers.onSubmit).toHaveBeenCalledTimes(1);
      const submitted = handlers.onSubmit.mock.calls[0][0];
      expect(submitted.id).toBe('task-1');
      expect(submitted.title).toBe('Updated title');
    });
  });

  describe('accessibility', () => {
    it('has proper dialog role', () => {
      render(<TaskForm task={null} {...handlers} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has aria-modal attribute', () => {
      render(<TaskForm task={null} {...handlers} />);
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    });

    it('focuses the title input on open', () => {
      render(<TaskForm task={null} {...handlers} />);
      expect(screen.getByLabelText('Title *')).toHaveFocus();
    });
  });
});
