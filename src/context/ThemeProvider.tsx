import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoaded } = useUser();
  const [theme, setTheme] = useState<Theme>('light');

  // Load theme from Clerk metadata or local storage
  useEffect(() => {
    if (isLoaded && user) {
      // Check both public and unsafe metadata for transition, but prefer unsafe for client-side
      const savedTheme = (user.unsafeMetadata?.theme || user.publicMetadata?.theme) as Theme;
      if (savedTheme) {
        setTheme(savedTheme);
      } else {
        // Fallback to system preference if no metadata
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        setTheme(systemTheme);
      }
    } else {
       // While loading or unauthenticated, check localStorage
       const localTheme = localStorage.getItem('theme') as Theme;
       if (localTheme) {
         setTheme(localTheme);
       }
    }
  }, [isLoaded, user]);

  // Apply theme to document element
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);

    if (user) {
      try {
        await user.update({
          unsafeMetadata: {
            ...user.unsafeMetadata,
            theme: newTheme,
          },
        });
      } catch (error) {
        console.error('Failed to update theme in Clerk metadata:', error);
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
