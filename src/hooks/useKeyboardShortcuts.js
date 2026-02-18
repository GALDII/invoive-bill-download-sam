import { useEffect } from 'react';

export const useKeyboardShortcuts = (shortcuts) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check for Ctrl/Cmd + key combinations
      const isModifierPressed = e.ctrlKey || e.metaKey;
      
      if (isModifierPressed) {
        const key = e.key.toLowerCase();
        const shortcut = shortcuts.find(s => s.key === key && (!s.shift || e.shiftKey));
        
        if (shortcut) {
          e.preventDefault();
          shortcut.action();
        }
      } else {
        // Check for single key shortcuts
        const shortcut = shortcuts.find(s => s.key === e.key && !s.ctrl && !s.shift);
        if (shortcut) {
          e.preventDefault();
          shortcut.action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

