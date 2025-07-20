import React from 'react';
import ReactDOM from 'react-dom/client';
import './main.css';
import App from '@/App';
import { BrowserRouter } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

/** The pictures for epic lack headers for the browser to cache the images, 
 * making the user experience painful with slow reloads. This worker acts as a cache 
 * for EPIC pictures
 */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('Service worker registered:', reg);
      })
      .catch(err => {
        console.error('Service worker registration failed:', err);
      });
  });
}
