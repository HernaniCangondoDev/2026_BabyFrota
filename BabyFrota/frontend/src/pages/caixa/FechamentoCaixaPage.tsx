import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Landmark } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useCaixaAberto, useFecharCaixa } from '@/features/caixa/api'
import { FORMA_DINHEIRO_ID } from '@/features/caixa/types'
import { useFormasRecebimento } from '@/features/locacoes/api'
import { extrairMensagemErro, formatarDataHora, formatarMoeda } from '@/lib/utils'
import { toast } from '@/stores/toast-store'

function Linha({ rotulo, valor, destaque }: { rotulo: string; valor: string; destaque?: boolean }) {
  return (
    <>
      <p className={destaque ? 'font-medium text-foreground' : 'text-muted-foreground'}>{rotulo}</p>
      <p className={destaque ? 'text-right font-medium text-foreground' : 'text-right text-foreground'}>{valor}</p>
    </>
  )
}

/**
 * Fechamento no fluxo do legado: o sistema apura tudo e o operador só confirma, sem digitar valor.
 * O servidor grava o total vendido em ValorFechamento, como o legado fazia.
 */
export function FechamentoCaixaPage() {
  const { data: caixaAberto, isLoading } = useCaixaAberto()
  const { data: formas } = useFormasRecebimento()
  const fechar = useFecharCaixa()
  const [fechado, setFechado] = useState(false)

  async function confirmarFechamento() {
    if (!confirm('Confirma o fechamento do caixa? Essa ação não pode ser desfeita.')) return
    try {
      await fechar.mutateAsync()
      setFechado(true)
      toast.success('Caixa fechado com sucesso.')
    } catch (err) {
      toast.error('Não foi possível fechar o caixa.', extrairMensagemErro(err))
    }
  }

  const pendentes = caixaAberto?.locacoesPendentes ?? 0

  return (
    <>
      <PageHeader title="Fechamento de Caixa" description="Confere o resumo apurado pelo sistema e encerra o caixa." />

      <Card className="max-w-lg">
        <CardContent className="space-y-4 pt-6">
          {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}

          {!isLoading && fechado && (
            <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">Caixa fechado com sucesso.</p>
          )}

          {!isLoading && !fechado && !caixaAberto && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Landmark className="size-5" />
              <p className="text-sm">Não há caixa aberto no momento.</p>
            </div>
          )}

          {!isLoading && !fechado && caixaAberto && (
            <>
              <div className="space-y-1 rounded-lg border p-3 text-sm">
                <p className="text-muted-foreground">
                  Aberto por <span className="text-foreground">{caixaAberto.usuarioAberturaNome}</span> em{' '}
                  {formatarDataHora(caixaAberto.dataAbertura)}
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 pt-1">
                  <Linha rotulo="Suprimento inicial" valor={formatarMoeda(caixaAberto.suprimentoInicial)} />
                  <Linha rotulo="Reforços (suprimentos)" valor={formatarMoeda(caixaAberto.totalSuprimentos)} />
                  <Linha rotulo="Sangrias" valor={`-${formatarMoeda(caixaAberto.totalSangrias)}`} />
                </div>

                <p className="pt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Vendas por forma</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                  {[...(formas ?? [])]
                    .sort((a, b) => a.id - b.id)
                    .map((f) => (
                      <Linha
                        key={f.id}
                        rotulo={f.id === FORMA_DINHEIRO_ID ? `${f.nome} (líquido de troco)` : f.nome}
                        valor={formatarMoeda(caixaAberto.porForma[String(f.id)] ?? 0)}
                      />
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 border-t pt-2">
                  <Linha rotulo="Total vendido" valor={formatarMoeda(caixaAberto.totalLocacoes)} destaque />
                  <Linha rotulo="Saldo em dinheiro" valor={formatarMoeda(caixaAberto.saldoEmDinheiro)} destaque />
                </div>
              </div>

              {pendentes > 0 && (
                <p className="flex items-start gap-2 rounded-md bg-amber-50 p-2 text-sm text-amber-800">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <span>
                    {pendentes === 1
                      ? 'Há 1 locação sem devolução.'
                      : `Há ${pendentes} locações sem devolução.`}{' '}
                    O caixa só fecha depois de registrá-las em{' '}
                    <Link to="/locacao/troca-devolucao" className="font-medium underline underline-offset-2">
                      Troca e Devolução
                    </Link>
                    .
                  </span>
                </p>
              )}

              {!caixaAberto.podeFechar && (
                <p className="rounded-md bg-muted p-2 text-sm text-muted-foreground">
                  Somente quem abriu o caixa ({caixaAberto.usuarioAberturaNome}), um Gerente ou um Administrador pode
                  fechá-lo.
                </p>
              )}

              <Button
                type="button"
                className="w-full"
                onClick={confirmarFechamento}
                disabled={fechar.isPending || pendentes > 0 || !caixaAberto.podeFechar}
              >
                Confirmar fechamento
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </>
  )
}
