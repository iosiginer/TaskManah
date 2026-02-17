import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

describe('App integration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2025-03-15T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the app with header', () => {
    render(<App />);
    expect(screen.getByText('TaskFlow')).toBeInTheDocument();
  });

  it('shows empty state initially', () => {
    render(<App />);
    expect(screen.getByText(/No tasks yet/)).toBeInTheDocument();
  });

  it('shows the FAB button', () => {
    render(<App />);
    expect(screen.getByLabelText('Add new task')).toBeInTheDocument();
  });

  it('opens the task form when FAB is clicked', () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText('Add new task'));
    expect(screen.getByText('New Task')).toBeInTheDocument();
  });

  it('adds a task and shows it in the list', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);

    // Open form
    fireEvent.click(screen.getByLabelText('Add new task'));

    // Fill title
    await user.type(screen.getByLabelText('Title *'), 'My first task');

    // Submit
    fireEvent.click(screen.getByText('Add Task'));

    // Task should appear
    expect(screen.getByText('My first task')).toBeInTheDocument();

    // Toast should show
    expect(screen.getByText('Task added')).toBeInTheDocument();
  });

  it('completes a task and moves it to completed section', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);

    // Add a task
    fireEvent.click(screen.getByLabelText('Add new task'));
    await user.type(screen.getByLabelText('Title *'), 'Task to complete');
    fireEvent.click(screen.getByText('Add Task'));

    // Complete it
    fireEvent.click(screen.getByLabelText('Mark as complete'));

    // Should show in completed section
    await waitFor(() => {
      expect(screen.getByText('Completed (1)')).toBeInTheDocument();
    });
  });

  it('deletes a task after confirmation', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);

    // Add a task
    fireEvent.click(screen.getByLabelText('Add new task'));
    await user.type(screen.getByLabelText('Title *'), 'Task to delete');
    fireEvent.click(screen.getByText('Add Task'));

    // Click delete
    fireEvent.click(screen.getByLabelText('Delete task: Task to delete'));

    // Confirm dialog should appear
    expect(screen.getByText(/Are you sure/)).toBeInTheDocument();

    // Confirm
    fireEvent.click(screen.getByLabelText('Confirm delete'));

    // Task should be gone
    await waitFor(() => {
      expect(screen.queryByText('Task to delete')).not.toBeInTheDocument();
    });

    // Toast should show
    expect(screen.getByText('Task deleted')).toBeInTheDocument();
  });

  it('filters tasks by category', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);

    // Add a task in "work" category
    fireEvent.click(screen.getByLabelText('Add new task'));
    await user.type(screen.getByLabelText('Title *'), 'Work task');
    await user.selectOptions(screen.getByLabelText('Category'), 'work');
    fireEvent.click(screen.getByText('Add Task'));

    // Wait for FAB to re-enable after double-click protection
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    // Add another task in "personal" category
    fireEvent.click(screen.getByLabelText('Add new task'));
    await user.type(screen.getByLabelText('Title *'), 'Personal task');
    await user.selectOptions(screen.getByLabelText('Category'), 'personal');
    fireEvent.click(screen.getByText('Add Task'));

    // Both should be visible under "All"
    expect(screen.getByText('Work task')).toBeInTheDocument();
    expect(screen.getByText('Personal task')).toBeInTheDocument();

    // Filter by Work
    fireEvent.click(screen.getByLabelText('Filter by Work'));

    // Only work task visible
    expect(screen.getByText('Work task')).toBeInTheDocument();
    expect(screen.queryByText('Personal task')).not.toBeInTheDocument();
  });

  it('creates next occurrence when completing a recurring task', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);

    // Add a recurring task
    fireEvent.click(screen.getByLabelText('Add new task'));
    await user.type(screen.getByLabelText('Title *'), 'Weekly meeting');

    // Set due date via the date input
    const dueDateInput = screen.getByLabelText('Due Date');
    fireEvent.change(dueDateInput, { target: { value: '2025-03-15' } });

    // Set recurrence
    await user.selectOptions(screen.getByLabelText('Repeat'), 'weekly');
    fireEvent.click(screen.getByText('Add Task'));

    // Complete the task
    fireEvent.click(screen.getByLabelText('Mark as complete'));

    // Should have the original (completed) and a new occurrence
    await waitFor(() => {
      const weeklyMeetings = screen.getAllByText('Weekly meeting');
      expect(weeklyMeetings.length).toBe(2);
    });
  });

  it('persists tasks across renders', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { unmount } = render(<App />);

    // Add a task
    fireEvent.click(screen.getByLabelText('Add new task'));
    await user.type(screen.getByLabelText('Title *'), 'Persistent task');
    fireEvent.click(screen.getByText('Add Task'));

    expect(screen.getByText('Persistent task')).toBeInTheDocument();

    // Unmount and re-render
    unmount();
    render(<App />);

    // Task should still be there
    expect(screen.getByText('Persistent task')).toBeInTheDocument();
  });
});
