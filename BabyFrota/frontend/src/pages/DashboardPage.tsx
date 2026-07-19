import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Baby, DollarSign, PackageCheck, PercentCircle } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useDashboardResumo } from '@/features/dashboard/api'

function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function KpiCard({
  titulo,
  valor,
  icon: Icon,
  descricao,
}: {
  titulo: string
  valor: string
  icon: typeof Baby
  descricao?: string
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{titulo}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{valor}</div>
        {descricao && <p className="text-xs text-muted-foreground">{descricao}</p>}
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const { data, isLoading, isError } = useDashboardResumo()

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Visão geral da operação — ocupação da frota, faturamento e KPIs do dia."
        actions={
          data && (
            <Badge variant={data.caixaAberto ? 'success' : 'secondary'}>
              {data.caixaAberto ? 'Caixa aberto' : 'Caixa fechado'}
            </Badge>
          )
        }
      />

      {isError && (
        <Card className="mb-6 border-destructive/40">
          <CardContent className="py-4 text-sm text-destructive">
            Não foi possível carregar os dados do dashboard. Verifique se a API está em execução e se você
            está autenticado.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          titulo="Ocupação da frota"
          valor={isLoading ? '—' : `${data?.percentualOcupacao ?? 0}%`}
          icon={PercentCircle}
          descricao={
            isLoading ? undefined : `${data?.carrinhosAlugados ?? 0} alugados de ${data?.totalCarrinhos ?? 0}`
          }
        />
        <KpiCard
          titulo="Carrinhos disponíveis"
          valor={isLoading ? '—' : `${data?.carrinhosDisponiveis ?? 0}`}
          icon={Baby}
        />
        <KpiCard
          titulo="Faturamento hoje"
          valor={isLoading ? '—' : formatarMoeda(data?.faturamentoHoje ?? 0)}
          icon={DollarSign}
          descricao={isLoading ? undefined : `${data?.locacoesHoje ?? 0} locações · ticket médio ${formatarMoeda(data?.ticketMedioHoje ?? 0)}`}
        />
        <KpiCard
          titulo="Faturamento do caixa atual"
          valor={isLoading ? '—' : data?.faturamentoCaixaAtual != null ? formatarMoeda(data.faturamentoCaixaAtual) : '—'}
          icon={PackageCheck}
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Carrinhos mais alugados (últimos 30 dias)</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          {data && data.topCarrinhos.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topCarrinhos}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="descricao" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="quantidadeLocacoes" name="Locações" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              {isLoading ? 'Carregando...' : 'Sem locações no período.'}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
