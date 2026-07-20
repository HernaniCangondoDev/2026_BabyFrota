import { useEffect, useRef, useState } from 'react'
import JsBarcode from 'jsbarcode'
import { Printer, Search, X } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Pagination } from '@/components/ui/pagination'
import { PageSizeSelect } from '@/components/ui/page-size-select'
import { useCarrinhos, useStatusCarrinho } from '@/features/carrinhos/api'
import { useTiposCarrinho } from '@/features/tipos-carrinho/api'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

const TAMANHO_PAGINA_PADRAO = 10

function codigoDoCarrinho(id: number) {
  return String(id).padStart(6, '0')
}

function EtiquetaLabel({ codigo, descricao }: { codigo: string; descricao: string }) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current) return
    JsBarcode(svgRef.current, codigo, {
      format: 'CODE128',
      width: 1.6,
      height: 42,
      displayValue: true,
      fontSize: 12,
      margin: 6,
    })
  }, [codigo])

  return (
    <div className="flex w-56 flex-col items-center gap-1 break-inside-avoid border border-dashed border-neutral-400 p-3 text-center">
      <svg ref={svgRef} />
      <p className="text-sm font-medium leading-tight">{descricao}</p>
      <p className="text-xs text-neutral-500">Baby Frota</p>
    </div>
  )
}

export function EtiquetasPage() {
  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [pagina, setPagina] = useState(1)
  const [tamanhoPagina, setTamanhoPagina] = useState(TAMANHO_PAGINA_PADRAO)
  const [selecionados, setSelecionados] = useState<Map<number, string>>(new Map())

  const buscaAtrasada = useDebouncedValue(busca, 400)

  const { data, isLoading } = useCarrinhos({
    descricao: buscaAtrasada || undefined,
    statusId: statusFiltro ? Number(statusFiltro) : undefined,
    tipoCarrinhoId: tipoFiltro ? Number(tipoFiltro) : undefined,
    pagina,
    tamanhoPagina,
  })
  const { data: status } = useStatusCarrinho()
  const { data: tipos } = useTiposCarrinho()
  const carrinhos = data?.itens ?? []

  const todosDaPaginaSelecionados = carrinhos.length > 0 && carrinhos.every((c) => selecionados.has(c.id))

  function alternarSelecao(id: number, descricao: string) {
    setSelecionados((prev) => {
      const novo = new Map(prev)
      if (novo.has(id)) novo.delete(id)
      else novo.set(id, descricao)
      return novo
    })
  }

  function alternarSelecionarPagina() {
    setSelecionados((prev) => {
      const novo = new Map(prev)
      if (todosDaPaginaSelecionados) {
        carrinhos.forEach((c) => novo.delete(c.id))
      } else {
        carrinhos.forEach((c) => novo.set(c.id, c.descricao))
      }
      return novo
    })
  }

  const etiquetas = Array.from(selecionados.entries()).map(([id, descricao]) => ({
    id,
    codigo: codigoDoCarrinho(id),
    descricao,
  }))

  return (
    <>
      <div className="print:hidden">
        <PageHeader
          title="Etiquetas"
          description="Selecione os carrinhos e gere etiquetas com código de barras para impressão."
        />

        <Card className="mb-4">
          <CardContent className="flex flex-wrap items-center gap-2 pt-6">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por descrição..."
                className="pl-8"
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value)
                  setPagina(1)
                }}
              />
            </div>
            <Select
              className="w-48"
              value={tipoFiltro}
              onChange={(e) => {
                setTipoFiltro(e.target.value)
                setPagina(1)
              }}
            >
              <option value="">Todos os tipos</option>
              {tipos?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.descricao}
                </option>
              ))}
            </Select>
            <Select
              className="w-48"
              value={statusFiltro}
              onChange={(e) => {
                setStatusFiltro(e.target.value)
                setPagina(1)
              }}
            >
              <option value="">Todas as situações</option>
              {status?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </Select>
            <PageSizeSelect
              tamanhoPagina={tamanhoPagina}
              onChange={(valor) => {
                setTamanhoPagina(valor)
                setPagina(1)
              }}
            />
          </CardContent>
        </Card>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-card p-3">
          <p className="text-sm text-muted-foreground">
            {selecionados.size === 0
              ? 'Nenhum carrinho selecionado.'
              : `${selecionados.size} carrinho(s) selecionado(s) para impressão.`}
          </p>
          <div className="flex gap-2">
            {selecionados.size > 0 && (
              <Button variant="outline" size="sm" onClick={() => setSelecionados(new Map())}>
                <X className="size-4" /> Limpar seleção
              </Button>
            )}
            <Button size="sm" onClick={() => window.print()} disabled={selecionados.size === 0}>
              <Printer className="size-4" /> Imprimir etiquetas
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      className="size-4"
                      checked={todosDaPaginaSelecionados}
                      onChange={alternarSelecionarPagina}
                      title="Selecionar todos desta página"
                    />
                  </TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>Código</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && carrinhos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Nenhum carrinho encontrado.
                    </TableCell>
                  </TableRow>
                )}
                {carrinhos.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        className="size-4"
                        checked={selecionados.has(c.id)}
                        onChange={() => alternarSelecao(c.id, c.descricao)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{c.descricao}</TableCell>
                    <TableCell>{c.tipoCarrinhoDescricao}</TableCell>
                    <TableCell>{c.statusNome}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {codigoDoCarrinho(c.id)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination
              pagina={data?.pagina ?? pagina}
              totalPaginas={data?.totalPaginas ?? 0}
              totalRegistros={data?.totalRegistros ?? 0}
              tamanhoPagina={data?.tamanhoPagina ?? tamanhoPagina}
              onPageChange={setPagina}
            />
          </CardContent>
        </Card>
      </div>

      <div className="hidden print:block">
        <div className="flex flex-wrap gap-3">
          {etiquetas.map((e) => (
            <EtiquetaLabel key={e.id} codigo={e.codigo} descricao={e.descricao} />
          ))}
        </div>
      </div>
    </>
  )
}
