// React
import React from 'react'
import ReactDOM from 'react-dom/client'

// External dependencies
import {BrowserRouter} from "react-router-dom";

// Internal dependencies
import App from './App.jsx'
import { ScrollProvider } from './ScrollContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
      <BrowserRouter>
          <ScrollProvider>
            <App />
          </ScrollProvider>
      </BrowserRouter>
  </React.StrictMode>,
)
