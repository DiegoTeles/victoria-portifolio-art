import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { LocaleProvider } from './i18n/LocaleContext.tsx'
import { ThemeProvider } from './theme/ThemeContext.tsx'
import { Routes } from './routes/index.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <LocaleProvider>
        <Routes />
      </LocaleProvider>
    </ThemeProvider>
  </StrictMode>,
)
