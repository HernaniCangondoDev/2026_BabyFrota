import { useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AxiosError } from 'axios'
import { ArrowLeftRight, Loader2, Plus, Trash2, Undo2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  useCarrinhosParaTroca,
  useFormasRecebimento,
  useLocacoesEmAndamento,
  usePreviaDevolucao,
  useRegistrarDevolucao,
  useTrocarCarrinho,
} from '@/features/locacoes/api'
import type { Locacao } from '@/features/locacoes/types'
import { extrairMensagemErro, formatarDataHora, formatarMoeda } from '@/lib/utils'
import { toast } from '@/stores/toast-store'

const pagamentoSchema = z.object({
  formaRecebimentoId: z.coerce.number().min(1, 'Selecione a forma'),
  valor: z.coerce.number().min(0.01, 'Valor inválido'),
})

const devolucaoSchema = z.object({
  desconto: z.coerce.number().min(0).optional(),
  observacao: z.string().optional(),
  pagamentos: z.array(pagamentoSchema).min(1, 'Adicione ao menos uma forma de pagamento'),
})
type DevolucaoFormValues = z.infer<typeof devolucaoSchema>

/** Estimativa client-side só para exibição na lista — o valor oficial vem da prévia ao abrir a devolução. */
function tempoDecorridoTexto(dataEntrega: string): string {
  const minutos = Math.max(0, Math.round((Date.now() - new Date(dataEntrega).getTime()) / 60000))
  const horas = Math.floor(minutos / 60)
  const restante = minutos % 60
  return horas > 0 ? `${horas}h ${restante}min` : `${restante}min`
}

export function TrocaDevolucaoPage() {
  const { data: emAndamento, isLoading } = useLocacoesEmAndamento()

  // --- Troca ---
  const [locacaoTroca, setLocacaoTroca] = useState<Locacao | null>(null)
  const [novoCarrinhoId, setNovoCarrinhoId] = useState(0)
  const { data: carrinhosTroca, isFetching: carregandoCarrinhosTroca } = useCarrinhosParaTroca(
    locacaoTroca?.id ?? null,
  )
  const trocarCarrinho = useTrocarCarrinho()

  function abrirTroca(locacao: Locacao) {
    setNovoCarrinhoId(0)
    setLocacaoTroca(locacao)
  }

  async function confirmarTroca() {
    if (!locacaoTroca || !novoCarrinhoId) return
    try {
      await trocarCarrinho.mutateAsync({ locacaoId: locacaoTroca.id, payload: { novoCarrinhoId } })
      toast.success('Carrinho trocado com sucesso.')
      setLocacaoTroca(null)
    } catch (err) {
      toast.error('Não foi possível trocar o carrinho.', extrairMensagemErro(err))
    }
  }

  // --- Devolução ---
  const [locacaoDevolucao, setLocacaoDevolucao] = useState<Locacao | null>(null)
  const { data: previa, isFetching: carregandoPrevia } = usePreviaDevolucao(locacaoDevolucao?.id ?? null)
  const { data: formasRecebimento } = useFormasRecebimento()
  const registrarDevolucao = useRegistrarDevolucao()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<DevolucaoFormValues>({
    resolver: zodResolver(devolucaoSchema),
    defaultValues: { desconto: 0, observacao: '', pagamentos: [] },
  })

  const { fields: pagamentos, append: adicionarPagamento, remove: removerPagamento } = useFieldArray({
    control,
    name: 'pagamentos',
  })

  const desconto = watch('desconto') ?? 0
  const valoresPagamentos = watch('pagamentos')

  function abrirDevolucao(locacao: Locacao) {
    reset({ desconto: 0, observacao: '', pagamentos: [] })
    setLocacaoDevolucao(locacao)
  }

  const valorTotal = previa ? Math.max(0, previa.valor - desconto) : null
  const somaPagamentos = (valoresPagamentos ?? []).reduce((soma, p) => soma + (Number(p.valor) || 0), 0)
  const troco = valorTotal !== null ? somaPagamentos - valorTotal : null

  async function onSubmitDevolucao(values: DevolucaoFormValues) {
    if (!locacaoDevolucao) return
    try {
      await registrarDevolucao.mutateAsync({
        locacaoId: locacaoDevolucao.id,
        payload: {
          desconto: values.desconto ?? 0,
          observacao: values.observacao || undefined,
          pagamentos: values.pagamentos,
        },
      })
      toast.success('Devolução registrada com sucesso.', `Cliente: ${locacaoDevolucao.clienteNome}`)
      setLocacaoDevolucao(null)
    } catch (err) {
      toast.error('Não foi possível registrar a devolução.', extrairMensagemErro(err))
    }
  }

  return (
    <>
      <PageHeader
        title="Troca e Devolução"
        description="Troque o carrinho de uma locação em andamento ou finalize a devolução."
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Carrinho</TableHead>
                <TableHead>Entrega</TableHead>
                <TableHead>Tempo decorrido</TableHead>
                <TableHead className="text-right">Ações</TableHead>
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
              {!isLoading && emAndamento?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhuma locação em andamento.
                  </TableCell>
                </TableRow>
              )}
              {emAndamento?.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.clienteNome}</TableCell>
                  <TableCell>
                    <Badge variant="default">{l.carrinhoDescricao}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatarDataHora(l.dataEntrega)}</TableCell>
                  <TableCell className="text-xs">{tempoDecorridoTexto(l.dataEntrega)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => abrirTroca(l)} title="Trocar carrinho">
                      <ArrowLeftRight className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => abrirDevolucao(l)} title="Registrar devolução">
                      <Undo2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Troca */}
      <Dialog open={locacaoTroca !== null} onOpenChange={(open) => !open && setLocacaoTroca(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trocar carrinho</DialogTitle>
          </DialogHeader>

          {locacaoTroca && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Cliente <span className="font-medium text-foreground">{locacaoTroca.clienteNome}</span> — carrinho
                atual <span className="font-medium text-foreground">{locacaoTroca.carrinhoDescricao}</span>.
              </p>

              <div className="space-y-1.5">
                <Label htmlFor="novoCarrinhoId">Novo carrinho (mesmo tipo, disponível)</Label>
                <Select
                  id="novoCarrinhoId"
                  value={novoCarrinhoId}
                  onChange={(e) => setNovoCarrinhoId(Number(e.target.value))}
                >
                  <option value={0}>Selecione...</option>
                  {carrinhosTroca?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.descricao}
                    </option>
                  ))}
                </Select>
                {carregandoCarrinhosTroca && (
                  <p className="text-xs text-muted-foreground">Carregando carrinhos disponíveis...</p>
                )}
                {!carregandoCarrinhosTroca && carrinhosTroca?.length === 0 && (
                  <p className="text-xs text-amber-700">Não há outro carrinho do mesmo tipo disponível agora.</p>
                )}
              </div>

              {trocarCarrinho.isError && (
                <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
                  {trocarCarrinho.error instanceof AxiosError
                    ? (trocarCarrinho.error.response?.data?.detail ?? 'Não foi possível trocar o carrinho.')
                    : 'Não foi possível trocar o carrinho.'}
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setLocacaoTroca(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={confirmarTroca}
              disabled={!novoCarrinhoId || trocarCarrinho.isPending}
            >
              Confirmar troca
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Devolução */}
      <Dialog open={locacaoDevolucao !== null} onOpenChange={(open) => !open && setLocacaoDevolucao(null)}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar devolução</DialogTitle>
          </DialogHeader>

          {locacaoDevolucao && (
            <form className="space-y-5" onSubmit={handleSubmit(onSubmitDevolucao)}>
              <p className="text-sm text-muted-foreground">
                Cliente <span className="font-medium text-foreground">{locacaoDevolucao.clienteNome}</span> — carrinho{' '}
                <span className="font-medium text-foreground">{locacaoDevolucao.carrinhoDescricao}</span>.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Tempo total</Label>
                  <p className="flex h-9 items-center text-sm">
                    {carregandoPrevia ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : previa ? (
                      `${previa.tempoMinutos} min`
                    ) : (
                      '—'
                    )}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="desconto">Desconto</Label>
                  <Input id="desconto" type="number" step="0.01" {...register('desconto')} />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-md border p-3">
                <span className="text-sm text-muted-foreground">Valor da devolução</span>
                <span className="text-lg font-semibold">
                  {valorTotal !== null ? formatarMoeda(valorTotal) : '—'}
                </span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="observacao">Observação</Label>
                <Input id="observacao" {...register('observacao')} />
              </div>

              <div className="space-y-3 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Pagamento</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => adicionarPagamento({ formaRecebimentoId: formasRecebimento?.[0]?.id ?? 0, valor: 0 })}
                  >
                    <Plus className="size-4" /> Adicionar forma
                  </Button>
                </div>

                {pagamentos.length === 0 && (
                  <p className="text-sm text-muted-foreground">Adicione ao menos uma forma de pagamento.</p>
                )}
                {errors.pagamentos?.message && (
                  <p className="text-xs text-destructive">{errors.pagamentos.message}</p>
                )}

                {pagamentos.map((pagamento, index) => (
                  <div key={pagamento.id} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
                    <div className="space-y-1.5">
                      <Label htmlFor={`pagamentos.${index}.formaRecebimentoId`}>Forma</Label>
                      <Select
                        id={`pagamentos.${index}.formaRecebimentoId`}
                        {...register(`pagamentos.${index}.formaRecebimentoId` as const)}
                      >
                        {formasRecebimento?.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.nome}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`pagamentos.${index}.valor`}>Valor</Label>
                      <Input
                        id={`pagamentos.${index}.valor`}
                        type="number"
                        step="0.01"
                        {...register(`pagamentos.${index}.valor` as const)}
                      />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removerPagamento(index)} title="Remover">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}

                {valorTotal !== null && (
                  <div className="flex items-center justify-between border-t pt-2 text-sm">
                    <span className="text-muted-foreground">Pago: {formatarMoeda(somaPagamentos)}</span>
                    <span className={troco !== null && troco < 0 ? 'text-destructive' : 'font-medium'}>
                      {troco !== null && troco < 0
                        ? `Falta ${formatarMoeda(Math.abs(troco))}`
                        : `Troco: ${formatarMoeda(troco ?? 0)}`}
                    </span>
                  </div>
                )}
              </div>

              {registrarDevolucao.isError && (
                <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
                  {registrarDevolucao.error instanceof AxiosError
                    ? (registrarDevolucao.error.response?.data?.detail ?? 'Não foi possível registrar a devolução.')
                    : 'Não foi possível registrar a devolução.'}
                </p>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setLocacaoDevolucao(null)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting || !previa}>
                  Confirmar devolução
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
