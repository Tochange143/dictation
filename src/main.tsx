import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';

const RouterComponent = (typeof window !== 'undefined' && (window.location.protocol === 'file:' || (window as any).electronAPI))
  ? HashRouter
  : BrowserRouter;

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <RouterComponent>
        <App />
      </RouterComponent>
    </React.StrictMode>
  );
}
