/**
 * ==============================================================================
 * File: src/main.jsx
 * Description: Application Entry Point & React Root Mounting
 * 
 * Sets up:
 * 1. React.StrictMode
 * 2. BrowserRouter for client-side routing
 * 3. AuthProvider for global authentication state
 * 4. Tailwind CSS styling via index.css
 * ==============================================================================
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import './index.css';

// Mount React Root application
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
