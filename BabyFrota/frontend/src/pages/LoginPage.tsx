import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AxiosError } from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { login } from '@/features/auth/api'
import { useAuthStore } from '@/store/auth-store'

const schema = z.object({
  email: z.string().email('Informe um email válido'),
  senha: z.string().min(1, 'Informe a senha'),
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.login)
  const [erro, setErro] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    setErro(null)
    try {
      const resposta = await login(values)
      setAuth(resposta.token, resposta.usuario)
      navigate('/', { replace: true })
    } catch (err) {
      const mensagem =
        err instanceof AxiosError ? err.response?.data?.detail ?? err.response?.data?.title : undefined
      setErro(mensagem ?? 'Não foi possível entrar. Verifique suas credenciais.')
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground">
            BF
          </div>
          <CardTitle className="text-xl">Baby Frota</CardTitle>
          <CardDescription>Sistema de Locação</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="username" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="senha">Senha</Label>
              <Input id="senha" type="password" autoComplete="current-password" {...register('senha')} />
              {errors.senha && <p className="text-xs text-destructive">{errors.senha.message}</p>}
            </div>

            {erro && <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{erro}</p>}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
