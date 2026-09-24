import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { AxiosError } from 'axios'
import { CarrinhoAutocomplete } from '@/components/carrinhos/CarrinhoAutocomplete'
import { ClienteAutocomplete } from '@/components/clientes/ClienteAutocomplete'
import { PageHeader } from '@/components/layout/PageHeader'
import { LocacaoAcoesDialog } from '@/components/locacao/LocacaoAcoesDialog'
import { TabelaPrecosDialog } from '@/components/locacao/TabelaPrecosDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Cliente } from '@/features/clientes/types'
import { useCarrinhosDisponiveis, useLocacoesEmAndamento, useRegistrarEntrega } from '@/features/locacoes/api'
import { useImprimirComprovante } from '@/features/locacoes/comprovante'
import type { CarrinhoDisponivel, Locacao } from '@/features/locacoes/types'
import { useAgora } from '@/hooks/use-agora'
import { extrairMensagemErro, formatarDataHora, tempoDecorrido } from '@/lib/utils'
import { toast } from '@/stores/toast-store'

interface FormValues {
  observacao: string
}

export function EntregaPage() {
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [carrinho, setCarrinho] = useState<CarrinhoDisponivel | null>(null)
  /** Carrinho cuja tabela de preços está aberta no modal (abre sozinho ao escolher o carrinho). */
  const [carrinhoDosPrecos, setCarrinhoDosPrecos] = useState<CarrinhoDisponivel | null>(null)
  const [locacaoAberta, setLocacaoAberta] = useState<Locacao | null>(null)
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null)

  const { data: carrinhos, isLoading: carregandoCarrinhos } = useCarrinhosDisponiveis()
  const { data: emAndamento, isLoading: carregandoLocacoes } = useLocacoesEmAndamento()
  const registrarEntrega = useRegistrarEntrega()
  const imprimirComprovante = useImprimirComprovante()
  const agora = useAgora()

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>({ defaultValues: { observacao: '' } })

  function escolherCarrinho(escolhido: CarrinhoDisponivel | null) {
    setCarrinho(escolhido)
    // Como no legado, escolher o carrinho já mostra os preços dele; agora num modal, para o atendente informar o valor.
    if (escolhido) setCarrinhoDosPrecos(escolhido)
  }

  async function onSubmit(values: FormValues) {
    if (!cliente || !carrinho) return
    setMensagemSucesso(null)
    try {
      const { data: locacao } = await registrarEntrega.mutateAsync({
        clienteId: cliente.id,
        carrinhoId: carrinho.id,
        observacao: values.observacao || undefined,
      })
      setMensagemSucesso(`Locação registrada para ${cliente.nome}.`)
      toast.success('Entrega registrada com sucesso.', `Cliente: ${cliente.nome}`)
      void imprimirComprovante('entrega', locacao.id, { automatico: true })
      setCliente(null)
      setCarrinho(null)
      reset({ observacao: '' })
    } catch (err) {
      toast.error('Não foi possível registrar a entrega.', extrairMensagemErro(err))
    }
  }

  return (
    <>
      <PageHeader
        title="Entrega e Devolução"
        description="Registre a entrega de um carrinho. Para devolver ou trocar, clique numa locação em andamento. O valor é calculado pelo tempo de uso e cobrado na devolução."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Card>
          <CardContent className="space-y-6 pt-6">
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-1.5">
                <Label>Cliente</Label>
                <ClienteAutocomplete clienteSelecionado={cliente} onSelecionar={setCliente} />
                {!cliente && <p className="text-xs text-muted-foreground">Busque e selecione o cliente antes de salvar.</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="carrinho">Carrinho disponível</Label>
                <CarrinhoAutocomplete
                  id="carrinho"
                  carrinhos={carrinhos}
                  carregando={carregandoCarrinhos}
                  selecionado={carrinho}
                  onSelecionar={escolherCarrinho}
                  onVerPrecos={setCarrinhoDosPrecos}
                />
                {!carrinho && <p className="text-xs text-muted-foreground">Busque e selecione o carrinho antes de salvar.</p>}
                {carrinhos?.length === 0 && <p className="text-xs text-amber-700">Nenhum carrinho disponível no momento.</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="observacao">Observação</Label>
                <Input id="observacao" {...register('observacao')} />
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

              <Button type="submit" className="w-full" disabled={isSubmitting || !cliente || !carrinho}>
                Registrar entrega
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">Locações em andamento</CardTitle>
              {emAndamento && <Badge variant="secondary">{emAndamento.length}</Badge>}
            </div>
            <p className="text-xs text-muted-foreground">Clique numa locação para devolver ou trocar o carrinho.</p>
          </CardHeader>
          <CardContent className="max-h-[32rem] overflow-y-auto border-t p-0">
            {carregandoLocacoes && <p className="p-4 text-sm text-muted-foreground">Carregando...</p>}
            {!carregandoLocacoes && emAndamento?.length === 0 && (
              <p className="p-4 text-center text-sm text-muted-foreground">Nenhuma locação em andamento.</p>
            )}
            <ul className="divide-y">
              {emAndamento?.map((l) => (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() => setLocacaoAberta(l)}
                    className="flex w-full flex-col items-start gap-1.5 px-4 py-3 text-left transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50"
                  >
                    <span className="font-medium leading-tight">{l.clienteNome}</span>
                    <span className="flex max-w-full flex-wrap items-center gap-x-2 gap-y-1">
                      <Badge variant="default" className="max-w-full truncate">
                        {l.carrinhoDescricao}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        desde {formatarDataHora(l.dataEntrega)} · {tempoDecorrido(l.dataEntrega, agora)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <TabelaPrecosDialog carrinho={carrinhoDosPrecos} onClose={() => setCarrinhoDosPrecos(null)} />
      <LocacaoAcoesDialog locacao={locacaoAberta} abaInicial="devolucao" onClose={() => setLocacaoAberta(null)} />
    </>
  )
}
