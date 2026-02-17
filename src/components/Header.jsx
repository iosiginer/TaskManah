import { useState, useRef, useEffect } from 'react';
import { SORT_OPTIONS } from '../utils/constants';

export default function Header({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  darkMode,
  onToggleDarkMode,
  user,
  onSignOut,
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  return (
    <header className="app-header">
      <div className="header-top">
        <h1 className="app-title">TaskFlow</h1>
        <div className="header-actions">
          <button
            className="btn-icon header-btn"
            onClick={() => {
              setSearchOpen(!searchOpen);
              if (searchOpen) onSearchChange('');
            }}
            aria-label={searchOpen ? 'Close search' : 'Open search'}
            aria-expanded={searchOpen}
          >
            {searchOpen ? '✕' : '🔍'}
          </button>
          <div className="sort-wrapper">
            <label htmlFor="sort-select" className="sr-only">Sort tasks by</label>
            <select
              id="sort-select"
              className="sort-select"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              aria-label="Sort tasks by"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <button
            className="btn-icon header-btn"
            onClick={onToggleDarkMode}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? '☀' : '🌙'}
          </button>
          {user && (
            <button
              className="btn-icon header-btn"
              onClick={onSignOut}
              aria-label="Sign out"
              title={user.email}
            >
              ⏻
            </button>
          )}
        </div>
      </div>
      {searchOpen && (
        <div className="search-bar">
          <input
            ref={searchInputRef}
            type="text"
            className="search-input"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search tasks by title or description"
          />
        </div>
      )}
    </header>
  );
}
