import { createRoot } from 'react-dom/client';
import './main.css';
// @ts-ignore - App.jsx doesn't have TypeScript declarations
import App from './App'; // ✅ path updated - both files now in src folder

// Global error handler to suppress MetaMask and other third-party errors
window.addEventListener('error', (event) => {
  if (event.error && event.error.message && 
      (event.error.message.includes('MetaMask') || 
       event.error.message.includes('chrome-extension'))) {
    console.warn('Third-party extension error suppressed:', event.error.message);
    event.preventDefault();
    return false;
  }
});

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<App />);
}