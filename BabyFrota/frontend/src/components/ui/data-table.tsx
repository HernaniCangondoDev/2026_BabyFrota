import type { ReactNode } from 'react'
import { Download, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Pagination } from '@/components/ui/pagination'
import { PageSizeSelect } from '@/components/ui/page-size-select'

export interface DataTableColumn<T> {
  header: string
  cell: (row: T) => ReactNode
  /** Usado na exportação CSV. Colunas sem isto ficam de fora do arquivo exportado. */
  exportValue?: (row: T) => string | number | null | undefined
  className?: string
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  rowKey: (row: T) => string | number
  isLoading?: boolean
  emptyMessage?: string
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  pagina: number
  totalPaginas: number
  totalRegistros: number
  tamanhoPagina: number
  onPageChange: (pagina: number) => void
  onTamanhoPaginaChange?: (tamanho: number) => void
  exportFileName?: string
  actions?: ReactNode
}

function exportarCsv<T>(data: T[], columns: DataTableColumn<T>[], fileName: string) {
  const colunasExportaveis = columns.filter((c) => c.exportValue)
  if (colunasExportaveis.length === 0 || data.length === 0) return

  const cabecalho = colunasExportaveis.map((c) => `"${c.header}"`).join(';')
  const linhas = data.map((row) =>
    colunasExportaveis
      .map((c) => `"${String(c.exportValue?.(row) ?? '').replace(/"/g, '""')}"`)
      .join(';'),
  )
  const conteudo = [cabecalho, ...linhas].join('\n')
  // BOM (﻿) para o Excel abrir acentuação em UTF-8 corretamente.
  const blob = new Blob(['﻿' + conteudo], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${fileName}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * Tabela de listagem com busca, paginação server-side e exportação CSV.
 * A exportação exporta apenas os registros já carregados na página atual — para exportar a
 * base inteira seria necessário um endpoint dedicado sem paginação.
 */
export function DataTable<T>({
  columns,
  data,
  rowKey,
  isLoading,
  emptyMessage = 'Nenhum registro encontrado.',
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  pagina,
  totalPaginas,
  totalRegistros,
  tamanhoPagina,
  onPageChange,
  onTamanhoPaginaChange,
  exportFileName = 'exportacao',
  actions,
}: DataTableProps<T>) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            className="pl-8"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {onTamanhoPaginaChange && (
            <PageSizeSelect tamanhoPagina={tamanhoPagina} onChange={onTamanhoPaginaChange} />
          )}
          {actions}
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportarCsv(data, columns, exportFileName)}
            disabled={data.length === 0}
            title="Exporta os registros carregados na página atual"
          >
            <Download className="size-4" /> Exportar CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col.header} className={col.className}>
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center text-muted-foreground">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                data.map((row) => (
                  <TableRow key={rowKey(row)}>
                    {columns.map((col) => (
                      <TableCell key={col.header} className={col.className}>
                        {col.cell(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          <Pagination
            pagina={pagina}
            totalPaginas={totalPaginas}
            totalRegistros={totalRegistros}
            tamanhoPagina={tamanhoPagina}
            onPageChange={onPageChange}
          />
        </CardContent>
      </Card>
    </div>
  )
}
