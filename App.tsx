import React, { useState, useEffect } from 'react';
import { APP_TABS, DEFAULT_TAB_ID, APP_THEME_LOCAL_STORAGE_KEY } from './constants';
import type { TabDefinition } from './types';
import TabButton from './components/TabButton';

const App: React.FC = () => {
  const [activeTabId, setActiveTabId] = useState<string>(DEFAULT_TAB_ID);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const storedTheme = localStorage.getItem(APP_THEME_LOCAL_STORAGE_KEY);
    return (storedTheme === 'light' || storedTheme === 'dark') ? storedTheme : 'dark'; // Default to dark
  });

  const ActiveComponent = APP_TABS.find(tab => tab.id === activeTabId)?.component;

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(APP_THEME_LOCAL_STORAGE_KEY, theme);
  }, [theme]);

  // Pass setTheme to AdminView if needed, or AdminView can manage its own toggle
  // For now, AdminView will directly manipulate localStorage and this useEffect will pick it up
  // Or, provide a context for theme if multiple components need to toggle it.
  // For simplicity, AdminView will update localStorage and App.tsx will react.
  // To make AdminView reflect current theme, pass `theme` as a prop.

  // Context for theme would be cleaner if many components need to set it.
  // For now, AdminView will read localStorage to set its toggle's initial state.

  return (
    // Ensure this top-level div also respects dark mode for its own background if body doesn't cover everything
    <div className="min-h-screen flex flex-col items-center justify-center p-2 sm:p-4 selection:bg-sky-500 selection:text-white bg-slate-100 dark:bg-slate-900 transition-colors duration-300">
      <div className="w-full max-w-5xl h-[calc(100vh-2rem)] sm:h-[calc(100vh-4rem)] bg-white dark:bg-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden border border-slate-300 dark:border-slate-700">
        {/* Tab Bar */}
        <div className="flex border-b border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 backdrop-blur-sm no-scrollbar overflow-x-auto">
          {APP_TABS.map((tab: TabDefinition) => (
            <TabButton
              key={tab.id}
              label={tab.label}
              icon={tab.icon ? <tab.icon className="w-5 h-5 mr-2 shrink-0" /> : undefined}
              isActive={tab.id === activeTabId}
              onClick={() => setActiveTabId(tab.id)}
            />
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-grow p-4 sm:p-6 overflow-y-auto bg-slate-100 dark:bg-slate-800/80">
          {/* Pass theme and setTheme to AdminView if it needs to directly control App's theme state */}
          {ActiveComponent ? (
            activeTabId === 'admin' && ActiveComponent === APP_TABS.find(t => t.id === 'admin')?.component 
            ? <ActiveComponent currentTheme={theme} setTheme={setTheme} /> 
            : <ActiveComponent />
          ) : <p className="text-slate-500 dark:text-slate-400">Select a tab to start.</p>}
        </div>
        <footer className="p-2 text-center text-xs text-slate-500 dark:text-slate-500 border-t border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          OS Tabbed Interface Demo
        </footer>
      </div>
    </div>
  );
};

export default App;