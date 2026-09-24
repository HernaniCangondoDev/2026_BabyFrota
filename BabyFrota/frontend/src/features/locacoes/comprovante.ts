import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { obterEmpresa } from '@/features/empresa/api'
import { extrairMensagemErro } from '@/lib/utils'
import { useComprovanteStore, type TipoComprovante } from '@/store/comprovante-store'
import { toast } from '@/stores/toast-store'
import { buscarLocacaoDetalhe } from './api'

interface OpcoesComprovante {
  /**
   * Impressão que acontece sozinha depois de entregar, trocar ou devolver. Como no legado, que não imprimia no celular,
   * ela só ocorre em tela de computador; o botão de reimprimir (não automático) funciona em qualquer tela.
   */
  automatico?: boolean
}

/**
 * Prepara e imprime o comprovante de uma locação. Busca os dados no servidor (detalhe da locação e cadastro da empresa),
 * então o ticket sai igual seja logo depois da operação, seja reimpresso dias depois pela tela Locações.
 */
export function useImprimirComprovante() {
  const queryClient = useQueryClient()

  return useCallback(
    async (tipo: TipoComprovante, locacaoId: number, opcoes: OpcoesComprovante = {}) => {
      if (opcoes.automatico && !window.matchMedia('(min-width: 768px)').matches) return

      try {
        const [locacao, empresa] = await Promise.all([
          // staleTime 0: o comprovante mostra o que está gravado agora, não uma cópia antiga do cache.
          queryClient.fetchQuery({
            queryKey: ['locacoes', 'detalhe', locacaoId],
            queryFn: () => buscarLocacaoDetalhe(locacaoId),
            staleTime: 0,
          }),
          queryClient.fetchQuery({ queryKey: ['empresa'], queryFn: obterEmpresa, staleTime: 5 * 60_000 }),
        ])
        // ListarTrocas devolve a mais recente primeiro.
        useComprovanteStore.getState().imprimir({ tipo, locacao, empresa, troca: locacao.trocas[0] })
      } catch (err) {
        toast.error('Não foi possível preparar o comprovante.', extrairMensagemErro(err))
      }
    },
    [queryClient],
  )
}
