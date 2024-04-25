import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
// import 'antd/dist/antd.css';
import './shims.d.ts'
import App from './App.tsx';
import reportWebVitals from './reportWebVitals';
import AppContext from './GLOBAL_VARIABLE';
const someValue = 'someValue';
const root = ReactDOM.createRoot(document.getElementById('root'));
window.backend_url = "http://localhost:8000/"
root.render(
  <React.StrictMode>
    <AppContext.Provider value={someValue}>
    <App />
    </AppContext.Provider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
