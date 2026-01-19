import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { publishableKey } from './lib/clerk'
import './index.css'
import './i18n/config'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={publishableKey} afterSignOutUrl="/">
      <App />
    </ClerkProvider>
  </StrictMode>,
)
