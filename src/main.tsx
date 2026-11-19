import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './ui/styles.css';
import { useGame } from './store/gameStore';
import { rt } from './systems/runtime';

// acesso para testes automáticos
(window as unknown as { __mm: unknown }).__mm = { useGame, rt };

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Funciona offline depois do primeiro carregamento
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => undefined));
}

// Evita zoom com gesto no iOS
document.addEventListener('gesturestart', (e) => e.preventDefault());
