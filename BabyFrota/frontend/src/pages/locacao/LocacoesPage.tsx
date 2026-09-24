import { useEffect, useMemo, useState } from 'react'
import { Eye } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { LocacaoAcoesDialog } from '@/components/locacao/LocacaoAcoesDialog'
import { LocacaoDetalheDialog } from '@/components/locacao/LocacaoDetalheDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DataTable, type DataTableColumn, type DataTableExportColumn } from '@/components/ui/data-table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useCarrinhos } from '@/features/carrinhos/api'
import {
  buscarLocacoesCompleto,
  useConsultaLocacoes,
  useConsultaLocacoesResumo,
  useFormasRecebimento,
} from '@/features/locacoes/api'
import type { EstadoLocacaoFiltro, Locacao, LocacaoConsulta, LocacaoConsultaFiltro } from '@/features/locacoes/types'
import { useTiposCarrinho } from '@/features/tipos-carrinho/api'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { extrairMensagemErro, formatarDataHora, formatarMinutos, formatarMoeda } from '@/lib/utils'
import { toast } from '@/stores/toast-store'

const TAMANHO_PAGINA_PADRAO = 10

/** 'aaaa-mm-dd' (valor do input de data) para 'dd/mm/aaaa', sem passar por Date para não deslocar o dia por fuso. */
function formatarDataInput(valor: string): string {
  const [ano, mes, dia] = valor.split('-')
  return `${dia}/${mes}/${ano}`
}

/**
 * Consulta de todas as locações, entregues e devolvidas, com filtros, total do filtro e detalhes de cada uma (pagamentos,
 * trocas, observações). O detalhe de uma locação ainda aberta leva direto à devolução ou troca.
 */
export function LocacoesPage() {
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [estado, setEstado] = useState<'' | EstadoLocacaoFiltro>('')
  const [carrinhoId, setCarrinhoId] = useState(0)
  const [tipoCarrinhoId, setTipoCarrinhoId] = useState(0)
  const [formaRecebimentoId, setFormaRecebimentoId] = useState(0)
  const [clienteNome, setClienteNome] = useState('')
  const [pagina, setPagina] = useState(1)
  const [tamanhoPagina, setTamanhoPagina] = useState(TAMANHO_PAGINA_PADRAO)

  const [detalheId, setDetalheId] = useState<number | null>(null)
  const [locacaoAberta, setLocacaoAberta] = useState<Locacao | null>(null)

  const { data: carrinhos } = useCarrinhos({ tamanhoPagina: 500 })
  const { data: tiposCarrinho } = useTiposCarrinho()
  const { data: formasBrutas } = useFormasRecebimento()
  const formas = useMemo(() => [...(formasBrutas ?? [])].sort((a, b) => a.id - b.id), [formasBrutas])

  const clienteNomeAtrasado = useDebouncedValue(clienteNome, 400)

  const filtro: LocacaoConsultaFiltro = {
    dataEntregaInicio: dataInicio || undefined,
    dataEntregaFim: dataFim || undefined,
    estado: estado || undefined,
    clienteNome: clienteNomeAtrasado || undefined,
    carrinhoId: carrinhoId || undefined,
    tipoCarrinhoId: tipoCarrinhoId || undefined,
    formaRecebimentoId: formaRecebimentoId || undefined,
    pagina,
    tamanhoPagina,
  }

  const { data, isLoading, isError, error } = useConsultaLocacoes(filtro)
  const { data: resumo } = useConsultaLocacoesResumo(filtro)
  const semFiltroDeData = !dataInicio && !dataFim

  useEffect(() => {
    if (isError) toast.error('Não foi possível carregar as locações.', extrairMensagemErro(error))
  }, [isError, error])

  function alterar<T>(definir: (valor: T) => void) {
    return (valor: T) => {
      definir(valor)
      setPagina(1)
    }
  }

  const columns = useMemo<DataTableColumn<LocacaoConsulta>[]>(
    () => [
      { header: 'Nº', className: 'text-muted-foreground tabular-nums', cell: (l) => l.id },
      { header: 'Cliente', cell: (l) => <span className="font-medium">{l.clienteNome}</span> },
      {
        header: 'Carrinho',
        cell: (l) => (
          <div>
            <p>{l.carrinhoDescricao}</p>
            <p className="text-xs text-muted-foreground">{l.tipoCarrinhoDescricao}</p>
          </div>
        ),
      },
      { header: 'Entrega', className: 'whitespace-nowrap text-xs', cell: (l) => formatarDataHora(l.dataEntrega) },
      {
        header: 'Devolução',
        className: 'whitespace-nowrap text-xs',
        cell: (l) => (l.dataDevolucao ? formatarDataHora(l.dataDevolucao) : <span className="text-muted-foreground">—</span>),
      },
      {
        header: 'Estado',
        cell: (l) => (
          <Badge variant={l.entregue ? 'warning' : 'success'}>{l.entregue ? 'Entregue' : 'Devolvido'}</Badge>
        ),
      },
      {
        header: 'Valor total',
        className: 'text-right tabular-nums',
        cell: (l) =>
          l.valorTotal !== null ? (
            <span className="font-medium">{formatarMoeda(l.valorTotal)}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        header: 'Detalhes',
        className: 'w-16 text-center',
        cell: (l) => (
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            title="Ver detalhes"
            aria-label={`Ver detalhes da locação ${l.id}`}
            onClick={() => setDetalheId(l.id)}
          >
            <Eye className="size-4" />
          </Button>
        ),
      },
    ],
    [],
  )

  const footer = resumo
    ? [
        null,
        <span key="total">Total do filtro · {resumo.totalLocacoes.toLocaleString('pt-BR')} {resumo.totalLocacoes === 1 ? 'locação' : 'locações'}</span>,
        null,
        null,
        null,
        <span key="entregues" className="text-xs font-normal text-muted-foreground">
          {resumo.totalEntregues.toLocaleString('pt-BR')} {resumo.totalEntregues === 1 ? 'entregue' : 'entregues'}
        </span>,
        formatarMoeda(resumo.valorTotal),
        null,
      ]
    : undefined

  const exportColumns: DataTableExportColumn<LocacaoConsulta>[] = [
    { cabecalho: 'Nº', tipo: 'inteiro', value: (l) => l.id },
    { cabecalho: 'Cliente', value: (l) => l.clienteNome },
    { cabecalho: 'Carrinho', value: (l) => l.carrinhoDescricao },
    { cabecalho: 'Tipo', value: (l) => l.tipoCarrinhoDescricao },
    { cabecalho: 'Entrega', value: (l) => formatarDataHora(l.dataEntrega) },
    { cabecalho: 'Devolução', value: (l) => (l.dataDevolucao ? formatarDataHora(l.dataDevolucao) : '') },
    { cabecalho: 'Estado', value: (l) => (l.entregue ? 'Entregue' : 'Devolvido') },
    { cabecalho: 'Tempo de uso', value: (l) => (l.tempoMinutos !== null ? formatarMinutos(l.tempoMinutos) : '') },
    { cabecalho: 'Valor total', tipo: 'moeda', value: (l) => l.valorTotal },
  ]

  const exportFooter = resumo
    ? [
        'Total',
        `${resumo.totalLocacoes} ${resumo.totalLocacoes === 1 ? 'locação' : 'locações'}`,
        '',
        '',
        '',
        '',
        `${resumo.totalEntregues} ${resumo.totalEntregues === 1 ? 'entregue' : 'entregues'}`,
        '',
        resumo.valorTotal,
      ]
    : undefined

  const nomeCarrinho = carrinhos?.itens.find((c) => c.id === carrinhoId)?.descricao
  const nomeTipo = tiposCarrinho?.find((t) => t.id === tipoCarrinhoId)?.descricao
  const nomeForma = formas.find((f) => f.id === formaRecebimentoId)?.nome
  const exportSubtitle = [
    dataInicio || dataFim
      ? `Entrega: ${dataInicio ? formatarDataInput(dataInicio) : 'início'} a ${dataFim ? formatarDataInput(dataFim) : 'hoje'}`
      : estado === 'entregue'
        ? 'Todas as locações entregues e ainda não devolvidas'
        : 'Entrega: últimos 90 dias',
    estado ? `Estado: ${estado === 'entregue' ? 'Entregue' : 'Devolvido'}` : null,
    nomeCarrinho ? `Carrinho: ${nomeCarrinho}` : null,
    nomeTipo ? `Tipo: ${nomeTipo}` : null,
    nomeForma ? `Pagamento: ${nomeForma}` : null,
    clienteNomeAtrasado ? `Cliente: ${clienteNomeAtrasado}` : null,
  ]
    .filter(Boolean)
    .join('  |  ')

  return (
    <>
      <PageHeader
        title="Locações"
        description="Todas as locações, entregues e devolvidas. Clique no ícone de uma locação para ver pagamentos, trocas e observações."
      />

      <Card className="mb-4">
        <CardContent className="grid grid-cols-2 gap-4 pt-6 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="dataInicio">Entrega de</Label>
            <Input id="dataInicio" type="date" value={dataInicio} onChange={(e) => alterar(setDataInicio)(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dataFim">Entrega até</Label>
            <Input id="dataFim" type="date" value={dataFim} onChange={(e) => alterar(setDataFim)(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="estado">Estado</Label>
            <Select
              id="estado"
              value={estado}
              onChange={(e) => alterar(setEstado)(e.target.value as '' | EstadoLocacaoFiltro)}
            >
              <option value="">Todos</option>
              <option value="entregue">Entregue</option>
              <option value="devolvido">Devolvido</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="carrinhoId">Carrinho</Label>
            <Select id="carrinhoId" value={carrinhoId} onChange={(e) => alterar(setCarrinhoId)(Number(e.target.value))}>
              <option value={0}>Todos</option>
              {carrinhos?.itens.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.descricao}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tipoCarrinhoId">Tipo de carrinho</Label>
            <Select
              id="tipoCarrinhoId"
              value={tipoCarrinhoId}
              onChange={(e) => alterar(setTipoCarrinhoId)(Number(e.target.value))}
              disabled={carrinhoId > 0}
            >
              <option value={0}>Todos</option>
              {tiposCarrinho?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.descricao}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="formaRecebimentoId">Forma de pagamento</Label>
            <Select
              id="formaRecebimentoId"
              value={formaRecebimentoId}
              onChange={(e) => alterar(setFormaRecebimentoId)(Number(e.target.value))}
            >
              <option value={0}>Todas</option>
              {formas.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
            </Select>
          </div>
          {semFiltroDeData && (
            <p className="col-span-full text-xs text-muted-foreground">
              {estado === 'entregue'
                ? 'Mostrando todas as locações ainda não devolvidas, de qualquer data.'
                : 'Sem data selecionada, mostrando os últimos 90 dias (evita consultas lentas sobre todo o histórico). Para achar locações antigas ainda não devolvidas, escolha o estado Entregue. O cliente é filtrado na busca da tabela.'}
            </p>
          )}
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={data?.itens ?? []}
        rowKey={(l) => l.id}
        isLoading={isLoading}
        searchValue={clienteNome}
        onSearchChange={alterar(setClienteNome)}
        searchPlaceholder="Buscar por cliente..."
        emptyMessage="Nenhuma locação encontrada para os filtros selecionados."
        pagina={data?.pagina ?? pagina}
        totalPaginas={data?.totalPaginas ?? 0}
        totalRegistros={data?.totalRegistros ?? 0}
        tamanhoPagina={data?.tamanhoPagina ?? tamanhoPagina}
        onPageChange={setPagina}
        onTamanhoPaginaChange={(t) => {
          setTamanhoPagina(t)
          setPagina(1)
        }}
        footer={footer}
        exportFileName="locacoes"
        exportTitle="Locações"
        exportSubtitle={exportSubtitle}
        exportFormats={['excel', 'pdf', 'csv']}
        exportColumns={exportColumns}
        exportFooter={exportFooter}
        loadAllForExport={() => buscarLocacoesCompleto(filtro)}
      />

      <LocacaoDetalheDialog
        locacaoId={detalheId}
        onClose={() => setDetalheId(null)}
        onDevolverOuTrocar={(locacao) => {
          setDetalheId(null)
          setLocacaoAberta(locacao)
        }}
      />
      <LocacaoAcoesDialog locacao={locacaoAberta} abaInicial="devolucao" onClose={() => setLocacaoAberta(null)} />
    </>
  )
}
