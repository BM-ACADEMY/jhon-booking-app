import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Clear booking search state on full page reload/refresh
if (typeof sessionStorage !== 'undefined') {
  sessionStorage.removeItem('booking_location');
  sessionStorage.removeItem('booking_start_date');
  sessionStorage.removeItem('booking_end_date');
  sessionStorage.removeItem('booking_adults');
  sessionStorage.removeItem('booking_children');
  sessionStorage.removeItem('booking_rooms');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
