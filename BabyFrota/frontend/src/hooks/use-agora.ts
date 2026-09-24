import { useEffect, useState } from 'react'

/**
 * Relógio para telas que mostram "há quanto tempo": devolve o instante atual e re-renderiza a cada `intervaloMs`.
 * Só refazer a consulta não basta, porque dados iguais não re-renderizam e o tempo decorrido ficaria parado.
 */
export function useAgora(intervaloMs = 30_000): number {
  const [agora, setAgora] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), intervaloMs)
    return () => clearInterval(id)
  }, [intervaloMs])

  return agora
}
