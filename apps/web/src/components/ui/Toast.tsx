import * as RadixToast from '@radix-ui/react-toast'
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info'

interface ToastMessage {
  title:        string
  description?: string
  variant?:     ToastVariant
  durationMs?:  number
}

interface ToastItem extends ToastMessage {
  id:   string
  open: boolean
}

interface ToastCtx {
  toast: (msg: ToastMessage) => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const Ctx = createContext<ToastCtx | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toast = useCallback((msg: ToastMessage) => {
    const id = crypto.randomUUID()
    setToasts(prev => [...prev, { ...msg, id, open: true }])
  }, [])

  function close(id: string) {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, open: false } : t))
    // Remove after animation
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300)
  }

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <RadixToast.Provider swipeDirection="right" duration={4000}>
        {toasts.map(t => (
          <RadixToast.Root
            key={t.id}
            open={t.open}
            onOpenChange={open => !open && close(t.id)}
            duration={t.durationMs ?? 4000}
            className={['toast-root', t.variant ? `toast-root--${t.variant}` : ''].filter(Boolean).join(' ')}
          >
            <div className="toast-body">
              <RadixToast.Title className="toast-title">{t.title}</RadixToast.Title>
              {t.description && (
                <RadixToast.Description className="toast-description">
                  {t.description}
                </RadixToast.Description>
              )}
            </div>
            <RadixToast.Close className="toast-close" aria-label="Dismiss">
              <CloseIcon />
            </RadixToast.Close>
          </RadixToast.Root>
        ))}
        <RadixToast.Viewport className="toast-viewport" />
      </RadixToast.Provider>
    </Ctx.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast(): ToastCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

// ─── Icon ─────────────────────────────────────────────────────────────────────

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
