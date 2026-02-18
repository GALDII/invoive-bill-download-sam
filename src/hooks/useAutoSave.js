import { useEffect, useRef } from 'react';

export const useAutoSave = (data, saveFunction, delay = 2000) => {
  const timeoutRef = useRef(null);
  const lastSavedRef = useRef(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Skip auto-save on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      lastSavedRef.current = JSON.stringify(data);
      return;
    }

    const dataString = JSON.stringify(data);
    
    if (dataString !== lastSavedRef.current) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        saveFunction(data);
        lastSavedRef.current = dataString;
      }, delay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, saveFunction, delay]);
};

