import { useEffect, useState } from 'react'
import { DollarSign, ListChecks, TicketPercent, Users } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import { useRelatorioClientes, useRelatorioClientesResumo } from '@/features/relatorios/api'
import type { ClienteRelatorio, RelatorioClientesFiltro } from '@/features/relatorios/types'
import { extrairMensagemErro, formatarMoeda } from '@/lib/utils'
import { toast } from '@/stores/toast-store'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

const TAMANHO_PAGINA_PADRAO = 10

function KpiCard({
  titulo,
  valor,
  icon: Icon,
}: {
  titulo: string
  valor: string
  icon: typeof Users
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{titulo}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{valor}</div>
      </CardContent>
    </Card>
  )
}

function formatarTempo(minutos: number) {
  if (minutos <= 0) return '—'
  const horas = Math.floor(minutos / 60)
  const restante = minutos % 60
  return horas > 0 ? `${horas}h ${restante}min` : `${restante}min`
}

function formatarData(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString('pt-BR') : '—'
}

export function RelatorioClientesPage() {
  const [nome, setNome] = useState('')
  const [cidade, setCidade] = useState('')
  const [uf, setUf] = useState('')
  const [dataCadastroInicio, setDataCadastroInicio] = useState('')
  const [dataCadastroFinal, setDataCadastroFinal] = useState('')
  const [dataLocacaoInicio, setDataLocacaoInicio] = useState('')
  const [dataLocacaoFinal, setDataLocacaoFinal] = useState('')
  const [pagina, setPagina] = useState(1)
  const [tamanhoPagina, setTamanhoPagina] = useState(TAMANHO_PAGINA_PADRAO)

  const nomeAtrasado = useDebouncedValue(nome, 400)
  const cidadeAtrasada = useDebouncedValue(cidade, 400)
  const ufAtrasada = useDebouncedValue(uf, 400)

  const filtro: RelatorioClientesFiltro = {
    nome: nomeAtrasado || undefined,
    cidade: cidadeAtrasada || undefined,
    uf: ufAtrasada || undefined,
    dataCadastroInicio: dataCadastroInicio || undefined,
    dataCadastroFinal: dataCadastroFinal || undefined,
    dataLocacaoInicio: dataLocacaoInicio || undefined,
    dataLocacaoFinal: dataLocacaoFinal || undefined,
    pagina,
    tamanhoPagina,
  }

  const { data, isLoading, isError, error } = useRelatorioClientes(filtro)
  const { data: resumo } = useRelatorioClientesResumo(filtro)

  useEffect(() => {
    if (isError) toast.error('Não foi possível carregar o relatório de clientes.', extrairMensagemErro(error))
  }, [isError, error])

  function onChangeNome(valor: string) {
    setNome(valor)
    setPagina(1)
  }

  function onChangeFiltro(setter: (v: string) => void) {
    return (valor: string) => {
      setter(valor)
      setPagina(1)
    }
  }

  const columns: DataTableColumn<ClienteRelatorio>[] = [
    { header: 'Nome', cell: (c) => <span className="font-medium">{c.nome}</span>, exportValue: (c) => c.nome },
    { header: 'CPF', cell: (c) => c.cpf, exportValue: (c) => c.cpf },
    {
      header: 'Cidade/UF',
      cell: (c) => (c.cidade ? `${c.cidade}/${c.uf ?? ''}` : '—'),
      exportValue: (c) => (c.cidade ? `${c.cidade}/${c.uf ?? ''}` : ''),
    },
    { header: 'Telefone', cell: (c) => c.telefone, exportValue: (c) => c.telefone },
    {
      header: 'Cadastro',
      cell: (c) => formatarData(c.dataCadastro),
      exportValue: (c) => formatarData(c.dataCadastro),
    },
    {
      header: 'Locações',
      cell: (c) => <Badge variant="secondary">{c.quantidadeLocacoes}</Badge>,
      exportValue: (c) => c.quantidadeLocacoes,
    },
    {
      header: 'Tempo total',
      cell: (c) => formatarTempo(c.tempoTotalMinutos),
      exportValue: (c) => c.tempoTotalMinutos,
    },
    {
      header: 'Total gasto',
      cell: (c) => <span className="font-medium">{formatarMoeda(c.totalGasto)}</span>,
      exportValue: (c) => c.totalGasto,
    },
    {
      header: 'Última locação',
      cell: (c) => formatarData(c.dataUltimaLocacao),
      exportValue: (c) => formatarData(c.dataUltimaLocacao),
    },
    {
      header: '1º carrinho locado',
      cell: (c) => c.primeiroTipoCarrinho ?? '—',
      exportValue: (c) => c.primeiroTipoCarrinho ?? '',
    },
  ]

  return (
    <>
      <PageHeader
        title="Relatório de Clientes"
        description="Perfil de consumo dos clientes — locações, tempo de uso e total gasto, com filtros para tomada de decisão."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard titulo="Clientes no filtro" valor={resumo ? String(resumo.totalClientes) : '—'} icon={Users} />
        <KpiCard titulo="Locações no período" valor={resumo ? String(resumo.totalLocacoes) : '—'} icon={ListChecks} />
        <KpiCard titulo="Total gasto" valor={resumo ? formatarMoeda(resumo.totalGasto) : '—'} icon={DollarSign} />
        <KpiCard
          titulo="Ticket médio por cliente"
          valor={resumo ? formatarMoeda(resumo.ticketMedioPorCliente) : '—'}
          icon={TicketPercent}
        />
      </div>

      <Card className="mb-4">
        <CardContent className="grid grid-cols-2 gap-4 pt-6 md:grid-cols-3 lg:grid-cols-6">
          <div className="space-y-1.5">
            <Label htmlFor="cidade">Cidade</Label>
            <Input id="cidade" value={cidade} onChange={(e) => onChangeFiltro(setCidade)(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="uf">UF</Label>
            <Input id="uf" maxLength={2} value={uf} onChange={(e) => onChangeFiltro(setUf)(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dataCadastroInicio">Cadastro de</Label>
            <Input
              id="dataCadastroInicio"
              type="date"
              value={dataCadastroInicio}
              onChange={(e) => onChangeFiltro(setDataCadastroInicio)(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dataCadastroFinal">Cadastro até</Label>
            <Input
              id="dataCadastroFinal"
              type="date"
              value={dataCadastroFinal}
              onChange={(e) => onChangeFiltro(setDataCadastroFinal)(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dataLocacaoInicio">Locação de</Label>
            <Input
              id="dataLocacaoInicio"
              type="date"
              value={dataLocacaoInicio}
              onChange={(e) => onChangeFiltro(setDataLocacaoInicio)(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dataLocacaoFinal">Locação até</Label>
            <Input
              id="dataLocacaoFinal"
              type="date"
              value={dataLocacaoFinal}
              onChange={(e) => onChangeFiltro(setDataLocacaoFinal)(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={data?.itens ?? []}
        rowKey={(c) => c.id}
        isLoading={isLoading}
        searchValue={nome}
        onSearchChange={onChangeNome}
        searchPlaceholder="Buscar por nome..."
        emptyMessage="Nenhum cliente encontrado para os filtros selecionados."
        pagina={data?.pagina ?? pagina}
        totalPaginas={data?.totalPaginas ?? 0}
        totalRegistros={data?.totalRegistros ?? 0}
        tamanhoPagina={data?.tamanhoPagina ?? tamanhoPagina}
        onPageChange={setPagina}
        onTamanhoPaginaChange={(t) => {
          setTamanhoPagina(t)
          setPagina(1)
        }}
        exportFileName="relatorio-clientes"
      />
    </>
  )
}
