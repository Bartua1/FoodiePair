import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { publishableKey } from './lib/clerk'
import './index.css'
import './i18n/config'
import { Toaster } from 'sonner'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={publishableKey}
      afterSignOutUrl="/foodiepair/"
      signInUrl={import.meta.env.VITE_CLERK_SIGN_IN_URL}
      signUpUrl={import.meta.env.VITE_CLERK_SIGN_UP_URL}
      signInFallbackRedirectUrl={import.meta.env.VITE_CLERK_AFTER_SIGN_IN_URL}
    >
      <Toaster position="top-center" richColors />
      <App />
    </ClerkProvider>
  </StrictMode>,
)
