import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

const ThemeToggle: React.FC = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="theme-toggle-btn"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            <div className="icon-container">
                {theme === 'light' ? (
                    <Moon size={18} className="theme-icon moon" />
                ) : (
                    <Sun size={18} className="theme-icon sun" />
                )}
            </div>
            <span className="toggle-text">{theme === 'light' ? 'Dark' : 'Light'}</span>
        </button>
    );
};

export default ThemeToggle;
