import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

const OPCOES_TAMANHO = [10, 20, 50, 100]
const TAMANHO_MAXIMO = 500

interface PageSizeSelectProps {
  tamanhoPagina: number
  onChange: (tamanho: number) => void
}

/** Seletor de "itens por página" (10/20/50/100/personalizado) — fica no topo das listagens. */
export function PageSizeSelect({ tamanhoPagina, onChange }: PageSizeSelectProps) {
  const [personalizadoAberto, setPersonalizadoAberto] = useState(false)
  const [valorPersonalizado, setValorPersonalizado] = useState(String(tamanhoPagina))
  const ehTamanhoPadrao = OPCOES_TAMANHO.includes(tamanhoPagina)

  function onSelecionar(valor: string) {
    if (valor === 'personalizado') {
      setValorPersonalizado(String(tamanhoPagina))
      setPersonalizadoAberto(true)
      return
    }
    setPersonalizadoAberto(false)
    onChange(Number(valor))
  }

  function onConfirmarPersonalizado() {
    const numero = Math.max(1, Math.min(TAMANHO_MAXIMO, Math.trunc(Number(valorPersonalizado)) || tamanhoPagina))
    setValorPersonalizado(String(numero))
    onChange(numero)
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="whitespace-nowrap text-sm text-muted-foreground">Itens por página</span>
      <Select
        className="h-9 w-32"
        value={personalizadoAberto || !ehTamanhoPadrao ? 'personalizado' : String(tamanhoPagina)}
        onChange={(e) => onSelecionar(e.target.value)}
      >
        {OPCOES_TAMANHO.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
        <option value="personalizado">Personalizado</option>
      </Select>

      {(personalizadoAberto || !ehTamanhoPadrao) && (
        <form
          className="flex items-center gap-1"
          onSubmit={(e) => {
            e.preventDefault()
            onConfirmarPersonalizado()
          }}
        >
          <Input
            type="number"
            min={1}
            max={TAMANHO_MAXIMO}
            className="h-9 w-20"
            value={valorPersonalizado}
            onChange={(e) => setValorPersonalizado(e.target.value)}
          />
          <Button type="submit" size="sm" variant="outline">
            OK
          </Button>
        </form>
      )}
    </div>
  )
}
