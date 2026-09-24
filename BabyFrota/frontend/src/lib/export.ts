/**
 * Exportação de tabelas para CSV, Excel e PDF. Excel e PDF usam bibliotecas grandes (exceljs, jspdf), então são
 * carregadas só no clique (import dinâmico) e não pesam no carregamento normal do sistema.
 */

export type ValorExportavel = string | number | null | undefined

export interface ColunaExportacao {
  cabecalho: string
  /**
   * 'moeda': sai como R$ no PDF e com formato monetário numérico no Excel (o valor continua número, então soma).
   * 'inteiro': número sem casas decimais. Sem tipo, o valor sai como está.
   */
  tipo?: 'moeda' | 'inteiro'
}

export interface DadosExportacao {
  nomeArquivo: string
  titulo: string
  /** Contexto do relatório, ex.: os filtros aplicados. */
  subtitulo?: string
  colunas: ColunaExportacao[]
  linhas: ValorExportavel[][]
  /** Linha de total, alinhada às colunas. */
  rodape?: ValorExportavel[]
}

function baixar(blob: Blob, nomeArquivo: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  link.click()
  URL.revokeObjectURL(url)
}

function moeda(valor: number): string {
  // O toLocaleString põe um espaço "sem quebra" entre R$ e o número; some no PDF e na leitura de CSV.
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace(/\u00a0/g, ' ')
}

function textoDoValor(valor: ValorExportavel, tipo: ColunaExportacao['tipo'], vazio: string): string {
  if (valor === null || valor === undefined || valor === '') return vazio
  if (typeof valor === 'number') {
    if (tipo === 'moeda') return moeda(valor)
    if (tipo === 'inteiro') return String(Math.round(valor))
  }
  return String(valor)
}

function geradoEm(): string {
  return `Gerado em ${new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}`
}

export function exportarCsv(dados: DadosExportacao) {
  const { colunas, linhas, rodape, nomeArquivo } = dados
  if (colunas.length === 0 || linhas.length === 0) return

  const celula = (v: ValorExportavel, tipo: ColunaExportacao['tipo']) => {
    // Números monetários saem com vírgula decimal, que é como o Excel em português espera ler um CSV.
    const texto =
      typeof v === 'number' && tipo === 'moeda' ? v.toFixed(2).replace('.', ',') : String(v ?? '')
    return `"${texto.replace(/"/g, '""')}"`
  }

  const cabecalho = colunas.map((c) => `"${c.cabecalho}"`).join(';')
  const corpo = linhas.map((linha) => colunas.map((c, i) => celula(linha[i], c.tipo)).join(';'))
  if (rodape) corpo.push(colunas.map((c, i) => celula(rodape[i], c.tipo)).join(';'))

  // BOM (U+FEFF) para o Excel abrir acentuação em UTF-8 corretamente.
  baixar(new Blob(['\uFEFF' + [cabecalho, ...corpo].join('\n')], { type: 'text/csv;charset=utf-8;' }), `${nomeArquivo}.csv`)
}

export async function exportarExcel(dados: DadosExportacao) {
  const { colunas, linhas, rodape, titulo, subtitulo, nomeArquivo } = dados
  const ExcelJS = (await import('exceljs')).default

  const wb = new ExcelJS.Workbook()
  wb.created = new Date()
  // Nome de aba do Excel: até 31 caracteres e sem \ / ? * [ ] :
  const ws = wb.addWorksheet(titulo.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31) || 'Relatório')

  ws.addRow([titulo]).font = { bold: true, size: 14 }
  if (subtitulo) ws.addRow([subtitulo]).font = { color: { argb: 'FF666666' } }
  ws.addRow([geradoEm()]).font = { color: { argb: 'FF666666' }, size: 9 }
  ws.addRow([])

  const linhaCabecalho = ws.addRow(colunas.map((c) => c.cabecalho))
  linhaCabecalho.font = { bold: true }
  linhaCabecalho.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFEFEF' } }
    cell.border = { bottom: { style: 'thin', color: { argb: 'FF999999' } } }
  })

  const formato = (tipo: ColunaExportacao['tipo']) =>
    tipo === 'moeda' ? '"R$" #,##0.00;[Red]-"R$" #,##0.00' : tipo === 'inteiro' ? '0' : undefined

  const adicionar = (valores: ValorExportavel[]) => {
    const linha = ws.addRow(valores.map((v) => v ?? ''))
    colunas.forEach((c, i) => {
      const f = formato(c.tipo)
      if (f && typeof valores[i] === 'number') linha.getCell(i + 1).numFmt = f
      if (c.tipo) linha.getCell(i + 1).alignment = { horizontal: 'right' }
    })
    return linha
  }

  linhas.forEach(adicionar)
  if (rodape) {
    const linhaTotal = adicionar(rodape)
    linhaTotal.font = { bold: true }
    linhaTotal.eachCell((cell) => {
      cell.border = { top: { style: 'thin', color: { argb: 'FF333333' } } }
    })
  }

  // Largura pelo conteúdo (com teto), para não abrir tudo espremido nem com colunas gigantes.
  colunas.forEach((c, i) => {
    const tamanhos = [c.cabecalho, ...linhas.map((l) => textoDoValor(l[i], c.tipo, '')), textoDoValor(rodape?.[i], c.tipo, '')]
    ws.getColumn(i + 1).width = Math.min(40, Math.max(10, ...tamanhos.map((t) => t.length + 2)))
  })
  ws.views = [{ state: 'frozen', ySplit: linhaCabecalho.number }]

  const buffer = await wb.xlsx.writeBuffer()
  baixar(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `${nomeArquivo}.xlsx`,
  )
}

export async function exportarPdf(dados: DadosExportacao) {
  const { colunas, linhas, rodape, titulo, subtitulo, nomeArquivo } = dados
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const margem = 32

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text(titulo, margem, 38)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100)
  if (subtitulo) doc.text(subtitulo, margem, 54)
  doc.text(geradoEm(), doc.internal.pageSize.getWidth() - margem, 38, { align: 'right' })
  doc.setTextColor(0)

  // A fonte padrão do PDF cobre o alfabeto latino com acentos, mas não travessão nem setas: usa "-" para vazio.
  const texto = (v: ValorExportavel, c: ColunaExportacao) => textoDoValor(v, c.tipo, '-')

  autoTable(doc, {
    startY: subtitulo ? 64 : 52,
    head: [colunas.map((c) => c.cabecalho)],
    body: linhas.map((l) => colunas.map((c, i) => texto(l[i], c))),
    foot: rodape ? [colunas.map((c, i) => texto(rodape[i], c))] : undefined,
    showFoot: 'lastPage',
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 3, lineColor: [225, 224, 217], lineWidth: 0.4, textColor: 20 },
    headStyles: { fillColor: [239, 239, 239], textColor: 20, fontStyle: 'bold' },
    footStyles: { fillColor: [239, 239, 239], textColor: 20, fontStyle: 'bold' },
    columnStyles: Object.fromEntries(
      colunas.map((c, i) => [i, c.tipo ? { halign: 'right' as const } : {}]).filter(([, estilo]) => Object.keys(estilo).length > 0),
    ),
    margin: { left: margem, right: margem, bottom: 28 },
    didDrawPage: () => {
      const { width, height } = doc.internal.pageSize
      doc.setFontSize(8)
      doc.setTextColor(120)
      doc.text(`Página ${doc.getNumberOfPages()}`, width - margem, height - 14, { align: 'right' })
      doc.setTextColor(0)
    },
  })

  doc.save(`${nomeArquivo}.pdf`)
}
