import { useState, type ReactNode } from 'react'
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartColumn, Table2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { FluxoCaixaRecebido, FluxoCaixaResumo } from '@/features/caixa/types'
import type { FormaRecebimento } from '@/features/locacoes/types'
import { cn, formatarMoeda } from '@/lib/utils'

/** A cor segue a forma de recebimento (não a posição na lista): filtrar o período não repinta as que sobram. */
function corDaForma(id: number): string {
  return id >= 1 && id <= 6 ? `var(--viz-forma-${id})` : 'var(--muted-foreground)'
}

const EIXO = { fill: 'var(--muted-foreground)', fontSize: 12 }
const MAX_UTILIZADORES = 8

// ---------------------------------------------------------------------------------------------------------------------
// Cartão com alternância gráfico / tabela. A tabela é o gêmeo acessível do gráfico: os valores nunca dependem do hover
// nem da cor (e é o que o guia exige quando uma cor da paleta fica abaixo de 3:1 no fundo claro).
// ---------------------------------------------------------------------------------------------------------------------

function CartaoGrafico({
  titulo,
  descricao,
  atualizando,
  grafico,
  tabela,
}: {
  titulo: string
  descricao: string
  atualizando: boolean
  grafico: ReactNode
  tabela: ReactNode
}) {
  const [verTabela, setVerTabela] = useState(false)

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0 pb-2">
        <div>
          <CardTitle className="text-base">{titulo}</CardTitle>
          <p className="text-xs text-muted-foreground">{descricao}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setVerTabela((v) => !v)} aria-pressed={verTabela}>
          {verTabela ? <ChartColumn className="size-4" /> : <Table2 className="size-4" />}{' '}
          {verTabela ? 'Ver gráfico' : 'Ver tabela'}
        </Button>
      </CardHeader>
      {/* Ao recarregar, mantém o desenho anterior mais claro em vez de piscar ou trocar por um esqueleto. */}
      <CardContent className={cn('transition-opacity duration-200', atualizando && 'opacity-60')}>
        {verTabela ? tabela : grafico}
      </CardContent>
    </Card>
  )
}

function SemDados() {
  return <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">Sem caixas no período.</div>
}

// ---------------------------------------------------------------------------------------------------------------------
// Gráfico 1: vendas por dia, colunas empilhadas por forma de recebimento
// ---------------------------------------------------------------------------------------------------------------------

interface LinhaDia {
  rotulo: string
  dataCompleta: string
  total: number
  [chave: string]: string | number
}

function chaveForma(id: number) {
  return `f${id}`
}

interface SegmentoProps {
  x?: number
  y?: number
  width?: number
  height?: number
  fill?: string
  topo: boolean
}

/**
 * Segmento da coluna empilhada: base reta, topo arredondado em 4px só no segmento de cima. O traço de 2px na cor do
 * fundo do cartão é a "folga" entre segmentos (não uma borda visível): o guia pede separar por espaço, não por linha.
 */
function Segmento({ x = 0, y = 0, width = 0, height = 0, fill, topo }: SegmentoProps) {
  if (height <= 0 || width <= 0) return null
  const r = topo ? Math.min(4, width / 2, height) : 0
  const d = `M${x},${y + height} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + width - r},${y} Q${x + width},${y} ${x + width},${y + r} L${x + width},${y + height} Z`
  return <path d={d} fill={fill} stroke="var(--card)" strokeWidth={2} />
}

function TooltipDia({
  active,
  payload,
  formas,
}: {
  active?: boolean
  payload?: Array<{ payload: LinhaDia }>
  formas: FormaRecebimento[]
}) {
  if (!active || !payload?.length) return null
  const linha = payload[0].payload
  return (
    <div className="min-w-44 rounded-md border bg-popover p-2.5 text-xs shadow-md">
      <p className="mb-1.5 font-medium text-popover-foreground">{linha.dataCompleta}</p>
      <ul className="space-y-1">
        {formas.map((f) => (
          <li key={f.id} className="flex items-center gap-2">
            <span className="h-0.5 w-3 shrink-0 rounded-full" style={{ background: corDaForma(f.id) }} />
            <span className="text-muted-foreground">{f.nome}</span>
            <span className="ml-auto pl-4 font-semibold tabular-nums text-popover-foreground">
              {formatarMoeda(Number(linha[chaveForma(f.id)] ?? 0))}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-1.5 flex justify-between border-t pt-1.5">
        <span className="text-muted-foreground">Total</span>
        <span className="font-semibold tabular-nums text-popover-foreground">{formatarMoeda(linha.total)}</span>
      </p>
    </div>
  )
}

function VendasPorDia({
  resumo,
  formas,
  atualizando,
}: {
  resumo: FluxoCaixaResumo | undefined
  formas: FormaRecebimento[]
  atualizando: boolean
}) {
  const dados: LinhaDia[] = (resumo?.porDia ?? []).map((d) => {
    const data = new Date(d.data)
    const linha: LinhaDia = {
      rotulo: data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      dataCompleta: data.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }),
      total: d.totalVendido,
    }
    formas.forEach((f) => {
      linha[chaveForma(f.id)] = d.porForma[String(f.id)] ?? 0
    })
    return linha
  })
  const temDados = dados.some((d) => d.total > 0)

  const legenda = (
    <ul className="mb-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
      {formas.map((f) => (
        <li key={f.id} className="flex items-center gap-2">
          <span className="size-2.5 shrink-0 rounded-sm" style={{ background: corDaForma(f.id) }} />
          <span className="text-muted-foreground">{f.nome}</span>
          <span className="font-medium tabular-nums">{formatarMoeda(resumo?.totais.porForma[String(f.id)] ?? 0)}</span>
        </li>
      ))}
    </ul>
  )

  const grafico = !temDados ? (
    <SemDados />
  ) : (
    <>
      {legenda}
      <div
        className="h-64"
        role="img"
        aria-label="Gráfico de colunas empilhadas com as vendas de cada dia por forma de recebimento. Use Ver tabela para ler os valores."
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dados} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="rotulo"
              tick={EIXO}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
              minTickGap={16}
            />
            <YAxis
              tick={EIXO}
              tickLine={false}
              axisLine={false}
              width={64}
              tickFormatter={(v: number) => v.toLocaleString('pt-BR')}
            />
            <Tooltip
              cursor={{ fill: 'var(--muted)', opacity: 0.7 }}
              content={(p) => (
                <TooltipDia
                  active={p.active}
                  payload={p.payload as unknown as Array<{ payload: LinhaDia }> | undefined}
                  formas={formas}
                />
              )}
            />
            {formas.map((f, i) => (
              <Bar
                key={f.id}
                dataKey={chaveForma(f.id)}
                name={f.nome}
                stackId="dia"
                fill={corDaForma(f.id)}
                maxBarSize={24}
                isAnimationActive={false}
                // É o segmento de cima quando nenhuma forma seguinte (empilhada acima) tem valor naquele dia.
                shape={(props: unknown) => {
                  const p = props as SegmentoProps & { payload: LinhaDia }
                  const topo = formas.slice(i + 1).every((g) => Number(p.payload[chaveForma(g.id)] ?? 0) <= 0)
                  return <Segmento x={p.x} y={p.y} width={p.width} height={p.height} fill={p.fill} topo={topo} />
                }}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  )

  const tabela = (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Dia</TableHead>
          {formas.map((f) => (
            <TableHead key={f.id} className="text-right">
              {f.nome}
            </TableHead>
          ))}
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {dados.map((d) => (
          <TableRow key={d.dataCompleta}>
            <TableCell>{d.dataCompleta}</TableCell>
            {formas.map((f) => (
              <TableCell key={f.id} className="text-right tabular-nums">
                {formatarMoeda(Number(d[chaveForma(f.id)] ?? 0))}
              </TableCell>
            ))}
            <TableCell className="text-right font-medium tabular-nums">{formatarMoeda(d.total)}</TableCell>
          </TableRow>
        ))}
        {dados.length === 0 && (
          <TableRow>
            <TableCell colSpan={formas.length + 2} className="text-center text-muted-foreground">
              Sem caixas no período.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
      {dados.length > 0 && resumo && (
        <TableFooter>
          <TableRow>
            <TableCell>Total</TableCell>
            {formas.map((f) => (
              <TableCell key={f.id} className="text-right tabular-nums">
                {formatarMoeda(resumo.totais.porForma[String(f.id)] ?? 0)}
              </TableCell>
            ))}
            <TableCell className="text-right tabular-nums">{formatarMoeda(resumo.totais.totalVendido)}</TableCell>
          </TableRow>
        </TableFooter>
      )}
    </Table>
  )

  return (
    <CartaoGrafico
      titulo="Vendas por dia"
      descricao="Recebido em cada dia (pela abertura do caixa), por forma de recebimento."
      atualizando={atualizando}
      grafico={grafico}
      tabela={tabela}
    />
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Gráfico 2: recebido por utilizador (quem processou as devoluções), uma série só
// ---------------------------------------------------------------------------------------------------------------------

/** Os primeiros MAX_UTILIZADORES pelo valor; o resto vira "Outros" (nunca se gera uma cor a mais). */
function agruparUtilizadores(lista: FluxoCaixaRecebido[]): FluxoCaixaRecebido[] {
  if (lista.length <= MAX_UTILIZADORES) return lista
  const principais = lista.slice(0, MAX_UTILIZADORES - 1)
  const resto = lista.slice(MAX_UTILIZADORES - 1)
  return [
    ...principais,
    {
      usuarioId: 0,
      usuarioNome: `Outros (${resto.length})`,
      totalRecebido: resto.reduce((s, r) => s + r.totalRecebido, 0),
      quantidadeLocacoes: resto.reduce((s, r) => s + r.quantidadeLocacoes, 0),
    },
  ]
}

function TooltipUtilizador({ active, payload }: { active?: boolean; payload?: Array<{ payload: FluxoCaixaRecebido }> }) {
  if (!active || !payload?.length) return null
  const u = payload[0].payload
  return (
    <div className="rounded-md border bg-popover p-2.5 text-xs shadow-md">
      <p className="text-base font-semibold tabular-nums text-popover-foreground">{formatarMoeda(u.totalRecebido)}</p>
      <p className="text-muted-foreground">{u.usuarioNome}</p>
      <p className="text-muted-foreground">
        {u.quantidadeLocacoes} {u.quantidadeLocacoes === 1 ? 'locação' : 'locações'}
      </p>
    </div>
  )
}

function RecebidoPorUtilizador({
  resumo,
  atualizando,
}: {
  resumo: FluxoCaixaResumo | undefined
  atualizando: boolean
}) {
  const dados = agruparUtilizadores(resumo?.porUtilizador ?? [])

  const grafico =
    dados.length === 0 ? (
      <SemDados />
    ) : (
      <div
        style={{ height: Math.max(140, dados.length * 40 + 16) }}
        role="img"
        aria-label="Gráfico de barras com o total recebido por utilizador. Use Ver tabela para ler os valores."
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dados} layout="vertical" margin={{ top: 0, right: 84, bottom: 0, left: 0 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="usuarioNome"
              width={112}
              tick={{ fill: 'var(--foreground)', fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
            />
            <Tooltip
              cursor={{ fill: 'var(--muted)', opacity: 0.7 }}
              content={(p) => (
                <TooltipUtilizador
                  active={p.active}
                  payload={p.payload as unknown as Array<{ payload: FluxoCaixaRecebido }> | undefined}
                />
              )}
            />
            {/* Uma série = uma cor, sem legenda (o título já diz o que é). Violeta: não confunde com "Dinheiro" (azul). */}
            <Bar
              dataKey="totalRecebido"
              fill="var(--viz-ranking)"
              maxBarSize={24}
              radius={[0, 4, 4, 0]}
              isAnimationActive={false}
            >
              <LabelList
                dataKey="totalRecebido"
                position="right"
                formatter={(v: unknown) => formatarMoeda(Number(v))}
                style={{ fill: 'var(--foreground)', fontSize: 12 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    )

  const tabela = (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Utilizador</TableHead>
          <TableHead className="text-right">Locações</TableHead>
          <TableHead className="text-right">Recebido</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(resumo?.porUtilizador ?? []).map((u) => (
          <TableRow key={u.usuarioId}>
            <TableCell>{u.usuarioNome}</TableCell>
            <TableCell className="text-right tabular-nums">{u.quantidadeLocacoes}</TableCell>
            <TableCell className="text-right tabular-nums">{formatarMoeda(u.totalRecebido)}</TableCell>
          </TableRow>
        ))}
        {(resumo?.porUtilizador.length ?? 0) === 0 && (
          <TableRow>
            <TableCell colSpan={3} className="text-center text-muted-foreground">
              Sem caixas no período.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )

  return (
    <CartaoGrafico
      titulo="Recebido por utilizador"
      descricao="Quem processou as devoluções nos caixas do período."
      atualizando={atualizando}
      grafico={grafico}
      tabela={tabela}
    />
  )
}

export function FluxoCaixaGraficos({
  resumo,
  formas,
  atualizando,
}: {
  resumo: FluxoCaixaResumo | undefined
  formas: FormaRecebimento[]
  atualizando: boolean
}) {
  return (
    <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <VendasPorDia resumo={resumo} formas={formas} atualizando={atualizando} />
      <RecebidoPorUtilizador resumo={resumo} atualizando={atualizando} />
    </div>
  )
}
