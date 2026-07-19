import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Pencil, Plus, Search, UserX } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  useAtualizarUsuario,
  useCriarUsuario,
  useInativarUsuario,
  usePerfis,
  useUsuarios,
} from '@/features/usuarios/api'
import type { Usuario } from '@/features/usuarios/types'

function buildSchema(exigirSenha: boolean) {
  return z.object({
    nome: z.string().min(2, 'Informe o nome completo'),
    email: z.string().email('Email inválido'),
    cpf: z.string().optional(),
    telefone: z.string().optional(),
    celular: z.string().optional(),
    perfilId: z.coerce.number().min(1, 'Selecione um perfil'),
    ativo: z.boolean(),
    senha: exigirSenha
      ? z.string().min(6, 'A senha deve ter ao menos 6 caracteres')
      : z.union([z.string().min(6, 'A senha deve ter ao menos 6 caracteres'), z.literal('')]).optional(),
  })
}
type FormValues = z.infer<ReturnType<typeof buildSchema>>

export function UsuariosPage() {
  const [busca, setBusca] = useState('')
  const { data: usuarios, isLoading } = useUsuarios({ nome: busca || undefined })
  const { data: perfis } = usePerfis()

  const criar = useCriarUsuario()
  const atualizar = useAtualizarUsuario()
  const inativar = useInativarUsuario()

  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Usuario | null>(null)

  const schema = useMemo(() => buildSchema(editando === null), [editando])
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  function abrirNovo() {
    setEditando(null)
    reset({ nome: '', email: '', cpf: '', telefone: '', celular: '', perfilId: perfis?.[0]?.id ?? 0, ativo: true, senha: '' })
    setModalAberto(true)
  }

  function abrirEdicao(usuario: Usuario) {
    setEditando(usuario)
    reset({
      nome: usuario.nome,
      email: usuario.email,
      cpf: usuario.cpf ?? '',
      telefone: usuario.telefone ?? '',
      celular: usuario.celular ?? '',
      perfilId: usuario.perfilId,
      ativo: usuario.ativo,
      senha: '',
    })
    setModalAberto(true)
  }

  async function onSubmit(values: FormValues) {
    const payload = { ...values, senha: values.senha || undefined }
    if (editando) {
      await atualizar.mutateAsync({ id: editando.id, payload })
    } else {
      await criar.mutateAsync(payload)
    }
    setModalAberto(false)
  }

  async function onInativar(usuario: Usuario) {
    if (!confirm(`Inativar o usuário "${usuario.nome}"? Ele não conseguirá mais acessar o sistema.`)) return
    await inativar.mutateAsync(usuario.id)
  }

  return (
    <>
      <PageHeader
        title="Usuários"
        description="Operadores do sistema — cada um com um perfil de acesso."
        actions={
          <Button onClick={abrirNovo}>
            <Plus /> Novo usuário
          </Button>
        }
      />

      <div className="mb-4 flex max-w-sm items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nome..." className="pl-8" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-32 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">Carregando...</TableCell>
                </TableRow>
              )}
              {!isLoading && usuarios?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">Nenhum usuário encontrado.</TableCell>
                </TableRow>
              )}
              {usuarios?.map((usuario) => (
                <TableRow key={usuario.id}>
                  <TableCell className="font-medium">{usuario.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{usuario.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{usuario.perfilNome}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={usuario.ativo ? 'success' : 'outline'}>
                      {usuario.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => abrirEdicao(usuario)} title="Editar">
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onInativar(usuario)} title="Inativar" disabled={!usuario.ativo}>
                      <UserX className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar usuário' : 'Novo usuário'}</DialogTitle>
          </DialogHeader>
          <form className="grid grid-cols-2 gap-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="nome">Nome completo</Label>
              <Input id="nome" {...register('nome')} />
              {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cpf">CPF</Label>
              <Input id="cpf" {...register('cpf')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" {...register('telefone')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="celular">Celular</Label>
              <Input id="celular" {...register('celular')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="perfilId">Perfil</Label>
              <Select id="perfilId" {...register('perfilId')}>
                {perfis?.map((perfil) => (
                  <option key={perfil.id} value={perfil.id}>
                    {perfil.nome}
                  </option>
                ))}
              </Select>
              {errors.perfilId && <p className="text-xs text-destructive">{errors.perfilId.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="senha">{editando ? 'Nova senha (opcional)' : 'Senha'}</Label>
              <Input id="senha" type="password" {...register('senha')} />
              {errors.senha && <p className="text-xs text-destructive">{errors.senha.message}</p>}
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input id="ativo" type="checkbox" className="size-4 rounded border-input" {...register('ativo')} />
              <Label htmlFor="ativo">Usuário ativo</Label>
            </div>

            <DialogFooter className="col-span-2">
              <Button type="button" variant="outline" onClick={() => setModalAberto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
