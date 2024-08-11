// React
import React from 'react'
import ReactDOM from 'react-dom/client'

// External dependencies
import {BrowserRouter} from "react-router-dom";

// Internal dependencies
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
  </React.StrictMode>,
)
