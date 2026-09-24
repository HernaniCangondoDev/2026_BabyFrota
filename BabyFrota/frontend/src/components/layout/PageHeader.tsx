import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useTopbarStore } from '@/store/topbar-store'

/**
 * Nome, descrição e ações da tela. Não ocupa lugar no conteúdo da página: vai para a barra superior (Topbar), que fica
 * parada enquanto a página rola, então o nome da tela nunca some.
 */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  const slotTitulo = useTopbarStore((s) => s.titulo)
  const slotAcoes = useTopbarStore((s) => s.acoes)

  return (
    <>
      {slotTitulo &&
        createPortal(
          <div className="min-w-0 border-l pl-3 sm:pl-4">
            <h1 className="truncate text-base font-semibold leading-tight tracking-tight text-foreground sm:text-lg">{title}</h1>
            {description && (
              <p title={description} className="hidden text-xs leading-tight text-muted-foreground md:line-clamp-2">
                {description}
              </p>
            )}
          </div>,
          slotTitulo,
        )}
      {actions && slotAcoes && createPortal(actions, slotAcoes)}
    </>
  )
}
