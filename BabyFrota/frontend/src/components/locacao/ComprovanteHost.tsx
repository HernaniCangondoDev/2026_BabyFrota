import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useComprovanteStore } from '@/store/comprovante-store'
import { Comprovante } from './Comprovante'

/** Se o navegador nunca avisar que a impressão terminou, solta o comprovante depois de 2 minutos. */
const LIMITE_MS = 120_000

/**
 * Renderiza o comprovante pedido em `useComprovanteStore` num nó próprio do <body> e abre a impressão do navegador.
 * O CSS de impressão (index.css) esconde todo o resto da página enquanto `body[data-imprimir]` estiver marcado, e o
 * `@page` de 80mm só existe durante esse momento, para não mexer na impressão das Etiquetas (folha A4).
 */
export function ComprovanteHost() {
  const dados = useComprovanteStore((s) => s.dados)
  const limpar = useComprovanteStore((s) => s.limpar)

  useEffect(() => {
    if (!dados) return

    document.body.dataset.imprimir = 'comprovante'
    const pagina = document.createElement('style')
    pagina.textContent = '@page { size: 80mm auto; margin: 0 }'
    document.head.appendChild(pagina)

    window.addEventListener('afterprint', limpar, { once: true })
    // Dá um instante para o React pintar o ticket antes de o navegador tirar a "foto" da página.
    const abrirImpressao = window.setTimeout(() => window.print(), 60)
    const seguranca = window.setTimeout(limpar, LIMITE_MS)

    return () => {
      window.clearTimeout(abrirImpressao)
      window.clearTimeout(seguranca)
      window.removeEventListener('afterprint', limpar)
      delete document.body.dataset.imprimir
      pagina.remove()
    }
  }, [dados, limpar])

  if (!dados) return null

  return createPortal(
    <div id="comprovante-impressao">
      <Comprovante dados={dados} />
    </div>,
    document.body,
  )
}
