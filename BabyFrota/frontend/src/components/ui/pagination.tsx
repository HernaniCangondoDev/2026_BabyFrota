import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PaginationProps {
  pagina: number
  totalPaginas: number
  totalRegistros: number
  tamanhoPagina: number
  onPageChange: (pagina: number) => void
}

/** Navegação de página (anterior/próxima) — o seletor de "itens por página" fica no topo (ver PageSizeSelect). */
export function Pagination({ pagina, totalPaginas, totalRegistros, tamanhoPagina, onPageChange }: PaginationProps) {
  if (totalRegistros === 0) return null

  const inicio = (pagina - 1) * tamanhoPagina + 1
  const fim = Math.min(pagina * tamanhoPagina, totalRegistros)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm text-muted-foreground">
      <span>
        {inicio}–{fim} de {totalRegistros} registros
      </span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onPageChange(pagina - 1)} disabled={pagina <= 1}>
          <ChevronLeft className="size-4" /> Anterior
        </Button>
        <span className="tabular-nums">Página {pagina} de {Math.max(totalPaginas, 1)}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagina + 1)}
          disabled={pagina >= totalPaginas}
        >
          Próxima <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
