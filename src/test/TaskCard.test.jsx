import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TaskCard from '../components/TaskCard';

describe('TaskCard', () => {
  const mockTask = {
    id: 'task-1',
    title: 'Buy groceries',
    description: 'Milk, eggs, bread',
    dueDate: '2025-03-20',
    priority: 'high',
    category: 'shopping',
    recurrence: 'none',
    completed: false,
    createdAt: '2025-03-01T00:00:00Z',
  };

  const handlers = {
    onToggle: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-03-15T12:00:00'));
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the task title', () => {
    render(<TaskCard task={mockTask} {...handlers} />);
    expect(screen.getByText('Buy groceries')).toBeInTheDocument();
  });

  it('renders the description', () => {
    render(<TaskCard task={mockTask} {...handlers} />);
    expect(screen.getByText('Milk, eggs, bread')).toBeInTheDocument();
  });

  it('renders the priority badge', () => {
    render(<TaskCard task={mockTask} {...handlers} />);
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('renders the due date', () => {
    render(<TaskCard task={mockTask} {...handlers} />);
    expect(screen.getByText('Mar 20, 2025')).toBeInTheDocument();
  });

  it('shows overdue styling for past due dates', () => {
    const overdueTask = { ...mockTask, dueDate: '2025-03-10' };
    render(<TaskCard task={overdueTask} {...handlers} />);
    const card = screen.getByRole('article');
    expect(card.className).toContain('task-overdue');
  });

  it('does not show overdue styling for future dates', () => {
    render(<TaskCard task={mockTask} {...handlers} />);
    const card = screen.getByRole('article');
    expect(card.className).not.toContain('task-overdue');
  });

  it('shows completed styling', () => {
    const completedTask = { ...mockTask, completed: true };
    render(<TaskCard task={completedTask} {...handlers} />);
    const card = screen.getByRole('article');
    expect(card.className).toContain('task-completed');
  });

  it('calls onToggle when checkbox is clicked', () => {
    render(<TaskCard task={mockTask} {...handlers} />);
    fireEvent.click(screen.getByLabelText('Mark as complete'));
    expect(handlers.onToggle).toHaveBeenCalledWith('task-1');
  });

  it('calls onEdit when edit button is clicked', () => {
    render(<TaskCard task={mockTask} {...handlers} />);
    fireEvent.click(screen.getByLabelText('Edit task: Buy groceries'));
    expect(handlers.onEdit).toHaveBeenCalledWith(mockTask);
  });

  it('calls onDelete when delete button is clicked', () => {
    render(<TaskCard task={mockTask} {...handlers} />);
    fireEvent.click(screen.getByLabelText('Delete task: Buy groceries'));
    expect(handlers.onDelete).toHaveBeenCalledWith('task-1');
  });

  it('renders category label', () => {
    render(<TaskCard task={mockTask} {...handlers} />);
    expect(screen.getByText('shopping')).toBeInTheDocument();
  });

  it('renders recurrence indicator when set', () => {
    const recurringTask = { ...mockTask, recurrence: 'weekly' };
    render(<TaskCard task={recurringTask} {...handlers} />);
    expect(screen.getByText(/weekly/)).toBeInTheDocument();
  });

  it('does not render recurrence for "none"', () => {
    render(<TaskCard task={mockTask} {...handlers} />);
    expect(screen.queryByText(/↻/)).not.toBeInTheDocument();
  });

  it('shows "Mark as incomplete" for completed tasks', () => {
    const completedTask = { ...mockTask, completed: true };
    render(<TaskCard task={completedTask} {...handlers} />);
    expect(screen.getByLabelText('Mark as incomplete')).toBeInTheDocument();
  });
});
