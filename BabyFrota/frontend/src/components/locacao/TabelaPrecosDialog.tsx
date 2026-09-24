import { Loader2, TriangleAlert } from 'lucide-react'
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
import { useFaixasPreco } from '@/features/locacoes/api'
import type { CarrinhoDisponivel } from '@/features/locacoes/types'
import { extrairMensagemErro, formatarMinutos, formatarMoeda } from '@/lib/utils'

/** 15 -> "15 min"; 120 -> "120 min (2h)"; 150 -> "150 min (2h 30min)": a tabela é em minutos, mas horas ajudam a ler os limites altos. */
function limite(minutos: number): string {
  if (minutos < 60) return `${minutos} min`
  return `${minutos} min (${minutos % 60 === 0 ? `${minutos / 60}h` : formatarMinutos(minutos)})`
}

/**
 * Preços por tempo de uso do tipo do carrinho, como o "Preços por Minutos" da entrega do legado. Abre sozinho ao escolher
 * o carrinho, para o atendente informar o valor ao cliente, e pode ser reaberto pelo cartão do carrinho.
 */
export function TabelaPrecosDialog({ carrinho, onClose }: { carrinho: CarrinhoDisponivel | null; onClose: () => void }) {
  const { data: faixas, isLoading, isError, error } = useFaixasPreco(carrinho?.id ?? null)
  const ultima = faixas && faixas.length > 0 ? faixas[faixas.length - 1] : null

  return (
    <Dialog open={carrinho !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tabela de preços</DialogTitle>
          <DialogDescription>
            {carrinho ? `${carrinho.descricao} — ${carrinho.tipoCarrinhoDescricao}` : ''}
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Carregando preços...
          </p>
        )}

        {isError && (
          <p role="alert" className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
            Não foi possível carregar os preços: {extrairMensagemErro(error, 'erro ao consultar a tabela.')}
          </p>
        )}

        {faixas && faixas.length === 0 && (
          <p className="flex items-start gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <span>
              Este tipo de carrinho não tem nenhuma faixa de preço cadastrada. Se for alugado, a devolução não conseguirá
              calcular o valor. Cadastre as faixas em <strong>Tipos de Carrinho</strong> antes de entregar.
            </span>
          </p>
        )}

        {faixas && faixas.length > 0 && (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>De</TableHead>
                  <TableHead>Até</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {faixas.map((f) => (
                  <TableRow key={`${f.minimoMinutos}-${f.maximoMinutos}`}>
                    <TableCell className="tabular-nums">{f.minimoMinutos} min</TableCell>
                    <TableCell className="tabular-nums">{limite(f.maximoMinutos)}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{formatarMoeda(f.valor)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-xs text-muted-foreground">
              O valor é calculado pelo tempo real de uso e cobrado na devolução.
              {ultima && (
                <>
                  {' '}
                  Acima de {limite(ultima.maximoMinutos)} é cobrado o valor da última faixa ({formatarMoeda(ultima.valor)}).
                </>
              )}
            </p>
          </>
        )}

        <DialogFooter>
          <Button type="button" onClick={onClose}>
            Entendi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
