import React, { useState, createContext, useContext } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [grades, setGrades] = useState({});
  const [results, setResults] = useState(null);

  const value = {
    grades,
    setGrades,
    results,
    setResults,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === null) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}