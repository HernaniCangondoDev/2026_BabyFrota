import type { CSSProperties, ReactNode } from 'react'
import { formatarMinutos, formatarMoeda } from '@/lib/utils'
import type { DadosComprovante } from '@/store/comprovante-store'

/** O legado imprimia "Brasília, ..." fixo no rodapé; a cidade continua a mesma da empresa. */
const CIDADE = 'Brasília'

function hora(iso: string | null | undefined): string {
  return iso ? new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-'
}

function dataPorExtenso(data: Date): string {
  return data.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
}

/** 07477000000126 -> 07.477.000/0001-26; se não tiver 14 dígitos, imprime como veio. */
function cnpj(valor: string): string {
  const d = valor.replace(/\D/g, '')
  return d.length === 14 ? d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : valor
}

const separador: CSSProperties = { border: 0, borderTop: '1px dashed #000', margin: '2mm 0' }

function Linha({ rotulo, valor, forte }: { rotulo: string; valor: ReactNode; forte?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '3mm', fontWeight: forte ? 700 : 400 }}>
      <span>{rotulo}</span>
      <span style={{ textAlign: 'right' }}>{valor}</span>
    </div>
  )
}

/**
 * Ticket de bobina 80mm com o mesmo conteúdo dos comprovantes do legado (entrega, troca e devolução). É HTML/CSS, não
 * texto alinhado com espaços, então não precisa do ajuste por modelo de impressora (MP-4000/MP-4200) que o legado fazia.
 */
export function Comprovante({ dados }: { dados: DadosComprovante }) {
  const { tipo, locacao, empresa, troca } = dados
  const titulo =
    tipo === 'entrega' ? 'ENTREGA DE CARRINHO' : tipo === 'troca' ? 'TROCA DE CARRINHO' : 'DEVOLUÇÃO DE CARRINHO'
  const numero = String(locacao.id).padStart(6, '0')
  const temDesconto = (locacao.desconto ?? 0) > 0

  return (
    <div
      style={{
        width: '72mm',
        padding: '3mm',
        background: '#fff',
        color: '#000',
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: '9pt',
        lineHeight: 1.35,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: '10.5pt' }}>{empresa?.razaoSocial?.trim() || 'Baby Frota'}</div>
        <div style={{ fontWeight: 700 }}>{titulo}</div>
        {empresa?.cnpj && <div>CNPJ {cnpj(empresa.cnpj)}</div>}
      </div>

      <hr style={separador} />

      <div style={{ fontWeight: 700, textTransform: 'uppercase' }}>{locacao.clienteNome}</div>

      {tipo === 'troca' ? (
        <>
          <div style={{ marginTop: '1.5mm' }}>CARRINHO ANTERIOR:</div>
          <div style={{ textTransform: 'uppercase' }}>{troca?.carrinhoAnteriorDescricao ?? '-'}</div>
          <div style={{ marginTop: '1.5mm' }}>NOVO CARRINHO:</div>
          <div style={{ textTransform: 'uppercase' }}>{troca?.novoCarrinhoDescricao ?? locacao.carrinhoDescricao}</div>
        </>
      ) : (
        <>
          <div style={{ textTransform: 'uppercase' }}>{locacao.carrinhoDescricao}</div>
          {tipo === 'entrega' && <div style={{ textTransform: 'uppercase' }}>TIPO: {locacao.tipoCarrinhoDescricao}</div>}
        </>
      )}

      <hr style={separador} />

      <Linha rotulo="Locação" valor={numero} />
      {tipo === 'troca' ? (
        <Linha rotulo="Hora da troca" valor={hora(troca?.dataTroca)} />
      ) : (
        <Linha rotulo="Hora de saída" valor={hora(locacao.dataEntrega)} />
      )}
      {tipo === 'devolucao' && (
        <>
          <Linha rotulo="Hora de chegada" valor={hora(locacao.dataDevolucao)} />
          <Linha
            rotulo="Tempo de uso"
            valor={locacao.tempoMinutos !== null ? formatarMinutos(locacao.tempoMinutos) : '-'}
            forte
          />

          <hr style={separador} />

          {temDesconto && locacao.valorTabela !== null && (
            <>
              <Linha rotulo="Valor da tabela" valor={formatarMoeda(locacao.valorTabela)} />
              <Linha rotulo="Desconto" valor={`- ${formatarMoeda(locacao.desconto ?? 0)}`} />
            </>
          )}
          <Linha rotulo="Total" valor={formatarMoeda(locacao.valorTotal ?? 0)} forte />

          {locacao.pagamentos.length > 0 && (
            <>
              <hr style={separador} />
              {locacao.pagamentos.map((p) => (
                <Linha key={p.numero} rotulo={p.formaRecebimentoNome} valor={formatarMoeda(p.valorRecebido)} />
              ))}
            </>
          )}
          <Linha rotulo="Troco" valor={formatarMoeda(locacao.troco ?? 0)} forte />
        </>
      )}

      <hr style={separador} />

      <div style={{ textAlign: 'center' }}>
        {CIDADE}, {dataPorExtenso(new Date())}
      </div>
      {tipo === 'devolucao' && (
        <div style={{ textAlign: 'center', fontWeight: 700, marginTop: '2mm' }}>GRATO - VOLTE SEMPRE</div>
      )}
    </div>
  )
}
