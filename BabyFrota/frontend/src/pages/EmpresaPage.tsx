import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AxiosError } from 'axios'
import { Loader2, MapPinCheck } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { useEmpresa, useSalvarEmpresa } from '@/features/empresa/api'
import { buscarCep } from '@/features/cep/api'
import { toast } from '@/stores/toast-store'
import { extrairMensagemErro } from '@/lib/utils'

const schema = z.object({
  cnpj: z.string().min(11, 'CNPJ inválido'),
  razaoSocial: z.string().min(2, 'Informe a razão social'),
  responsavelLegal: z.string().min(2, 'Informe o responsável legal'),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  ddd: z.string().optional(),
  telefone: z.string().optional(),
  celular: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export function EmpresaPage() {
  const { data: empresa, isLoading } = useEmpresa()
  const salvar = useSalvarEmpresa()
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [erroCep, setErroCep] = useState<string | null>(null)
  const [bairroEncontrado, setBairroEncontrado] = useState<string | null>(null)
  const [mensagemSucesso, setMensagemSucesso] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!empresa) return
    reset({
      cnpj: empresa.cnpj,
      razaoSocial: empresa.razaoSocial,
      responsavelLegal: empresa.responsavelLegal,
      cep: empresa.cep ?? '',
      logradouro: empresa.logradouro ?? '',
      numero: empresa.numero ?? '',
      complemento: empresa.complemento ?? '',
      ddd: empresa.ddd ?? '',
      telefone: empresa.telefone ?? '',
      celular: empresa.celular ?? '',
    })
  }, [empresa, reset])

  async function onBuscarCep() {
    const cep = getValues('cep')?.replace(/\D/g, '')
    if (!cep || cep.length !== 8) {
      setErroCep('Informe um CEP com 8 dígitos.')
      return
    }
    setErroCep(null)
    setBairroEncontrado(null)
    setBuscandoCep(true)
    try {
      const endereco = await buscarCep(cep)
      setValue('logradouro', endereco.logradouro, { shouldValidate: true })
      setBairroEncontrado(endereco.bairro || null)
    } catch (err) {
      const status = err instanceof AxiosError ? err.response?.status : undefined
      setErroCep(status === 404 ? 'CEP não encontrado.' : 'Não foi possível consultar o CEP agora.')
    } finally {
      setBuscandoCep(false)
    }
  }

  async function onSubmit(values: FormValues) {
    setMensagemSucesso(false)
    try {
      await salvar.mutateAsync(values)
      setMensagemSucesso(true)
      toast.success('Dados da empresa salvos com sucesso.')
    } catch (err) {
      toast.error('Não foi possível salvar os dados da empresa.', extrairMensagemErro(err))
    }
  }

  return (
    <>
      <PageHeader title="Empresa" description="Dados cadastrais da empresa, usados em recibos e relatórios." />

      <Card className="max-w-3xl">
        <CardContent className="pt-6">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input id="cnpj" {...register('cnpj')} />
                  {errors.cnpj && <p className="text-xs text-destructive">{errors.cnpj.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="responsavelLegal">Responsável legal</Label>
                  <Input id="responsavelLegal" {...register('responsavelLegal')} />
                  {errors.responsavelLegal && (
                    <p className="text-xs text-destructive">{errors.responsavelLegal.message}</p>
                  )}
                </div>

                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="razaoSocial">Razão social</Label>
                  <Input id="razaoSocial" {...register('razaoSocial')} />
                  {errors.razaoSocial && <p className="text-xs text-destructive">{errors.razaoSocial.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ddd">DDD</Label>
                  <Input id="ddd" {...register('ddd')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input id="telefone" {...register('telefone')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="celular">Celular</Label>
                  <Input id="celular" {...register('celular')} />
                </div>
              </div>

              <div className="space-y-3 rounded-lg border p-3">
                <p className="flex items-center gap-1.5 text-sm font-medium">
                  <MapPinCheck className="size-4" /> Endereço
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="cep">CEP</Label>
                    <div className="flex gap-2">
                      <Input id="cep" placeholder="00000-000" maxLength={9} {...register('cep')} />
                      <Button type="button" variant="outline" onClick={onBuscarCep} disabled={buscandoCep}>
                        {buscandoCep ? <Loader2 className="size-4 animate-spin" /> : 'Buscar'}
                      </Button>
                    </div>
                    {erroCep && <p className="text-xs text-destructive">{erroCep}</p>}
                    {bairroEncontrado && !erroCep && (
                      <p className="text-xs text-muted-foreground">Bairro: {bairroEncontrado}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="numero">Número</Label>
                    <Input id="numero" {...register('numero')} />
                  </div>

                  <div className="col-span-2 space-y-1.5">
                    <Label htmlFor="logradouro">Logradouro</Label>
                    <Input id="logradouro" {...register('logradouro')} />
                  </div>

                  <div className="col-span-2 space-y-1.5">
                    <Label htmlFor="complemento">Complemento</Label>
                    <Input id="complemento" {...register('complemento')} />
                  </div>
                </div>
              </div>

              {mensagemSucesso && (
                <p className="rounded-md bg-emerald-50 p-2 text-sm text-emerald-800">
                  Dados da empresa salvos com sucesso.
                </p>
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  Salvar
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </>
  )
}
