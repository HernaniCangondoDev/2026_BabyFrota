import { useEffect, useState } from 'react'

/**
 * Atrasa a propagação de um valor que muda rápido (digitação em campo de busca) para reduzir
 * o número de requisições disparadas — sem isto, cada letra digitada dispara uma consulta nova
 * (e sobrepõe as anteriores), o que pesa desnecessariamente no banco em tabelas grandes.
 */
export function useDebouncedValue<T>(valor: T, atrasoMs = 350): T {
  const [valorAtrasado, setValorAtrasado] = useState(valor)

  useEffect(() => {
    const id = setTimeout(() => setValorAtrasado(valor), atrasoMs)
    return () => clearTimeout(id)
  }, [valor, atrasoMs])

  return valorAtrasado
}
