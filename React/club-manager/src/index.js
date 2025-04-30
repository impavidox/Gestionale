import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import './styles/variables.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Make sure this line runs only after the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('root');
  
  // Check if the container exists
  if (container) {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } else {
    console.error("Container with ID 'root' not found in the DOM");
  }
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();