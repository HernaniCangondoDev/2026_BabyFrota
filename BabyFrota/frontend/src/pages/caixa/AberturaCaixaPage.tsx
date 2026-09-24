import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AxiosError } from 'axios'
import { CheckCircle2, Wallet } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAbrirCaixa, useCaixaAberto } from '@/features/caixa/api'
import { extrairMensagemErro, formatarDataHora, formatarMoeda } from '@/lib/utils'
import { toast } from '@/stores/toast-store'

const schema = z.object({
  suprimentoInicial: z.coerce.number().min(0, 'Valor inválido'),
})
type FormValues = z.infer<typeof schema>

export function AberturaCaixaPage() {
  const { data: caixaAberto, isLoading } = useCaixaAberto()
  const abrir = useAbrirCaixa()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { suprimentoInicial: 0 } })

  async function onSubmit(values: FormValues) {
    try {
      await abrir.mutateAsync(values)
      toast.success('Caixa aberto com sucesso.')
    } catch (err) {
      toast.error('Não foi possível abrir o caixa.', extrairMensagemErro(err))
    }
  }

  return (
    <>
      <PageHeader title="Abertura de Caixa" description="Abre um novo caixa para registrar locações, suprimentos e sangrias do dia." />

      <Card className="max-w-lg">
        <CardContent className="pt-6">
          {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}

          {!isLoading && caixaAberto && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="size-5" />
                <p className="font-medium">Já existe um caixa aberto</p>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Aberto por <span className="text-foreground">{caixaAberto.usuarioAberturaNome}</span> em {formatarDataHora(caixaAberto.dataAbertura)}</p>
                <p>Suprimento inicial: <span className="text-foreground">{formatarMoeda(caixaAberto.suprimentoInicial)}</span></p>
                <p>Saldo em dinheiro: <span className="text-foreground font-medium">{formatarMoeda(caixaAberto.saldoEmDinheiro)}</span></p>
              </div>
              <Badge variant="success">Caixa aberto</Badge>
            </div>
          )}

          {!isLoading && !caixaAberto && (
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Wallet className="size-5" />
                <p className="text-sm">Nenhum caixa aberto no momento.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="suprimentoInicial">Suprimento inicial (troco)</Label>
                <Input id="suprimentoInicial" type="number" step="0.01" {...register('suprimentoInicial')} />
                {errors.suprimentoInicial && (
                  <p className="text-xs text-destructive">{errors.suprimentoInicial.message}</p>
                )}
              </div>

              {abrir.isError && (
                <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
                  {abrir.error instanceof AxiosError
                    ? (abrir.error.response?.data?.detail ?? 'Não foi possível abrir o caixa.')
                    : 'Não foi possível abrir o caixa.'}
                </p>
              )}

              <Button type="submit" disabled={isSubmitting} className="w-full">
                Abrir caixa
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </>
  )
}
