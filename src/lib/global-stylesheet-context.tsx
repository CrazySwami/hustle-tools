'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

// Type definitions
interface CSSVariable {
  name: string;
  value: string;
}

interface GlobalStylesheetContextType {
  // State
  globalCss: string;
  cssVariables: CSSVariable[];
  themeName: string;
  themeVersion: string;
  isLoading: boolean;
  error: string | null;

  // Actions
  setGlobalCss: (css: string) => void;
  pullFromWordPress: () => Promise<void>;
  pushToWordPress: () => Promise<void>;
  parseCssVariables: () => void;
}

// Create context
const GlobalStylesheetContext = createContext<GlobalStylesheetContextType | undefined>(undefined);

// CSS variable parser
function parseCssVars(css: string): CSSVariable[] {
  const variables: CSSVariable[] = [];

  // Match :root { ... } block
  const rootMatch = css.match(/:root\s*\{([^}]*)\}/);
  if (!rootMatch) return variables;

  const rootContent = rootMatch[1];

  // Match CSS variables --var-name: value;
  const varRegex = /--([\w-]+)\s*:\s*([^;]+);/g;
  let match;

  while ((match = varRegex.exec(rootContent)) !== null) {
    variables.push({
      name: `--${match[1]}`,
      value: match[2].trim()
    });
  }

  return variables;
}

// Provider component
export function GlobalStylesheetProvider({ children }: { children: React.ReactNode }) {
  const [globalCss, setGlobalCss] = useState<string>('');
  const [cssVariables, setCssVariables] = useState<CSSVariable[]>([]);
  const [themeName, setThemeName] = useState<string>('');
  const [themeVersion, setThemeVersion] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Parse CSS variables from current CSS
  const parseCssVariables = useCallback(() => {
    const vars = parseCssVars(globalCss);
    setCssVariables(vars);
    console.log('📊 Parsed CSS variables:', vars.length);
  }, [globalCss]);

  // Pull stylesheet from WordPress
  const pullFromWordPress = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('⬇️ Pulling stylesheet from WordPress...');

      // Check if WordPress Playground is available
      if (typeof window === 'undefined' || !(window as any).getWordPressStylesheet) {
        throw new Error('WordPress Playground not available. Please launch WordPress first.');
      }

      // Call WordPress Playground function
      const result = await (window as any).getWordPressStylesheet();

      setGlobalCss(result.css);
      setThemeName(result.themeName);
      setThemeVersion(result.themeVersion);

      // Auto-parse variables
      const vars = parseCssVars(result.css);
      setCssVariables(vars);

      console.log('✅ Stylesheet pulled successfully:', {
        theme: result.themeName,
        version: result.themeVersion,
        cssLength: result.css.length,
        variables: vars.length
      });

    } catch (err: any) {
      const errorMsg = err.message || 'Failed to pull stylesheet';
      setError(errorMsg);
      console.error('❌ Pull error:', errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Push stylesheet to WordPress
  const pushToWordPress = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('⬆️ Pushing stylesheet to WordPress...');

      // Check if WordPress Playground is available
      if (typeof window === 'undefined' || !(window as any).updateGlobalStylesheet) {
        throw new Error('WordPress Playground not available. Please launch WordPress first.');
      }

      // Call WordPress Playground function
      const result = await (window as any).updateGlobalStylesheet(globalCss);

      console.log('✅ Stylesheet pushed successfully:', result);

    } catch (err: any) {
      const errorMsg = err.message || 'Failed to push stylesheet';
      setError(errorMsg);
      console.error('❌ Push error:', errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [globalCss]);

  const value: GlobalStylesheetContextType = {
    globalCss,
    cssVariables,
    themeName,
    themeVersion,
    isLoading,
    error,
    setGlobalCss,
    pullFromWordPress,
    pushToWordPress,
    parseCssVariables
  };

  return (
    <GlobalStylesheetContext.Provider value={value}>
      {children}
    </GlobalStylesheetContext.Provider>
  );
}

// Hook to use the context
export function useGlobalStylesheet() {
  const context = useContext(GlobalStylesheetContext);
  if (context === undefined) {
    throw new Error('useGlobalStylesheet must be used within a GlobalStylesheetProvider');
  }
  return context;
}
