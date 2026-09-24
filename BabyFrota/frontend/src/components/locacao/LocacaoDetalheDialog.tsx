import type { ReactNode } from 'react'
import { Loader2, Printer, TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useLocacaoDetalhe } from '@/features/locacoes/api'
import { useImprimirComprovante } from '@/features/locacoes/comprovante'
import type { Locacao, LocacaoDetalhe } from '@/features/locacoes/types'
import { useAgora } from '@/hooks/use-agora'
import { extrairMensagemErro, formatarDataHora, formatarMinutos, formatarMoeda, tempoDecorrido } from '@/lib/utils'

/** ("61", "996621144") -> "(61) 99662-1144"; número fixo de 8 dígitos -> "(61) 3356-6035". */
function formatarTelefone(ddd: string | null, numero: string | null): string | null {
  const digitos = (numero ?? '').replace(/\D/g, '')
  if (!digitos) return null
  const separado =
    digitos.length === 9
      ? `${digitos.slice(0, 5)}-${digitos.slice(5)}`
      : digitos.length === 8
        ? `${digitos.slice(0, 4)}-${digitos.slice(4)}`
        : digitos
  return ddd ? `(${ddd}) ${separado}` : separado
}

/** O modal de ações (devolver/trocar) recebe a locação no formato da lista de "em andamento". */
function comoLocacaoEmAndamento(d: LocacaoDetalhe): Locacao {
  return {
    id: d.id,
    clienteId: d.clienteId,
    clienteNome: d.clienteNome,
    carrinhoId: d.carrinhoId,
    carrinhoDescricao: d.carrinhoDescricao,
    dataEntrega: d.dataEntrega,
    dataDevolucao: null,
    tempoMinutos: null,
    valorTotal: null,
    desconto: null,
    troco: null,
    usuarioEntregaNome: d.usuarioEntregaNome,
    emAndamento: true,
  }
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3">
      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">{titulo}</p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">{children}</dl>
    </div>
  )
}

function Item({ rotulo, valor, forte }: { rotulo: string; valor: ReactNode; forte?: boolean }) {
  return (
    <>
      <dt className={forte ? 'font-medium' : 'text-muted-foreground'}>{rotulo}</dt>
      <dd className={forte ? 'text-right font-semibold tabular-nums' : 'text-right tabular-nums'}>{valor}</dd>
    </>
  )
}

/**
 * Tudo o que se sabe de uma locação: pagamentos e parcelas, valores, trocas, observações e quem fez o quê. Vem de um
 * endpoint só (o mesmo dos comprovantes), então o que aparece aqui é o que sai impresso.
 */
export function LocacaoDetalheDialog({
  locacaoId,
  onClose,
  onDevolverOuTrocar,
}: {
  locacaoId: number | null
  onClose: () => void
  /** Locação ainda não devolvida: abre o modal de devolução e troca. */
  onDevolverOuTrocar: (locacao: Locacao) => void
}) {
  const { data: d, isLoading, isError, error } = useLocacaoDetalhe(locacaoId)
  const imprimirComprovante = useImprimirComprovante()
  const agora = useAgora()

  const telefones = d
    ? [formatarTelefone(d.clienteDddCelular, d.clienteCelular), formatarTelefone(d.clienteDddTelefone, d.clienteTelefone)]
        .filter(Boolean)
        .join(' · ')
    : ''

  return (
    <Dialog open={locacaoId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-6">
            {d ? `Locação ${d.id}` : 'Locação'}
            {d && <Badge variant={d.entregue ? 'warning' : 'success'}>{d.entregue ? 'Entregue' : 'Devolvido'}</Badge>}
          </DialogTitle>
          <DialogDescription>
            {d ? `${d.clienteNome}${telefones ? ` · ${telefones}` : ''}` : 'Carregando os detalhes...'}
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Carregando...
          </p>
        )}
        {isError && (
          <p role="alert" className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
            Não foi possível carregar a locação: {extrairMensagemErro(error, 'erro ao consultar os detalhes.')}
          </p>
        )}

        {d && (
          <div className="space-y-4">
            {d.pagamentosInconsistentes && (
              <p className="flex items-start gap-2 rounded-md bg-amber-50 p-2 text-sm text-amber-800">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                Os pagamentos desta locação não fecham com o valor (provável parcela do fluxo antigo de entrega, em que a
                entrega também cobrava). Confira antes de usar estes números.
              </p>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <Secao titulo="Locação">
                <Item rotulo="Carrinho" valor={d.carrinhoDescricao} />
                <Item rotulo="Tipo" valor={d.tipoCarrinhoDescricao} />
                <Item rotulo="Entrega" valor={`${formatarDataHora(d.dataEntrega)} · ${d.usuarioEntregaNome}`} />
                <Item
                  rotulo="Devolução"
                  valor={
                    d.dataDevolucao
                      ? `${formatarDataHora(d.dataDevolucao)}${d.usuarioDevolucaoNome ? ` · ${d.usuarioDevolucaoNome}` : ''}`
                      : 'Ainda não devolvido'
                  }
                />
                <Item
                  rotulo={d.entregue ? 'Em uso há' : 'Tempo de uso'}
                  valor={
                    d.entregue
                      ? tempoDecorrido(d.dataEntrega, agora)
                      : d.tempoMinutos !== null
                        ? formatarMinutos(d.tempoMinutos)
                        : '—'
                  }
                />
                <Item rotulo="Caixa" valor={`nº ${d.caixaId}`} />
              </Secao>

              <Secao titulo="Valores">
                {d.entregue ? (
                  <p className="col-span-2 text-muted-foreground">
                    O valor é calculado pelo tempo de uso e cobrado na devolução.
                  </p>
                ) : (
                  <>
                    {d.valorTabela !== null && <Item rotulo="Valor da tabela" valor={formatarMoeda(d.valorTabela)} />}
                    {(d.desconto ?? 0) > 0 && <Item rotulo="Desconto" valor={`− ${formatarMoeda(d.desconto ?? 0)}`} />}
                    <Item rotulo="Valor total" valor={formatarMoeda(d.valorTotal ?? 0)} forte />
                    <Item rotulo="Recebido" valor={formatarMoeda(d.valorRecebido)} />
                    <Item rotulo="Troco" valor={formatarMoeda(d.troco ?? 0)} />
                  </>
                )}
              </Secao>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Pagamentos</p>
              {d.pagamentos.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {d.entregue ? 'Nenhum pagamento: ele é registrado na devolução.' : 'Nenhum pagamento (valor zerado).'}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-14">Nº</TableHead>
                      <TableHead>Forma</TableHead>
                      <TableHead className="text-right">Valor recebido</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {d.pagamentos.map((p) => (
                      <TableRow key={p.numero}>
                        <TableCell className="tabular-nums">{p.numero}</TableCell>
                        <TableCell>{p.formaRecebimentoNome}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatarMoeda(p.valorRecebido)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            {d.trocas.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Trocas de carrinho
                </p>
                <ul className="space-y-1.5">
                  {d.trocas.map((t) => (
                    <li key={t.id} className="rounded-md border p-2 text-sm">
                      <span className="font-medium">
                        {t.carrinhoAnteriorDescricao} → {t.novoCarrinhoDescricao}
                      </span>
                      <span className="text-muted-foreground">
                        {' '}
                        · {formatarDataHora(t.dataTroca)} · {t.usuarioNome}
                      </span>
                      {t.tempoCarrinhoAnterior !== null && (
                        <p className="text-xs text-muted-foreground">
                          Carrinho anterior: {formatarMinutos(t.tempoCarrinhoAnterior)} de uso
                          {t.precoCarrinhoAnterior !== null && `, ${formatarMoeda(t.precoCarrinhoAnterior)} na tabela`}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {d.observacao?.trim() && (
              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Observações</p>
                <p className="whitespace-pre-wrap rounded-md border p-2 text-sm">{d.observacao}</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {d && (
            <Button
              type="button"
              variant="outline"
              onClick={() => void imprimirComprovante(d.entregue ? 'entrega' : 'devolucao', d.id)}
            >
              <Printer className="size-4" /> Imprimir comprovante
            </Button>
          )}
          {d?.entregue && (
            <Button type="button" onClick={() => onDevolverOuTrocar(comoLocacaoEmAndamento(d))}>
              Devolver ou trocar
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
