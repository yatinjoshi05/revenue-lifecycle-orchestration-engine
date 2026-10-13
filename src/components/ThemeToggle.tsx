import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex size-7 items-center justify-center rounded-control border border-border bg-background text-foreground hover:bg-muted outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring ${className}`}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? (
        <Sun className="size-3.5 text-amber-400 transition-transform hover:rotate-45" />
      ) : (
        <Moon className="size-3.5 text-foreground transition-transform hover:-rotate-12" />
      )}
    </button>
  );
};

export default ThemeToggle;
