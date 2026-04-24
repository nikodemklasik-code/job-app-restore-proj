import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './neuro-friendly-themes.css';
import './theme-hierarchy.css';
import App from './App.tsx';
import { useThemeStore } from './stores/themeStore';

// Init theme before render
useThemeStore.getState().initTheme();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
