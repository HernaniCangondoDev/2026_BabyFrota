import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useClientes } from '@/features/clientes/api'
import type { Cliente } from '@/features/clientes/types'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

interface ClienteAutocompleteProps {
  clienteSelecionado: Cliente | null
  onSelecionar: (cliente: Cliente | null) => void
}

/** Busca de cliente por nome com resultados em dropdown — evita carregar a lista inteira. */
export function ClienteAutocomplete({ clienteSelecionado, onSelecionar }: ClienteAutocompleteProps) {
  const [busca, setBusca] = useState('')
  const buscaAtrasada = useDebouncedValue(busca, 400)
  const buscaValida = buscaAtrasada.trim().length >= 2
  const { data, isFetching } = useClientes({ nome: buscaValida ? buscaAtrasada : undefined, tamanhoPagina: 8 })
  const mostrarLista = busca.trim().length >= 2 && !clienteSelecionado

  if (clienteSelecionado) {
    return (
      <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
        <div>
          <p className="font-medium">{clienteSelecionado.nome}</p>
          <p className="text-xs text-muted-foreground">{clienteSelecionado.cpf}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            onSelecionar(null)
            setBusca('')
          }}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        className="pl-8"
        placeholder="Buscar cliente por nome (mín. 2 letras)..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />
      {mostrarLista && (
        <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
          {isFetching && <p className="p-3 text-sm text-muted-foreground">Buscando...</p>}
          {!isFetching && data?.itens.length === 0 && (
            <p className="p-3 text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
          )}
          {!isFetching &&
            data?.itens.map((cliente) => (
              <button
                key={cliente.id}
                type="button"
                className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-accent"
                onClick={() => {
                  onSelecionar(cliente)
                  setBusca('')
                }}
              >
                <span className="font-medium">{cliente.nome}</span>
                <span className="text-xs text-muted-foreground">{cliente.cpf}</span>
              </button>
            ))}
        </div>
      )}
    </div>
  )
}
