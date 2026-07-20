import { useEffect, useState } from 'react'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth-store'

function useRelogio() {
  const [agora, setAgora] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return agora
}

export function Topbar() {
  const agora = useRelogio()
  const { usuario, logout } = useAuthStore()

  const hora = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const data = agora.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6 print:hidden">
      <div>
        <p className="text-sm font-semibold tabular-nums">{hora}</p>
        <p className="text-xs text-muted-foreground">{data}</p>
      </div>

      <div className="flex items-center gap-4">
        {usuario && (
          <div className="text-right">
            <p className="text-sm font-medium leading-tight">{usuario.nome}</p>
            <p className="text-xs text-muted-foreground leading-tight">{usuario.perfilNome}</p>
          </div>
        )}
        <Button variant="outline" size="icon" onClick={logout} title="Sair">
          <LogOut />
        </Button>
      </div>
    </header>
  )
}
