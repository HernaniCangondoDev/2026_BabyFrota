import { useMemo, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AxiosError } from 'axios'
import { Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ClienteAutocomplete } from '@/components/clientes/ClienteAutocomplete'
import {
  useCarrinhosDisponiveis,
  useFaixasPreco,
  useFormasRecebimento,
  useLocacoesEmAndamento,
  useRegistrarEntrega,
} from '@/features/locacoes/api'
import type { Cliente } from '@/features/clientes/types'
import { extrairMensagemErro, formatarDataHora, formatarMoeda } from '@/lib/utils'
import { toast } from '@/stores/toast-store'

const pagamentoSchema = z.object({
  formaRecebimentoId: z.coerce.number().min(1, 'Selecione a forma'),
  valor: z.coerce.number().min(0.01, 'Valor inválido'),
})

const schema = z.object({
  carrinhoId: z.coerce.number().min(1, 'Selecione um carrinho'),
  tempoMinutos: z.coerce.number().min(1, 'Informe o tempo'),
  desconto: z.coerce.number().min(0).optional(),
  observacao: z.string().optional(),
  pagamentos: z.array(pagamentoSchema).min(1, 'Adicione ao menos uma forma de pagamento'),
})
type FormValues = z.infer<typeof schema>

export function EntregaPage() {
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null)

  const { data: carrinhos } = useCarrinhosDisponiveis()
  const { data: formasRecebimento } = useFormasRecebimento()
  const { data: emAndamento } = useLocacoesEmAndamento()
  const registrarEntrega = useRegistrarEntrega()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { carrinhoId: 0, tempoMinutos: 0, desconto: 0, observacao: '', pagamentos: [] },
  })

  const { fields: pagamentos, append: adicionarPagamento, remove: removerPagamento } = useFieldArray({
    control,
    name: 'pagamentos',
  })

  const carrinhoId = watch('carrinhoId')
  const tempoMinutos = watch('tempoMinutos')
  const desconto = watch('desconto') ?? 0
  const valoresPagamentos = watch('pagamentos')

  const { data: faixas } = useFaixasPreco(carrinhoId > 0 ? carrinhoId : null)

  const faixaAtual = useMemo(
    () => faixas?.find((f) => tempoMinutos >= f.minimoMinutos && tempoMinutos <= f.maximoMinutos) ?? null,
    [faixas, tempoMinutos],
  )
  const valorTotal = faixaAtual ? Math.max(0, faixaAtual.valor - desconto) : null
  const somaPagamentos = (valoresPagamentos ?? []).reduce((soma, p) => soma + (Number(p.valor) || 0), 0)
  const troco = valorTotal !== null ? somaPagamentos - valorTotal : null

  async function onSubmit(values: FormValues) {
    if (!cliente) return
    setMensagemSucesso(null)
    try {
      await registrarEntrega.mutateAsync({
        clienteId: cliente.id,
        carrinhoId: values.carrinhoId,
        tempoMinutos: values.tempoMinutos,
        desconto: values.desconto ?? 0,
        observacao: values.observacao || undefined,
        pagamentos: values.pagamentos,
      })
      setMensagemSucesso(`Locação registrada para ${cliente.nome}.`)
      toast.success('Entrega registrada com sucesso.', `Cliente: ${cliente.nome}`)
      setCliente(null)
      reset({ carrinhoId: 0, tempoMinutos: 0, desconto: 0, observacao: '', pagamentos: [] })
    } catch (err) {
      toast.error('Não foi possível registrar a entrega.', extrairMensagemErro(err))
    }
  }

  return (
    <>
      <PageHeader title="Entrega" description="Registra a locação de um carrinho para um cliente." />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardContent className="space-y-6 pt-6">
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-1.5">
                <Label>Cliente</Label>
                <ClienteAutocomplete clienteSelecionado={cliente} onSelecionar={setCliente} />
                {!cliente && <p className="text-xs text-muted-foreground">Busque e selecione o cliente antes de salvar.</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="carrinhoId">Carrinho disponível</Label>
                  <Select id="carrinhoId" {...register('carrinhoId')}>
                    <option value={0}>Selecione...</option>
                    {carrinhos?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.descricao} — {c.tipoCarrinhoDescricao}
                      </option>
                    ))}
                  </Select>
                  {errors.carrinhoId && <p className="text-xs text-destructive">{errors.carrinhoId.message}</p>}
                  {carrinhos?.length === 0 && (
                    <p className="text-xs text-amber-700">Nenhum carrinho disponível no momento.</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="tempoMinutos">Tempo (minutos)</Label>
                  <Input id="tempoMinutos" type="number" {...register('tempoMinutos')} />
                  {errors.tempoMinutos && <p className="text-xs text-destructive">{errors.tempoMinutos.message}</p>}
                  {carrinhoId > 0 && tempoMinutos > 0 && !faixaAtual && (
                    <p className="text-xs text-destructive">Não há faixa de preço cadastrada para esse tempo.</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="desconto">Desconto</Label>
                  <Input id="desconto" type="number" step="0.01" {...register('desconto')} />
                </div>

                <div className="space-y-1.5">
                  <Label>Valor da locação</Label>
                  <p className="flex h-9 items-center text-lg font-semibold">
                    {valorTotal !== null ? formatarMoeda(valorTotal) : '—'}
                  </p>
                </div>
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
                      <Select id={`pagamentos.${index}.formaRecebimentoId`} {...register(`pagamentos.${index}.formaRecebimentoId` as const)}>
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

              {registrarEntrega.isError && (
                <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
                  {registrarEntrega.error instanceof AxiosError
                    ? (registrarEntrega.error.response?.data?.detail ?? 'Não foi possível registrar a entrega.')
                    : 'Não foi possível registrar a entrega.'}
                </p>
              )}
              {mensagemSucesso && (
                <p className="rounded-md bg-emerald-50 p-2 text-sm text-emerald-800">{mensagemSucesso}</p>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting || !cliente}>
                Registrar entrega
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Locações em andamento</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Carrinho</TableHead>
                  <TableHead>Entrega</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emAndamento?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
