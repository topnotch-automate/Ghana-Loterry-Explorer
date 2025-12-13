import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { SubscriptionProvider } from './contexts/SubscriptionContext'
import './index.css'

// Get user ID from localStorage (for MVP - replace with proper auth later)
const getUserId = () => {
  return localStorage.getItem('userId') || undefined;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SubscriptionProvider userId={getUserId()}>
      <App />
    </SubscriptionProvider>
  </React.StrictMode>,
)

