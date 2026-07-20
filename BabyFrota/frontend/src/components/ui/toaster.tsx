import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { useToastStore } from '@/stores/toast-store'
import { cn } from '@/lib/utils'

const ICONES = { success: CheckCircle2, error: XCircle, info: Info } as const

const ESTILOS = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  error: 'border-destructive/30 bg-destructive/10 text-destructive',
  info: 'border-border bg-card text-card-foreground',
} as const

/** Notificações de sucesso/erro para toda ação de criar, editar ou remover. Montado uma vez no AppLayout. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  const removeToast = useToastStore((s) => s.removeToast)

  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => {
        const Icone = ICONES[t.variant]
        return (
          <div
            key={t.id}
            role="status"
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-lg border p-3 shadow-lg animate-in slide-in-from-bottom-2 fade-in',
              ESTILOS[t.variant],
            )}
          >
            <Icone className="mt-0.5 size-5 shrink-0" />
            <div className="flex-1 text-sm">
              <p className="font-medium">{t.title}</p>
              {t.description && <p className="mt-0.5 text-xs opacity-80">{t.description}</p>}
            </div>
            <button type="button" onClick={() => removeToast(t.id)} className="shrink-0 opacity-60 hover:opacity-100">
              <X className="size-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
