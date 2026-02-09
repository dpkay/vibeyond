/**
 * @file main.tsx -- Application entry point.
 *
 * Mounts the root React component (`<App />`) into the DOM element with
 * id "root" (defined in `index.html`). The app is wrapped in React's
 * `<StrictMode>` to surface potential problems during development (e.g.
 * impure renders, missing cleanup in effects).
 *
 * Global CSS (Tailwind base styles, custom theme tokens, and nebula
 * background layers) is imported here via `./index.css` so it is
 * available throughout the entire component tree.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
