import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowDownCircle, ArrowUpCircle, Wallet } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  useCaixaAberto,
  useRegistrarSangria,
  useRegistrarSuprimento,
  useSangrias,
  useSuprimentos,
} from '@/features/caixa/api'
import { formatarDataHora, formatarMoeda } from '@/lib/utils'

const schema = z.object({
  valor: z.coerce.number().positive('Informe um valor maior que zero'),
})
type FormValues = z.infer<typeof schema>

function FormularioValor({
  onConfirmar,
  rotulo,
}: {
  onConfirmar: (valor: number) => Promise<unknown>
  rotulo: string
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { valor: 0 } })

  async function onSubmit(values: FormValues) {
    await onConfirmar(values.valor)
    reset({ valor: 0 })
  }

  return (
    <form className="flex items-end gap-2" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex-1 space-y-1.5">
        <Label htmlFor={`valor-${rotulo}`}>Valor</Label>
        <Input id={`valor-${rotulo}`} type="number" step="0.01" {...register('valor')} />
        {errors.valor && <p className="text-xs text-destructive">{errors.valor.message}</p>}
      </div>
      <Button type="submit" disabled={isSubmitting}>
        Lançar
      </Button>
    </form>
  )
}

export function SuprimentoSangriaPage() {
  const { data: caixaAberto, isLoading } = useCaixaAberto()
  const { data: suprimentos } = useSuprimentos()
  const { data: sangrias } = useSangrias()
  const registrarSuprimento = useRegistrarSuprimento()
  const registrarSangria = useRegistrarSangria()

  return (
    <>
      <PageHeader title="Suprimento e Sangria" description="Lançamentos de entrada (suprimento) e saída (sangria) de dinheiro no caixa aberto." />

      {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}

      {!isLoading && !caixaAberto && (
        <Card className="max-w-lg">
          <CardContent className="flex items-center gap-2 pt-6 text-muted-foreground">
            <Wallet className="size-5" />
            <p className="text-sm">Não há caixa aberto — abra o caixa antes de lançar suprimentos ou sangrias.</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && caixaAberto && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ArrowUpCircle className="size-4 text-emerald-600" /> Suprimento (entrada)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormularioValor rotulo="suprimento" onConfirmar={(valor) => registrarSuprimento.mutateAsync(valor)} />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suprimentos?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        Nenhum suprimento lançado.
                      </TableCell>
                    </TableRow>
                  )}
                  {suprimentos?.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="text-muted-foreground">{formatarDataHora(s.data)}</TableCell>
                      <TableCell className="text-muted-foreground">{s.usuarioNome}</TableCell>
                      <TableCell className="text-right">{formatarMoeda(s.valor)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ArrowDownCircle className="size-4 text-destructive" /> Sangria (saída)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormularioValor rotulo="sangria" onConfirmar={(valor) => registrarSangria.mutateAsync(valor)} />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sangrias?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        Nenhuma sangria lançada.
                      </TableCell>
                    </TableRow>
                  )}
                  {sangrias?.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="text-muted-foreground">{formatarDataHora(s.data)}</TableCell>
                      <TableCell className="text-muted-foreground">{s.usuarioNome}</TableCell>
                      <TableCell className="text-right">{formatarMoeda(s.valor)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
