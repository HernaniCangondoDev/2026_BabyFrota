import { useId, useMemo, useState, type KeyboardEvent } from 'react'
import { Search, Tag, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { CarrinhoDisponivel } from '@/features/locacoes/types'
import { cn } from '@/lib/utils'

const MAX_RESULTADOS = 8

/** O código de barras da etiqueta é o id do carrinho com 6 dígitos (ver EtiquetasPage). */
function codigoDe(carrinho: CarrinhoDisponivel): string {
  return String(carrinho.id).padStart(6, '0')
}

/** Sem acento e sem maiúsculas, para "bebê" achar "Bebe" e vice-versa. */
function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
}

interface CarrinhoAutocompleteProps {
  id?: string
  /** Carrinhos disponíveis. A lista já vem inteira do servidor, então o filtro é local e instantâneo. */
  carrinhos: CarrinhoDisponivel[] | undefined
  carregando: boolean
  selecionado: CarrinhoDisponivel | null
  onSelecionar: (carrinho: CarrinhoDisponivel | null) => void
  onVerPrecos: (carrinho: CarrinhoDisponivel) => void
}

/**
 * Busca de carrinho disponível por número, nome ou tipo, como a consulta de carrinhos da entrega do legado. Também aceita
 * o código de barras: o leitor digita o código e um Enter, e o carrinho é selecionado direto.
 */
export function CarrinhoAutocomplete({
  id,
  carrinhos,
  carregando,
  selecionado,
  onSelecionar,
  onVerPrecos,
}: CarrinhoAutocompleteProps) {
  const idLista = useId()
  const [busca, setBusca] = useState('')
  const [aberto, setAberto] = useState(false)
  const [ativo, setAtivo] = useState(0)

  const termo = normalizar(busca)
  const digitos = /^\d+$/.test(termo) ? termo : null

  const resultados = useMemo(() => {
    const ordenados = [...(carrinhos ?? [])].sort((a, b) =>
      a.descricao.localeCompare(b.descricao, 'pt-BR', { numeric: true }),
    )
    if (!termo) return ordenados

    // Quanto menor a nota, mais acima: código exato, começo do nome, trecho do nome, tipo, trecho do código.
    const nota = (c: CarrinhoDisponivel): number => {
      const descricao = normalizar(c.descricao)
      if (digitos && (String(c.id) === digitos || codigoDe(c) === digitos.padStart(6, '0'))) return 0
      if (descricao.startsWith(termo)) return 1
      if (descricao.includes(termo)) return 2
      if (normalizar(c.tipoCarrinhoDescricao).includes(termo)) return 3
      if (digitos && codigoDe(c).includes(digitos)) return 4
      return -1
    }

    return ordenados
      .map((c) => ({ c, nota: nota(c) }))
      .filter((x) => x.nota >= 0)
      .sort((a, b) => a.nota - b.nota) // a ordenação é estável: dentro da mesma nota fica a ordem alfabética
      .map((x) => x.c)
  }, [carrinhos, termo, digitos])

  const visiveis = resultados.slice(0, MAX_RESULTADOS)

  function escolher(carrinho: CarrinhoDisponivel | undefined) {
    if (!carrinho) return
    onSelecionar(carrinho)
    setBusca('')
    setAberto(false)
  }

  function aoTeclar(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setAberto(true)
      setAtivo((i) => Math.min(i + 1, visiveis.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setAtivo((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      // O Enter do leitor de código de barras não pode enviar o formulário da entrega.
      e.preventDefault()
      escolher(visiveis[ativo])
    } else if (e.key === 'Escape') {
      setAberto(false)
    }
  }

  if (selecionado) {
    return (
      <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{selecionado.descricao}</p>
          <p className="truncate text-xs text-muted-foreground">
            {selecionado.tipoCarrinhoDescricao} · código {codigoDe(selecionado)}
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => onVerPrecos(selecionado)}>
          <Tag className="size-4" /> Ver preços
        </Button>
        <button
          type="button"
          aria-label="Remover carrinho selecionado"
          title="Escolher outro carrinho"
          onClick={() => onSelecionar(null)}
          className="rounded-sm text-muted-foreground hover:text-foreground"
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
        id={id}
        className="pl-8"
        placeholder="Buscar por número, nome ou tipo — ou leia o código de barras..."
        autoComplete="off"
        role="combobox"
        aria-expanded={aberto}
        aria-controls={idLista}
        aria-activedescendant={aberto && visiveis[ativo] ? `${idLista}-${visiveis[ativo].id}` : undefined}
        value={busca}
        onChange={(e) => {
          setBusca(e.target.value)
          setAtivo(0)
          setAberto(true)
        }}
        onFocus={() => setAberto(true)}
        onBlur={() => setAberto(false)}
        onKeyDown={aoTeclar}
      />

      {aberto && (
        <div
          id={idLista}
          role="listbox"
          // Evita que o clique numa opção tire o foco do campo (o blur fecharia a lista antes do clique valer).
          onMouseDown={(e) => e.preventDefault()}
          className="absolute z-10 mt-1 max-h-72 w-full overflow-y-auto rounded-md border bg-popover shadow-md"
        >
          {carregando && <p className="p-3 text-sm text-muted-foreground">Carregando carrinhos...</p>}

          {!carregando && (carrinhos?.length ?? 0) === 0 && (
            <p className="p-3 text-sm text-amber-700">Nenhum carrinho disponível no momento.</p>
          )}

          {!carregando && (carrinhos?.length ?? 0) > 0 && visiveis.length === 0 && (
            <p className="p-3 text-sm text-muted-foreground">Nenhum carrinho disponível encontrado para “{busca.trim()}”.</p>
          )}

          {visiveis.map((c, i) => (
            <div
              key={c.id}
              id={`${idLista}-${c.id}`}
              role="option"
              aria-selected={i === ativo}
              onMouseEnter={() => setAtivo(i)}
              onClick={() => escolher(c)}
              className={cn(
                'flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm',
                i === ativo && 'bg-accent text-accent-foreground',
              )}
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">{c.descricao}</span>
                <span className="block truncate text-xs text-muted-foreground">{c.tipoCarrinhoDescricao}</span>
              </span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{codigoDe(c)}</span>
            </div>
          ))}

          {!carregando && resultados.length > visiveis.length && (
            <p className="border-t p-2 text-center text-xs text-muted-foreground">
              Mostrando {visiveis.length} de {resultados.length} carrinhos — digite mais para filtrar.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
