import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
  useAtualizarTipoCarrinho,
  useCriarTipoCarrinho,
  useExcluirTipoCarrinho,
  useTiposCarrinho,
} from '@/features/tipos-carrinho/api'
import type { TipoCarrinho } from '@/features/tipos-carrinho/types'
import { toast } from '@/stores/toast-store'
import { extrairMensagemErro } from '@/lib/utils'

const schema = z.object({
  descricao: z.string().min(2, 'Informe ao menos 2 caracteres'),
})
type FormValues = z.infer<typeof schema>

export function TiposCarrinhoPage() {
  const { data, isLoading } = useTiposCarrinho()
  const criar = useCriarTipoCarrinho()
  const atualizar = useAtualizarTipoCarrinho()
  const excluir = useExcluirTipoCarrinho()

  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<TipoCarrinho | null>(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  function abrirNovo() {
    setEditando(null)
    reset({ descricao: '' })
    setModalAberto(true)
  }

  function abrirEdicao(item: TipoCarrinho) {
    setEditando(item)
    reset({ descricao: item.descricao })
    setModalAberto(true)
  }

  async function onSubmit(values: FormValues) {
    try {
      if (editando) {
        await atualizar.mutateAsync({ id: editando.id, payload: values })
        toast.success('Tipo de carrinho atualizado com sucesso.')
      } else {
        await criar.mutateAsync(values)
        toast.success('Tipo de carrinho cadastrado com sucesso.')
      }
      setModalAberto(false)
    } catch (err) {
      toast.error('Não foi possível salvar o tipo de carrinho.', extrairMensagemErro(err))
    }
  }

  async function onExcluir(item: TipoCarrinho) {
    if (!confirm(`Excluir o tipo de carrinho "${item.descricao}"?`)) return
    try {
      await excluir.mutateAsync(item.id)
      toast.success('Tipo de carrinho excluído com sucesso.')
    } catch (err) {
      toast.error('Não foi possível excluir o tipo de carrinho.', extrairMensagemErro(err))
    }
  }

  return (
    <>
      <PageHeader
        title="Tipos de Carrinho"
        description="Categorias usadas no cadastro de carrinhos e nas faixas de preço por minuto."
        actions={
          <Button onClick={abrirNovo}>
            <Plus /> Novo tipo
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Carrinhos cadastrados</TableHead>
                <TableHead className="w-32 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && data?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    Nenhum tipo de carrinho cadastrado.
                  </TableCell>
                </TableRow>
              )}
              {data?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.descricao}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{item.quantidadeCarrinhos}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => abrirEdicao(item)} title="Editar">
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onExcluir(item)} title="Excluir">
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar tipo de carrinho' : 'Novo tipo de carrinho'}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-1.5">
              <Label htmlFor="descricao">Descrição</Label>
              <Input id="descricao" placeholder="Ex.: Carrinho Temático Individual" {...register('descricao')} />
              {errors.descricao && <p className="text-xs text-destructive">{errors.descricao.message}</p>}
            </div>
            <DialogFooter>
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
