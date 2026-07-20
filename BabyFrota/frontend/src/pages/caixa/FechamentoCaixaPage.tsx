import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AxiosError } from 'axios'
import { AlertTriangle, Landmark } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { useCaixaAberto, useFecharCaixa } from '@/features/caixa/api'
import { formatarDataHora, formatarMoeda } from '@/lib/utils'

const schema = z.object({
  valorFechamento: z.coerce.number().min(0, 'Valor inválido'),
})
type FormValues = z.infer<typeof schema>

export function FechamentoCaixaPage() {
  const { data: caixaAberto, isLoading } = useCaixaAberto()
  const fechar = useFecharCaixa()
  const [fechado, setFechado] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const valorFechamento = watch('valorFechamento')
  const diferenca =
    caixaAberto && typeof valorFechamento === 'number' && !Number.isNaN(valorFechamento)
      ? valorFechamento - caixaAberto.saldoAtual
      : null

  async function onSubmit(values: FormValues) {
    if (!confirm('Confirma o fechamento do caixa? Essa ação não pode ser desfeita.')) return
    await fechar.mutateAsync(values)
    setFechado(true)
  }

  return (
    <>
      <PageHeader title="Fechamento de Caixa" description="Confere o saldo calculado com o valor contado e encerra o caixa do dia." />

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
                <div className="grid grid-cols-2 gap-x-4 pt-1">
                  <p className="text-muted-foreground">Suprimento inicial</p>
                  <p className="text-right text-foreground">{formatarMoeda(caixaAberto.suprimentoInicial)}</p>
                  <p className="text-muted-foreground">Locações</p>
                  <p className="text-right text-foreground">{formatarMoeda(caixaAberto.totalLocacoes)}</p>
                  <p className="text-muted-foreground">Suprimentos</p>
                  <p className="text-right text-foreground">{formatarMoeda(caixaAberto.totalSuprimentos)}</p>
                  <p className="text-muted-foreground">Sangrias</p>
                  <p className="text-right text-foreground">-{formatarMoeda(caixaAberto.totalSangrias)}</p>
                  <p className="font-medium text-foreground">Saldo calculado</p>
                  <p className="text-right font-medium text-foreground">{formatarMoeda(caixaAberto.saldoAtual)}</p>
                </div>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-1.5">
                  <Label htmlFor="valorFechamento">Valor contado no caixa</Label>
                  <Input id="valorFechamento" type="number" step="0.01" {...register('valorFechamento')} />
                  {errors.valorFechamento && (
                    <p className="text-xs text-destructive">{errors.valorFechamento.message}</p>
                  )}
                </div>

                {diferenca !== null && diferenca !== 0 && (
                  <p className="flex items-center gap-2 rounded-md bg-amber-50 p-2 text-sm text-amber-800">
                    <AlertTriangle className="size-4 shrink-0" />
                    {diferenca > 0
                      ? `Sobra de ${formatarMoeda(diferenca)} em relação ao saldo calculado.`
                      : `Falta de ${formatarMoeda(Math.abs(diferenca))} em relação ao saldo calculado.`}
                  </p>
                )}

                {fechar.isError && (
                  <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
                    {fechar.error instanceof AxiosError
                      ? (fechar.error.response?.data?.detail ?? 'Não foi possível fechar o caixa.')
                      : 'Não foi possível fechar o caixa.'}
                  </p>
                )}

                <Button type="submit" disabled={isSubmitting} className="w-full">
                  Fechar caixa
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </>
  )
}
